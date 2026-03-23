import { MapScene } from './MapScene'
import type { MapGraph } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import type { Scene, SceneContext } from './Scene'

function hasNed(state: RunState): boolean {
  return state.loadout.some((l) => l.characterId === 'ned')
}

function healAll(state: RunState, amount: number): void {
  for (const u of state.partyRoster) {
    u.hp = amount === Infinity ? u.maxHp : Math.min(u.maxHp, u.hp + amount)
  }
}

// ── Brother definitions ────────────────────────────────────────────────────

interface BrotherCamp {
  brother: 'chuco' | 'benito'
  title: string
  dish: string
  flavor: string
  nedLine: string
  healAmount: number
  bonusLabel: string
  bonusDesc: string
  applyBonus: (rs: RunState) => void
  setMet: (rs: RunState) => void
}

const CHUCO: BrotherCamp = {
  brother: 'chuco',
  title: "Chuco's Camp",
  dish: 'Frontier Stew',
  flavor: `A fire off the main path. Heavy pot, slow simmer. He doesn't stop stirring when he hears you coming — just nods at the stack of bowls.

"Sit. There's enough."

There's always enough. The stew is thick and hot and tastes like somewhere else entirely.`,
  nedLine: `He spots Ned before he spots the rest of you. "...Ned? You absolute nightmare. You're alive." He shakes his head and reaches for an extra bowl. "Sit. Eat. I'm not hearing about it until after."

`,
  healAmount: Infinity, // full heal
  bonusLabel: 'Frontier Stew',
  bonusDesc: 'Full HP restore to all units. The stew brings everyone back.',
  applyBonus: (rs) => {
    rs.bonusMaxHp += 1
    for (const u of rs.partyRoster) {
      u.maxHp += 1
      u.hp = u.maxHp
    }
  },
  setMet: (rs) => { rs.metChuco = true },
}

const BENITO: BrotherCamp = {
  brother: 'benito',
  title: "Benito's Camp",
  dish: 'Spiced Meat',
  flavor: `More organized than you'd expect out here. Provisions laid out in rows, fire at the right height, a cloth over the prep surface. He's made something of it.

"Good timing. Sit down before it gets cold — it's better hot."

The meat has heat to it. You feel it in your chest before you've finished eating.`,
  nedLine: `He sees Ned and stops moving entirely for a moment. "You know, when that Gate opened, the last thing I saw was you running the wrong direction." His tone is dry. There's no real anger in it. "You look terrible. Sit down."

`,
  healAmount: Infinity, // full heal
  bonusLabel: 'Spiced Meat',
  bonusDesc: 'Full HP restore to all units. +1 charge to all weapons at the start of your next combat.',
  applyBonus: (rs) => { rs.campBonusCharges += 1 },
  setMet: (rs) => { rs.metBenito = true },
}

// ── Scene ──────────────────────────────────────────────────────────────────

export class CampScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext
  private camp!: BrotherCamp

  constructor(
    private readonly mapGraph: MapGraph,
    private readonly runState: RunState,
    seed: number
  ) {
    // Pick which brother based on who hasn't been met yet
    if (!runState.metChuco) {
      this.camp = CHUCO
    } else if (!runState.metBenito) {
      this.camp = BENITO
    } else {
      // Both met — alternate based on seed
      this.camp = seed % 2 === 0 ? CHUCO : BENITO
    }
  }

  activate(ctx: SceneContext): void {
    this.ctx = ctx
    this.root = document.createElement('div')
    this.root.id = 'event-screen'
    this.camp.setMet(this.runState)
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
    const c = this.camp
    const rs = this.runState
    const ned = hasNed(rs)
    const healWithBonus = c.healAmount
    const flavor = (ned ? c.nedLine : '') + c.flavor

    this.root.innerHTML = `
      <div class="event-panel">
        <h2 class="event-title">${c.title}</h2>
        <p class="event-flavor camp-dish">Tonight: <strong>${c.dish}</strong></p>
        <p class="event-flavor">${flavor.replace(/\n/g, '<br>')}</p>
        <div class="event-choices">
          <button class="event-choice" data-camp="eat">
            <div class="event-choice-label">Sit down and eat</div>
            <div class="event-choice-desc">${c.bonusDesc}${ned ? ' Ned gets an extra bowl.' : ''}</div>
          </button>
          <button class="event-choice" data-camp="leave">
            <div class="event-choice-label">Can't stop — keep moving</div>
            <div class="event-choice-desc">Restore 8 HP to all units. He wraps something up for the road.</div>
          </button>
        </div>
      </div>
    `
  }

  private onClick = (e: MouseEvent): void => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-camp]')
    if (!btn) return

    const choice = btn.dataset.camp
    const rs = this.runState

    if (choice === 'eat') {
      healAll(rs, Infinity) // full heal
      this.camp.applyBonus(rs)
    } else {
      // Quick stop — partial heal, no bonus
      healAll(rs, 8)
    }

    this.ctx.switchTo(new MapScene(this.mapGraph, rs))
  }
}
