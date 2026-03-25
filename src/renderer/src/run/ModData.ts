/**
 * ModData — Definitions for equipment mods that attach to weapons/armor during a run.
 *
 * Mods are universal — any effect (fire coating, stun force, etc.) can attach to
 * any weapon or armor. Naming avoids firearm-specific language so mods make sense
 * on swords, staves, bows, and guns alike.
 *
 * Mods are earned as combat rewards (faction-locked type) and attach permanently
 * for the run. Duplicate mods upgrade in-place (x2, x3 multiplier).
 */

export type ModSlotType = 'weapon' | 'armor'
export type ModRarity = 'common' | 'uncommon' | 'rare' | 'legendary' | 'cursed'

export type ModEffectKind =
  | 'flat_damage'             // +X damage per attack
  | 'flat_defense'            // +X defense
  | 'flat_hp'                 // +X max HP
  | 'flat_range'              // +X attack range (negative = range penalty)
  | 'flat_charges'            // +X max charges
  | 'flat_movement'           // +X movement
  | 'burn_on_hit'             // apply burn on hit
  | 'recharge_boost'          // +X recharge rate
  | 'negate_first_hit'        // first hit per combat is negated (binary)
  | 'heal_once'               // restore X HP once per combat (binary)
  | 'splash_on_hit'           // hit applies splash to adjacent tiles
  | 'stun_chance'             // % chance to apply stasis on hit
  | 'vampiric'                // lethal damage heals attacker X HP
  | 'self_damage'             // attacker takes X HP per attack (cursed)
  | 'set_defense_zero'        // defender's DEF becomes 0 (cursed)
  | 'must_move_full'          // unit must move full MOV every turn (cursed)
  | 'infinite_charges'        // infinite charges, never depleted (cursed)
  | 'no_status_procs'         // weapon cannot proc status effects (cursed)
  | 'taunt'                   // enemy AI always targets this unit first (cursed)
  | 'status_damage_reduction' // -X damage from burn/status tick effects

export interface ModEffect {
  kind: ModEffectKind
  value: number
}

export interface ModDefinition {
  id: string
  name: string
  description: string
  slotType: ModSlotType
  rarity: ModRarity
  effects: ModEffect[]
  nonStackable?: boolean
}

export interface EquippedMod {
  modId: string
  stacks: number
}

