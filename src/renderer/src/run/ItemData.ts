/**
 * ItemData — Definitions for all items that can be carried through a run.
 *
 * Items are data-only; their effects are applied by DamageResolver (combat
 * modifiers) or by RunState helper functions (stat bonuses on spawn).
 */

import type { AttackKind } from '../entities/UnitData'

export type ItemType = 'consumable' | 'passive' | 'weapon' | 'armor'

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export type ItemEffectKind =
  | 'stat_bonus'                      // flat stat modifier applied at spawn
  | 'damage_modifier'                 // multiplier applied in DamageResolver
  | 'on_kill'                         // triggers when the holder kills a unit
  | 'consumable_party_heal'           // restore HP to all roster units (Rest)
  | 'consumable_add_crystals'         // add crystals when consumed (Rest)
  | 'consumable_add_gold'             // add gold when consumed (Rest)
  | 'consumable_full_heal_most_wounded' // set lowest-%HP unit to full HP (Rest)
  | 'consumable_refund_mod_reroll'    // reduce modRerollsSpentThisRun by 1 (Rest)
  | 'consumable_combat_heal_single'   // heal target hero for amount HP (Combat)
  | 'consumable_combat_atk_buff'      // +amount ATK to target hero this combat (Combat)
  | 'consumable_revive'               // revive a dead hero to amount% HP (Combat or post-battle)

export interface ItemEffect {
  kind: ItemEffectKind
  /** Which stat to modify (for stat_bonus effects). */
  stat?: 'attack' | 'defense' | 'maxHp' | 'moveRange'
  /** Flat amount for stat_bonus; multiplier for damage_modifier; HP/ATK for consumables. */
  amount?: number
}

export interface ItemDefinition {
  id: string
  name: string
  description: string
  type: ItemType
  rarity: ItemRarity
  effects: ItemEffect[]
  goldCost?: number
  /** Attack type granted by this weapon. Only relevant for type === 'weapon'. */
  attackType?: AttackKind
  /** Weapon charges per combat. Omit or Infinity for unlimited. */
  charges?: number
  maxCharges?: number
  rechargeRate?: number
  /** If false, the unit keeps remaining movement after attacking. Defaults to true. */
  exhausting?: boolean
  weaponStyle?: 'melee' | 'ranged' | 'arcane' | 'tech'
  tags?: string[]
  suggestedCharacterIds?: string[]
  suggestedPathIds?: string[]
  affinityTags?: string[]
}

export interface ItemStack {
  itemId: string
  quantity: number
}

