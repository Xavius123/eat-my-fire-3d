/**
 * CharacterData — Eat My Fire heroes ported to 3D engine.
 *
 * Each hero maps to a mini-character GLB asset for 3D rendering.
 * Legendary heroes (ned, death) are locked until unlocked via events or
 * meta-progression.
 */

import { isCharacterUnlocked } from '../run/MetaProgression'
import { DEV_MODE } from '../utils/devMode'

export type AttackKind = 'basic' | 'projectile' | 'lobbed' | 'cleave'
export type AbilityType = 'heal_all' | 'heal_single' | 'self_buff' | 'thorns_buff'
export type PassiveType = 'lifesteal' | 'stationary_bonus'

export interface AttackProfile {
  id: string
  name: string
  attackType?: AttackKind
  abilityType?: AbilityType
  range: number
  cost: number
  exhausting: boolean
  /** For heal abilities. */
  healAmount?: number
  /** For self_buff abilities. */
  atkMod?: number
  /** For thorns_buff abilities. */
  value?: number
}

export interface Passive {
  type: PassiveType
  value: number
  description: string
}

/** Equipment slots for loadout UI. */
export type EquipSlot = 'weapon' | 'armor'

export type HeroPerkKind = 'reward_reroll' | 'stat_bonus'

export interface HeroPerkDefinition {
  id: string
  name: string
  description: string
  kind: HeroPerkKind
  /** `reward_reroll`: +N mod-offer rerolls per run (shared pool). `stat_bonus`: amount for `stat`. */
  value?: number
  stat?: 'maxHp' | 'attack' | 'defense' | 'moveRange'
}

