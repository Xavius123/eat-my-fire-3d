import type { RunState } from '../run/RunState'

// ── Talent kinds ──────────────────────────────────────────────────────────────

export type TalentKind = 'stat' | 'ability' | 'passive'

/**
 * A single talent granted at a hero level (3–9).
 * - 'stat'    → flat stat bump applied at combat spawn
 * - 'ability' → new active skill added to hero's attack list
 * - 'passive' → passive effect flag checked during combat resolution
 */
export interface MinorTalentDefinition {
  id: string
  name: string
  kind: TalentKind
  /** For kind='stat' */
  stat?: 'maxHp' | 'attack' | 'defense' | 'moveRange'
  amount?: number
  /** For kind='ability' | 'passive' — the id in PATH_ABILITY_CATALOG or PASSIVE_CATALOG */
  grantId?: string
  /** Short description shown in skill tree UI */
  description: string
}

// ── Stat talent registry ───────────────────────────────────────────────────────

const STAT_TALENTS: Record<string, MinorTalentDefinition> = {
  // Warrior
  w_atk: { id: 'w_atk', kind: 'stat', name: 'Frontline Edge', stat: 'attack', amount: 1, description: '+1 ATK' },
  w_def: { id: 'w_def', kind: 'stat', name: 'Shield Discipline', stat: 'defense', amount: 1, description: '+1 DEF' },
  w_hp:  { id: 'w_hp',  kind: 'stat', name: 'Vanguard Vigor', stat: 'maxHp', amount: 1, description: '+1 Max HP' },
  // Mage
  m_atk: { id: 'm_atk', kind: 'stat', name: 'Arcane Precision', stat: 'attack', amount: 1, description: '+1 ATK' },
  m_hp:  { id: 'm_hp',  kind: 'stat', name: 'Mana Bloom', stat: 'maxHp', amount: 1, description: '+1 Max HP' },
  m_rng: { id: 'm_rng', kind: 'stat', name: 'Far Reach', stat: 'moveRange', amount: 1, description: '+1 Range' },
  // Healer
  h_atk: { id: 'h_atk', kind: 'stat', name: 'Steady Hands', stat: 'attack', amount: 1, description: '+1 ATK' },
  h_def: { id: 'h_def', kind: 'stat', name: 'Cover Sense', stat: 'defense', amount: 1, description: '+1 DEF' },
  h_hp:  { id: 'h_hp',  kind: 'stat', name: 'Resilience', stat: 'maxHp', amount: 1, description: '+1 Max HP' },
  h_mov: { id: 'h_mov', kind: 'stat', name: 'Swift Stride', stat: 'moveRange', amount: 1, description: '+1 MOV' },
  // Samurai
  s_atk: { id: 's_atk', kind: 'stat', name: 'Blade Poise', stat: 'attack', amount: 1, description: '+1 ATK' },
  s_def: { id: 's_def', kind: 'stat', name: 'Iron Calm', stat: 'defense', amount: 1, description: '+1 DEF' },
  s_hp:  { id: 's_hp',  kind: 'stat', name: 'Duelist Heart', stat: 'maxHp', amount: 1, description: '+1 Max HP' },
  s_mov: { id: 's_mov', kind: 'stat', name: 'Footwork', stat: 'moveRange', amount: 1, description: '+1 MOV' },
  // Ned
  n_atk: { id: 'n_atk', kind: 'stat', name: 'Dead Eye', stat: 'attack', amount: 1, description: '+1 ATK' },
  n_def: { id: 'n_def', kind: 'stat', name: 'Bush Telegraph', stat: 'defense', amount: 1, description: '+1 DEF' },
  n_hp:  { id: 'n_hp',  kind: 'stat', name: 'Kelly Grit', stat: 'maxHp', amount: 1, description: '+1 Max HP' },
}

// ── Ability & passive talents ─────────────────────────────────────────────────