export const ITEM_CATALOG: Record<string, ItemDefinition> = {

  // ══════════════════════════════════════════════
  // WEAPONS — Common
  // ══════════════════════════════════════════════
  iron_sword: {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: '+2 ATK · Melee',
    type: 'weapon',
    rarity: 'common',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 30,
    charges: 1, maxCharges: 1, rechargeRate: 1,
    weaponStyle: 'melee', tags: ['fantasy'],
    suggestedCharacterIds: ['warrior', 'samurai'],
  },
  hunting_bow: {
    id: 'hunting_bow',
    name: 'Hunting Bow',
    description: '+1 ATK · Ranged',
    type: 'weapon',
    rarity: 'common',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 1 }],
    goldCost: 25,
    charges: 1, maxCharges: 1, rechargeRate: 1,
    weaponStyle: 'ranged', tags: ['fantasy'],
    suggestedCharacterIds: ['healer'],
  },
  rusty_dagger: {
    id: 'rusty_dagger',
    name: 'Rusty Dagger',
    description: '+1 ATK · Melee',
    type: 'weapon',
    rarity: 'common',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 1 }],
    goldCost: 15,
    charges: 1, maxCharges: 1, rechargeRate: 1,
    weaponStyle: 'melee', tags: ['fantasy'],
  },
  iron_wraps: {
    id: 'iron_wraps',
    name: 'Iron Wraps',
    description: '+1 ATK · Melee · 2 max charges',
    type: 'weapon',
    rarity: 'common',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 1 }],
    goldCost: 20,
    charges: 1, maxCharges: 2, rechargeRate: 2,
    weaponStyle: 'melee', tags: ['fantasy'],
  },

  // ══════════════════════════════════════════════
  // WEAPONS — Uncommon
  // ══════════════════════════════════════════════
  steel_sword: {
    id: 'steel_sword',
    name: 'Steel Sword',
    description: '+2 ATK · Melee · 2 charges',
    type: 'weapon',
    rarity: 'uncommon',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 38,
    charges: 1, maxCharges: 2, rechargeRate: 1,
    weaponStyle: 'melee', tags: ['fantasy'],
    suggestedCharacterIds: ['warrior', 'samurai'],
  },
  crossbow: {
    id: 'crossbow',
    name: 'Crossbow',
    description: '+2 ATK · Ranged · Non-exhausting',
    type: 'weapon',
    rarity: 'uncommon',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 40,
    charges: 1, maxCharges: 1, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'ranged', tags: ['fantasy'],
  },
  flame_wand: {
    id: 'flame_wand',
    name: 'Flame Wand',
    description: '+2 ATK · Lobbed · 2 charges',
    type: 'weapon',
    rarity: 'uncommon',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 42,
    charges: 1, maxCharges: 2, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'arcane', tags: ['fantasy', 'fire'],
    suggestedCharacterIds: ['mage'],
    affinityTags: ['fire'],
  },
  heavy_axe: {
    id: 'heavy_axe',
    name: 'Heavy Axe',
    description: '+3 ATK · Cleave · High damage, exhausting',
    type: 'weapon',
    rarity: 'uncommon',
    attackType: 'cleave',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 44,
    charges: 1, maxCharges: 1, rechargeRate: 1,
    exhausting: true,
    weaponStyle: 'melee', tags: ['fantasy'],
    suggestedCharacterIds: ['warrior'],
  },
  throwing_knives: {
    id: 'throwing_knives',
    name: 'Throwing Knives',
    description: '+1 ATK · Ranged · 3 charges, non-exhausting',
    type: 'weapon',
    rarity: 'uncommon',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 1 }],
    goldCost: 38,
    charges: 2, maxCharges: 3, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'ranged', tags: ['fantasy'],
  },
  combat_staff: {
    id: 'combat_staff',
    name: 'Combat Staff',
    description: '+2 ATK · Melee · 2 charges, non-exhausting',
    type: 'weapon',
    rarity: 'uncommon',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 40,
    charges: 1, maxCharges: 2, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'melee', tags: ['fantasy'],
    suggestedCharacterIds: ['healer', 'mage'],
  },
  smoke_caster: {
    id: 'smoke_caster',
    name: 'Smoke Caster',
    description: '+1 ATK · Lobbed · 3 charges, non-exhausting',
    type: 'weapon',
    rarity: 'uncommon',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 1 }],
    goldCost: 38,
    charges: 2, maxCharges: 3, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'tech', tags: ['tech'],
    suggestedCharacterIds: ['ned'],
  },
  repeating_bow: {
    id: 'repeating_bow',
    name: 'Repeating Bow',
    description: '+1 ATK · Ranged · 4 max charges, recharge 2',
    type: 'weapon',
    rarity: 'uncommon',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 1 }],
    goldCost: 42,
    charges: 2, maxCharges: 4, rechargeRate: 2,
    exhausting: false,
    weaponStyle: 'ranged', tags: ['fantasy'],
  },
  shock_lance: {
    id: 'shock_lance',
    name: 'Shock Lance',
    description: '+3 ATK · Melee · 2 charges',
    type: 'weapon',
    rarity: 'uncommon',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 45,
    charges: 1, maxCharges: 2, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'tech', tags: ['tech'],
    suggestedCharacterIds: ['warrior', 'ned'],
  },
  vine_whip: {
    id: 'vine_whip',
    name: 'Vine Whip',
    description: '+2 ATK · Melee · Non-exhausting',
    type: 'weapon',
    rarity: 'uncommon',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 38,
    charges: 1, maxCharges: 1, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'melee', tags: ['fantasy'],
  },

  // ══════════════════════════════════════════════
  // WEAPONS — Rare
  // ══════════════════════════════════════════════
  war_hammer: {
    id: 'war_hammer',
    name: 'War Hammer',
    description: '+3 ATK · Cleave · 2 max charges',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'cleave',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 50,
    charges: 2, maxCharges: 3, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'melee', tags: ['fantasy'],
  },
  fire_staff: {
    id: 'fire_staff',
    name: 'Fire Staff',
    description: '+2 ATK · Lobbed · Arcs over obstacles',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 45,
    charges: 2, maxCharges: 2, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'arcane', tags: ['fantasy'],
    suggestedCharacterIds: ['mage'],
  },
  ice_staff: {
    id: 'ice_staff',
    name: 'Ice Staff',
    description: '+3 ATK · Lobbed · 2 charges',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 50,
    charges: 2, maxCharges: 2, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'arcane', tags: ['fantasy', 'ice'],
    suggestedCharacterIds: ['mage'],
    suggestedPathIds: ['frostweaver'],
    affinityTags: ['ice'],
  },
  ember_staff: {
    id: 'ember_staff',
    name: 'Ember Staff',
    description: '+3 ATK · Lobbed · 2 charges',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 50,
    charges: 2, maxCharges: 2, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'arcane', tags: ['fantasy', 'fire'],
    suggestedCharacterIds: ['mage'],
    suggestedPathIds: ['pyromancer'],
    affinityTags: ['fire'],
  },
  tectonic_breaker: {
    id: 'tectonic_breaker',
    name: 'Tectonic Breaker',
    description: '+3 ATK · Cleave',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'cleave',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 55,
    charges: 1, maxCharges: 2, rechargeRate: 1,
    weaponStyle: 'melee', tags: ['tech'],
  },
  ricochet_rifle: {
    id: 'ricochet_rifle',
    name: 'Ricochet Rifle',
    description: '+2 ATK · Ranged · Non-exhausting',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 50,
    charges: 1, maxCharges: 1, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'tech', tags: ['tech', 'firearm'],
    suggestedCharacterIds: ['ned'],
  },
  napalm_launcher: {
    id: 'napalm_launcher',
    name: 'Napalm Launcher',
    description: '+2 ATK · Lobbed',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 50,
    charges: 1, maxCharges: 1, rechargeRate: 1,
    weaponStyle: 'tech', tags: ['tech'],
  },
  wide_cleaver: {
    id: 'wide_cleaver',
    name: 'Wide Cleaver',
    description: '+2 ATK · Cleave',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'cleave',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 45,
    charges: 1, maxCharges: 1, rechargeRate: 1,
    weaponStyle: 'melee', tags: ['fantasy'],
  },
  sunforged_blade: {
    id: 'sunforged_blade',
    name: 'Sunforged Blade',
    description: '+4 ATK · Melee',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 4 }],
    goldCost: 60,
    charges: 1, maxCharges: 1, rechargeRate: 1,
    weaponStyle: 'melee', tags: ['fantasy'],
    suggestedCharacterIds: ['warrior', 'samurai'],
  },
  the_core: {
    id: 'the_core',
    name: 'The Core',
    description: '+6 ATK · Ranged · Slow recharge',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 6 }],
    goldCost: 65,
    charges: 1, maxCharges: 3, rechargeRate: 0,
    exhausting: false,
    weaponStyle: 'tech', tags: ['tech', 'firearm'],
    suggestedCharacterIds: ['ned'],
  },
  graviton_singularity: {
    id: 'graviton_singularity',
    name: 'Graviton Singularity',
    description: '+3 ATK · Lobbed',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 60,
    charges: 1, maxCharges: 2, rechargeRate: 1,
    weaponStyle: 'tech', tags: ['tech', 'arcane'],
    suggestedCharacterIds: ['mage'],
  },
  phase_blade: {
    id: 'phase_blade',
    name: 'Phase Blade',
    description: '+5 ATK · Melee',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 5 }],
    goldCost: 60,
    charges: 1, maxCharges: 1, rechargeRate: 1,
    weaponStyle: 'melee', tags: ['tech', 'arcane'],
    suggestedCharacterIds: ['samurai', 'warrior'],
  },

  // ══════════════════════════════════════════════
  // WEAPONS — Legendary (1 per hero, boss drop only)
  // ══════════════════════════════════════════════
  crownbreaker: {
    id: 'crownbreaker',
    name: 'Crownbreaker',
    description: '+4 ATK · Cleave · 2 max charges — Warrior only',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'cleave',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 4 }],
    goldCost: 0,
    charges: 1, maxCharges: 2, rechargeRate: 1,
    weaponStyle: 'melee', tags: ['fantasy'],
    suggestedCharacterIds: ['warrior'],
    affinityTags: ['hero'],
  },
  storm_staff: {
    id: 'storm_staff',
    name: 'Storm Staff',
    description: '+3 ATK · Lobbed · 3 charges — Mage only',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 0,
    charges: 3, maxCharges: 3, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'arcane', tags: ['fantasy', 'arcane'],
    suggestedCharacterIds: ['mage'],
    suggestedPathIds: ['arcanist'],
    affinityTags: ['hero', 'arcane'],
  },
  duelists_edge: {
    id: 'duelists_edge',
    name: "Duelist's Edge",
    description: '+4 ATK · Melee — Samurai only',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 4 }],
    goldCost: 0,
    charges: 1, maxCharges: 1, rechargeRate: 1,
    weaponStyle: 'melee', tags: ['fantasy'],
    suggestedCharacterIds: ['samurai'],
    suggestedPathIds: ['duelist'],
    affinityTags: ['hero'],
  },
  ned_starfall: {
    id: 'ned_starfall',
    name: 'Starfall Iron',
    description: '+4 ATK · Ranged · 2 charges — Ned only',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 4 }],
    goldCost: 0,
    charges: 1, maxCharges: 2, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'tech', tags: ['tech', 'firearm'],
    suggestedCharacterIds: ['ned'],
    affinityTags: ['hero'],
  },
  // Healer legendary weapon
  sacred_bow: {
    id: 'sacred_bow',
    name: 'Sacred Bow',
    description: '+2 ATK · Projectile · Range 4 · 3 charges — Healer only',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 0,
    charges: 2, maxCharges: 3, rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'ranged', tags: ['fantasy', 'arcane'],
    suggestedCharacterIds: ['healer'],
    affinityTags: ['hero'],
  },

  // ══════════════════════════════════════════════
  // ARMOR — Common
  // ══════════════════════════════════════════════
  leather_vest: {
    id: 'leather_vest',
    name: 'Leather Vest',
    description: '+1 DEF',
    type: 'armor',
    rarity: 'common',
    effects: [{ kind: 'stat_bonus', stat: 'defense', amount: 1 }],
    goldCost: 25,
    tags: ['fantasy', 'light'],
  },
  scout_cloak: {
    id: 'scout_cloak',
    name: 'Scout Cloak',
    description: '+1 Move',
    type: 'armor',
    rarity: 'common',
    effects: [{ kind: 'stat_bonus', stat: 'moveRange', amount: 1 }],
    goldCost: 30,
  },
  ablative_mesh: {
    id: 'ablative_mesh',
    name: 'Ablative Mesh',
    description: '+1 Move',
    type: 'armor',
    rarity: 'common',
    effects: [{ kind: 'stat_bonus', stat: 'moveRange', amount: 1 }],
    goldCost: 30,
    tags: ['tech'],
  },

  // ══════════════════════════════════════════════
  // ARMOR — Uncommon
  // ══════════════════════════════════════════════
  padded_vest: {
    id: 'padded_vest',
    name: 'Padded Vest',
    description: '+1 DEF, +5 HP',
    type: 'armor',
    rarity: 'uncommon',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 1 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 5 },
    ],
    goldCost: 38,
    tags: ['fantasy', 'light'],
  },
  light_mail: {
    id: 'light_mail',
    name: 'Light Mail',
    description: '+2 DEF',
    type: 'armor',
    rarity: 'uncommon',
    effects: [{ kind: 'stat_bonus', stat: 'defense', amount: 2 }],
    goldCost: 36,
    tags: ['fantasy'],
  },
  runners_gear: {
    id: 'runners_gear',
    name: "Runner's Gear",
    description: '+1 DEF, +1 Move',
    type: 'armor',
    rarity: 'uncommon',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 1 },
      { kind: 'stat_bonus', stat: 'moveRange', amount: 1 },
    ],
    goldCost: 40,
    tags: ['fantasy', 'light'],
  },
  warding_cloak: {
    id: 'warding_cloak',
    name: 'Warding Cloak',
    description: '+1 DEF, +8 HP',
    type: 'armor',
    rarity: 'uncommon',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 1 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 8 },
    ],
    goldCost: 40,
    tags: ['fantasy'],
    suggestedCharacterIds: ['healer', 'mage'],
  },
  hardened_leathers: {
    id: 'hardened_leathers',
    name: 'Hardened Leathers',
    description: '+2 DEF',
    type: 'armor',
    rarity: 'uncommon',
    effects: [{ kind: 'stat_bonus', stat: 'defense', amount: 2 }],
    goldCost: 36,
    tags: ['fantasy'],
    suggestedCharacterIds: ['warrior', 'samurai'],
  },
  tactical_vest: {
    id: 'tactical_vest',
    name: 'Tactical Vest',
    description: '+1 DEF, +1 Move',
    type: 'armor',
    rarity: 'uncommon',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 1 },
      { kind: 'stat_bonus', stat: 'moveRange', amount: 1 },
    ],
    goldCost: 40,
    tags: ['tech'],
    suggestedCharacterIds: ['ned'],
  },
  bone_guard: {
    id: 'bone_guard',
    name: 'Bone Guard',
    description: '+2 DEF',
    type: 'armor',
    rarity: 'uncommon',
    effects: [{ kind: 'stat_bonus', stat: 'defense', amount: 2 }],
    goldCost: 36,
    tags: ['fantasy'],
    suggestedCharacterIds: ['warrior'],
  },
  shock_padding: {
    id: 'shock_padding',
    name: 'Shock Padding',
    description: '+1 DEF, +5 HP',
    type: 'armor',
    rarity: 'uncommon',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 1 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 5 },
    ],
    goldCost: 38,
    tags: ['tech'],
    suggestedCharacterIds: ['ned'],
  },
  iron_bracers: {
    id: 'iron_bracers',
    name: 'Iron Bracers',
    description: '+1 ATK — offensive armor piece',
    type: 'armor',
    rarity: 'uncommon',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 1 }],
    goldCost: 38,
    tags: ['fantasy'],
    suggestedCharacterIds: ['warrior', 'samurai'],
  },
  field_harness: {
    id: 'field_harness',
    name: 'Field Harness',
    description: '+1 DEF, +5 HP',
    type: 'armor',
    rarity: 'uncommon',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 1 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 5 },
    ],
    goldCost: 38,
    tags: ['tech'],
  },

  // ══════════════════════════════════════════════
  // ARMOR — Rare
  // ══════════════════════════════════════════════
  chain_mail: {
    id: 'chain_mail',
    name: 'Chain Mail',
    description: '+2 DEF',
    type: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'stat_bonus', stat: 'defense', amount: 2 }],
    goldCost: 45,
  },
  iron_plate: {
    id: 'iron_plate',
    name: 'Iron Plate',
    description: '+3 DEF, -1 Move',
    type: 'armor',
    rarity: 'rare',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 3 },
      { kind: 'stat_bonus', stat: 'moveRange', amount: -1 },
    ],
    goldCost: 50,
  },
  battle_robes: {
    id: 'battle_robes',
    name: 'Battle Robes',
    description: '+1 DEF, +5 HP',
    type: 'armor',
    rarity: 'rare',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 1 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 5 },
    ],
    goldCost: 40,
  },
  collision_plate: {
    id: 'collision_plate',
    name: 'Collision Plate',
    description: '+3 DEF, -1 Move',
    type: 'armor',
    rarity: 'rare',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 3 },
      { kind: 'stat_bonus', stat: 'moveRange', amount: -1 },
    ],
    goldCost: 55,
    tags: ['tech', 'heavy'],
  },
  thermo_shell: {
    id: 'thermo_shell',
    name: 'Thermo-Shell',
    description: '+2 DEF',
    type: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'stat_bonus', stat: 'defense', amount: 2 }],
    goldCost: 48,
    tags: ['tech'],
  },
  kinetic_dynamo: {
    id: 'kinetic_dynamo',
    name: 'Kinetic Dynamo',
    description: '+2 Move',
    type: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'stat_bonus', stat: 'moveRange', amount: 2 }],
    goldCost: 50,
    tags: ['tech'],
  },
  repulsor_field: {
    id: 'repulsor_field',
    name: 'Repulsor Field',
    description: '+2 DEF',
    type: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'stat_bonus', stat: 'defense', amount: 2 }],
    goldCost: 50,
    tags: ['tech'],
  },
  recoil_harness: {
    id: 'recoil_harness',
    name: 'Recoil Harness',
    description: '+2 DEF, -1 Move',
    type: 'armor',
    rarity: 'rare',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 2 },
      { kind: 'stat_bonus', stat: 'moveRange', amount: -1 },
    ],
    goldCost: 50,
    tags: ['tech'],
  },
  martyrs_blood: {
    id: 'martyrs_blood',
    name: "Martyr's Blood",
    description: '+3 DEF, +15 HP',
    type: 'armor',
    rarity: 'rare',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 3 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 15 },
    ],
    goldCost: 60,
    tags: ['fantasy'],
  },
  boss_cache_plate: {
    id: 'boss_cache_plate',
    name: 'Boss Cache Plate',
    description: '+3 DEF, +8 HP',
    type: 'armor',
    rarity: 'rare',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 3 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 8 },
    ],
    goldCost: 58,
    tags: ['boss'],
  },
  archivist_veil: {
    id: 'archivist_veil',
    name: "Archivist's Veil",
    description: '+2 DEF, +6 HP',
    type: 'armor',
    rarity: 'rare',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 2 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 6 },
    ],
    goldCost: 50,
    tags: ['fantasy'],
    suggestedCharacterIds: ['mage'],
  },

  // ══════════════════════════════════════════════
  // ARMOR — Legendary (1 per hero, boss drop only)
  // ══════════════════════════════════════════════
  sanctuary_mail: {
    id: 'sanctuary_mail',
    name: 'Sanctuary Mail',
    description: '+3 DEF, +10 HP — Healer only',
    type: 'armor',
    rarity: 'legendary',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 3 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 10 },
    ],
    goldCost: 0,
    tags: ['fantasy'],
    suggestedCharacterIds: ['healer'],
    affinityTags: ['hero'],
  },
  ironwall_plate: {
    id: 'ironwall_plate',
    name: 'Ironwall Plate',
    description: '+4 DEF, +12 HP — Warrior only',
    type: 'armor',
    rarity: 'legendary',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 4 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 12 },
    ],
    goldCost: 0,
    tags: ['fantasy'],
    suggestedCharacterIds: ['warrior'],
    affinityTags: ['hero'],
  },
  astral_robe: {
    id: 'astral_robe',
    name: 'Astral Robe',
    description: '+1 DEF, +10 HP, +1 Move — Mage only',
    type: 'armor',
    rarity: 'legendary',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 1 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 10 },
      { kind: 'stat_bonus', stat: 'moveRange', amount: 1 },
    ],
    goldCost: 0,
    tags: ['fantasy', 'arcane'],
    suggestedCharacterIds: ['mage'],
    affinityTags: ['hero', 'arcane'],
  },
  voidstep_wraps: {
    id: 'voidstep_wraps',
    name: 'Voidstep Wraps',
    description: '+2 DEF, +8 HP, +1 Move — Samurai only',
    type: 'armor',
    rarity: 'legendary',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 2 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 8 },
      { kind: 'stat_bonus', stat: 'moveRange', amount: 1 },
    ],
    goldCost: 0,
    tags: ['fantasy'],
    suggestedCharacterIds: ['samurai'],
    affinityTags: ['hero'],
  },
  bushrangers_iron: {
    id: 'bushrangers_iron',
    name: "Bushranger's Iron",
    description: '+6 DEF, +6 HP — Ned only',
    type: 'armor',
    rarity: 'legendary',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 6 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 6 },
    ],
    goldCost: 0,
    tags: ['tech'],
    suggestedCharacterIds: ['ned'],
    affinityTags: ['hero'],
  },

  // ══════════════════════════════════════════════
  // CONSUMABLES — Common (Rest only)
  // ══════════════════════════════════════════════
  healing_salve: {
    id: 'healing_salve',
    name: 'Healing Salve',
    description: 'Rest: restore 10 HP to all party members.',
    type: 'consumable',
    rarity: 'common',
    effects: [{ kind: 'consumable_party_heal', amount: 10 }],
    goldCost: 12,
  },
  crystal_shard: {
    id: 'crystal_shard',
    name: 'Crystal Shard',
    description: 'Rest: crush for +1 crystal (meta currency).',
    type: 'consumable',
    rarity: 'common',
    effects: [{ kind: 'consumable_add_crystals', amount: 1 }],
    goldCost: 15,
  },
  field_bandage: {
    id: 'field_bandage',
    name: 'Field Bandage Kit',
    description: 'Rest: fully heal whoever is hurt worst (by HP %).',
    type: 'consumable',
    rarity: 'common',
    effects: [{ kind: 'consumable_full_heal_most_wounded' }],
    goldCost: 14,
  },
  gold_coffer: {
    id: 'gold_coffer',
    name: 'Small Gold Coffer',
    description: 'Rest: crack it open for +20 gold.',
    type: 'consumable',
    rarity: 'common',
    effects: [{ kind: 'consumable_add_gold', amount: 20 }],
    goldCost: 18,
  },

  revive_draught: {
    id: 'revive_draught',
    name: 'Revive Draught',
    description: 'Combat or post-battle: revive a fallen hero to 50% HP.',
    type: 'consumable',
    rarity: 'uncommon',
    effects: [{ kind: 'consumable_revive', amount: 50 }],
    goldCost: 35,
  },

  // ══════════════════════════════════════════════
  // CONSUMABLES — Uncommon (Combat or Rest)
  // ══════════════════════════════════════════════
  battle_potion: {
    id: 'battle_potion',
    name: 'Battle Potion',
    description: 'Combat: heal one hero for 15 HP immediately.',
    type: 'consumable',
    rarity: 'uncommon',
    effects: [{ kind: 'consumable_combat_heal_single', amount: 15 }],
    goldCost: 22,
  },
  strength_tonic: {
    id: 'strength_tonic',
    name: 'Strength Tonic',
    description: 'Combat: give one hero +2 ATK for this battle.',
    type: 'consumable',
    rarity: 'uncommon',
    effects: [{ kind: 'consumable_combat_atk_buff', amount: 2 }],
    goldCost: 24,
  },

  // ══════════════════════════════════════════════
  // CONSUMABLES — Rare (Rest only)
  // ══════════════════════════════════════════════
  greater_salve: {
    id: 'greater_salve',
    name: 'Greater Salve',
    description: 'Rest: restore 16 HP to all party members.',
    type: 'consumable',
    rarity: 'rare',
    effects: [{ kind: 'consumable_party_heal', amount: 16 }],
    goldCost: 22,
  },
  saints_balm: {
    id: 'saints_balm',
    name: "Saint's Balm",
    description: 'Rest: restore 22 HP to all party members.',
    type: 'consumable',
    rarity: 'rare',
    effects: [{ kind: 'consumable_party_heal', amount: 22 }],
    goldCost: 32,
  },
  mod_reroll_chip: {
    id: 'mod_reroll_chip',
    name: 'Tinker Chip',
    description: 'Rest: recover 1 mod reroll spent this run (if any).',
    type: 'consumable',
    rarity: 'rare',
    effects: [{ kind: 'consumable_refund_mod_reroll' }],
    goldCost: 28,
  },
}

