import type { ItemStack } from './ItemData'
import type { TraitId } from './TraitData'

/**
 * Per-unit equipment selections made at the loadout screen.
 */
export interface UnitLoadout {
  characterId: string
  weaponId: string | null
  armorId: string | null
}

/**
 * Snapshot of a single unit's persistent state between combats.
 * Used by partyRoster to carry HP (and later equipment) across encounters.
 */
export interface UnitSaveData {
  unitId: string
  hp: number
  maxHp: number
}

export interface RunState {
  // ── Stat bonuses (applied to all player units at combat start) ──
  bonusAtk: number
  bonusDef: number
  bonusMaxHp: number

  // ── Economy (Phase 3+) ──
  gold: number

  // ── Carried items (Phase 4+) ──
  /** Items in the player's inventory. Multiple copies tracked via quantity. */
  items: ItemStack[]

  // ── Traits / perks (Phase 4+) ──
  /** IDs of permanent run-wide traits the player has acquired. */
  traits: TraitId[]

  // ── Reproducibility ──
  runSeed: number

  // ── Party persistence (Phase 3+) ──
  partyRoster: UnitSaveData[]

  // ── Pre-run loadout ──
  /** Equipment selections for each of the 3 player units (index = unit slot). */
  loadout: UnitLoadout[]
}

export function createRunState(): RunState {
  return {
    bonusAtk: 0,
    bonusDef: 0,
    bonusMaxHp: 0,
    gold: 50,
    items: [],
    traits: [],
    runSeed: 0,
    partyRoster: [],
    loadout: [],
  }
}
