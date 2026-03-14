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
