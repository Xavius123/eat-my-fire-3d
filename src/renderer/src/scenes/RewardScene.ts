import { MapScene } from './MapScene'
import type { MapGraph } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import type { Scene, SceneContext } from './Scene'

interface RewardOption {
  label: string
  description: string
  apply: (state: RunState) => void
}

const REWARD_OPTIONS: RewardOption[] = [
  {
    label: '+1 ATK',
    description: 'All player units gain +1 Attack',
    apply: (s) => { s.bonusAtk += 1 }
  },
  {
    label: '+1 DEF',
    description: 'All player units gain +1 Defense',
    apply: (s) => { s.bonusDef += 1 }
  },
  {
    label: '+5 HP',
    description: 'All player units gain +5 Max HP',
    apply: (s) => { s.bonusMaxHp += 5 }
  }
]

export class RewardScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext

  constructor(
    private readonly mapGraph: MapGraph,
    private readonly runState: RunState
  ) {}

  activate(ctx: SceneContext): void {
    this.ctx = ctx

    this.root = document.createElement('div')
    this.root.id = 'reward-screen'
    this.root.innerHTML = `
      <h2 class="reward-title">CHOOSE A REWARD</h2>
      <div class="reward-cards">
        ${REWARD_OPTIONS.map((o, i) => `
          <button class="reward-card" data-index="${i}">
            <div class="reward-card-label">${o.label}</div>
            <div class="reward-card-desc">${o.description}</div>
          </button>
        `).join('')}
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
    const card = (e.target as HTMLElement).closest<HTMLButtonElement>('.reward-card')
    if (!card) return
    const idx = parseInt(card.dataset.index ?? '0', 10)
    REWARD_OPTIONS[idx].apply(this.runState)
    this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
  }
}
