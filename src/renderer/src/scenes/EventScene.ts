import { MapScene } from './MapScene'
import type { MapGraph } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import type { Scene, SceneContext } from './Scene'

interface EventChoice {
  label: string
  description: string
  apply: (state: RunState) => void
}

interface GameEvent {
  title: string
  flavor: string
  choices: EventChoice[]
}

const EVENTS: GameEvent[] = [
  {
    title: 'The Field Medic',
    flavor: 'A field medic offers to patch up your squad.',
    choices: [
      {
        label: 'Focus on one',
        description: 'Restore 30 HP to one unit',
        apply: (s) => {
          const wounded = s.partyRoster.filter((u) => u.hp < u.maxHp)
          const target = wounded.length > 0 ? wounded[0] : s.partyRoster[0]
          if (target) target.hp = Math.min(target.maxHp, target.hp + 30)
        },
      },
      {
        label: 'Spread it',
        description: 'Restore 15 HP to all units',
        apply: (s) => {
          for (const u of s.partyRoster) u.hp = Math.min(u.maxHp, u.hp + 15)
        },
      },
    ],
  },
  {
    title: 'Aurora Winds',
    flavor: 'You pass through an aurora. Your team feels lighter.',
    choices: [
      {
        label: 'Accept the blessing',
        description: 'All units gain +1 ATK for the rest of the run',
        apply: (s) => { s.bonusAtk += 1 },
      },
    ],
  },
  {
    title: 'Crashed Supply Drone',
    flavor: 'A crashed supply drone. Cargo intact — but the signal beacon is active. Someone knows it\'s here.',
    choices: [
      {
        label: 'Loot quickly',
        description: '+1 DEF to all units, but next combat has tougher enemies',
        apply: (s) => { s.bonusDef += 1 },
      },
      {
        label: 'Leave it',
        description: 'Nothing happens. Better safe than sorry.',
        apply: () => {},
      },
    ],
  },
  {
    title: 'Mysterious Flask',
    flavor: 'A stranger offers you a flask. No label. No explanation. "Drink. It\'s medicine."',
    choices: [
      {
        label: 'Drink',
        description: 'Random: +5 Max HP or -1 ATK to all units',
        apply: (s) => {
          if (Math.random() < 0.5) {
            s.bonusMaxHp += 5
          } else {
            s.bonusAtk = Math.max(0, s.bonusAtk - 1)
          }
        },
      },
      {
        label: 'Refuse',
        description: 'Nothing happens.',
        apply: () => {},
      },
    ],
  },
  {
    title: 'Abandoned Campfire',
    flavor: 'The embers are still warm. Your squad takes a moment to rest.',
    choices: [
      {
        label: 'Rest up',
        description: 'Restore 10 HP to all units',
        apply: (s) => {
          for (const u of s.partyRoster) u.hp = Math.min(u.maxHp, u.hp + 10)
        },
      },
    ],
  },
  {
    title: 'Weapon Cache',
    flavor: 'Hidden behind rubble, a stash of military-grade supplies.',
    choices: [
      {
        label: 'Take the weapons',
        description: 'All units gain +2 ATK for the rest of the run',
        apply: (s) => { s.bonusAtk += 2 },
      },
      {
        label: 'Take the armor',
        description: 'All units gain +2 DEF for the rest of the run',
        apply: (s) => { s.bonusDef += 2 },
      },
      {
        label: 'Leave it',
        description: 'Could be trapped. Walk away.',
        apply: () => {},
      },
    ],
  },
]

function pickEvent(seed: number): GameEvent {
  return EVENTS[Math.abs(seed) % EVENTS.length]
}

export class EventScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext

  constructor(
    private readonly mapGraph: MapGraph,
    private readonly runState: RunState,
    private readonly seed: number
  ) {}

  activate(ctx: SceneContext): void {
    this.ctx = ctx

    const event = pickEvent(this.seed)

    this.root = document.createElement('div')
    this.root.id = 'event-screen'
    this.root.innerHTML = `
      <div class="event-panel">
        <h2 class="event-title">${event.title}</h2>
        <p class="event-flavor">${event.flavor}</p>
        <div class="event-choices">
          ${event.choices.map((c, i) => `
            <button class="event-choice" data-index="${i}">
              <div class="event-choice-label">${c.label}</div>
              <div class="event-choice-desc">${c.description}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `

    this.root.addEventListener('click', this.onClick)
    ctx.container.appendChild(this.root)
    ctx.ready()
  }

  deactivate(): void {
    this.root.removeEventListener('click', this.onClick)
    this.root.remove()
  }

  private onClick = (e: MouseEvent): void => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.event-choice')
    if (!btn) return
    const idx = parseInt(btn.dataset.index ?? '0', 10)
    const event = pickEvent(this.seed)
    event.choices[idx].apply(this.runState)
    this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
  }
}
