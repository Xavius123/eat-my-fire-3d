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
  /** No equipment restrictions on any hero. */
  equipRestrictions: []
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero catalog
// GLB asset IDs available: unit.mini.male-a/b/c/d/e/f  unit.mini.female-a/b/c/d/e/f
// ─────────────────────────────────────────────────────────────────────────────

export const CHARACTER_CATALOG: Record<string, CharacterDefinition> = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    title: 'Vanguard',
    class: 'Vanguard',
    description: 'Balanced frontliner. Reliable melee. No weaknesses.',
    assetId: 'unit.mini.male-a',
    baseHp: 14, baseAttack: 2, baseDefense: 1, baseMoveRange: 3,
    weapon: { name: 'Iron Sword', attackType: 'basic', range: 1, charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true },
    attacks: [
      { id: 'iron_slash',  name: 'Iron Slash',  attackType: 'basic',  range: 1, cost: 1, exhausting: true },
      { id: 'shield_bash', name: 'Shield Bash', attackType: 'basic',  range: 1, cost: 1, exhausting: true },
      { id: 'whirlwind',   name: 'Whirlwind',   attackType: 'cleave', range: 1, cost: 2, exhausting: false },
    ],
    unlocked: true,
    equipRestrictions: [],
  },

  mage: {
    id: 'mage',
    name: 'Mage',
    title: 'Channeler',
    class: 'Channeler',
    description: 'Nature caster. Lobs magic over obstacles. Fragile.',
    assetId: 'unit.mini.female-a',
    baseHp: 10, baseAttack: 3, baseDefense: 0, baseMoveRange: 3,
    weapon: { name: 'Arcane Staff', attackType: 'lobbed', range: 4, charges: 1, maxCharges: 2, rechargeRate: 1, exhausting: false },
    attacks: [
      { id: 'arcane_bolt', name: 'Arcane Bolt', attackType: 'lobbed', range: 4, cost: 1, exhausting: false },
      { id: 'fireball',    name: 'Fireball',    attackType: 'lobbed', range: 3, cost: 2, exhausting: false },
      { id: 'focus',       name: 'Focus',       abilityType: 'self_buff', range: 0, cost: 0, exhausting: false, atkMod: 2 },
    ],
    unlocked: true,
    equipRestrictions: [],
  },

  healer: {
    id: 'healer',
    name: 'Healer',
    title: 'Arcane Archer',
    class: 'Arcane Archer',
    description: 'Arcane Archer healer. Heal all, heal one, or shoot.',
    assetId: 'unit.mini.female-c',
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
  },

  samurai: {
    id: 'samurai',
    name: 'Samurai',
    title: 'Samurai',
    class: 'Samurai',
    description: 'Precise melee duelist. High damage, hit-and-run.',
    assetId: 'unit.mini.male-c',
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
  },

  ned: {
    id: 'ned',
    name: 'Ned',
    title: 'Crusader',
    class: 'Crusader',
    description: 'Legendary bushranger. Iron armor and revolver. Tank with punishing range.',
    assetId: 'unit.mini.male-b',
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
  },

  death: {
    id: 'death',
    name: 'Death',
    title: 'Reaper',
    class: 'Reaper',
    description: 'Legendary reaper. Cleave and lifesteal. Grows stronger per kill.',
    assetId: 'unit.mini.female-b',
    baseHp: 14, baseAttack: 4, baseDefense: 2, baseMoveRange: 3,
    weapon: { name: 'Scythe', attackType: 'cleave', range: 1, charges: 2, maxCharges: 2, rechargeRate: 1, exhausting: false },
    attacks: [
      { id: 'scythe',      name: 'Scythe',      attackType: 'cleave',     range: 1, cost: 1, exhausting: false },
      { id: 'soul_harvest',name: 'Soul Harvest', attackType: 'basic',      range: 1, cost: 2, exhausting: false },
      { id: 'death_mark',  name: 'Death Mark',  attackType: 'projectile', range: 4, cost: 1, exhausting: false },
    ],
    passive: { type: 'lifesteal', value: 2, description: 'Soul harvest: heals 2 HP on each successful hit.' },
    unlocked: false,
    legendary: true,
    equipRestrictions: [],
  },
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