export const MOD_CATALOG: Record<string, ModDefinition> = {

  // ══════════════════════════════════════════════
  // WEAPON MODS — Common
  // ══════════════════════════════════════════════
  cal_rounds: {
    id: 'cal_rounds',
    name: 'Heavy Strike',
    description: '+5 damage per attack',
    slotType: 'weapon',
    rarity: 'common',
    effects: [{ kind: 'flat_damage', value: 5 }],
  },
  scope: {
    id: 'scope',
    name: 'Keen Eye',
    description: '+3 attack range',
    slotType: 'weapon',
    rarity: 'common',
    effects: [{ kind: 'flat_range', value: 3 }],
  },
  extended_magazine: {
    id: 'extended_magazine',
    name: 'Extra Charge',
    description: '+1 max charge',
    slotType: 'weapon',
    rarity: 'common',
    effects: [{ kind: 'flat_charges', value: 1 }],
  },
  razor_edge: {
    id: 'razor_edge',
    name: 'Razor Edge',
    description: '+3 damage per attack',
    slotType: 'weapon',
    rarity: 'common',
    effects: [{ kind: 'flat_damage', value: 3 }],
  },
  long_barrel: {
    id: 'long_barrel',
    name: 'Extended Reach',
    description: '+2 attack range',
    slotType: 'weapon',
    rarity: 'common',
    effects: [{ kind: 'flat_range', value: 2 }],
  },
  venom_coat: {
    id: 'venom_coat',
    name: 'Venom Coat',
    description: 'Attacks apply Burn 2 for 3 turns',
    slotType: 'weapon',
    rarity: 'common',
    effects: [{ kind: 'burn_on_hit', value: 2 }],
  },
  frag_tip: {
    id: 'frag_tip',
    name: 'Piercing Edge',
    description: '+4 damage per attack',
    slotType: 'weapon',
    rarity: 'common',
    effects: [{ kind: 'flat_damage', value: 4 }],
  },

  // ══════════════════════════════════════════════
  // WEAPON MODS — Uncommon
  // ══════════════════════════════════════════════
  ember_edge: {
    id: 'ember_edge',
    name: 'Ember Edge',
    description: 'Attacks apply Burn 1 for 2 turns',
    slotType: 'weapon',
    rarity: 'uncommon',
    effects: [{ kind: 'burn_on_hit', value: 1 }],
  },
  momentum_strike: {
    id: 'momentum_strike',
    name: 'Momentum Strike',
    description: '+2 damage per attack',
    slotType: 'weapon',
    rarity: 'uncommon',
    effects: [{ kind: 'flat_damage', value: 2 }],
  },
  quick_tempo: {
    id: 'quick_tempo',
    name: 'Quick Tempo',
    description: '+1 charge recharge per turn',
    slotType: 'weapon',
    rarity: 'uncommon',
    effects: [{ kind: 'recharge_boost', value: 1 }],
  },
  overreach: {
    id: 'overreach',
    name: 'Overreach',
    description: '+1 attack range',
    slotType: 'weapon',
    rarity: 'uncommon',
    effects: [{ kind: 'flat_range', value: 1 }],
  },
  double_swing: {
    id: 'double_swing',
    name: 'Double Swing',
    description: '+1 max charge',
    slotType: 'weapon',
    rarity: 'uncommon',
    effects: [{ kind: 'flat_charges', value: 1 }],
  },
  weight_forward: {
    id: 'weight_forward',
    name: 'Weight Forward',
    description: '+3 damage per attack',
    slotType: 'weapon',
    rarity: 'uncommon',
    effects: [{ kind: 'flat_damage', value: 3 }],
  },
  toxic_coat: {
    id: 'toxic_coat',
    name: 'Toxic Coat',
    description: 'Attacks apply Burn 1 for 3 turns',
    slotType: 'weapon',
    rarity: 'uncommon',
    effects: [{ kind: 'burn_on_hit', value: 1 }],
  },
  precision_focus: {
    id: 'precision_focus',
    name: 'Precision Focus',
    description: '+2 attack range',
    slotType: 'weapon',
    rarity: 'uncommon',
    effects: [{ kind: 'flat_range', value: 2 }],
  },
  echo_strike: {
    id: 'echo_strike',
    name: 'Echo Strike',
    description: '+2 max charges',
    slotType: 'weapon',
    rarity: 'uncommon',
    effects: [{ kind: 'flat_charges', value: 2 }],
  },
  swift_edge: {
    id: 'swift_edge',
    name: 'Swift Edge',
    description: '+2 damage per attack',
    slotType: 'weapon',
    rarity: 'uncommon',
    effects: [{ kind: 'flat_damage', value: 2 }],
  },

  // ══════════════════════════════════════════════
  // WEAPON MODS — Rare
  // ══════════════════════════════════════════════
  incendiary_rounds: {
    id: 'incendiary_rounds',
    name: 'Fire Coating',
    description: 'Attacks apply Burn 3 for 2 turns',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'burn_on_hit', value: 3 }],
  },
  extended_mag: {
    id: 'extended_mag',
    name: 'Extra Charges II',
    description: '+2 max weapon charges',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'flat_charges', value: 2 }],
  },
  fast_loader: {
    id: 'fast_loader',
    name: 'Swift Recovery',
    description: '+1 charge recharge per turn',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'recharge_boost', value: 1 }],
  },
  explosive_tip: {
    id: 'explosive_tip',
    name: 'Explosive Force',
    description: 'Attacks splash to adjacent tiles',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'splash_on_hit', value: 1 }],
  },
  stun_round: {
    id: 'stun_round',
    name: 'Concussive Strike',
    description: '20% chance to stun on hit',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'stun_chance', value: 20 }],
  },
  heavy_slugs: {
    id: 'heavy_slugs',
    name: 'Heavy Blow',
    description: '+8 damage per attack, -2 attack range',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [
      { kind: 'flat_damage', value: 8 },
      { kind: 'flat_range', value: -2 },
    ],
  },
  rapid_fire_coil: {
    id: 'rapid_fire_coil',
    name: 'Rapid Tempo',
    description: '+3 max weapon charges',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'flat_charges', value: 3 }],
  },
  concussive_rounds: {
    id: 'concussive_rounds',
    name: 'Stunning Force',
    description: '35% chance to stun on hit',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'stun_chance', value: 35 }],
  },
  overcharge_cell: {
    id: 'overcharge_cell',
    name: 'Overcharge',
    description: '+2 charge recharge per turn',
    slotType: 'weapon',
    rarity: 'rare',
    effects: [{ kind: 'recharge_boost', value: 2 }],
  },

  // ══════════════════════════════════════════════
  // WEAPON MODS — Legendary (boss/miniboss drops only)
  // ══════════════════════════════════════════════
  burst_mag: {
    id: 'burst_mag',
    name: 'Surge Tempo',
    description: '+4 max weapon charges',
    slotType: 'weapon',
    rarity: 'legendary',
    effects: [{ kind: 'flat_charges', value: 4 }],
  },
  inferno_rounds: {
    id: 'inferno_rounds',
    name: 'Inferno Coating',
    description: 'Attacks apply Burn 5 for 2 turns',
    slotType: 'weapon',
    rarity: 'legendary',
    effects: [{ kind: 'burn_on_hit', value: 5 }],
  },
  shockwave_tip: {
    id: 'shockwave_tip',
    name: 'Shockwave',
    description: 'Attacks splash to adjacent tiles, +2 damage',
    slotType: 'weapon',
    rarity: 'legendary',
    effects: [
      { kind: 'splash_on_hit', value: 1 },
      { kind: 'flat_damage', value: 2 },
    ],
  },
  leech_filament: {
    id: 'leech_filament',
    name: 'Leech Filament',
    description: 'Lethal damage heals attacker for 5 HP',
    slotType: 'weapon',
    rarity: 'legendary',
    effects: [{ kind: 'vampiric', value: 5 }],
    nonStackable: true,
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

  // ══════════════════════════════════════════════
  // WEAPON MODS — Cursed (event/temptation only)
  // ══════════════════════════════════════════════
  bloodthirst_rounds: {
    id: 'bloodthirst_rounds',
    name: 'Bloodthirst',
    description: '+6 damage, but attacker loses 3 HP per attack',
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
    description: "+4 damage, unit's DEF becomes 0 permanently",
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
    name: "Dead Man's Pact",
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
    description: '+5 damage, but this unit is always targeted first by enemy AI',
    slotType: 'weapon',
    rarity: 'cursed',
    effects: [
      { kind: 'flat_damage', value: 5 },
      { kind: 'taunt', value: 1 },
    ],
    nonStackable: true,
  },

  // ══════════════════════════════════════════════
  // ARMOR MODS — Common
  // ══════════════════════════════════════════════
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
  agile_frame: {
    id: 'agile_frame',
    name: 'Agile Frame',
    description: '+1 movement',
    slotType: 'armor',
    rarity: 'common',
    effects: [{ kind: 'flat_movement', value: 1 }],
  },

  // ══════════════════════════════════════════════
  // ARMOR MODS — Uncommon
  // ══════════════════════════════════════════════
  thick_padding: {
    id: 'thick_padding',
    name: 'Thick Padding',
    description: '+8 max HP',
    slotType: 'armor',
    rarity: 'uncommon',
    effects: [{ kind: 'flat_hp', value: 8 }],
  },
  sturdy_straps: {
    id: 'sturdy_straps',
    name: 'Sturdy Straps',
    description: '+1 defense',
    slotType: 'armor',
    rarity: 'uncommon',
    effects: [{ kind: 'flat_defense', value: 1 }],
  },
  momentum_core: {
    id: 'momentum_core',
    name: 'Momentum Core',
    description: '+1 movement',
    slotType: 'armor',
    rarity: 'uncommon',
    effects: [{ kind: 'flat_movement', value: 1 }],
  },
  triage_wrap: {
    id: 'triage_wrap',
    name: 'Triage Wrap',
    description: 'Restore 8 HP once per combat',
    slotType: 'armor',
    rarity: 'uncommon',
    effects: [{ kind: 'heal_once', value: 8 }],
    nonStackable: true,
  },
  thermal_lining: {
    id: 'thermal_lining',
    name: 'Thermal Lining',
    description: '-1 damage from all status effects',
    slotType: 'armor',
    rarity: 'uncommon',
    effects: [{ kind: 'status_damage_reduction', value: 1 }],
  },
  cushioned_plates: {
    id: 'cushioned_plates',
    name: 'Cushioned Plates',
    description: '+1 defense, +3 max HP',
    slotType: 'armor',
    rarity: 'uncommon',
    effects: [
      { kind: 'flat_defense', value: 1 },
      { kind: 'flat_hp', value: 3 },
    ],
  },
  sprint_kit: {
    id: 'sprint_kit',
    name: 'Sprint Kit',
    description: '+1 movement',
    slotType: 'armor',
    rarity: 'uncommon',
    effects: [{ kind: 'flat_movement', value: 1 }],
  },
  repair_mesh: {
    id: 'repair_mesh',
    name: 'Repair Mesh',
    description: '+12 max HP',
    slotType: 'armor',
    rarity: 'uncommon',
    effects: [{ kind: 'flat_hp', value: 12 }],
  },
  flex_armor: {
    id: 'flex_armor',
    name: 'Flex Armor',
    description: '+1 defense, +1 movement',
    slotType: 'armor',
    rarity: 'uncommon',
    effects: [
      { kind: 'flat_defense', value: 1 },
      { kind: 'flat_movement', value: 1 },
    ],
  },
  guard_brace: {
    id: 'guard_brace',
    name: 'Guard Brace',
    description: '+1 defense, +5 max HP',
    slotType: 'armor',
    rarity: 'uncommon',
    effects: [
      { kind: 'flat_defense', value: 1 },
      { kind: 'flat_hp', value: 5 },
    ],
  },

  // ══════════════════════════════════════════════
  // ARMOR MODS — Rare
  // ══════════════════════════════════════════════
  sprint_boosters: {
    id: 'sprint_boosters',
    name: 'Sprint Boosters',
    description: '+2 movement',
    slotType: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'flat_movement', value: 2 }],
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
  fortified_plating: {
    id: 'fortified_plating',
    name: 'Fortified Plating',
    description: '+20 max HP',
    slotType: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'flat_hp', value: 20 }],
  },
  iron_skin: {
    id: 'iron_skin',
    name: 'Iron Skin',
    description: '+2 defense',
    slotType: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'flat_defense', value: 2 }],
  },

  // ══════════════════════════════════════════════
  // ARMOR MODS — Legendary (boss drops only)
  // ══════════════════════════════════════════════
  reactive_shield: {
    id: 'reactive_shield',
    name: 'Reactive Shield',
    description: 'First hit per combat is negated',
    slotType: 'armor',
    rarity: 'legendary',
    effects: [{ kind: 'negate_first_hit', value: 1 }],
    nonStackable: true,
  },
  hazard_suit: {
    id: 'hazard_suit',
    name: 'Hazard Suit',
    description: '-2 damage from all status effects',
    slotType: 'armor',
    rarity: 'legendary',
    effects: [{ kind: 'status_damage_reduction', value: 2 }],
  },
  triage_kit: {
    id: 'triage_kit',
    name: 'Triage Kit',
    description: 'Restore 25 HP once per combat',
    slotType: 'armor',
    rarity: 'legendary',
    effects: [{ kind: 'heal_once', value: 25 }],
    nonStackable: true,
  },

  // ══════════════════════════════════════════════
  // ARMOR MODS — Cursed (event/temptation only)
  // ══════════════════════════════════════════════
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

