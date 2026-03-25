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
  // Sword Saint (Duelist L5): doubles the stationary bonus
  const multiplier = ctx.attacker.activePassives.includes('passive_sword_saint') ? 2 : 1
  const bonus = char.passive.value * multiplier
  return {
    ...result,
    amount: result.amount + bonus,
    modifiers: [...result.modifiers, `Steady +${bonus}`],
  }
}

/** Duelist passive: attacks ignore DEF. Master Cut (L9) upgrades to ignore 2. */
function applyDuelistArmorPen(ctx: DamageContext, result: DamageResult): DamageResult {
  const passives = ctx.attacker.activePassives
  if (!passives.includes('passive_sword_saint') && !passives.includes('passive_master_cut')) {
    // Base Duelist path passive — ignore 1 DEF (stored on path, applied at base damage)
    return result
  }
  const pen = passives.includes('passive_master_cut') ? 2 : 1
  const restored = Math.min(pen, ctx.defender.stats.defense)
  return restored > 0
    ? { ...result, amount: result.amount + restored, modifiers: [...result.modifiers, `Armor Pen +${restored}`] }
    : result
}

/** Pyromancer passive: Fan the Flames — burning enemies take +1 damage from all sources. */
function applyFanTheFlames(ctx: DamageContext, result: DamageResult): DamageResult {
  if (!ctx.attacker.activePassives.includes('passive_fan_flames')) return result
  const isBurning = ctx.defender.statusEffects.some((s) => s.type === 'burn')
  if (!isBurning) return result
  return {
    ...result,
    amount: result.amount + 1,
    modifiers: [...result.modifiers, 'Fan the Flames +1'],
  }
}

/** Frostweaver passive: Shatter — hitting a Stasis enemy deals +3 bonus damage. */
function applyShatter(ctx: DamageContext, result: DamageResult): DamageResult {
  if (!ctx.attacker.activePassives.includes('passive_shatter')) return result
  const inStasis = ctx.defender.statusEffects.some((s) => s.type === 'stasis')
  if (!inStasis) return result
  return {
    ...result,
    amount: result.amount + 3,
    modifiers: [...result.modifiers, 'Shatter +3'],
  }
}

/** Arcane Hunter passive: Hunter's Eye — marked target takes +1 (or +2 with upgrade). */
function applyHuntersEye(ctx: DamageContext, result: DamageResult): DamageResult {
  const passives = ctx.attacker.activePassives
  if (!passives.includes('passive_hunters_eye') && !passives.includes('passive_precision_mark')) return result
  const isMarked = ctx.defender.statusEffects.some((s) => s.type === 'marked')
  if (!isMarked) return result
  const bonus = passives.includes('passive_precision_mark') ? 2 : 1
  return {
    ...result,
    amount: result.amount + bonus,
    modifiers: [...result.modifiers, `Marked +${bonus}`],
  }
}

/** Outlaw passive: Dead Eye — +2 damage when not moved this turn. */
function applyDeadEye(ctx: DamageContext, result: DamageResult): DamageResult {
  if (!ctx.attacker.activePassives.includes('passive_dead_eye')) return result
  if (ctx.attacker.movementLeft < ctx.attacker.stats.moveRange) return result
  if (ctx.attackType.kind !== 'projectile') return result
  return {
    ...result,
    amount: result.amount + 2,
    modifiers: [...result.modifiers, 'Dead Eye +2'],
  }
}

/** Shadow passive: First Blood — first attack each combat deals +3 damage. */
function applyFirstBlood(ctx: DamageContext, result: DamageResult): DamageResult {
  if (!ctx.attacker.activePassives.includes('passive_first_blood')) return result
  if (ctx.attacker.firstBloodUsed) return result
  ctx.attacker.firstBloodUsed = true
  return {
    ...result,
    amount: result.amount + 3,
    modifiers: [...result.modifiers, 'First Blood +3'],
  }
}

/** Iron Tide passive: Armor of Kelly — reduce incoming damage by 1 (or 2 with upgrade). */
function applyArmorOfKelly(ctx: DamageContext, result: DamageResult): DamageResult {
  const passives = ctx.defender.activePassives
  const hasBase = passives.includes('passive_iron_body') // from path passive at L2
  const hasUpgrade = passives.includes('passive_armor_kelly')
  if (!hasBase && !hasUpgrade) return result
  const reduction = hasUpgrade ? 2 : 1
  return {
    ...result,
    amount: Math.max(1, result.amount - reduction),
    modifiers: [...result.modifiers, `Iron Body -${reduction}`],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ordered pipeline
// ─────────────────────────────────────────────────────────────────────────────

const DAMAGE_CHAIN: DamageModifier[] = [
  applyBaseDamage,
  applyStationaryBonus,
  applyDuelistArmorPen,
  applyDeadEye,
  applyFirstBlood,
  applyModDamageBonus,
  applyFanTheFlames,
  applyShatter,
  applyHuntersEye,
  applyModDefenseBonus,
  applyArmorOfKelly,
  applyReactiveShield,
]

/**
 * Resolve the final damage for an attack.
 * Modifier order is fixed in `DAMAGE_CHAIN`: base → hero passives → gear →
 * defensive passives → reactive shield (zeros damage last).
 */
export function resolveDamage(ctx: DamageContext): DamageResult {
  let result: DamageResult = { amount: 0, isCrit: false, modifiers: [] }
  for (const modifier of DAMAGE_CHAIN) {
    result = modifier(ctx, result)
  }
  return result
}
