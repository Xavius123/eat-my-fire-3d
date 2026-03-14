/**
 * ItemData — Definitions for all items that can be carried through a run.
 *
 * Items are data-only; their effects are applied by DamageResolver (combat
 * modifiers) or by RunState helper functions (stat bonuses on spawn).
 */

import type { AttackKind } from '../entities/UnitData'

export type ItemType = 'consumable' | 'passive' | 'weapon' | 'armor'

export type ItemRarity = 'common' | 'rare' | 'legendary'

export type ItemEffectKind =
  | 'stat_bonus'       // flat stat modifier applied at spawn
  | 'damage_modifier'  // multiplier applied in DamageResolver
  | 'on_kill'          // triggers when the holder kills a unit

export interface ItemEffect {
  kind: ItemEffectKind
  /** Which stat to modify (for stat_bonus effects). */
  stat?: 'attack' | 'defense' | 'maxHp' | 'moveRange'
  /** Flat amount for stat_bonus; multiplier for damage_modifier. */
  amount?: number
}

export interface ItemDefinition {
  id: string
  name: string
  description: string
  type: ItemType
  rarity: ItemRarity
  /** Effects applied by the systems that know about this item. */
  effects: ItemEffect[]
  /** Base cost when purchased from a shop node. */
  goldCost?: number
  /** Attack type granted by this weapon. Only relevant for type === 'weapon'. */
  attackType?: AttackKind
  /** Weapon charges per combat. Omit or Infinity for unlimited (common weapons). */
  charges?: number
  /** Max charges this weapon can accumulate. */
  maxCharges?: number
  /** Charges regained at the start of each turn. */
  rechargeRate?: number
  /** If false, the unit keeps remaining movement after attacking. Defaults to true. */
  exhausting?: boolean
}

export interface ItemStack {
  itemId: string
  quantity: number
}

