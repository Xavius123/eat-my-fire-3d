/**
 * CharacterData — Defines playable characters with base stats and equipment restrictions.
 *
 * Characters are selected in the pre-run loadout. Each has innate base stats
 * (HP, movement, attack, defense) that equipment bonuses stack on top of.
 * Some characters may have equipment restrictions (e.g. cannot equip weapons).
 *
 * Characters are unlocked through meta-progression across runs.
 */

import type { ItemType } from '../run/ItemData'

export interface CharacterDefinition {
  id: string
  name: string
  title: string
  description: string
  /** Asset ID used for 3D model preview and in-combat rendering. */
  assetId: string
  /** Base stats before any equipment bonuses. */
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseMoveRange: number
  /** Equipment types this character CANNOT equip. Empty = no restrictions. */
  equipRestrictions: ItemType[]
  /** Whether this character is available from the start or must be unlocked. */
  unlocked: boolean
}

export const CHARACTER_CATALOG: Record<string, CharacterDefinition> = {
  // ── Starter characters (unlocked from the start) ──
  vanguard: {
    id: 'vanguard',
    name: 'Kael',
    title: 'Vanguard',
    description: 'Balanced frontliner. No weaknesses, no specialties.',
    assetId: 'unit.mini.male-a',
    baseHp: 12,
    baseAttack: 4,
    baseDefense: 1,
    baseMoveRange: 3,
    equipRestrictions: [],
    unlocked: true,
  },
  striker: {
    id: 'striker',
    name: 'Ryn',
    title: 'Striker',
    description: 'Fast and fragile. Gets in, hits hard, gets out.',
    assetId: 'unit.mini.female-a',
    baseHp: 8,
    baseAttack: 5,
    baseDefense: 0,
    baseMoveRange: 4,
    equipRestrictions: [],
    unlocked: true,
  },
  sentinel: {
    id: 'sentinel',
    name: 'Dorn',
    title: 'Sentinel',
    description: 'Slow and tough. Holds the line so others don\'t have to.',
    assetId: 'unit.mini.male-c',
    baseHp: 16,
    baseAttack: 3,
    baseDefense: 2,
    baseMoveRange: 2,
    equipRestrictions: [],
    unlocked: true,
  },

  // ── Unlockable characters ──
  channeler: {
    id: 'channeler',
    name: 'Syl',
    title: 'Channeler',
    description: 'Pure magic. Cannot equip weapons — attacks with innate power.',
    assetId: 'unit.mini.female-c',
    baseHp: 10,
    baseAttack: 6,
    baseDefense: 0,
    baseMoveRange: 3,
    equipRestrictions: ['weapon'],
    unlocked: true,
  },
  juggernaut: {
    id: 'juggernaut',
    name: 'Vex',
    title: 'Juggernaut',
    description: 'Unstoppable force. Cannot equip armor — relies on raw HP.',
    assetId: 'unit.mini.male-a',
    baseHp: 22,
    baseAttack: 4,
    baseDefense: 0,
    baseMoveRange: 2,
    equipRestrictions: ['armor'],
    unlocked: true,
  },
}

/** Returns all characters that are currently unlocked. */
export function getUnlockedCharacters(): CharacterDefinition[] {
  return Object.values(CHARACTER_CATALOG).filter((c) => c.unlocked)
}

/** Returns all characters (including locked ones). */
export function getAllCharacters(): CharacterDefinition[] {
  return Object.values(CHARACTER_CATALOG)
}

/** Look up a character by id. */
export function getCharacter(id: string): CharacterDefinition | undefined {
  return CHARACTER_CATALOG[id]
}