const UNLOCK_TALENTS: Record<string, MinorTalentDefinition> = {
  // ── Warrior: Berserker ──
  w_ber_skill1: {
    id: 'w_ber_skill1', kind: 'ability', name: 'Battle Rage',
    grantId: 'battle_rage',
    description: 'New skill: spend 2 charges to strike the same target twice',
  },
  w_ber_passive: {
    id: 'w_ber_passive', kind: 'passive', name: 'Bloodlust',
    grantId: 'passive_bloodlust',
    description: 'Passive: on kill, restore 2 HP to Kael',
  },
  w_ber_skill2: {
    id: 'w_ber_skill2', kind: 'ability', name: 'Berserk Surge',
    grantId: 'berserk_surge',
    description: 'New skill: charge through a line of enemies, hitting each',
  },
  w_ber_cap: {
    id: 'w_ber_cap', kind: 'passive', name: 'War Frenzy',
    grantId: 'passive_war_frenzy',
    description: 'Passive upgrade: kill-streak cap raised to 5; each kill also +1 Max HP',
  },

  // ── Warrior: Guardian ──
  w_gua_skill1: {
    id: 'w_gua_skill1', kind: 'ability', name: 'Shield Wall',
    grantId: 'shield_wall',
    description: 'New skill: grant +2 DEF to one ally until Kael\'s next turn',
  },
  w_gua_passive: {
    id: 'w_gua_passive', kind: 'passive', name: 'Iron Aura',
    grantId: 'passive_iron_aura',
    description: 'Passive: damage reduction aura extends to 2 tiles',
  },
  w_gua_skill2: {
    id: 'w_gua_skill2', kind: 'ability', name: 'Taunt Strike',
    grantId: 'taunt_strike',
    description: 'New skill: hit target, force all enemies to target Kael for 1 turn',
  },
  w_gua_cap: {
    id: 'w_gua_cap', kind: 'passive', name: 'Last Line',
    grantId: 'passive_last_line',
    description: 'Passive upgrade: below 4 HP, all allies gain +2 ATK for 2 turns',
  },

  // ── Mage: Pyromancer ──
  m_pyr_skill1: {
    id: 'm_pyr_skill1', kind: 'ability', name: 'Inferno Bolt',
    grantId: 'inferno_bolt',
    description: 'New skill: lobbed range 3, 5 damage + Burn 3',
  },
  m_pyr_passive: {
    id: 'm_pyr_passive', kind: 'passive', name: 'Fan the Flames',
    grantId: 'passive_fan_flames',
    description: 'Passive: burning enemies take +1 damage from all sources',
  },
  m_pyr_skill2: {
    id: 'm_pyr_skill2', kind: 'ability', name: 'Pyroclasm',
    grantId: 'pyroclasm',
    description: 'New skill: AoE lobbed, hits radius-1 area, applies Burn to all',
  },
  m_pyr_cap: {
    id: 'm_pyr_cap', kind: 'passive', name: 'Phoenix Spark',
    grantId: 'passive_phoenix_spark',
    description: 'Passive upgrade: killing a burning enemy regains 1 charge',
  },

  // ── Mage: Frostweaver ──
  m_fro_skill1: {
    id: 'm_fro_skill1', kind: 'ability', name: 'Glacial Spike',
    grantId: 'glacial_spike',
    description: 'New skill: lobbed range 5, guaranteed Stasis for 2 turns',
  },
  m_fro_passive: {
    id: 'm_fro_passive', kind: 'passive', name: 'Shatter',
    grantId: 'passive_shatter',
    description: 'Passive: hitting a Stasis enemy deals +3 bonus damage',
  },
  m_fro_skill2: {
    id: 'm_fro_skill2', kind: 'ability', name: 'Blizzard',
    grantId: 'blizzard',
    description: 'New skill: fire bolts at all visible enemies (1 charge each)',
  },
  m_fro_cap: {
    id: 'm_fro_cap', kind: 'passive', name: 'Frozen Death',
    grantId: 'passive_frozen_death',
    description: 'Passive upgrade: Stasis enemies that die spread Stasis to adjacent enemies',
  },

  // ── Healer: Battle Medic ──
  h_med_skill1: {
    id: 'h_med_skill1', kind: 'ability', name: 'Emergency Stim',
    grantId: 'emergency_stim',
    description: 'New skill: heal 8 HP + grant +2 ATK for 1 turn (2 charges)',
  },
  h_med_passive: {
    id: 'h_med_passive', kind: 'passive', name: 'Resilient Care',
    grantId: 'passive_resilient_care',
    description: 'Passive: heals on targets below 50% HP are doubled',
  },
  h_med_skill2: {
    id: 'h_med_skill2', kind: 'ability', name: 'Mass Triage',
    grantId: 'mass_triage',
    description: 'New skill: heal all allies 6 HP + +1 DEF each (3 charges)',
  },
  h_med_cap: {
    id: 'h_med_cap', kind: 'passive', name: 'Field Renewal',
    grantId: 'passive_field_renewal',
    description: 'Passive upgrade: Ryn recovers 1 HP every time she heals an ally',
  },

  // ── Healer: Arcane Hunter ──
  h_hun_skill1: {
    id: 'h_hun_skill1', kind: 'ability', name: 'Twin Shot',
    grantId: 'twin_shot',
    description: 'New skill: fire 2 arrows at same target, each at -1 ATK (1 charge)',
  },
  h_hun_passive: {
    id: 'h_hun_passive', kind: 'passive', name: "Hunter's Eye",
    grantId: 'passive_hunters_eye',
    description: 'Passive: first arrow each turn marks target: +1 dmg from all for 2 turns',
  },
  h_hun_skill2: {
    id: 'h_hun_skill2', kind: 'ability', name: 'Volley',
    grantId: 'volley',
    description: 'New skill: fire at up to 3 different enemies, 1 charge each',
  },
  h_hun_cap: {
    id: 'h_hun_cap', kind: 'passive', name: 'Precision Mark',
    grantId: 'passive_precision_mark',
    description: 'Passive upgrade: marked targets take +2 dmg; mark applies to all pierced',
  },

  // ── Samurai: Duelist ──
  s_due_skill1: {
    id: 's_due_skill1', kind: 'ability', name: 'Precision Strike',
    grantId: 'precision_strike',
    description: 'New skill: +4 damage, ignores all DEF (1 charge, exhausting)',
  },
  s_due_passive: {
    id: 's_due_passive', kind: 'passive', name: 'Sword Saint',
    grantId: 'passive_sword_saint',
    description: 'Passive: stationary bonus doubles to +2 ATK when not moved',
  },
  s_due_skill2: {
    id: 's_due_skill2', kind: 'ability', name: 'Blade Dance',
    grantId: 'blade_dance',
    description: 'New skill: cleave all adjacent enemies, ignore 2 DEF on each hit',
  },
  s_due_cap: {
    id: 's_due_cap', kind: 'passive', name: 'Master Cut',
    grantId: 'passive_master_cut',
    description: 'Passive upgrade: attacks ignore 2 DEF total; every 3rd hit crits +2',
  },

  // ── Samurai: Shadow ──
  s_sha_skill1: {
    id: 's_sha_skill1', kind: 'ability', name: 'Shadow Step',
    grantId: 'shadow_step',
    description: 'New skill: teleport to any empty tile within 3 (free action)',
  },
  s_sha_passive: {
    id: 's_sha_passive', kind: 'passive', name: 'First Blood',
    grantId: 'passive_first_blood',
    description: 'Passive: first attack each combat deals +3 damage',
  },
  s_sha_skill2: {
    id: 's_sha_skill2', kind: 'ability', name: 'Vanishing Cut',
    grantId: 'vanishing_cut',
    description: 'New skill: attack then step back 1 tile (non-exhausting)',
  },
  s_sha_cap: {
    id: 's_sha_cap', kind: 'passive', name: 'Death\'s Step',
    grantId: 'passive_deaths_step',
    description: 'Passive upgrade: on kill, reset all movement + gain 1 free charge',
  },

  // ── Ned: Outlaw ──
  n_out_skill1: {
    id: 'n_out_skill1', kind: 'ability', name: 'Fan the Hammer',
    grantId: 'fan_the_hammer',
    description: 'New skill: 3 rapid shots at same target (2 charges, each -1 ATK)',
  },
  n_out_passive: {
    id: 'n_out_passive', kind: 'passive', name: 'Dead Eye',
    grantId: 'passive_dead_eye',
    description: 'Passive: when not moved, projectile attacks deal +2 bonus damage',
  },
  n_out_skill2: {
    id: 'n_out_skill2', kind: 'ability', name: 'Suppressing Fire',
    grantId: 'suppressing_fire',
    description: 'New skill: hit all enemies in a line, reduced damage per tile',
  },
  n_out_cap: {
    id: 'n_out_cap', kind: 'passive', name: 'Gunslinger\'s Rush',
    grantId: 'passive_gunslingers_rush',
    description: 'Passive upgrade: on kill also grants +1 ATK this combat (stacks, max 3)',
  },

  // ── Ned: Iron Tide ──
  n_iro_skill1: {
    id: 'n_iro_skill1', kind: 'ability', name: 'Cover Position',
    grantId: 'cover_position',
    description: 'New skill: give ally +3 DEF for 1 turn, Ned absorbs their incoming damage',
  },
  n_iro_passive: {
    id: 'n_iro_passive', kind: 'passive', name: 'Armor of Kelly',
    grantId: 'passive_armor_kelly',
    description: 'Passive: incoming damage -2 (upgrade from -1), immune to Burn damage',
  },
  n_iro_skill2: {
    id: 'n_iro_skill2', kind: 'ability', name: 'Iron Charge',
    grantId: 'iron_charge',
    description: 'New skill: move 3 tiles in a line, deal damage to every enemy in path',
  },
  n_iro_cap: {
    id: 'n_iro_cap', kind: 'passive', name: 'Indestructible',
    grantId: 'passive_indestructible',
    description: 'Passive upgrade: below 6 HP, gain Reactive Shield + +2 DEF for rest of combat',
  },
}

