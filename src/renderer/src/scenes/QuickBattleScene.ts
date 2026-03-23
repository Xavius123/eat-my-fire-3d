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
  /** depth value used to drive biome selection via selectBiome() */
  depth: number
}

const MAP_OPTIONS: MapOption[] = [
  { label: 'Dungeon',      sub: 'Depth 1 · Easy',   faction: 'fantasy', depth: 1 },
  { label: 'Dungeon',      sub: 'Depth 3 · Medium', faction: 'fantasy', depth: 3 },
  { label: 'Dungeon',      sub: 'Depth 6 · Hard',   faction: 'fantasy', depth: 6 },
]

export class QuickBattleScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext
  private game: Game | null = null
  private active = false
  private inCombat = false

  private selectedOption = 0

  activate(ctx: SceneContext): void {
    this.ctx = ctx
    this.active = true

    this.root = document.createElement('div')
    this.root.id = 'quick-battle-screen'
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
    const optionCards = MAP_OPTIONS.map((opt, i) => `
      <button class="qb-option${i === this.selectedOption ? ' selected' : ''}" data-opt="${i}">
        <span class="qb-opt-label">${opt.label}</span>
        <span class="qb-opt-sub">${opt.sub}</span>
      </button>
    `).join('')

    this.root.innerHTML = `
      <h2 class="qb-title">QUICK BATTLE</h2>
      <p class="qb-desc">Select a map, then launch — boss + escorts spawn immediately.</p>
      <div class="qb-options">${optionCards}</div>
      <div class="qb-btn-row">
        <button class="qb-back" id="qb-back">BACK</button>
        <button class="qb-launch" id="qb-launch">LAUNCH</button>
      </div>
    `
  }

  private launchCombat(): void {
    const opt = MAP_OPTIONS[this.selectedOption]!
    this.inCombat = true

    // Hide the selection UI
    this.root.style.display = 'none'

    this.ctx.engine.setRotationEnabled(true)
    this.ctx.engine.setZoomEnabled(true)

    // Build a minimal RunState with default characters + loadout
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

    // Dummy map graph (single-node, not traversed in quick battle)
    const graph = generateMapGraph(Date.now(), { numCols: 1 })

    void this.ctx.assetsReady.then((sharedAssets) => {
      if (!this.active) return
      this.game = new Game(
        this.ctx.container,
        this.ctx.engine,
        () => this.onCombatEnd(),
        sharedAssets,
        () => this.ctx.ready(),
        runState,
        opt.faction,
        'quickbattle',
        `qb-${this.selectedOption}`,
        opt.depth,
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
