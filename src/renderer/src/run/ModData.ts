/**
 * ModData — Definitions for equipment mods that attach to weapons/armor during a run.
 *
 * Mods are earned as combat rewards (faction-locked type) and attach permanently
 * for the run. Duplicate mods upgrade in-place (x2, x3 multiplier).
 */

export type ModSlotType = 'weapon' | 'armor'
export type ModRarity = 'common' | 'rare' | 'legendary' | 'cursed'

export type ModEffectKind =
  | 'flat_damage'       // +X damage per attack
  | 'flat_defense'      // +X defense
  | 'flat_hp'           // +X max HP
  | 'flat_range'        // +X attack range
  | 'flat_charges'      // +X max charges
  | 'flat_movement'     // +X movement
  | 'burn_on_hit'       // apply burn on hit
  | 'recharge_boost'    // +X recharge rate
  | 'negate_first_hit'  // first hit per combat is negated (binary)
  | 'heal_once'         // restore X HP once per combat (binary)
  | 'splash_on_hit'     // hit applies splash to adjacent tiles
  | 'stun_chance'       // % chance to apply stasis on hit
  | 'vampiric'          // lethal damage heals attacker X HP
  | 'self_damage'       // attacker takes X HP per attack (cursed)
  | 'set_defense_zero'  // defender's DEF becomes 0 (cursed)
  | 'must_move_full'    // unit must move full MOV every turn (cursed)
  | 'infinite_charges'  // infinite charges (cursed)
  | 'no_status_procs'   // weapon cannot proc status effects (cursed)
  | 'taunt'             // enemy AI always targets this unit first (cursed)
  | 'status_damage_reduction' // -X damage from status effects

export interface ModEffect {
  kind: ModEffectKind
  /** Numeric value for the effect. */
  value: number
}

export interface ModDefinition {
  id: string
  name: string
  description: string
  slotType: ModSlotType
  rarity: ModRarity
  effects: ModEffect[]
  /** If true, duplicate stacking is disabled (binary effect). */
  nonStackable?: boolean
}

/** A mod instance attached to equipment, with stack count. */
export interface EquippedMod {
  modId: string
  /** Stack multiplier (1 = base, 2 = doubled, 3 = tripled). */
  stacks: number
}

