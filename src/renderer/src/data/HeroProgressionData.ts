import type { RunState } from '../run/RunState'

/** Small stat bumps granted at hero levels 3–9 (one per level). */
export interface MinorTalentDefinition {
  id: string
  name: string
  stat: 'maxHp' | 'attack' | 'defense' | 'moveRange'
  amount: number
}

export const MINOR_TALENT_REGISTRY: Record<string, MinorTalentDefinition> = {
  w_v1: { id: 'w_v1', name: 'Vanguard Vigor', stat: 'maxHp', amount: 1 },
  w_v2: { id: 'w_v2', name: 'Shield Discipline', stat: 'defense', amount: 1 },
  w_v3: { id: 'w_v3', name: 'Frontline Edge', stat: 'attack', amount: 1 },
  w_v4: { id: 'w_v4', name: 'Second Wind', stat: 'maxHp', amount: 1 },
  w_v5: { id: 'w_v5', name: 'Tactical Step', stat: 'moveRange', amount: 1 },
  w_v6: { id: 'w_v6', name: 'Hardened', stat: 'defense', amount: 1 },
  w_v7: { id: 'w_v7', name: 'Killing Focus', stat: 'attack', amount: 1 },
  m_v1: { id: 'm_v1', name: 'Mana Bloom', stat: 'maxHp', amount: 1 },
  m_v2: { id: 'm_v2', name: 'Arcane Precision', stat: 'attack', amount: 1 },
  m_v3: { id: 'm_v3', name: 'Ward Weave', stat: 'defense', amount: 1 },
  m_v4: { id: 'm_v4', name: 'Channeling', stat: 'maxHp', amount: 1 },
  m_v5: { id: 'm_v5', name: 'Far Reach', stat: 'moveRange', amount: 1 },
  m_v6: { id: 'm_v6', name: 'Spell Hardening', stat: 'defense', amount: 1 },
  m_v7: { id: 'm_v7', name: 'Nova Spark', stat: 'attack', amount: 1 },
  h_v1: { id: 'h_v1', name: 'Field Dressing', stat: 'maxHp', amount: 1 },
  h_v2: { id: 'h_v2', name: 'Steady Hands', stat: 'attack', amount: 1 },
  h_v3: { id: 'h_v3', name: 'Cover Sense', stat: 'defense', amount: 1 },
  h_v4: { id: 'h_v4', name: 'Swift Stride', stat: 'moveRange', amount: 1 },
  h_v5: { id: 'h_v5', name: 'Resilience', stat: 'maxHp', amount: 1 },
  h_v6: { id: 'h_v6', name: 'Keen Shot', stat: 'attack', amount: 1 },
  h_v7: { id: 'h_v7', name: 'Guarded Heart', stat: 'defense', amount: 1 },
  s_v1: { id: 's_v1', name: 'Blade Poise', stat: 'attack', amount: 1 },
  s_v2: { id: 's_v2', name: 'Footwork', stat: 'moveRange', amount: 1 },
  s_v3: { id: 's_v3', name: 'Iron Calm', stat: 'defense', amount: 1 },
  s_v4: { id: 's_v4', name: 'Duelist Heart', stat: 'maxHp', amount: 1 },
  s_v5: { id: 's_v5', name: 'Razor Focus', stat: 'attack', amount: 1 },
  s_v6: { id: 's_v6', name: 'Silent Step', stat: 'moveRange', amount: 1 },
  s_v7: { id: 's_v7', name: 'Final Stand', stat: 'defense', amount: 1 },
  n_v1: { id: 'n_v1', name: 'Kelly Grit', stat: 'maxHp', amount: 1 },
  n_v2: { id: 'n_v2', name: 'Bush Telegraph', stat: 'defense', amount: 1 },
  n_v3: { id: 'n_v3', name: 'Dead Eye', stat: 'attack', amount: 1 },
  n_v4: { id: 'n_v4', name: 'Iron Gut', stat: 'maxHp', amount: 1 },
  n_v5: { id: 'n_v5', name: 'Rough Country', stat: 'moveRange', amount: 1 },
  n_v6: { id: 'n_v6', name: 'Crusader Aegis', stat: 'defense', amount: 1 },
  n_v7: { id: 'n_v7', name: 'Last Argyle', stat: 'attack', amount: 1 },
}

/** Talent ids granted at hero levels 3,4,5,6,7,8,9 (index 0 = level 3). */
export const HERO_MINOR_TALENT_SEQUENCE: Record<string, readonly string[]> = {
  warrior: ['w_v1', 'w_v2', 'w_v3', 'w_v4', 'w_v5', 'w_v6', 'w_v7'],
  mage: ['m_v1', 'm_v2', 'm_v3', 'm_v4', 'm_v5', 'm_v6', 'm_v7'],
  healer: ['h_v1', 'h_v2', 'h_v3', 'h_v4', 'h_v5', 'h_v6', 'h_v7'],
  samurai: ['s_v1', 's_v2', 's_v3', 's_v4', 's_v5', 's_v6', 's_v7'],
  ned: ['n_v1', 'n_v2', 'n_v3', 'n_v4', 'n_v5', 'n_v6', 'n_v7'],
}

export function getMinorTalentDef(id: string): MinorTalentDefinition | undefined {
  return MINOR_TALENT_REGISTRY[id]
}

/** Grant minor talents for each level in (fromLevel, toLevel] that falls in 3–9. */
export function grantMinorTalentsForLevelRange(
  state: RunState,
  characterId: string,
  fromLevelExclusive: number,
  toLevelInclusive: number
): void {
  const seq = HERO_MINOR_TALENT_SEQUENCE[characterId]
  if (!seq) return
  if (!state.heroTalents[characterId]) state.heroTalents[characterId] = []
  const owned = state.heroTalents[characterId]

  for (let L = fromLevelExclusive + 1; L <= toLevelInclusive; L++) {
    if (L < 3 || L > 9) continue
    const idx = L - 3
    const tid = seq[idx]
    if (tid && !owned.includes(tid)) owned.push(tid)
  }
}

export function getTalentName(talentId: string): string | undefined {
  return MINOR_TALENT_REGISTRY[talentId]?.name
}

export function getMinorTalentIdForLevel(characterId: string, level: number): string | undefined {
  if (level < 3 || level > 9) return undefined
  return HERO_MINOR_TALENT_SEQUENCE[characterId]?.[level - 3]
}
