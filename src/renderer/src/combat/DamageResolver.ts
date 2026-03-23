import type { UnitData, AttackType } from '../entities/UnitData'
import type { RunState } from '../run/RunState'
import { getMod, effectiveValue } from '../run/ModData'
import { getCharacter } from '../entities/CharacterData'

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

/** Hero passive: stationary_bonus — extra ATK if the hero has not moved this turn. */
function applyStationaryBonus(ctx: DamageContext, result: DamageResult): DamageResult {
  if (!ctx.attacker.characterId) return result
  const char = getCharacter(ctx.attacker.characterId)
  if (char?.passive?.type !== 'stationary_bonus') return result
  // Hero hasn't moved if movementLeft equals full move range
  if (ctx.attacker.movementLeft < ctx.attacker.stats.moveRange) return result
  const bonus = char.passive.value
  return {
    ...result,
    amount: result.amount + bonus,
    modifiers: [...result.modifiers, `Steady +${bonus}`],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ordered pipeline
// ─────────────────────────────────────────────────────────────────────────────

const DAMAGE_CHAIN: DamageModifier[] = [
  applyBaseDamage,
  applyStationaryBonus,
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
