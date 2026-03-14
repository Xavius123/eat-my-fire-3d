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
import { isCharacterUnlocked } from '../run/MetaProgression'

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
    unlocked: false, // unlocked after 1 completed run
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
    unlocked: false, // unlocked after 3 completed runs
  },
  medic: {
    id: 'medic',
    name: 'Mira',
    title: 'Medic',
    description: 'Heals an adjacent ally for 6 HP instead of attacking. Cannot attack. The cost of sustained survivability.',
    assetId: 'unit.mini.female-c',
    baseHp: 10,
    baseAttack: 2,
    baseDefense: 1,
    baseMoveRange: 3,
    equipRestrictions: ['weapon'],
    unlocked: false, // unlocked after 2 completed runs
  },

  // ── Designed characters (not yet fully implemented in combat) ──
  tank: {
    id: 'tank',
    name: 'Torque',
    title: 'The Tank',
    description: 'Built for the front lines. Melee only (Basic/Cleave). Forces close-range commitment.',
    assetId: 'unit.mini.male-b',
    baseHp: 24,
    baseAttack: 0,
    baseDefense: 2,
    baseMoveRange: 2,
    equipRestrictions: [], // melee-only restriction handled at loadout level
    unlocked: false,
  },
  ghost: {
    id: 'ghost',
    name: 'Zephyr',
    title: 'The Ghost',
    description: 'Extreme high-risk flanker. Dies in two hits. Rewards players who keep her alive.',
    assetId: 'unit.mini.female-b',
    baseHp: 6,
    baseAttack: 0,
    baseDefense: 0,
    baseMoveRange: 5,
    equipRestrictions: [],
    unlocked: false,
  },
  siphoner: {
    id: 'siphoner',
    name: 'Sybil',
    title: 'The Siphoner',
    description: 'Free action: heal an ally within LOS for 6 HP once per turn. Slow and fragile.',
    assetId: 'unit.mini.female-d',
    baseHp: 12,
    baseAttack: 0,
    baseDefense: 0,
    baseMoveRange: 2,
    equipRestrictions: [],
    unlocked: false,
  },
}

/** Returns all characters that are currently unlocked (checks meta-progression). */
export function getUnlockedCharacters(): CharacterDefinition[] {
  return Object.values(CHARACTER_CATALOG).filter((c) =>
    c.unlocked || isCharacterUnlocked(c.id)
  )
}

/** Returns all characters (including locked ones). */
export function getAllCharacters(): CharacterDefinition[] {
  return Object.values(CHARACTER_CATALOG)
}

/** Look up a character by id. */
export function getCharacter(id: string): CharacterDefinition | undefined {
  return CHARACTER_CATALOG[id]
}
