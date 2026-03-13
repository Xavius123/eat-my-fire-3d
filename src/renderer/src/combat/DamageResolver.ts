import type { UnitData, AttackType } from '../entities/UnitData'
import type { RunState } from '../run/RunState'

export interface DamageContext {
  attacker: UnitData
  defender: UnitData
  attackType: AttackType
  /** Present when combat is running inside a full run (not standalone). */
  runState?: RunState
}

export interface DamageResult {
  amount: number
  isCrit: boolean
  /**
   * Human-readable modifier labels accumulated during resolution.
   * Used for future combat log / floating damage text UI.
   * e.g. ["Gambler +8", "Weakness +4"]
   */
  modifiers: string[]
}

/**
 * A damage modifier is a pure function that receives the current context and
 * result, applies its logic, and returns an updated result.
 *
 * Add new modifiers to DAMAGE_CHAIN in the order they should apply:
 *   base damage → weapon bonuses → crit → trait hooks → status modifiers
 */
type DamageModifier = (ctx: DamageContext, result: DamageResult) => DamageResult

// ─────────────────────────────────────────────────────────────────────────────
// Modifier implementations
// ─────────────────────────────────────────────────────────────────────────────

function applyBaseDamage(ctx: DamageContext, result: DamageResult): DamageResult {
  const base = Math.max(1, ctx.attacker.stats.attack - ctx.defender.stats.defense)
  return { ...result, amount: base }
}

// Placeholders — uncomment and implement as each phase is completed:
//
// function applyWeaponBonus(ctx: DamageContext, result: DamageResult): DamageResult {
//   // Phase 4: sum flat damage bonuses from equipped weapon items in runState.items
//   return result
// }
//
// function applyCritChance(ctx: DamageContext, result: DamageResult): DamageResult {
//   // Phase 4: roll crit based on unit stats / trait modifiers
//   return result
// }
//
// function applyTraitModifiers(ctx: DamageContext, result: DamageResult): DamageResult {
//   // Phase 4: iterate runState.traits and apply 'damage_modifier' hook traits
//   //   e.g. Gambler: spend 10 gold → +50% damage
//   return result
// }
//
// function applyStatusModifiers(ctx: DamageContext, result: DamageResult): DamageResult {
//   // Phase 4+: apply attacker status buffs and defender status debuffs
//   return result
// }

// ─────────────────────────────────────────────────────────────────────────────
// Ordered pipeline — each function receives (ctx, result) and returns result.
// ─────────────────────────────────────────────────────────────────────────────

const DAMAGE_CHAIN: DamageModifier[] = [
  applyBaseDamage,
  // applyWeaponBonus,     // Phase 4
  // applyCritChance,      // Phase 4
  // applyTraitModifiers,  // Phase 4
  // applyStatusModifiers, // Phase 4+
]

/**
 * Resolve the final damage for an attack, running all modifiers in order.
 *
 * Usage:
 * ```ts
 * const result = resolveDamage({ attacker: attacker.data, defender: defender.data, attackType, runState })
 * const damage = result.amount
 * ```
 */
export function resolveDamage(ctx: DamageContext): DamageResult {
  let result: DamageResult = { amount: 0, isCrit: false, modifiers: [] }
  for (const modifier of DAMAGE_CHAIN) {
    result = modifier(ctx, result)
  }
  return result
}