export const ITEM_CATALOG: Record<string, ItemDefinition> = {
  // ── Weapons ──
  iron_sword: {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: '+2 ATK · Melee',
    type: 'weapon',
    rarity: 'common',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 30,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
  },
  hunting_bow: {
    id: 'hunting_bow',
    name: 'Hunting Bow',
    description: '+1 ATK · Ranged, blocked by obstacles',
    type: 'weapon',
    rarity: 'common',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 1 }],
    goldCost: 25,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
  },
  war_hammer: {
    id: 'war_hammer',
    name: 'War Hammer',
    description: '+3 ATK · Melee, cleaves adjacent · 2 charges',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'cleave',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 50,
    charges: 2,
    maxCharges: 3,
    rechargeRate: 1,
    exhausting: false,
  },
  fire_staff: {
    id: 'fire_staff',
    name: 'Fire Staff',
    description: '+2 ATK · Arc, ignores obstacles · 2 charges',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 45,
    charges: 2,
    maxCharges: 2,
    rechargeRate: 1,
    exhausting: false,
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
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
  },
  iron_wraps: {
    id: 'iron_wraps',
    name: 'Iron Wraps',
    description: '+1 ATK · Melee · 2 max charges (can hit twice)',
    type: 'weapon',
    rarity: 'common',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 1 }],
    goldCost: 20,
    charges: 1,
    maxCharges: 2,
    rechargeRate: 2,
  },
  the_core: {
    id: 'the_core',
    name: 'The Core',
    description: '+6 ATK · Ranged · 0 recharge — needs Autoloader mod',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 6 }],
    goldCost: 80,
    charges: 1,
    maxCharges: 3,
    rechargeRate: 0,
    exhausting: false,
  },
  graviton_singularity: {
    id: 'graviton_singularity',
    name: 'Graviton Singularity',
    description: '+1 ATK · Lobbed · Pulls units 1 tile toward impact',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 1 }],
    goldCost: 70,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
  },
  tectonic_breaker: {
    id: 'tectonic_breaker',
    name: 'Tectonic Breaker',
    description: '+3 ATK · Cleave · Pushes target back 1 tile (+2 collision dmg)',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'cleave',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 55,
    charges: 1,
    maxCharges: 2,
    rechargeRate: 1,
  },
  phase_blade: {
    id: 'phase_blade',
    name: 'Phase Blade',
    description: '+6 ATK · Melee · Ignores DEF. Costs 1 HP per swing',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 6 }],
    goldCost: 75,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
  },
  ricochet_rifle: {
    id: 'ricochet_rifle',
    name: 'Ricochet Rifle',
    description: '+2 ATK · Ranged · On kill: bounces to nearest enemy',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 50,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: false,
  },
  napalm_launcher: {
    id: 'napalm_launcher',
    name: 'Napalm Launcher',
    description: '+2 ATK · Lobbed · Impact tile burns for 2 turns',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 50,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
  },
  wide_cleaver: {
    id: 'wide_cleaver',
    name: 'Wide Cleaver',
    description: '+2 ATK · Cleave · Hits 3-tile arc in front',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'cleave',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 45,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
  },

  // ── Armor ──
  leather_vest: {
    id: 'leather_vest',
    name: 'Leather Vest',
    description: '+1 DEF',
    type: 'armor',
    rarity: 'common',
    effects: [{ kind: 'stat_bonus', stat: 'defense', amount: 1 }],
    goldCost: 25,
  },
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
  scout_cloak: {
    id: 'scout_cloak',
    name: 'Scout Cloak',
    description: '+1 Move',
    type: 'armor',
    rarity: 'common',
    effects: [{ kind: 'stat_bonus', stat: 'moveRange', amount: 1 }],
    goldCost: 30,
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
    description: '+3 DEF, -1 Move. Moving through enemies deals 1 damage',
    type: 'armor',
    rarity: 'rare',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 3 },
      { kind: 'stat_bonus', stat: 'moveRange', amount: -1 },
    ],
    goldCost: 55,
  },
  thermo_shell: {
    id: 'thermo_shell',
    name: 'Thermo-Shell',
    description: '+1 DEF. Deals 1 Burn to adjacent enemies at end of turn',
    type: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'stat_bonus', stat: 'defense', amount: 1 }],
    goldCost: 45,
  },
  ablative_mesh: {
    id: 'ablative_mesh',
    name: 'Ablative Mesh',
    description: '+1 Move. Grants 10 HP Overshield at combat start',
    type: 'armor',
    rarity: 'common',
    effects: [{ kind: 'stat_bonus', stat: 'moveRange', amount: 1 }],
    goldCost: 30,
  },
  kinetic_dynamo: {
    id: 'kinetic_dynamo',
    name: 'Kinetic Dynamo',
    description: '+2 Move. Moving 4+ tiles grants +2 ATK on next attack',
    type: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'stat_bonus', stat: 'moveRange', amount: 2 }],
    goldCost: 50,
  },
  repulsor_field: {
    id: 'repulsor_field',
    name: 'Repulsor Field',
    description: '+2 DEF. Pushes adjacent enemies 1 tile away at end of their move',
    type: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'stat_bonus', stat: 'defense', amount: 2 }],
    goldCost: 50,
  },
  recoil_harness: {
    id: 'recoil_harness',
    name: 'Recoil Harness',
    description: '+1 DEF, -1 Move. Gain +1 charge when taking damage',
    type: 'armor',
    rarity: 'legendary',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 1 },
      { kind: 'stat_bonus', stat: 'moveRange', amount: -1 },
    ],
    goldCost: 65,
  },
  martyrs_blood: {
    id: 'martyrs_blood',
    name: "Martyr's Blood",
    description: '+3 DEF, +20 HP. Cannot be healed by any mid-run source',
    type: 'armor',
    rarity: 'legendary',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 3 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 20 },
    ],
    goldCost: 70,
  },
}

/** All weapon definitions. */
export function getWeapons(): ItemDefinition[] {
  return Object.values(ITEM_CATALOG).filter((i) => i.type === 'weapon')
}

/** All armor definitions. */
export function getArmors(): ItemDefinition[] {
  return Object.values(ITEM_CATALOG).filter((i) => i.type === 'armor')
}

/** Look up an item definition by id. Returns undefined if not found. */
export function getItem(id: string): ItemDefinition | undefined {
  return ITEM_CATALOG[id]
}
