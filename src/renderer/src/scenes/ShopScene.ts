import { MapScene } from './MapScene'
import type { MapGraph } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import { addItemStack, removeItemStack } from '../run/ItemInventory'
import { getItem } from '../run/ItemData'
import type { Scene, SceneContext } from './Scene'

interface ShopItem {
  label: string
  description: string
  cost: number
  apply: (state: RunState) => void
}

const RARITY_COLORS: Record<string, string> = {
  common: '#aaa',
  uncommon: '#4488ff',
  rare: '#aa44ff',
  legendary: '#ffaa00',
}

const SHOP_ITEMS: ShopItem[] = [
  {
    label: 'Healing Salve',
    description: 'Add 1 salve to inventory (use at Rest to heal the party)',
    cost: 12,
    apply: (s) => { addItemStack(s, 'healing_salve', 1) },
  },
  {
    label: 'Crystal Shard',
    description: 'Add 1 shard to inventory (use at Rest for +1 crystal)',
    cost: 15,
    apply: (s) => { addItemStack(s, 'crystal_shard', 1) },
  },
  {
    label: 'Greater Salve',
    description: 'Add 1 greater salve (16 HP party heal at Rest)',
    cost: 22,
    apply: (s) => { addItemStack(s, 'greater_salve', 1) },
  },
  {
    label: "Saint's Balm",
    description: 'Add 1 balm (22 HP party heal at Rest)',
    cost: 32,
    apply: (s) => { addItemStack(s, 'saints_balm', 1) },
  },
  {
    label: 'Field Bandage Kit',
    description: 'Add 1 kit (full heal most wounded at Rest)',
    cost: 14,
    apply: (s) => { addItemStack(s, 'field_bandage', 1) },
  },
  {
    label: 'Small Gold Coffer',
    description: 'Add 1 coffer (+20 gold when used at Rest)',
    cost: 18,
    apply: (s) => { addItemStack(s, 'gold_coffer', 1) },
  },
  {
    label: 'Revive Draught',
    description: 'Revive a fallen hero to 50% HP (use in combat or post-battle)',
    cost: 35,
    apply: (s) => { addItemStack(s, 'revive_draught', 1) },
  },
  {
    label: 'Tinker Chip',
    description: 'Add 1 chip (recover 1 mod reroll spent this run)',
    cost: 28,
    apply: (s) => { addItemStack(s, 'mod_reroll_chip', 1) },
  },
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

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

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
    const equipmentItems = this.runState.items
      .map((stack) => ({ stack, def: getItem(stack.itemId) }))
      .filter(({ def }) => def?.type === 'weapon' || def?.type === 'armor')

    const sellSection = equipmentItems.length > 0 ? `
      <div class="shop-section-title">Sell from Bag</div>
      <div class="shop-sell-items">
        ${equipmentItems.map(({ stack, def }) => {
          if (!def) return ''
          const sellPrice = Math.floor((def.goldCost ?? 20) * 0.5)
          const rColor = RARITY_COLORS[def.rarity] ?? '#aaa'
          return `
            <div class="shop-sell-item">
              <div class="shop-sell-name" style="color:${rColor}">${escHtml(def.name)}${stack.quantity > 1 ? ` ×${stack.quantity}` : ''}</div>
              <div class="shop-sell-desc">${escHtml(def.description)}</div>
              <button class="shop-sell-btn" data-sell-item="${escHtml(def.id)}">${sellPrice} gold</button>
            </div>
          `
        }).join('')}
      </div>
    ` : `<div class="shop-section-title shop-section-empty">No equipment in bag to sell</div>`

    this.root.innerHTML = `
      <div class="shop-panel">
        <h2 class="shop-title">SHOP</h2>
        <div class="shop-gold">Gold: ${this.runState.gold}</div>
        <div class="shop-section-title">Buy</div>
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
        ${sellSection}
        <button class="shop-leave-btn">Leave Shop</button>
      </div>
    `
  }

  private onClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement

    const leaveBtn = target.closest<HTMLButtonElement>('.shop-leave-btn')
    if (leaveBtn) {
      this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
      return
    }

    const sellBtn = target.closest<HTMLButtonElement>('.shop-sell-btn')
    if (sellBtn) {
      const itemId = sellBtn.dataset.sellItem
      if (!itemId) return
      const def = getItem(itemId)
      if (!def) return
      const sellPrice = Math.floor((def.goldCost ?? 20) * 0.5)
      removeItemStack(this.runState, itemId, 1)
      this.runState.gold += sellPrice
      this.buildUI()
      return
    }

    const itemBtn = target.closest<HTMLButtonElement>('.shop-item')
    if (!itemBtn || itemBtn.classList.contains('shop-item-disabled')) return

    const idx = parseInt(itemBtn.dataset.index ?? '0', 10)
    const item = SHOP_ITEMS[idx]
    if (this.runState.gold < item.cost) return

    this.runState.gold -= item.cost
    item.apply(this.runState)

    this.buildUI()
  }
}
