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
  | 'consumable_party_heal' // restore HP to all roster units (see ItemInventory)
  | 'consumable_add_crystals' // add crystals when consumed

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
  /**
   * Broad weapon category for UI / future proficiency and shop pools.
   * Gear still uses attackType for combat math.
   */
  weaponStyle?: 'melee' | 'ranged' | 'arcane' | 'tech'
  /** Optional labels (faction, firearm, fantasy, etc.). */
  tags?: string[]
  /**
   * Soft affinity — UI only unless you add hard bans later.
   * Empty means no specific hero suggestion.
   */
  suggestedCharacterIds?: string[]
  /** Path ids from HeroPathData (e.g. frostweaver) for “perfect fit” hints. */
  suggestedPathIds?: string[]
  /** Cross-cutting tags: ice, fire, healing, tech, etc. */
  affinityTags?: string[]
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
    weaponStyle: 'melee',
    tags: ['fantasy'],
    suggestedCharacterIds: ['warrior', 'samurai'],
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
    weaponStyle: 'ranged',
    tags: ['fantasy'],
    suggestedCharacterIds: ['healer'],
  },
  war_hammer: {
    id: 'war_hammer',
    name: 'War Hammer',
    description: '+3 ATK · Cleave profile · extra charges (cleave arc not yet custom)',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'cleave',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 50,
    charges: 2,
    maxCharges: 3,
    rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'melee',
    tags: ['fantasy'],
  },
  fire_staff: {
    id: 'fire_staff',
    name: 'Fire Staff',
    description: '+2 ATK · Lobbed (arcs over obstacles)',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 45,
    charges: 2,
    maxCharges: 2,
    rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'arcane',
    tags: ['fantasy'],
    suggestedCharacterIds: ['mage'],
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
    weaponStyle: 'melee',
    tags: ['fantasy'],
  },
  iron_wraps: {
    id: 'iron_wraps',
    name: 'Iron Wraps',
    description: '+1 ATK · Melee · higher max charges (extra swings per combat)',
    type: 'weapon',
    rarity: 'common',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 1 }],
    goldCost: 20,
    charges: 1,
    maxCharges: 2,
    rechargeRate: 2,
    weaponStyle: 'melee',
    tags: ['fantasy'],
  },
  the_core: {
    id: 'the_core',
    name: 'The Core',
    description: '+6 ATK · Ranged · slow recharge (pair with recharge mods for sustain)',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 6 }],
    goldCost: 80,
    charges: 1,
    maxCharges: 3,
    rechargeRate: 0,
    exhausting: false,
    weaponStyle: 'tech',
    tags: ['tech', 'firearm'],
  },
  graviton_singularity: {
    id: 'graviton_singularity',
    name: 'Graviton Singularity',
    description: '+1 ATK · Lobbed (pull-on-hit is flavor — not yet in combat resolver)',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 1 }],
    goldCost: 70,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    weaponStyle: 'tech',
    tags: ['tech', 'arcane'],
  },
  tectonic_breaker: {
    id: 'tectonic_breaker',
    name: 'Tectonic Breaker',
    description: '+3 ATK · Cleave (push/knockback is flavor — not yet implemented)',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'cleave',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 55,
    charges: 1,
    maxCharges: 2,
    rechargeRate: 1,
    weaponStyle: 'melee',
    tags: ['tech'],
  },
  phase_blade: {
    id: 'phase_blade',
    name: 'Phase Blade',
    description: '+6 ATK · Melee (ignore-DEF / self-damage are flavor — uses normal DEF rules)',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 6 }],
    goldCost: 75,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    weaponStyle: 'melee',
    tags: ['tech', 'arcane'],
  },
  ricochet_rifle: {
    id: 'ricochet_rifle',
    name: 'Ricochet Rifle',
    description: '+2 ATK · Ranged (chain kill is flavor — not yet implemented)',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'projectile',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 50,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'tech',
    tags: ['tech', 'firearm'],
    suggestedCharacterIds: ['ned'],
  },
  napalm_launcher: {
    id: 'napalm_launcher',
    name: 'Napalm Launcher',
    description: '+2 ATK · Lobbed (ground fire DoT is flavor — not yet implemented)',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 50,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    weaponStyle: 'tech',
    tags: ['tech'],
  },
  wide_cleaver: {
    id: 'wide_cleaver',
    name: 'Wide Cleaver',
    description: '+2 ATK · Cleave (wide arc is flavor — standard cleave pattern today)',
    type: 'weapon',
    rarity: 'rare',
    attackType: 'cleave',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 45,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    weaponStyle: 'melee',
    tags: ['fantasy'],
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
    tags: ['fantasy', 'light'],
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
    description: '+3 DEF, -1 Move (collision damage on move is flavor — not implemented)',
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
    description: '+1 DEF (adjacent burn aura is flavor — not implemented)',
    type: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'stat_bonus', stat: 'defense', amount: 1 }],
    goldCost: 45,
    tags: ['tech'],
  },
  ablative_mesh: {
    id: 'ablative_mesh',
    name: 'Ablative Mesh',
    description: '+1 Move (overshield at combat start is flavor — not implemented)',
    type: 'armor',
    rarity: 'common',
    effects: [{ kind: 'stat_bonus', stat: 'moveRange', amount: 1 }],
    goldCost: 30,
    tags: ['tech'],
  },
  kinetic_dynamo: {
    id: 'kinetic_dynamo',
    name: 'Kinetic Dynamo',
    description: '+2 Move (bonus ATK after long move is flavor — not implemented)',
    type: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'stat_bonus', stat: 'moveRange', amount: 2 }],
    goldCost: 50,
    tags: ['tech'],
  },
  repulsor_field: {
    id: 'repulsor_field',
    name: 'Repulsor Field',
    description: '+2 DEF (push aura is flavor — not implemented)',
    type: 'armor',
    rarity: 'rare',
    effects: [{ kind: 'stat_bonus', stat: 'defense', amount: 2 }],
    goldCost: 50,
    tags: ['tech'],
  },
  recoil_harness: {
    id: 'recoil_harness',
    name: 'Recoil Harness',
    description: '+1 DEF, -1 Move (charge-on-hit is flavor — not implemented)',
    type: 'armor',
    rarity: 'legendary',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 1 },
      { kind: 'stat_bonus', stat: 'moveRange', amount: -1 },
    ],
    goldCost: 65,
    tags: ['tech'],
  },
  martyrs_blood: {
    id: 'martyrs_blood',
    name: "Martyr's Blood",
    description: '+3 DEF, +20 HP (heal lock is flavor — normal healing applies today)',
    type: 'armor',
    rarity: 'legendary',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 3 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 20 },
    ],
    goldCost: 70,
    tags: ['fantasy', 'cursed'],
  },

  // ── Path-flavored & boss-cache legendaries ──
  ice_staff: {
    id: 'ice_staff',
    name: 'Ice Staff',
    description: '+3 ATK · Lobbed · Shards of winter (path-tuned frost flavor)',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 0,
    charges: 2,
    maxCharges: 2,
    rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'arcane',
    tags: ['fantasy', 'ice'],
    suggestedCharacterIds: ['mage'],
    suggestedPathIds: ['frostweaver'],
    affinityTags: ['ice'],
  },
  ember_staff: {
    id: 'ember_staff',
    name: 'Ember Staff',
    description: '+3 ATK · Lobbed · Breath of cinders (path-tuned fire flavor)',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 3 }],
    goldCost: 0,
    charges: 2,
    maxCharges: 2,
    rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'arcane',
    tags: ['fantasy', 'fire'],
    suggestedCharacterIds: ['mage'],
    suggestedPathIds: ['pyromancer'],
    affinityTags: ['fire'],
  },
  storm_staff: {
    id: 'storm_staff',
    name: 'Storm Staff',
    description: '+2 ATK · Lobbed · Unstable conduit (Arcanist)',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'lobbed',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 2 }],
    goldCost: 0,
    charges: 3,
    maxCharges: 3,
    rechargeRate: 1,
    exhausting: false,
    weaponStyle: 'arcane',
    tags: ['fantasy', 'arcane'],
    suggestedCharacterIds: ['mage'],
    suggestedPathIds: ['arcanist'],
    affinityTags: ['arcane'],
  },
  sunforged_blade: {
    id: 'sunforged_blade',
    name: 'Sunforged Blade',
    description: '+4 ATK · Melee · Boss cache relic',
    type: 'weapon',
    rarity: 'legendary',
    attackType: 'basic',
    effects: [{ kind: 'stat_bonus', stat: 'attack', amount: 4 }],
    goldCost: 0,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    weaponStyle: 'melee',
    tags: ['fantasy', 'boss'],
    suggestedCharacterIds: ['warrior', 'samurai'],
    affinityTags: ['boss'],
  },
  boss_cache_plate: {
    id: 'boss_cache_plate',
    name: 'Boss Cache Plate',
    description: '+4 DEF, +8 HP · Stripped from the gate guardian',
    type: 'armor',
    rarity: 'legendary',
    effects: [
      { kind: 'stat_bonus', stat: 'defense', amount: 4 },
      { kind: 'stat_bonus', stat: 'maxHp', amount: 8 },
    ],
    goldCost: 0,
    tags: ['boss'],
    suggestedCharacterIds: ['warrior', 'healer', 'samurai', 'ned'],
    affinityTags: ['boss'],
  },

  // ── Consumables (RunState.items — buy at shop, use at Rest) ──
  healing_salve: {
    id: 'healing_salve',
    name: 'Healing Salve',
    description: 'Use at a Rest node: restore 10 HP to all party members. Consumed on use.',
    type: 'consumable',
    rarity: 'common',
    effects: [{ kind: 'consumable_party_heal', amount: 10 }],
    goldCost: 12,
  },
  crystal_shard: {
    id: 'crystal_shard',
    name: 'Crystal Shard',
    description: 'Crush for +1 crystal (Awakened / meta currency). Consumed on use.',
    type: 'consumable',
    rarity: 'common',
    effects: [{ kind: 'consumable_add_crystals', amount: 1 }],
    goldCost: 15,
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

/** Consumables carried in RunState.items. */
export function getConsumables(): ItemDefinition[] {
  return Object.values(ITEM_CATALOG).filter((i) => i.type === 'consumable')
}

/** Look up an item definition by id. Returns undefined if not found. */
export function getItem(id: string): ItemDefinition | undefined {
  return ITEM_CATALOG[id]
}

export interface ItemRecommendationFormatOpts {
  characterName?: (characterId: string) => string | undefined
  pathName?: (pathId: string) => string | undefined
}

/**
 * Human-readable “Recommended: …” for loadout / run sheet.
 */
export function formatItemRecommendation(
  item: ItemDefinition,
  opts?: ItemRecommendationFormatOpts
): string | null {
  const chars = item.suggestedCharacterIds
  const paths = item.suggestedPathIds
  if ((!chars || chars.length === 0) && (!paths || paths.length === 0)) return null
  const parts: string[] = []
  if (chars?.length) {
    parts.push(
      chars.map((id) => opts?.characterName?.(id) ?? id).join(' · ')
    )
  }
  if (paths?.length) {
    parts.push(paths.map((id) => opts?.pathName?.(id) ?? id).join(' · '))
  }
  return `Recommended: ${parts.join(' — ')}`
}

/** Boss-only legendary pick pool (weapon + armor ids). Filtered by loadout in RewardScene. */
export const BOSS_LEGENDARY_POOL: readonly string[] = [
  'phase_blade',
  'the_core',
  'martyrs_blood',
  'boss_cache_plate',
  'sunforged_blade',
  'ice_staff',
  'ember_staff',
]

/** Pick up to 3 boss legendary offers; prefer items whose suggestedCharacterIds overlap loadout. */
export function getBossLegendaryOffers(loadoutCharacterIds: string[]): ItemDefinition[] {
  const pool = BOSS_LEGENDARY_POOL.map((id) => getItem(id)).filter(
    (def): def is ItemDefinition => !!def && (def.type === 'weapon' || def.type === 'armor')
  )
  const preferred = pool.filter((def) => {
    if (!def.suggestedCharacterIds?.length) return true
    return def.suggestedCharacterIds.some((id) => loadoutCharacterIds.includes(id))
  })
  const source = preferred.length > 0 ? preferred : pool
  const shuffled = [...source].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(3, shuffled.length))
}
