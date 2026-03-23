/**
 * HeroPathData — Path (subclass) options for each hero.
 *
 * At level 2, each hero picks a Path that defines their identity for the rest of the run.
 * The actual ability/passive mechanics are wired in Phase 2+.
 * This file contains only the structural data used by the UI and RunState.
 */

export interface HeroPath {
  id: string
  name: string
  /** Short passive description shown in the path picker. */
  passive: string
  /** Longer flavor description shown as subtitle. */
  flavor: string
  /** CSS accent color for the path card. */
  color: string
  /** If set, this path is only available when the named run flag is true. */
  unlockCondition?: 'metEcho'
}

/**
 * Path options per hero (keyed by characterId).
 * Heroes with 3 paths have one gated by an unlock condition.
 */
export const HERO_PATHS: Record<string, HeroPath[]> = {
  warrior: [
    {
      id: 'berserker',
      name: 'Berserker',
      passive: 'On kill: +1 ATK this combat (stacks).',
      flavor: 'Every death feeds the frenzy.',
      color: '#e05040',
    },
    {
      id: 'guardian',
      name: 'Guardian',
      passive: 'Adjacent allies take 1 less damage from all sources.',
      flavor: 'Stand between your allies and oblivion.',
      color: '#4488cc',
    },
  ],

  mage: [
    {
      id: 'pyromancer',
      name: 'Pyromancer',
      passive: 'Attacks apply Burn. Burn deals 1 damage per turn.',
      flavor: 'Set the world on fire and watch it spread.',
      color: '#ff7722',
    },
    {
      id: 'frostweaver',
      name: 'Frostweaver',
      passive: 'Attacks can Stasis enemies. +1 attack range.',
      flavor: 'Freeze time itself to control the battlefield.',
      color: '#44bbee',
    },
    {
      id: 'arcanist',
      name: 'Arcanist',
      passive: 'Spells cost HP instead of charges. Doubled spell power.',
      flavor: 'The price of true power is always pain.',
      color: '#bb55ff',
      unlockCondition: 'metEcho',
    },
  ],

  healer: [
    {
      id: 'battle_medic',
      name: 'Battle Medic',
      passive: 'Heals grant the target +1 DEF for 1 turn.',
      flavor: 'Your medicine is as sharp as any blade.',
      color: '#44cc77',
    },
    {
      id: 'arcane_hunter',
      name: 'Arcane Hunter',
      passive: 'Arrows pierce through enemies hitting all in line.',
      flavor: 'One arrow, many problems solved.',
      color: '#9966ee',
    },
  ],

  samurai: [
    {
      id: 'duelist',
      name: 'Duelist',
      passive: 'Attacks ignore 1 DEF. Master of precise strikes.',
      flavor: 'No armor survives a perfect cut.',
      color: '#ddcc22',
    },
    {
      id: 'shadow',
      name: 'Shadow',
      passive: 'First strike: acts before enemies at turn start.',
      flavor: 'Strike before they know you were there.',
      color: '#8855bb',
    },
  ],

  ned: [
    {
      id: 'outlaw',
      name: 'Outlaw',
      passive: 'On kill: regain 1 weapon charge.',
      flavor: 'The more they fall, the louder the guns.',
      color: '#dd7733',
    },
    {
      id: 'iron_tide',
      name: 'Iron Tide',
      passive: 'Iron body: –1 to all incoming damage.',
      flavor: 'The armor of Kelly holds. It always holds.',
      color: '#999999',
    },
  ],
}

/** Get available paths for a hero given current run flags. */
export function getAvailablePaths(heroId: string, metEcho: boolean): HeroPath[] {
  const paths = HERO_PATHS[heroId] ?? []
  return paths.filter((p) => {
    if (p.unlockCondition === 'metEcho') return metEcho
    return true
  })
}
