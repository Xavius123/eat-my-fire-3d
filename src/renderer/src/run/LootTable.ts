/**
 * LootTable — Data-driven drop system used by enemy kills, destructible props,
 * and any other source of randomised loot. Shared by Phases 3+ (currency/items).
 */

export type LootType = 'gold' | 'item' | 'nothing'

export interface LootEntry {
  type: LootType
  /** Relative probability weight. Higher = more likely. */
  weight: number
  /** For type 'gold': how many coins to award. */
  amount?: number
  /** For type 'item': the ItemDefinition id to grant. */
  itemId?: string
}

export type LootTable = LootEntry[]

/**
 * Roll a loot table and return a single result.
 * Returns null if 'nothing' is rolled or the table is empty.
 *
 * @param table - array of weighted entries
 * @param rng   - optional seeded RNG function (defaults to Math.random)
 */
export function rollLootTable(
  table: LootTable,
  rng: () => number = Math.random
): LootEntry | null {
  if (table.length === 0) return null

  const totalWeight = table.reduce((sum, e) => sum + e.weight, 0)
  let roll = rng() * totalWeight

  for (const entry of table) {
    roll -= entry.weight
    if (roll <= 0) {
      return entry.type === 'nothing' ? null : entry
    }
  }

  // Floating point safety: return last non-nothing entry
  const last = [...table].reverse().find((e) => e.type !== 'nothing')
  return last ?? null
}

/** Convenience: a table that always gives a fixed gold amount. */
export function fixedGoldTable(amount: number): LootTable {
  return [{ type: 'gold', weight: 1, amount }]
}
