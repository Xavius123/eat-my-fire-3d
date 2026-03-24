import { MapScene } from './MapScene'
import type { MapGraph } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import { getItem } from '../run/ItemData'
import { tryConsumeConsumable } from '../run/ItemInventory'
import type { Scene, SceneContext } from './Scene'

function esc(s: string): string {
  const d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}

export class RestScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext

  constructor(
    private readonly mapGraph: MapGraph,
    private readonly runState: RunState
  ) {}

  activate(ctx: SceneContext): void {
    this.ctx = ctx
    this.root = document.createElement('div')
    this.root.id = 'event-screen'
    this.render()
    this.root.addEventListener('click', this.onClick)
    ctx.container.appendChild(this.root)
    ctx.ready()
  }

  deactivate(): void {
    this.root.removeEventListener('click', this.onClick)
    this.root.remove()
  }

  private render(): void {
    const roster = this.runState.partyRoster
    const mostWounded = roster.length > 0
      ? roster.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b))
      : null
    const woundedName = mostWounded?.unitId ?? 'most wounded'
    const rs = this.runState

    const consumableRows = rs.items
      .filter((s) => s.quantity > 0)
      .map((s) => {
        const def = getItem(s.itemId)
        if (!def || def.type !== 'consumable') return ''
        return `
          <button type="button" class="event-choice" data-rest="consume" data-item-id="${def.id}">
            <div class="event-choice-label">Use ${esc(def.name)} ×${s.quantity}</div>
            <div class="event-choice-desc">${esc(def.description)}</div>
          </button>`
      })
      .join('')

    this.root.innerHTML = `
      <div class="event-panel">
        <h2 class="event-title">Rest</h2>
        <p class="event-flavor">
          The path is quiet for once. No movement ahead, no sound behind.
          Your squad drops their packs. Someone finds a flat rock to sit on.
          It won't last — but for now, it's enough.
        </p>
        <div class="event-choices">
          <button type="button" class="event-choice" data-rest="heal">
            <div class="event-choice-label">Rest</div>
            <div class="event-choice-desc">Restore 6 HP to all units</div>
          </button>
          <button type="button" class="event-choice" data-rest="train">
            <div class="event-choice-label">Train</div>
            <div class="event-choice-desc">All units gain +1 ATK for the rest of the run</div>
          </button>
          <button type="button" class="event-choice" data-rest="tend">
            <div class="event-choice-label">Tend Wounds</div>
            <div class="event-choice-desc">Fully restore HP to ${esc(woundedName)}</div>
          </button>
          ${consumableRows || '<p class="event-flavor" style="opacity:0.7">No consumables in inventory.</p>'}
        </div>
      </div>
    `
  }

  private onClick = (e: MouseEvent): void => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-rest]')
    if (!btn) return

    const choice = btn.dataset.rest
    const rs = this.runState

    if (choice === 'consume' && btn.dataset.itemId) {
      tryConsumeConsumable(rs, btn.dataset.itemId)
      this.render()
      return
    }

    switch (choice) {
      case 'heal':
        for (const u of rs.partyRoster) u.hp = Math.min(u.maxHp, u.hp + 6)
        break
      case 'train':
        rs.bonusAtk += 1
        break
      case 'tend': {
        const wounded = rs.partyRoster.length > 0
          ? rs.partyRoster.reduce((a, b) => (a.hp / a.maxHp < b.hp / b.maxHp ? a : b))
          : null
        if (wounded) wounded.hp = wounded.maxHp
        break
      }
      default:
        return
    }

    this.ctx.switchTo(new MapScene(this.mapGraph, rs))
  }
}