// ── Utility functions ──

export function getWeapons(): ItemDefinition[] {
  return Object.values(ITEM_CATALOG).filter((i) => i.type === 'weapon')
}

export function getArmors(): ItemDefinition[] {
  return Object.values(ITEM_CATALOG).filter((i) => i.type === 'armor')
}

export function getConsumables(): ItemDefinition[] {
  return Object.values(ITEM_CATALOG).filter((i) => i.type === 'consumable')
}

export function getItem(id: string): ItemDefinition | undefined {
  return ITEM_CATALOG[id]
}

/** Get weapons or armors filtered by rarity. */
export function getItemsByTypeAndRarity(
  type: 'weapon' | 'armor',
  rarities: ItemRarity[]
): ItemDefinition[] {
  return Object.values(ITEM_CATALOG).filter(
    (i) => i.type === type && rarities.includes(i.rarity)
  )
}

/** Returns true if this consumable can be used during combat (not just at Rest). */
export function isCombatUsableConsumable(item: ItemDefinition): boolean {
  return item.effects.some(
    (e) =>
      e.kind === 'consumable_combat_heal_single' ||
      e.kind === 'consumable_combat_atk_buff' ||
      e.kind === 'consumable_revive'
  )
}

export interface ItemRecommendationFormatOpts {
  characterName?: (characterId: string) => string | undefined
  pathName?: (pathId: string) => string | undefined
}

