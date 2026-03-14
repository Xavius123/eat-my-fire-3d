/**
 * StatusEffects — Tracks and applies per-unit status effects during combat.
 *
 * Implemented:
 *   - Burn: X damage at start of unit's turn for N turns
 *   - Corrosion: -1 DEF at start of unit's turn (min 0), lasts entire combat
 *   - Marked: next damage taken is doubled, then consumed
 *   - Leeched: 2 damage to target + 2 heal to applier at start of turn
 *   - Stasis: cannot move, attack, or take damage for 1 turn
 */

export type StatusType = 'burn' | 'corrosion' | 'marked' | 'leeched' | 'stasis'

export interface StatusEffect {
  type: StatusType
  /** Damage per tick (for burn), DEF reduction (for corrosion), etc. */
  value: number
  /** Remaining turns. -1 = lasts entire combat (corrosion). */
  duration: number
  /** Unit ID of the applier (for leeched heal-back). */
  sourceUnitId?: string
}

/**
 * Apply a status effect to a unit's status list.
 * If the same type already exists, refresh with the stronger value/duration.
 */
export function applyStatus(
  statuses: StatusEffect[],
  effect: StatusEffect
): void {
  const existing = statuses.find((s) => s.type === effect.type)
  if (existing) {
    existing.value = Math.max(existing.value, effect.value)
    existing.duration = Math.max(existing.duration, effect.duration)
    if (effect.sourceUnitId) existing.sourceUnitId = effect.sourceUnitId
  } else {
    statuses.push({ ...effect })
  }
}

/**
 * Check if a unit has a specific status effect.
 */
export function hasStatus(statuses: StatusEffect[], type: StatusType): boolean {
  return statuses.some((s) => s.type === type)
}

/**
 * Check if a unit is in stasis (cannot move, attack, or take damage).
 */
export function isInStasis(statuses: StatusEffect[]): boolean {
  return hasStatus(statuses, 'stasis')
}

export interface StatusTickResult {
  /** Total damage dealt by effects this tick. */
  damage: number
  /** HP to heal back to a source unit (from leeched). */
  leechHeal: { sourceUnitId: string; amount: number }[]
  /** DEF reduction applied this tick (from corrosion). */
  defReduction: number
}

/**
 * Process all status effects at the start of a unit's turn.
 * Returns damage dealt, leech heals, and DEF changes.
 * Decrements durations and removes expired effects.
 */
export function tickStatuses(statuses: StatusEffect[]): StatusTickResult {
  const result: StatusTickResult = {
    damage: 0,
    leechHeal: [],
    defReduction: 0,
  }

  for (let i = statuses.length - 1; i >= 0; i--) {
    const s = statuses[i]
    switch (s.type) {
      case 'burn':
        result.damage += s.value
        break
      case 'corrosion':
        result.defReduction += s.value
        break
      case 'leeched':
        result.damage += s.value
        if (s.sourceUnitId) {
          result.leechHeal.push({ sourceUnitId: s.sourceUnitId, amount: s.value })
        }
        break
      case 'stasis':
        // Stasis prevents actions but no damage
        break
      case 'marked':
        // Marked is consumed on next hit, not on tick
        break
    }

    // Decrement duration (skip permanent effects with duration -1)
    if (s.duration > 0) {
      s.duration -= 1
      if (s.duration <= 0) {
        statuses.splice(i, 1)
      }
    }
  }

  return result
}

/** Human-readable label for UI display. */
export function statusLabel(s: StatusEffect): string {
  const dur = s.duration === -1 ? '' : ` (${s.duration}t)`
  switch (s.type) {
    case 'burn':
      return `Burn ${s.value}${dur}`
    case 'corrosion':
      return `Corrosion${dur}`
    case 'marked':
      return `Marked${dur}`
    case 'leeched':
      return `Leeched${dur}`
    case 'stasis':
      return `Stasis${dur}`
  }
}
