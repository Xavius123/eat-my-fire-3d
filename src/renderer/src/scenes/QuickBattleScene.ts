import { Game } from '../Game'
import { TitleScene } from './TitleScene'
import { generateMapGraph } from '../map/MapGraph'
import { createRunState } from '../run/RunState'
import { getUnlockedCharacters } from '../entities/CharacterData'
import { getWeapons, getArmors } from '../run/ItemData'
import type { Faction } from '../entities/EnemyData'
import type { Scene, SceneContext } from './Scene'

interface MapOption {
  label: string
  sub: string
  faction: Faction
  /** depth value used for biome + enemy scaling (wave size & stats) */
  depth: number
}

/** Two factions × three difficulties — matches distinct enemy pools + mixed-role waves. */
const MAP_OPTIONS: MapOption[] = [
  {
    label: 'Bone trench',
    sub: 'Grunt · Archer · Shaman · low scale',
    faction: 'fantasy',
    depth: 1,
  },
  {
    label: 'Rib vault',
    sub: 'Mixed roles · medium scale',
    faction: 'fantasy',
    depth: 3,
  },
  {
    label: 'Dead kingdom',
    sub: 'Larger waves · elite buffs · high scale',
    faction: 'fantasy',
    depth: 6,
  },
  {
    label: 'Drone yard',
    sub: 'Combat drones only · low scale',
    faction: 'tech',
    depth: 1,
  },
  {
    label: 'Assembly line',
    sub: 'Drone swarms · medium scale',
    faction: 'tech',
    depth: 3,
  },
  {
    label: 'Core breach',
    sub: 'Larger waves · elite buffs · boss = big drone',
    faction: 'tech',
    depth: 6,
  },
]

/** Dev / title shortcuts: jump straight into quick battle with a fixed faction + depth. */
export type QuickBattlePreset = {
  faction: Faction
  depth: number
  nodeId: string
}

export class QuickBattleScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext
  private game: Game | null = null
  private active = false
  private inCombat = false

  private selectedOption = 0

  constructor(private readonly preset?: QuickBattlePreset) {}

  activate(ctx: SceneContext): void {
    this.ctx = ctx
    this.active = true

    this.root = document.createElement('div')
    this.root.id = 'quick-battle-screen'

    if (this.preset) {
      this.root.style.display = 'none'
      ctx.container.appendChild(this.root)
      this.launchFromParams(this.preset.faction, this.preset.depth, this.preset.nodeId)
      ctx.ready()
      return
    }

    this.buildUI()
    this.root.addEventListener('click', this.onClick)
    ctx.container.appendChild(this.root)
    ctx.ready()
  }

  deactivate(): void {
    this.active = false
    this.root.removeEventListener('click', this.onClick)
    if (this.game) {
      this.game.dispose()
      this.game = null
    }
    this.root.remove()
  }

  private buildUI(): void {
    const row = (opts: typeof MAP_OPTIONS, offset: number) =>
      opts
        .map((opt, j) => {
          const i = offset + j
          return `
      <button class="qb-option${i === this.selectedOption ? ' selected' : ''}" data-opt="${i}">
        <span class="qb-opt-label">${opt.label}</span>
        <span class="qb-opt-sub">${opt.sub}</span>
      </button>`
        })
        .join('')

    const fantasy = MAP_OPTIONS.slice(0, 3)
    const tech = MAP_OPTIONS.slice(3, 6)

    this.root.innerHTML = `
      <h2 class="qb-title">QUICK BATTLE</h2>
      <p class="qb-desc">Pick a faction and difficulty — boss plus escorts. Waves use mixed roles (melee / ranged / lob) with fewer duplicate clones; higher depth scales enemy stats.</p>
      <div class="qb-map-groups">
        <div class="qb-map-group">
          <h4 class="qb-map-group-title">Horde (fantasy)</h4>
          <div class="qb-options">${row(fantasy, 0)}</div>
        </div>
        <div class="qb-map-group">
          <h4 class="qb-map-group-title">Collective (tech)</h4>
          <div class="qb-options">${row(tech, 3)}</div>
        </div>
      </div>
      <div class="qb-btn-row">
        <button class="qb-back" id="qb-back">BACK</button>
        <button class="qb-launch" id="qb-launch">LAUNCH</button>
      </div>
    `
  }

  private launchCombat(): void {
    const opt = MAP_OPTIONS[this.selectedOption]!
    this.launchFromParams(opt.faction, opt.depth, `qb-${this.selectedOption}`)
  }

  private launchFromParams(faction: Faction, depth: number, nodeId: string): void {
    this.inCombat = true
    this.root.style.display = 'none'

    this.ctx.engine.setRotationEnabled(true)
    this.ctx.engine.setZoomEnabled(true)

    const runState = createRunState()
    const characters = getUnlockedCharacters()
    const weapons = getWeapons()
    const armors = getArmors()
    runState.loadout = characters.slice(0, 4).map((char, i) => ({
      characterId: char.id,
      weaponId: char.equipRestrictions.includes('weapon') ? null : weapons[i % weapons.length].id,
      armorId: char.equipRestrictions.includes('armor') ? null : armors[i % armors.length].id,
    }))
    runState.runSeed = Date.now()

    generateMapGraph(Date.now(), { numCols: 1 })

    void this.ctx.assetsReady.then((sharedAssets) => {
      if (!this.active) return
      this.game = new Game(
        this.ctx.container,
        this.ctx.engine,
        () => this.onCombatEnd(),
        sharedAssets,
        () => this.ctx.ready(),
        runState,
        faction,
        'quickbattle',
        nodeId,
        depth,
        () => this.onCombatEnd()
      )
    })
  }

  private onCombatEnd(): void {
    if (this.game) {
      this.game.dispose()
      this.game = null
    }
    this.inCombat = false
    this.root.style.display = ''
    this.ctx.ready()
  }

  private onClick = (e: MouseEvent): void => {
    if (this.inCombat) return
    const target = e.target as HTMLElement

    if (target.closest('#qb-back')) {
      this.ctx.switchTo(new TitleScene())
      return
    }

    if (target.closest('#qb-launch')) {
      this.launchCombat()
      return
    }

    const optBtn = target.closest<HTMLElement>('.qb-option')
    if (optBtn?.dataset.opt !== undefined) {
      this.selectedOption = parseInt(optBtn.dataset.opt, 10)
      this.root.querySelectorAll('.qb-option').forEach((btn, i) => {
        btn.classList.toggle('selected', i === this.selectedOption)
      })
    }
  }
}
