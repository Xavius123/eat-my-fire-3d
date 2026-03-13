/**
 * TraitData — Definitions for permanent run-wide perks (traits).
 *
 * Traits are acquired through rewards, shops, or boss drops (Phase 4+).
 * Their effects are evaluated inside DamageResolver and other hook points.
 *
 * The catalog starts empty and will be populated in Phase 4 with real
 * trait definitions from the GDD. The TraitId type and catalog structure
 * are established here so all downstream systems use a consistent contract.
 *
 * Example trait (not yet active):
 * ```ts
 * 'gambler': {
 *   id: 'gambler',
 *   name: 'Gambler',
 *   description: 'Spend 10 gold per attack to deal +50% damage.',
 *   hookPoints: ['damage_modifier'],
 * }
 * ```
 */

/** A string id referencing a TraitDefinition in TRAIT_CATALOG. */
export type TraitId = string

/**
 * Where in the game loop this trait's effect is evaluated.
 * Systems check traits at matching hook points and call the trait's logic.
 */
export type TraitHookPoint =
  | 'damage_modifier' // evaluated in DamageResolver
  | 'on_kill'         // evaluated after a unit is killed
  | 'on_turn_start'   // evaluated at the start of the player turn
  | 'on_move'         // evaluated after a unit moves

export interface TraitDefinition {
  id: TraitId
  name: string
  description: string
  /** Which systems need to query this trait. */
  hookPoints: TraitHookPoint[]
}

/**
 * The central trait catalog. Keys are trait IDs.
 * Populate this in Phase 4 with real trait definitions.
 */
export const TRAIT_CATALOG: Record<TraitId, TraitDefinition> = {}

/** Look up a trait definition by id. Returns undefined if not found. */
export function getTrait(id: TraitId): TraitDefinition | undefined {
  return TRAIT_CATALOG[id]
}
