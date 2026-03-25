import type { RunState } from './RunState'
import { getItem, isCombatUsableConsumable } from './ItemData'
export { isCombatUsableConsumable }

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
    if (e.kind === 'consumable_add_gold' && e.amount != null) {
      state.gold += e.amount
    }
    if (e.kind === 'consumable_full_heal_most_wounded') {
      if (state.partyRoster.length === 0) continue
      const wounded = state.partyRoster.reduce((a, b) =>
        a.maxHp <= 0 ? b : b.maxHp <= 0 ? a : a.hp / a.maxHp < b.hp / b.maxHp ? a : b
      )
      wounded.hp = wounded.maxHp
    }
    if (e.kind === 'consumable_refund_mod_reroll') {
      state.modRerollsSpentThisRun = Math.max(0, state.modRerollsSpentThisRun - 1)
    }
  }

  stack.quantity -= 1
  if (stack.quantity <= 0) {
    state.items = state.items.filter((s) => s.itemId !== itemId)
  }
  return true
}

/**
 * Remove one copy of an item from inventory without applying any effects.
 * Used by the combat UI which applies combat-specific effects directly to unit entities.
 */
export function consumeFromInventory(state: RunState, itemId: string): boolean {
  const def = getItem(itemId)
  if (!def || def.type !== 'consumable') return false
  const stack = state.items.find((s) => s.itemId === itemId)
  if (!stack || stack.quantity < 1) return false
  stack.quantity -= 1
  if (stack.quantity <= 0) {
    state.items = state.items.filter((s) => s.itemId !== itemId)
  }
  return true
}

/**
 * Remove one copy of any item (weapon, armor, or consumable) from inventory without applying effects.
 * Returns true if successful.
 */
export function removeItemStack(state: RunState, itemId: string, quantity = 1): boolean {
  const stack = state.items.find((s) => s.itemId === itemId)
  if (!stack || stack.quantity < quantity) return false
  stack.quantity -= quantity
  if (stack.quantity <= 0) {
    state.items = state.items.filter((s) => s.itemId !== itemId)
  }
  return true
}