export function formatItemRecommendation(
  item: ItemDefinition,
  opts?: ItemRecommendationFormatOpts
): string | null {
  const chars = item.suggestedCharacterIds
  const paths = item.suggestedPathIds
  if ((!chars || chars.length === 0) && (!paths || paths.length === 0)) return null
  const parts: string[] = []
  if (chars?.length) {
    parts.push(chars.map((id) => opts?.characterName?.(id) ?? id).join(' · '))
  }
  if (paths?.length) {
    parts.push(paths.map((id) => opts?.pathName?.(id) ?? id).join(' · '))
  }
  return `Recommended: ${parts.join(' — ')}`
}

/**
 * Boss-only legendary pool — one weapon + one armor per hero.
 * Items already dropped this run are excluded (tracked in RunState.droppedLegendaryIds).
 */
export const BOSS_LEGENDARY_POOL: readonly string[] = [
  // Weapons (one per hero)
  'crownbreaker',   // Warrior
  'storm_staff',    // Mage
  'sacred_bow',     // Healer
  'duelists_edge',  // Samurai
  'ned_starfall',   // Ned
  // Armors (one per hero)
  'ironwall_plate',   // Warrior
  'astral_robe',      // Mage
  'sanctuary_mail',   // Healer
  'voidstep_wraps',   // Samurai
  'bushrangers_iron', // Ned
]

