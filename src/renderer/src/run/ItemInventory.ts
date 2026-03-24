import type { RunState } from './RunState'
import { getItem } from './ItemData'

/** Add to run inventory (stacks with existing same itemId). */
export function addItemStack(state: RunState, itemId: string, quantity: number): void {
  const def = getItem(itemId)
  if (!def || quantity <= 0) return
  const existing = state.items.find((s) => s.itemId === itemId)
  if (existing) existing.quantity += quantity
  else state.items.push({ itemId, quantity })
}

export function getStackQuantity(state: RunState, itemId: string): number {
  return state.items.find((s) => s.itemId === itemId)?.quantity ?? 0
}

/**
 * Consume one stack of a consumable and apply its effects (party heal, crystals, etc.).
 * Returns false if missing, wrong type, or quantity 0.
 */
export function tryConsumeConsumable(state: RunState, itemId: string): boolean {
  const def = getItem(itemId)
  if (!def || def.type !== 'consumable') return false
  const stack = state.items.find((s) => s.itemId === itemId)
  if (!stack || stack.quantity < 1) return false

  for (const e of def.effects) {
    if (e.kind === 'consumable_party_heal' && e.amount != null) {
      const amt = e.amount
      for (const u of state.partyRoster) {
        u.hp = Math.min(u.maxHp, u.hp + amt)
      }
    }
    if (e.kind === 'consumable_add_crystals' && e.amount != null) {
      state.crystals += e.amount
    }
  }

  stack.quantity -= 1
  if (stack.quantity <= 0) {
    state.items = state.items.filter((s) => s.itemId !== itemId)
  }
  return true
}
