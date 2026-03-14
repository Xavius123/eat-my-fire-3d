import { MapScene } from './MapScene'
import type { MapGraph } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import type { Scene, SceneContext } from './Scene'

interface ShopItem {
  label: string
  description: string
  cost: number
  apply: (state: RunState) => void
}

const SHOP_ITEMS: ShopItem[] = [
  {
    label: '+2 ATK',
    description: 'All units gain +2 Attack',
    cost: 30,
    apply: (s) => { s.bonusAtk += 2 },
  },
  {
    label: '+2 DEF',
    description: 'All units gain +2 Defense',
    cost: 30,
    apply: (s) => { s.bonusDef += 2 },
  },
  {
    label: '+10 Max HP',
    description: 'All units gain +10 Max HP',
    cost: 25,
    apply: (s) => { s.bonusMaxHp += 10 },
  },
  {
    label: 'Heal 20 HP',
    description: 'Restore 20 HP to all units',
    cost: 20,
    apply: (s) => {
      for (const u of s.partyRoster) u.hp = Math.min(u.maxHp, u.hp + 20)
    },
  },
]

export class ShopScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext

  constructor(
    private readonly mapGraph: MapGraph,
    private readonly runState: RunState
  ) {}

  activate(ctx: SceneContext): void {
    this.ctx = ctx

    this.root = document.createElement('div')
    this.root.id = 'shop-screen'
    this.buildUI()

    this.root.addEventListener('click', this.onClick)
    ctx.container.appendChild(this.root)
    ctx.ready()
  }

  deactivate(): void {
    this.root.removeEventListener('click', this.onClick)
    this.root.remove()
  }

  private buildUI(): void {
    this.root.innerHTML = `
      <div class="shop-panel">
        <h2 class="shop-title">SHOP</h2>
        <div class="shop-gold">Gold: ${this.runState.gold}</div>
        <div class="shop-items">
          ${SHOP_ITEMS.map((item, i) => {
            const canAfford = this.runState.gold >= item.cost
            return `
              <button class="shop-item ${canAfford ? '' : 'shop-item-disabled'}" data-index="${i}">
                <div class="shop-item-label">${item.label}</div>
                <div class="shop-item-desc">${item.description}</div>
                <div class="shop-item-cost">${item.cost} gold</div>
              </button>
            `
          }).join('')}
        </div>
        <button class="shop-leave-btn">Leave Shop</button>
      </div>
    `
  }

  private onClick = (e: MouseEvent): void => {
    const leaveBtn = (e.target as HTMLElement).closest<HTMLButtonElement>('.shop-leave-btn')
    if (leaveBtn) {
      this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
      return
    }

    const itemBtn = (e.target as HTMLElement).closest<HTMLButtonElement>('.shop-item')
    if (!itemBtn || itemBtn.classList.contains('shop-item-disabled')) return

    const idx = parseInt(itemBtn.dataset.index ?? '0', 10)
    const item = SHOP_ITEMS[idx]
    if (this.runState.gold < item.cost) return

    this.runState.gold -= item.cost
    item.apply(this.runState)

    // Rebuild UI to reflect updated gold
    this.buildUI()
  }
}