export interface CharacterDefinition {
  id: string
  name: string
  /** Display class title. */
  title: string
  class: string
  description: string
  /** Mini-character GLB asset ID for 3D rendering. */
  assetId: string
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseMoveRange: number
  weapon: {
    name: string
    attackType: AttackKind
    range: number
    charges: number
    maxCharges: number
    rechargeRate: number
    exhausting: boolean
  }
  attacks: AttackProfile[]
  passive?: Passive
  /** Locked by default; unlocked via events or meta-progression. */
  unlocked: boolean
  /** Legendary heroes can only join via special events. */
  legendary?: boolean
  /** Slots this hero cannot equip. Empty = no restrictions. */
  equipRestrictions: EquipSlot[]
  /** Always-on run perk (stats or mod rerolls). */
  primaryPerk: HeroPerkDefinition
  /** Unlocks when hero level ≥ 10 in run. */
  level10Perk: HeroPerkDefinition
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero catalog
// Primary visuals: KayKit Adventurers (see AssetLibrary unit.kaykit.*).
// Fallback minis remain registered as unit.mini.* for enemies / tools.
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTER_CATALOG: Record<string, CharacterDefinition> = {
  warrior: {
    id: 'warrior',
    name: 'Kael',
    title: 'Vanguard',
    class: 'Vanguard',
    description: 'Balanced frontliner. Reliable melee. No weaknesses.',
    assetId: 'unit.kaykit.knight',
    baseHp: 14, baseAttack: 2, baseDefense: 1, baseMoveRange: 3,
    weapon: { name: 'Iron Sword', attackType: 'basic', range: 1, charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true },
    attacks: [
      { id: 'iron_slash',  name: 'Iron Slash',  attackType: 'basic',  range: 1, cost: 1, exhausting: true },
      { id: 'shield_bash', name: 'Shield Bash', attackType: 'basic',  range: 1, cost: 1, exhausting: true },
      { id: 'whirlwind',   name: 'Whirlwind',   attackType: 'cleave', range: 1, cost: 2, exhausting: false },
    ],
    unlocked: true,
    equipRestrictions: [],
    primaryPerk: {
      id: 'kael_veteran',
      name: 'Veteran',
      description: '+1 Max HP from campaign experience.',
      kind: 'stat_bonus',
      stat: 'maxHp',
      value: 1,
    },
    level10Perk: {
      id: 'kael_war_council',
      name: 'War Council',
      description: '+1 Attack — leadership hardens the line.',
      kind: 'stat_bonus',
      stat: 'attack',
      value: 1,
    },
  },

  mage: {
    id: 'mage',
    name: 'Syl',
    title: 'Channeler',
    class: 'Channeler',
    description: 'Nature caster. Lobs magic over obstacles. Fragile.',
    assetId: 'unit.kaykit.mage',
    baseHp: 10, baseAttack: 3, baseDefense: 0, baseMoveRange: 3,
    weapon: { name: 'Arcane Staff', attackType: 'lobbed', range: 4, charges: 1, maxCharges: 2, rechargeRate: 1, exhausting: false },
    attacks: [
      { id: 'arcane_bolt', name: 'Arcane Bolt', attackType: 'lobbed', range: 4, cost: 1, exhausting: false },
      { id: 'fireball',    name: 'Fireball',    attackType: 'lobbed', range: 3, cost: 2, exhausting: false },
      { id: 'focus',       name: 'Focus',       abilityType: 'self_buff', range: 0, cost: 0, exhausting: false, atkMod: 2 },
    ],
    unlocked: true,
    equipRestrictions: [],
    primaryPerk: {
      id: 'syl_lucky_draw',
      name: 'Lucky Draw',
      description: '+1 mod-offer reroll per run (party pool).',
      kind: 'reward_reroll',
      value: 1,
    },
    level10Perk: {
      id: 'syl_arcane_reserve',
      name: 'Arcane Reserve',
      description: '+2 Max HP — power stored, not spent.',
      kind: 'stat_bonus',
      stat: 'maxHp',
      value: 2,
    },
  },

  healer: {
    id: 'healer',
    name: 'Ryn',
    title: 'Arcane Archer',
    class: 'Arcane Archer',
    description: 'Arcane Archer healer. Heal all, heal one, or shoot.',
    assetId: 'unit.kaykit.ranger',
    baseHp: 11, baseAttack: 2, baseDefense: 0, baseMoveRange: 3,
    weapon: { name: 'Arcane Bow', attackType: 'projectile', range: 3, charges: 1, maxCharges: 2, rechargeRate: 1, exhausting: false },
    attacks: [
      { id: 'heal_all',        name: 'Heal All',        abilityType: 'heal_all',    range: 0, cost: 2, exhausting: false, healAmount: 3 },
      { id: 'heal_individual', name: 'Heal Individual', abilityType: 'heal_single', range: 3, cost: 1, exhausting: false, healAmount: 4 },
      { id: 'arcane_arrow',    name: 'Arcane Arrow',    attackType: 'projectile',   range: 3, cost: 1, exhausting: false },
    ],
    passive: { type: 'lifesteal', value: 1, description: 'Heals 1 HP on each successful hit.' },
    unlocked: true,
    equipRestrictions: [],
    primaryPerk: {
      id: 'ryn_field_bandage',
      name: 'Field Bandage',
      description: '+1 Defense — always another strap in the kit.',
      kind: 'stat_bonus',
      stat: 'defense',
      value: 1,
    },
    level10Perk: {
      id: 'ryn_supply_line',
      name: 'Supply Line',
      description: '+1 mod-offer reroll per run (party pool).',
      kind: 'reward_reroll',
      value: 1,
    },
  },

  samurai: {
    id: 'samurai',
    name: 'Jin',
    title: 'Samurai',
    class: 'Samurai',
    description: 'Precise melee duelist. High damage, hit-and-run.',
    assetId: 'unit.kaykit.rogue',
    baseHp: 12, baseAttack: 3, baseDefense: 1, baseMoveRange: 3,
    weapon: { name: 'Katana', attackType: 'basic', range: 1, charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true },
    attacks: [
      { id: 'katana_slash', name: 'Katana Slash', attackType: 'basic',  range: 1, cost: 1, exhausting: true },
      { id: 'iaido_strike', name: 'Iaido Strike', attackType: 'cleave', range: 1, cost: 2, exhausting: false },
      { id: 'deflect',      name: 'Deflect',      abilityType: 'thorns_buff', range: 0, cost: 1, exhausting: false, value: 1 },
    ],
    passive: { type: 'stationary_bonus', value: 1, description: 'Steady stance: +1 ATK when not moved this turn.' },
    unlocked: true,
    equipRestrictions: [],
    primaryPerk: {
      id: 'jin_blade_oath',
      name: 'Blade Oath',
      description: '+1 Attack — cut once, truly.',
      kind: 'stat_bonus',
      stat: 'attack',
      value: 1,
    },
    level10Perk: {
      id: 'jin_iron_will',
      name: 'Iron Will',
      description: '+1 Defense — the next blow still lands, softer.',
      kind: 'stat_bonus',
      stat: 'defense',
      value: 1,
    },
  },

  ned: {
    id: 'ned',
    name: 'Ned',
    title: 'Crusader',
    class: 'Crusader',
    description: 'Legendary bushranger. Iron armor and revolver. Tank with punishing range.',
    assetId: 'unit.kaykit.barbarian',
    baseHp: 18, baseAttack: 4, baseDefense: 3, baseMoveRange: 2,
    weapon: { name: 'Revolver', attackType: 'projectile', range: 5, charges: 2, maxCharges: 2, rechargeRate: 1, exhausting: false },
    attacks: [
      { id: 'revolver',   name: 'Revolver',   attackType: 'projectile', range: 5, cost: 1, exhausting: false },
      { id: 'quick_draw', name: 'Quick Draw', attackType: 'projectile', range: 4, cost: 2, exhausting: false },
      { id: 'last_stand', name: 'Last Stand', attackType: 'basic',      range: 1, cost: 1, exhausting: true },
    ],
    passive: { type: 'stationary_bonus', value: 2, description: 'Steady aim: +2 ATK when not moved this turn.' },
    unlocked: false,
    legendary: true,
    equipRestrictions: [],
    primaryPerk: {
      id: 'ned_bush_tally',
      name: 'Bush Tally',
      description: '+1 mod-offer reroll per run (party pool).',
      kind: 'reward_reroll',
      value: 1,
    },
    level10Perk: {
      id: 'ned_iron_lungs',
      name: 'Iron Lungs',
      description: '+2 Max HP — Kelly weathered worse.',
      kind: 'stat_bonus',
      stat: 'maxHp',
      value: 2,
    },
  },

}

// ─────────────────────────────────────────────────────────────────────────────
// Path ability catalog — skills unlocked mid-run via hero leveling
// Keyed by grantId (matches HeroProgressionData UNLOCK_TALENTS grantId field)
// ─────────────────────────────────────────────────────────────────────────────

export const PATH_ABILITY_CATALOG: Record<string, AttackProfile> = {
  // ── Warrior: Berserker ──
  battle_rage: {
    id: 'battle_rage', name: 'Battle Rage', attackType: 'basic',
    range: 1, cost: 2, exhausting: true,
  },
  berserk_surge: {
    id: 'berserk_surge', name: 'Berserk Surge', attackType: 'cleave',
    range: 1, cost: 1, exhausting: true,
  },

  // ── Warrior: Guardian ──
  shield_wall: {
    id: 'shield_wall', name: 'Shield Wall', abilityType: 'thorns_buff',
    range: 2, cost: 1, exhausting: false, value: 2,
  },
  taunt_strike: {
    id: 'taunt_strike', name: 'Taunt Strike', attackType: 'basic',
    range: 1, cost: 1, exhausting: true,
  },

  // ── Mage: Pyromancer ──
  inferno_bolt: {
    id: 'inferno_bolt', name: 'Inferno Bolt', attackType: 'lobbed',
    range: 3, cost: 2, exhausting: false,
  },
  pyroclasm: {
    id: 'pyroclasm', name: 'Pyroclasm', attackType: 'lobbed',
    range: 3, cost: 3, exhausting: true,
  },

  // ── Mage: Frostweaver ──
  glacial_spike: {
    id: 'glacial_spike', name: 'Glacial Spike', attackType: 'projectile',
    range: 5, cost: 2, exhausting: false,
  },
  blizzard: {
    id: 'blizzard', name: 'Blizzard', attackType: 'projectile',
    range: 4, cost: 1, exhausting: true,
  },

  // ── Healer: Battle Medic ──
  emergency_stim: {
    id: 'emergency_stim', name: 'Emergency Stim', abilityType: 'heal_single',
    range: 3, cost: 2, exhausting: false, healAmount: 8,
  },
  mass_triage: {
    id: 'mass_triage', name: 'Mass Triage', abilityType: 'heal_all',
    range: 0, cost: 3, exhausting: false, healAmount: 6,
  },

  // ── Healer: Arcane Hunter ──
  twin_shot: {
    id: 'twin_shot', name: 'Twin Shot', attackType: 'projectile',
    range: 3, cost: 1, exhausting: false,
  },
  volley: {
    id: 'volley', name: 'Volley', attackType: 'projectile',
    range: 3, cost: 1, exhausting: false,
  },

  // ── Samurai: Duelist ──
  precision_strike: {
    id: 'precision_strike', name: 'Precision Strike', attackType: 'basic',
    range: 1, cost: 1, exhausting: true,
  },
  blade_dance: {
    id: 'blade_dance', name: 'Blade Dance', attackType: 'cleave',
    range: 1, cost: 2, exhausting: false,
  },

  // ── Samurai: Shadow ──
  shadow_step: {
    id: 'shadow_step', name: 'Shadow Step', abilityType: 'self_buff',
    range: 3, cost: 0, exhausting: false, atkMod: 0,
  },
  vanishing_cut: {
    id: 'vanishing_cut', name: 'Vanishing Cut', attackType: 'basic',
    range: 1, cost: 1, exhausting: false,
  },

  // ── Ned: Outlaw ──
  fan_the_hammer: {
    id: 'fan_the_hammer', name: 'Fan the Hammer', attackType: 'projectile',
    range: 5, cost: 2, exhausting: false,
  },
  suppressing_fire: {
    id: 'suppressing_fire', name: 'Suppressing Fire', attackType: 'projectile',
    range: 5, cost: 2, exhausting: true,
  },

  // ── Ned: Iron Tide ──
  cover_position: {
    id: 'cover_position', name: 'Cover Position', abilityType: 'thorns_buff',
    range: 2, cost: 1, exhausting: false, value: 3,
  },
  iron_charge: {
    id: 'iron_charge', name: 'Iron Charge', attackType: 'basic',
    range: 1, cost: 2, exhausting: true,
  },
}

export function getPathAbility(id: string): AttackProfile | undefined {
  return PATH_ABILITY_CATALOG[id]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (same API as first-fight's CharacterData)
// ─────────────────────────────────────────────────────────────────────────────

export function getUnlockedCharacters(): CharacterDefinition[] {
  return Object.values(CHARACTER_CATALOG).filter(
    (c) => c.unlocked || isCharacterUnlocked(c.id) || (DEV_MODE && !!c.legendary)
  )
}

export function getAllCharacters(): CharacterDefinition[] {
  return Object.values(CHARACTER_CATALOG)
}

export function getCharacter(id: string): CharacterDefinition | undefined {
  return CHARACTER_CATALOG[id]
}
