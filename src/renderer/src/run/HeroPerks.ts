import type { CharacterDefinition, HeroPerkDefinition } from '../entities/CharacterData'
import { getCharacter } from '../entities/CharacterData'
import type { RunState } from './RunState'
import type { UnitEntity } from '../entities/UnitEntity'

/** Minimum cumulative XP to be considered each hero level (levels 1–10). */
export const HERO_XP_FLOOR_PER_LEVEL: readonly number[] = [
  0, 10, 22, 36, 52, 70, 90, 112, 136, 162,
]

/** Max hero level supported by XP ladder. */
export const MAX_HERO_LEVEL = HERO_XP_FLOOR_PER_LEVEL.length

export function levelFromXp(xp: number): number {
  for (let L = MAX_HERO_LEVEL; L >= 2; L--) {
    if (xp >= HERO_XP_FLOOR_PER_LEVEL[L - 1]!) return L
  }
  return 1
}

/** XP bar toward next level (used by LevelUpScene). */
export function xpProgressForDisplay(totalXp: number): {
  level: number
  current: number
  needed: number
  pct: number
} {
  const level = levelFromXp(totalXp)
  if (level >= MAX_HERO_LEVEL) {
    const floor = HERO_XP_FLOOR_PER_LEVEL[MAX_HERO_LEVEL - 1]!
    return { level, current: totalXp - floor, needed: 0, pct: 100 }
  }
  const floor = HERO_XP_FLOOR_PER_LEVEL[level - 1]!
  const nextFloor = HERO_XP_FLOOR_PER_LEVEL[level]!
  const needed = nextFloor - floor
  const current = totalXp - floor
  const pct = needed === 0 ? 100 : Math.round((current / needed) * 100)
  return { level, current, needed, pct }
}

function perkRerollValue(p: HeroPerkDefinition | undefined): number {
  if (!p || p.kind !== 'reward_reroll') return 0
  return Math.max(0, p.value ?? 0)
}

/**
 * Total mod-reward rerolls available this run from perks (primary + level-10 if applicable),
 * summed across current loadout heroes.
 */
export function computeModRerollBudget(state: RunState): number {
  let n = 0
  for (const slot of state.loadout) {
    const c = getCharacter(slot.characterId)
    if (!c?.primaryPerk || !c.level10Perk) continue
    n += perkRerollValue(c.primaryPerk)
    const lvl = state.heroLevel[slot.characterId] ?? 1
    if (lvl >= 10) n += perkRerollValue(c.level10Perk)
  }
  return n
}

/** Remaining rerolls = budget − spent (never negative). */
export function modRerollsRemaining(state: RunState): number {
  return Math.max(0, computeModRerollBudget(state) - state.modRerollsSpentThisRun)
}

function applyStatPerk(
  unit: UnitEntity,
  perk: HeroPerkDefinition | undefined
): void {
  if (!perk || perk.kind !== 'stat_bonus' || !perk.stat || perk.value === undefined) return
  const v = perk.value
  switch (perk.stat) {
    case 'maxHp':
      unit.stats.maxHp += v
      unit.stats.hp += v
      break
    case 'attack':
      unit.stats.attack += v
      break
    case 'defense':
      unit.stats.defense += v
      break
    case 'moveRange':
      unit.stats.moveRange += v
      break
    default:
      break
  }
}

/**
 * Apply primary + level-10 (if hero level ≥ 10) stat perks at combat spawn.
 * Call after base character stats, before run-wide bonuses.
 */
export function applyHeroPerkStatBonuses(
  character: CharacterDefinition,
  state: RunState,
  unit: UnitEntity
): void {
  const charId = character.id
  const lvl = state.heroLevel[charId] ?? 1
  applyStatPerk(unit, character.primaryPerk)
  if (lvl >= 10) applyStatPerk(unit, character.level10Perk)
}

/** Short labels for combat UI (primary + level-10 names when unlocked). */
export function formatHeroPerkSummary(
  character: CharacterDefinition,
  state: RunState
): string {
  const lvl = state.heroLevel[character.id] ?? 1
  const p = character.primaryPerk
  const t = character.level10Perk
  if (!p || !t) return ''
  const parts = [p.name]
  if (lvl >= 10) parts.push(t.name)
  return parts.join(' · ')
}