/**
 * Pick up to 3 boss legendary offers.
 * - Filters out items already dropped this run (droppedIds).
 * - Prefers items whose suggestedCharacterIds overlap the current loadout.
 * - Balances weapon vs armor so you don't get 3 weapons or 3 armors if possible.
 */
export function getBossLegendaryOffers(
  loadoutCharacterIds: string[],
  droppedIds: readonly string[] = []
): ItemDefinition[] {
  const available = BOSS_LEGENDARY_POOL
    .filter((id) => !droppedIds.includes(id))
    .map((id) => getItem(id))
    .filter((def): def is ItemDefinition => !!def && (def.type === 'weapon' || def.type === 'armor'))

  if (available.length === 0) return []

  // Prefer items for heroes in the current loadout
  const preferred = available.filter((def) => {
    if (!def.suggestedCharacterIds?.length) return true
    return def.suggestedCharacterIds.some((id) => loadoutCharacterIds.includes(id))
  })
  const source = preferred.length > 0 ? preferred : available

  // Shuffle and pick up to 3, trying to include both weapon and armor types
  const shuffled = [...source].sort(() => Math.random() - 0.5)
  const weapons = shuffled.filter((d) => d.type === 'weapon')
  const armors = shuffled.filter((d) => d.type === 'armor')
  const balanced: ItemDefinition[] = []
  if (weapons.length > 0) balanced.push(weapons[0]!)
  if (armors.length > 0) balanced.push(armors[0]!)
  for (const item of shuffled) {
    if (balanced.length >= 3) break
    if (!balanced.includes(item)) balanced.push(item)
  }
  return balanced
}