// ── Combined registry ─────────────────────────────────────────────────────────

export const MINOR_TALENT_REGISTRY: Record<string, MinorTalentDefinition> = {
  ...STAT_TALENTS,
  ...UNLOCK_TALENTS,
}

// ── Path-split talent sequences (levels 3–9) ──────────────────────────────────
// Index 0 = level 3, index 6 = level 9

export const HERO_PATH_TALENT_SEQUENCES: Record<string, Record<string, readonly string[]>> = {
  warrior: {
    berserker: ['w_atk', 'w_ber_skill1', 'w_ber_passive', 'w_atk', 'w_ber_skill2', 'w_hp', 'w_ber_cap'],
    guardian:  ['w_def', 'w_gua_skill1', 'w_gua_passive', 'w_hp',  'w_gua_skill2', 'w_def', 'w_gua_cap'],
  },
  mage: {
    pyromancer:  ['m_hp',  'm_pyr_skill1', 'm_pyr_passive', 'm_atk', 'm_pyr_skill2', 'm_hp',  'm_pyr_cap'],
    frostweaver: ['m_rng', 'm_fro_skill1', 'm_fro_passive', 'm_atk', 'm_fro_skill2', 'm_hp',  'm_fro_cap'],
    arcanist:    ['m_atk', 'm_hp', 'm_atk', 'm_hp', 'm_atk', 'm_hp', 'm_atk'],
  },
  healer: {
    battle_medic:   ['h_def', 'h_med_skill1', 'h_med_passive', 'h_hp',  'h_med_skill2', 'h_atk', 'h_med_cap'],
    arcane_hunter:  ['h_atk', 'h_hun_skill1', 'h_hun_passive', 'h_mov', 'h_hun_skill2', 'h_atk', 'h_hun_cap'],
  },
  samurai: {
    duelist: ['s_atk', 's_due_skill1', 's_due_passive', 's_atk', 's_due_skill2', 's_hp',  's_due_cap'],
    shadow:  ['s_mov', 's_sha_skill1', 's_sha_passive', 's_def', 's_sha_skill2', 's_mov', 's_sha_cap'],
  },
  ned: {
    outlaw:    ['n_atk', 'n_out_skill1', 'n_out_passive', 'n_hp',  'n_out_skill2', 'n_atk', 'n_out_cap'],
    iron_tide: ['n_def', 'n_iro_skill1', 'n_iro_passive', 'n_hp',  'n_iro_skill2', 'n_def', 'n_iro_cap'],
  },
}

