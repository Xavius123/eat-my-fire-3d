import type { UnitData, AttackType } from '../entities/UnitData'
import type { RunState } from '../run/RunState'
import { getMod, effectiveValue } from '../run/ModData'

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
 */
type DamageModifier = (ctx: DamageContext, result: DamageResult) => DamageResult

// ─────────────────────────────────────────────────────────────────────────────
// Modifier implementations
// ─────────────────────────────────────────────────────────────────────────────

function applyBaseDamage(ctx: DamageContext, result: DamageResult): DamageResult {
  const base = Math.max(1, ctx.attacker.stats.attack - ctx.defender.stats.defense)
  return { ...result, amount: base }
}

function applyModDamageBonus(ctx: DamageContext, result: DamageResult): DamageResult {
  let bonus = 0
  for (const equipped of ctx.attacker.weaponMods) {
    const def = getMod(equipped.modId)
    if (!def) continue
    for (const effect of def.effects) {
      if (effect.kind === 'flat_damage') {
        bonus += effectiveValue(effect, equipped.stacks)
      }
    }
  }
  if (bonus > 0) {
    return {
      ...result,
      amount: result.amount + bonus,
      modifiers: [...result.modifiers, `Mods +${bonus}`],
    }
  }
  return result
}

function applyModDefenseBonus(ctx: DamageContext, result: DamageResult): DamageResult {
  let bonus = 0
  for (const equipped of ctx.defender.armorMods) {
    const def = getMod(equipped.modId)
    if (!def) continue
    for (const effect of def.effects) {
      if (effect.kind === 'flat_defense') {
        bonus += effectiveValue(effect, equipped.stacks)
      }
    }
  }
  if (bonus > 0) {
    const reduced = Math.max(1, result.amount - bonus)
    return {
      ...result,
      amount: reduced,
      modifiers: [...result.modifiers, `Armor mods -${bonus}`],
    }
  }
  return result
}

function applyReactiveShield(ctx: DamageContext, result: DamageResult): DamageResult {
  if (ctx.defender.reactiveShieldActive) {
    ctx.defender.reactiveShieldActive = false
    return {
      ...result,
      amount: 0,
      modifiers: [...result.modifiers, 'Reactive Shield'],
    }
  }
  return result
}

function applyAuraEffects(ctx: DamageContext, result: DamageResult): DamageResult {
  // Aura damage reduction from nearby Shielders (enemy side)
  // This is handled at the unit level — defenders near Shielders get damage reduction
  // We check the defender's team for nearby aura units
  // Note: We don't have access to UnitManager here, so aura effects are applied
  // in CombatActions where we have the full context.
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Ordered pipeline
// ─────────────────────────────────────────────────────────────────────────────

const DAMAGE_CHAIN: DamageModifier[] = [
  applyBaseDamage,
  applyModDamageBonus,
  applyModDefenseBonus,
  applyReactiveShield,
]

/**
 * Resolve the final damage for an attack, running all modifiers in order.
 */
export function resolveDamage(ctx: DamageContext): DamageResult {
  let result: DamageResult = { amount: 0, isCrit: false, modifiers: [] }
  for (const modifier of DAMAGE_CHAIN) {
    result = modifier(ctx, result)
  }
  return result
}
