import { RewardScene } from './RewardScene'
import { getCharacter } from '../entities/CharacterData'
import type { MapGraph } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import type { Scene, SceneContext } from './Scene'

// Keep the export for CombatScene's import of the type
export interface LevelUpInfo {
  characterId: string
  name: string
  newLevel: number
}

const LEVEL_TITLES = ['', 'Recruit', 'Veteran', 'Elite', 'Legend']
const XP_PER_LEVEL: [number, number][] = [
  // [xpFloor, xpNeededToAdvance]
  [0,  10], // level 1 → 2
  [10, 15], // level 2 → 3
  [25, 20], // level 3 → 4
  [45,  0], // level 4 = max
]

function xpProgress(totalXp: number): { level: number; current: number; needed: number; pct: number } {
  let level = 1
  for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
    if (totalXp >= XP_PER_LEVEL[i][0]) { level = i + 1; break }
  }
  const [floor, needed] = XP_PER_LEVEL[level - 1]
  const current = totalXp - floor
  const pct = needed === 0 ? 100 : Math.round((current / needed) * 100)
  return { level, current, needed, pct }
}

export class LevelUpScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext

  constructor(
    private readonly mapGraph: MapGraph,
    private readonly runState: RunState,
    /** Set of characterIds that leveled up this combat. */
    private readonly leveledUpIds: Set<string>
  ) {}

  activate(ctx: SceneContext): void {
    this.ctx = ctx
    this.root = document.createElement('div')
    this.root.id = 'event-screen'
    this.render()
    this.root.addEventListener('click', this.onClick)
    ctx.container.appendChild(this.root)
    ctx.ready()

    // Animate XP bars after a short delay so the fill transition is visible
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        for (const bar of this.root.querySelectorAll<HTMLElement>('.xp-fill[data-pct]')) {
          bar.style.width = `${bar.dataset.pct}%`
        }
      })
    })
  }

  deactivate(): void {
    this.root.removeEventListener('click', this.onClick)
    this.root.remove()
  }

  private render(): void {
    const anyLevelUp = this.leveledUpIds.size > 0

    const cards = this.runState.loadout.map((loadout) => {
      const charId = loadout.characterId
      const char = getCharacter(charId)
      const totalXp = this.runState.heroXp[charId] ?? 0
      const { level, current, needed, pct } = xpProgress(totalXp)
      const didLevel = this.leveledUpIds.has(charId)
      const title = char?.title ?? char?.class ?? ''

      // What ability did they unlock on level-up?
      const abilities = char?.attacks.filter((a) => a.abilityType) ?? []
      const newAbility = didLevel ? abilities[level - 1] : null
      const newAbilityLine = newAbility
        ? `<div class="xp-new-ability">
             <span class="xp-ability-pill">NEW</span>
             ${newAbility.name}${newAbility.cost > 0 ? ` <span class="xp-ability-cost">${newAbility.cost}c</span>` : ''}
           </div>`
        : ''

      const xpLabel = needed === 0
        ? `MAX`
        : `${current} / ${needed} XP`

      return `
        <div class="xp-card${didLevel ? ' xp-card-levelup' : ''}">
          <div class="xp-card-header">
            <div class="xp-hero-info">
              <span class="xp-hero-name">${char?.name ?? charId}</span>
              <span class="xp-hero-title">${title}</span>
            </div>
            <div class="xp-level-badge${didLevel ? ' xp-level-badge-new' : ''}">
              ${didLevel ? '▲ ' : ''}Lv. ${level}
              <span class="xp-level-title">${LEVEL_TITLES[level] ?? ''}</span>
            </div>
          </div>
          <div class="xp-bar-row">
            <div class="xp-bar-track">
              <div class="xp-fill${needed === 0 ? ' xp-fill-max' : ''}" data-pct="${pct}" style="width:0%"></div>
            </div>
            <span class="xp-label">${xpLabel}</span>
          </div>
          ${newAbilityLine}
        </div>
      `
    }).join('')

    const heading = anyLevelUp ? 'Level Up!' : 'After Action'
    const sub = anyLevelUp
      ? 'Your fighters grow stronger.'
      : 'No new levels — but you\'re getting closer.'

    this.root.innerHTML = `
      <div class="event-panel xp-panel">
        <h2 class="event-title">${heading}</h2>
        <p class="event-flavor">${sub}</p>
        <div class="xp-cards">${cards}</div>
        <div class="event-choices">
          <button class="event-choice" data-levelup="continue">
            <div class="event-choice-label">Continue to Rewards</div>
          </button>
        </div>
      </div>
    `
  }

  private onClick = (e: MouseEvent): void => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-levelup]')
    if (!btn) return
    this.ctx.switchTo(new RewardScene(this.mapGraph, this.runState))
  }
}