/** Fallback generic sequences for heroes with no path chosen yet (shouldn't reach L3 without a path). */
const GENERIC_SEQUENCES: Record<string, readonly string[]> = {
  warrior: ['w_atk', 'w_def', 'w_atk', 'w_hp', 'w_atk', 'w_def', 'w_atk'],
  mage:    ['m_atk', 'm_hp',  'm_atk', 'm_hp', 'm_atk', 'm_hp',  'm_atk'],
  healer:  ['h_atk', 'h_def', 'h_hp',  'h_mov', 'h_atk', 'h_hp', 'h_atk'],
  samurai: ['s_atk', 's_mov', 's_def', 's_atk', 's_hp',  's_atk', 's_def'],
  ned:     ['n_atk', 'n_def', 'n_hp',  'n_atk', 'n_def', 'n_hp',  'n_atk'],
}

// ── Public helpers ────────────────────────────────────────────────────────────

export function getMinorTalentDef(id: string): MinorTalentDefinition | undefined {
  return MINOR_TALENT_REGISTRY[id]
}

export function getTalentName(talentId: string): string | undefined {
  return MINOR_TALENT_REGISTRY[talentId]?.name
}

/** Get the talent id for a specific hero, path, and level (3–9). */
export function getMinorTalentIdForLevel(
  characterId: string,
  level: number,
  pathId?: string
): string | undefined {
  if (level < 3 || level > 9) return undefined
  const idx = level - 3
  if (pathId) {
    return HERO_PATH_TALENT_SEQUENCES[characterId]?.[pathId]?.[idx]
  }
  return GENERIC_SEQUENCES[characterId]?.[idx]
}

