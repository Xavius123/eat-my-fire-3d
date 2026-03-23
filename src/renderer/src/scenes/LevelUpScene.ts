import { RewardScene } from './RewardScene'
import { getCharacter } from '../entities/CharacterData'
import { getAvailablePaths, type HeroPath } from '../data/HeroPathData'
import type { MapGraph } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import type { Scene, SceneContext } from './Scene'
import { xpProgressForDisplay } from '../run/HeroPerks'

// Keep the export for CombatScene's import of the type
export interface LevelUpInfo {
  characterId: string
  name: string
  newLevel: number
}

const LEVEL_TITLES = [
  '',
  'Recruit',
  'Veteran',
  'Elite',
  'Warden',
  'Champion',
  'Paragon',
  'Myth',
  'Ascendant',
  'Transcendent',
  'Legend',
]

export class LevelUpScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext

  /** Path IDs chosen this screen but not yet committed to runState. */
  private pendingPaths = new Map<string, string>()

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
    this.root.innerHTML = this.buildHTML()
    this.root.addEventListener('click', this.onClick)
    ctx.container.appendChild(this.root)
    ctx.ready()

    // Animate XP bars — double RAF so CSS transition triggers after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.triggerXpAnimations()
      })
    })
  }

  deactivate(): void {
    this.root.removeEventListener('click', this.onClick)
    this.root.remove()
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private triggerXpAnimations(): void {
    for (const bar of this.root.querySelectorAll<HTMLElement>('.xp-fill[data-pct]')) {
      bar.style.width = `${bar.dataset.pct}%`
    }
  }

  /** CharIds that just hit level 2 and haven't picked a path yet. */
  private heroesNeedingPath(): string[] {
    return this.runState.loadout
      .map((l) => l.characterId)
      .filter((id) => {
        const xp = this.runState.heroXp[id] ?? 0
        const { level } = xpProgressForDisplay(xp)
        return level === 2 && !this.runState.heroPath[id]
      })
  }

  private allPathsPicked(): boolean {
    const needing = this.heroesNeedingPath()
    return needing.every((id) => this.pendingPaths.has(id))
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  private buildHTML(): string {
    const anyLevelUp = this.leveledUpIds.size > 0
    const needsPathPicks = this.heroesNeedingPath().length > 0
    const continueReady = !needsPathPicks || this.allPathsPicked()

    const cards = this.runState.loadout.map((loadout) => this.buildCard(loadout.characterId)).join('')

    const heading = anyLevelUp ? 'Level Up!' : 'After Action'
    const sub = needsPathPicks
      ? 'Your fighters grow stronger — choose their path.'
      : anyLevelUp
        ? 'Your fighters grow stronger.'
        : "No new levels — but you're getting closer."

    const continueBtnDisabled = continueReady ? '' : 'disabled'
    const continueBtnHint = continueReady ? 'Continue to Rewards' : 'Choose all paths to continue'

    return `
      <div class="event-panel xp-panel">
        <h2 class="event-title">${heading}</h2>
        <p class="event-flavor">${sub}</p>
        <div class="xp-cards">${cards}</div>
        <div class="event-choices">
          <button class="event-choice" data-levelup="continue" ${continueBtnDisabled}>
            <div class="event-choice-label">${continueBtnHint}</div>
          </button>
        </div>
      </div>
    `
  }

  private buildCard(charId: string): string {
    const char = getCharacter(charId)
    const totalXp = this.runState.heroXp[charId] ?? 0
    const { level, current, needed, pct } = xpProgressForDisplay(totalXp)
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

    const xpLabel = needed === 0 ? 'MAX' : `${current} / ${needed} XP`

    // Path section
    const pathSection = this.buildPathSection(charId, level)

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
        ${pathSection}
      </div>
    `
  }

  private buildPathSection(charId: string, level: number): string {
    const existingPath = this.runState.heroPath[charId]

    // Show existing path badge for heroes that already have one
    if (existingPath && level >= 2) {
      const allPaths = getAvailablePaths(charId, this.runState.metEcho)
      const path = allPaths.find((p) => p.id === existingPath)
      if (!path) return ''
      return `
        <div class="path-chosen" style="--path-color: ${path.color}">
          <span class="path-chosen-label">Path</span>
          <span class="path-chosen-name">${path.name}</span>
          <span class="path-chosen-passive">${path.passive}</span>
        </div>
      `
    }

    // Show picker for heroes that just hit level 2 and need to pick
    if (level === 2 && !existingPath) {
      const options = getAvailablePaths(charId, this.runState.metEcho)
      if (options.length === 0) return ''
      const pendingId = this.pendingPaths.get(charId)

      const buttons = options
        .map(
          (p) => `
          <button class="path-option${pendingId === p.id ? ' path-option-selected' : ''}"
                  data-path-pick="${charId}:${p.id}"
                  style="--path-color: ${p.color}">
            <span class="path-option-name">${p.name}</span>
            <span class="path-option-passive">${p.passive}</span>
            <span class="path-option-flavor">${p.flavor}</span>
          </button>
        `
        )
        .join('')

      return `
        <div class="path-picker" data-picker="${charId}">
          <div class="path-picker-label">
            <span class="path-picker-icon">⚔</span> Choose your path
          </div>
          <div class="path-options">${buttons}</div>
        </div>
      `
    }

    return ''
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  private onClick = (e: MouseEvent): void => {
    // Path pick button
    const pathBtn = (e.target as HTMLElement).closest<HTMLElement>('[data-path-pick]')
    if (pathBtn) {
      const [charId, pathId] = pathBtn.dataset.pathPick!.split(':')
      this.pendingPaths.set(charId, pathId)

      // Update button visual states within this picker (no full re-render)
      const picker = pathBtn.closest<HTMLElement>(`[data-picker="${charId}"]`)
      if (picker) {
        picker.querySelectorAll<HTMLElement>('[data-path-pick]').forEach((btn) => {
          btn.classList.toggle('path-option-selected', btn.dataset.pathPick === `${charId}:${pathId}`)
        })
      }

      // Enable Continue button if all picks done
      if (this.allPathsPicked()) {
        const continueBtn = this.root.querySelector<HTMLButtonElement>('[data-levelup="continue"]')
        if (continueBtn) {
          continueBtn.disabled = false
          const label = continueBtn.querySelector('.event-choice-label')
          if (label) label.textContent = 'Continue to Rewards'
        }
      }
      return
    }

    // Continue button
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-levelup]')
    if (!btn) return

    // Commit pending paths to runState
    for (const [charId, pathId] of this.pendingPaths) {
      this.runState.heroPath[charId] = pathId
    }

    this.ctx.switchTo(new RewardScene(this.mapGraph, this.runState))
  }
}