// ── Utility functions ──

/** Get all weapon mods (excludes cursed). */
export function getWeaponMods(): ModDefinition[] {
  return Object.values(MOD_CATALOG).filter((m) => m.slotType === 'weapon' && m.rarity !== 'cursed')
}

/** Get all armor mods (excludes cursed). */
export function getArmorMods(): ModDefinition[] {
  return Object.values(MOD_CATALOG).filter((m) => m.slotType === 'armor' && m.rarity !== 'cursed')
}

/** Get all cursed mods for event/temptation use. */
export function getCursedMods(): ModDefinition[] {
  return Object.values(MOD_CATALOG).filter((m) => m.rarity === 'cursed')
}

export function getMod(id: string): ModDefinition | undefined {
  return MOD_CATALOG[id]
}

/** Get mods filtered by slot type and exact rarity tier(s). */
export function getModsByRarities(slotType: ModSlotType, rarities: ModRarity[]): ModDefinition[] {
  return Object.values(MOD_CATALOG).filter(
    (m) => m.slotType === slotType && rarities.includes(m.rarity)
  )
}

/** Get mods filtered by slot type and optional minimum rarity (legacy helper). */
export function getModsBySlot(slotType: ModSlotType, minRarity?: ModRarity): ModDefinition[] {
  const rarityOrder: ModRarity[] = ['common', 'uncommon', 'rare', 'legendary', 'cursed']
  const minIdx = minRarity ? rarityOrder.indexOf(minRarity) : 0
  return Object.values(MOD_CATALOG).filter((m) => {
    if (m.slotType !== slotType) return false
    if (m.rarity === 'cursed') return false
    return rarityOrder.indexOf(m.rarity) >= minIdx
  })
}

export function attachMod(mods: EquippedMod[], modId: string, maxSlots: number): boolean {
  const def = getMod(modId)
  if (!def) return false

  const existing = mods.find((m) => m.modId === modId)
  if (existing) {
    if (def.nonStackable) return false
    existing.stacks += 1
    return true
  }

  if (mods.length >= maxSlots) return false
  mods.push({ modId, stacks: 1 })
  return true
}

export function effectiveValue(effect: ModEffect, stacks: number): number {
  return effect.value * stacks
}