/**
 * Grant minor talents for each level in (fromLevel, toLevel] that falls in 3–9.
 * Path-aware: uses heroPath from RunState to select the correct sequence.
 * Pushes stat talent IDs into heroTalents, ability/passive IDs into heroUnlockedAbilities.
 */
export function grantMinorTalentsForLevelRange(
  state: RunState,
  characterId: string,
  fromLevelExclusive: number,
  toLevelInclusive: number
): void {
  const pathId = state.heroPath[characterId]
  const seq = (pathId && HERO_PATH_TALENT_SEQUENCES[characterId]?.[pathId])
    ?? GENERIC_SEQUENCES[characterId]
  if (!seq) return

  if (!state.heroTalents[characterId]) state.heroTalents[characterId] = []
  if (!state.heroUnlockedAbilities[characterId]) state.heroUnlockedAbilities[characterId] = []

  const statOwned = state.heroTalents[characterId]
  const abilityOwned = state.heroUnlockedAbilities[characterId]

  for (let L = fromLevelExclusive + 1; L <= toLevelInclusive; L++) {
    if (L < 3 || L > 9) continue
    const idx = L - 3
    const tid = seq[idx]
    if (!tid) continue

    const def = MINOR_TALENT_REGISTRY[tid]
    if (!def) continue

    if (def.kind === 'stat') {
      if (!statOwned.includes(tid)) statOwned.push(tid)
    } else {
      // ability or passive — store the grantId so combat can look it up
      const grantId = def.grantId ?? tid
      if (!abilityOwned.includes(grantId)) abilityOwned.push(grantId)
    }
  }
}