export const MOD_CATALOG: Record<string, ModDefinition> = {
  // ── Weapon Mods (earned from Fire Tech faction) ──
  cal_rounds: {
    id: 'cal_rounds',
    name: '.50 Cal Rounds',
    description: '+5 damage per attack',
    slotType: 'weapon',
    rarity: 'common',
    effects: [{ kind: 'flat_damage', value: 5 }],
  },
  incendiary_rounds: {
    id: 'incendiary_rounds',
    name: 'Incendiary Rounds',
    description: 'Attacks apply Burn 3 for 2 turns',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'burn_on_hit', value: 3 }],
  },
  scope: {
    id: 'scope',
    name: 'Scope',
    description: '+3 attack range',
    slotType: 'weapon',
    rarity: 'common',
    effects: [{ kind: 'flat_range', value: 3 }],
  },
  extended_mag: {
    id: 'extended_mag',
    name: 'Extended Mag',
    description: '+2 max weapon charges',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'flat_charges', value: 2 }],
  },
  fast_loader: {
    id: 'fast_loader',
    name: 'Fast Loader',
    description: '+1 charge recharge per turn',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'recharge_boost', value: 1 }],
  },

  explosive_tip: {
    id: 'explosive_tip',
    name: 'Explosive Tip',
    description: 'Attacks splash to adjacent tiles',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'splash_on_hit', value: 1 }],
  },
  stun_round: {
    id: 'stun_round',
    name: 'Stun Round',
    description: '20% chance to stun on hit',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'stun_chance', value: 20 }],
  },
  extended_magazine: {
    id: 'extended_magazine',
    name: 'Extended Magazine',
    description: '+1 max charge',
    slotType: 'weapon',
    rarity: 'common',
    effects: [{ kind: 'flat_charges', value: 1 }],
  },
  autoloader: {
    id: 'autoloader',
    name: 'Autoloader',
    description: '+1 recharge rate per turn',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'recharge_boost', value: 1 }],
  },
  vampiric_filament: {
    id: 'vampiric_filament',
    name: 'Vampiric Filament',
    description: 'Lethal damage heals attacker for 3 HP',
    slotType: 'weapon',
    rarity: 'legendary',
    effects: [{ kind: 'vampiric', value: 3 }],
    nonStackable: true,
  },

  // ── Cursed Weapon Mods ──
  bloodthirst_rounds: {
    id: 'bloodthirst_rounds',
    name: 'Bloodthirst Rounds',
    description: '+6 ATK, but attacker loses 3 HP per shot',
    slotType: 'weapon',
    rarity: 'cursed',
    effects: [
      { kind: 'flat_damage', value: 6 },
      { kind: 'self_damage', value: 3 },
    ],
    nonStackable: true,
  },
  glass_edge: {
    id: 'glass_edge',
    name: 'Glass Edge',
    description: "+4 ATK, unit's DEF becomes 0 permanently",
    slotType: 'weapon',
    rarity: 'cursed',
    effects: [
      { kind: 'flat_damage', value: 4 },
      { kind: 'set_defense_zero', value: 1 },
    ],
    nonStackable: true,
  },
  dead_mans_reload: {
    id: 'dead_mans_reload',
    name: "Dead Man's Reload",
    description: 'Infinite charges, but weapon can never proc status effects',
    slotType: 'weapon',
    rarity: 'cursed',
    effects: [
      { kind: 'infinite_charges', value: 1 },
      { kind: 'no_status_procs', value: 1 },
    ],
    nonStackable: true,
  },
  marked_for_death: {
    id: 'marked_for_death',
    name: 'Marked for Death',
    description: '+5 ATK, but this unit is always targeted first by enemy AI',
    slotType: 'weapon',
    rarity: 'cursed',
    effects: [
      { kind: 'flat_damage', value: 5 },
      { kind: 'taunt', value: 1 },
    ],
    nonStackable: true,
  },

  // ── Armor Mods (earned from Alien Pigs faction) ──
  reinforced_plating: {
    id: 'reinforced_plating',
    name: 'Reinforced Plating',
    description: '+10 max HP',
    slotType: 'armor',
    rarity: 'common',
    effects: [{ kind: 'flat_hp', value: 10 }],
  },
  dampeners: {
    id: 'dampeners',
    name: 'Dampeners',
    description: '+1 defense',
    slotType: 'armor',
    rarity: 'common',
    effects: [{ kind: 'flat_defense', value: 1 }],
  },
  sprint_boosters: {
    id: 'sprint_boosters',
    name: 'Sprint Boosters',
    description: '+2 movement',
    slotType: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'flat_movement', value: 2 }],
  },
  reactive_shield: {
    id: 'reactive_shield',
    name: 'Reactive Shield',
    description: 'First hit per combat is negated',
    slotType: 'armor',
    rarity: 'legendary',
    effects: [{ kind: 'negate_first_hit', value: 1 }],
    nonStackable: true,
  },
  medkit: {
    id: 'medkit',
    name: 'Medkit',
    description: 'Restore 15 HP once per combat',
    slotType: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'heal_once', value: 15 }],
    nonStackable: true,
  },
  reinforced_dampeners: {
    id: 'reinforced_dampeners',
    name: 'Reinforced Dampeners',
    description: '-1 damage from all status effects',
    slotType: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'status_damage_reduction', value: 1 }],
  },

  // ── Cursed Armor Mods ──
  frenzy_plating: {
    id: 'frenzy_plating',
    name: 'Frenzy Plating',
    description: '+3 DEF, +20 HP, but unit must move full MOV every turn',
    slotType: 'armor',
    rarity: 'cursed',
    effects: [
      { kind: 'flat_defense', value: 3 },
      { kind: 'flat_hp', value: 20 },
      { kind: 'must_move_full', value: 1 },
    ],
    nonStackable: true,
  },
  overclocked_actuators: {
    id: 'overclocked_actuators',
    name: 'Overclocked Actuators',
    description: '+2 MOV. Taking damage permanently reduces max MOV by 1 for combat',
    slotType: 'armor',
    rarity: 'cursed',
    effects: [{ kind: 'flat_movement', value: 2 }],
    nonStackable: true,
  },
}

/** Get all weapon mods. */
export function getWeaponMods(): ModDefinition[] {
  return Object.values(MOD_CATALOG).filter((m) => m.slotType === 'weapon')
}

/** Get all armor mods. */
export function getArmorMods(): ModDefinition[] {
  return Object.values(MOD_CATALOG).filter((m) => m.slotType === 'armor')
}

/** Look up a mod by id. */
export function getMod(id: string): ModDefinition | undefined {
  return MOD_CATALOG[id]
}

/** Get mods filtered by slot type and optional minimum rarity. */
export function getModsBySlot(slotType: ModSlotType, minRarity?: ModRarity): ModDefinition[] {
  const rarityOrder: ModRarity[] = ['common', 'rare', 'legendary', 'cursed']
  const minIdx = minRarity ? rarityOrder.indexOf(minRarity) : 0
  return Object.values(MOD_CATALOG).filter((m) => {
    if (m.slotType !== slotType) return false
    return rarityOrder.indexOf(m.rarity) >= minIdx
  })
}

/**
 * Attach a mod to an equipment's mod list.
 * If already present and stackable, increment stacks.
 * Returns true if successfully attached.
 */
export function attachMod(mods: EquippedMod[], modId: string, maxSlots: number): boolean {
  const def = getMod(modId)
  if (!def) return false

  const existing = mods.find((m) => m.modId === modId)
  if (existing) {
    if (def.nonStackable) return false // non-stackable duplicates are handled as reroll tokens
    existing.stacks += 1
    return true
  }

  if (mods.length >= maxSlots) return false
  mods.push({ modId, stacks: 1 })
  return true
}

/**
 * Calculate the effective value of a mod effect, accounting for stacks.
 */
export function effectiveValue(effect: ModEffect, stacks: number): number {
  return effect.value * stacks
}
