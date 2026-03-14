/**
 * EnemyData — Faction-based enemy definitions per the GDD.
 *
 * Each faction has regular and elite units with unique stats, attack types,
 * and special abilities. Spawning logic in Game.ts uses these templates
 * to create UnitData for combat encounters.
 */

import type { AttackKind } from './UnitData'

export type Faction = 'fire_tech' | 'alien_pigs'
export type EnemyTier = 'regular' | 'elite'

export interface OnHitEffect {
  type: 'burn'
  value: number
  duration: number
}

export interface AuraEffect {
  type: 'atk_boost' | 'damage_reduction' | 'charge_boost'
  value: number
  range: number // Manhattan distance for aura
}

export interface SpecialAbility {
  type: 'aura' | 'splash' | 'piercing' | 'explode_on_death' | 'spawn' | 'immobile'
  /** Aura effects for type === 'aura'. */
  aura?: AuraEffect
  /** Splash radius for type === 'splash'. */
  splashRadius?: number
  /** What to spawn for type === 'spawn'. */
  spawnTemplateId?: string
}

export interface EnemyTemplate {
  id: string
  name: string
  faction: Faction
  tier: EnemyTier
  hp: number
  attack: number
  defense: number
  moveRange: number
  attackKind: AttackKind
  attackRange: number
  /** Weapon charges per combat. */
  charges: number
  maxCharges: number
  rechargeRate: number
  exhausting: boolean
  /** Asset ID for visual representation. */
  assetId: string
  /** Status effects applied on hit. */
  onHitEffects?: OnHitEffect[]
  /** Special abilities this unit has. */
  specials?: SpecialAbility[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Fire Tech — Industrial military. Incendiary weapons, heavy armor, slow.
// Reward type: weapon mods
// ─────────────────────────────────────────────────────────────────────────────

export const FIRE_TECH_ENEMIES: EnemyTemplate[] = [
  // ── Regular ──
  {
    id: 'ft_grunt',
    name: 'Grunt',
    faction: 'fire_tech',
    tier: 'regular',
    hp: 10,
    attack: 4,
    defense: 1,
    moveRange: 3,
    attackKind: 'basic',
    attackRange: 1,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    onHitEffects: [{ type: 'burn', value: 1, duration: 2 }],
  },
  {
    id: 'ft_heavy',
    name: 'Heavy',
    faction: 'fire_tech',
    tier: 'regular',
    hp: 16,
    attack: 5,
    defense: 3,
    moveRange: 2,
    attackKind: 'lobbed',
    attackRange: 3,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [{ type: 'splash', splashRadius: 1 }],
  },
  {
    id: 'ft_commander',
    name: 'Commander',
    faction: 'fire_tech',
    tier: 'regular',
    hp: 12,
    attack: 3,
    defense: 1,
    moveRange: 2,
    attackKind: 'basic',
    attackRange: 1,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [{
      type: 'aura',
      aura: { type: 'atk_boost', value: 1, range: 1 },
    }],
  },
  {
    id: 'ft_shielder',
    name: 'Shielder',
    faction: 'fire_tech',
    tier: 'regular',
    hp: 8,
    attack: 2,
    defense: 0,
    moveRange: 3,
    attackKind: 'basic',
    attackRange: 1,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [{
      type: 'aura',
      aura: { type: 'damage_reduction', value: 2, range: 1 },
    }],
  },
  {
    id: 'ft_shield_tower',
    name: 'Shield Tower',
    faction: 'fire_tech',
    tier: 'regular',
    hp: 12,
    attack: 3,
    defense: 3,
    moveRange: 0,
    attackKind: 'projectile',
    attackRange: 3,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [{ type: 'immobile' }],
  },
  {
    id: 'ft_siege_launcher',
    name: 'Siege Launcher',
    faction: 'fire_tech',
    tier: 'regular',
    hp: 10,
    attack: 5,
    defense: 0,
    moveRange: 0,
    attackKind: 'projectile',
    attackRange: 99, // infinite range
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [{ type: 'immobile' }],
  },

  // ── Elites ──
  {
    id: 'ft_incendiary',
    name: 'Incendiary Specialist',
    faction: 'fire_tech',
    tier: 'elite',
    hp: 14,
    attack: 5,
    defense: 2,
    moveRange: 3,
    attackKind: 'cleave',
    attackRange: 1,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    onHitEffects: [{ type: 'burn', value: 2, duration: 2 }],
  },
  {
    id: 'ft_titan',
    name: 'Titan',
    faction: 'fire_tech',
    tier: 'elite',
    hp: 24,
    attack: 6,
    defense: 4,
    moveRange: 1,
    attackKind: 'lobbed',
    attackRange: 4,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [{ type: 'splash', splashRadius: 3 }],
  },
  {
    id: 'ft_war_commander',
    name: 'War Commander',
    faction: 'fire_tech',
    tier: 'elite',
    hp: 16,
    attack: 4,
    defense: 2,
    moveRange: 2,
    attackKind: 'basic',
    attackRange: 1,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [{
      type: 'aura',
      aura: { type: 'charge_boost', value: 1, range: 1 },
    }],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Alien Pigs — Fast swarm fighters. Piercing lasers, low HP, dangerous packs.
// Reward type: armor mods
// ─────────────────────────────────────────────────────────────────────────────

export const ALIEN_PIGS_ENEMIES: EnemyTemplate[] = [
  // ── Regular ──
  {
    id: 'ap_laser_scout',
    name: 'Laser Scout',
    faction: 'alien_pigs',
    tier: 'regular',
    hp: 6,
    attack: 3,
    defense: 0,
    moveRange: 5,
    attackKind: 'projectile', // piercing handled via special
    attackRange: 4,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [{ type: 'piercing' }],
  },
  {
    id: 'ap_laser_brute',
    name: 'Laser Brute',
    faction: 'alien_pigs',
    tier: 'regular',
    hp: 14,
    attack: 5,
    defense: 1,
    moveRange: 2,
    attackKind: 'projectile',
    attackRange: 5,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [{ type: 'piercing' }],
  },
  {
    id: 'ap_squealer',
    name: 'Squealer',
    faction: 'alien_pigs',
    tier: 'regular',
    hp: 8,
    attack: 6,
    defense: 0,
    moveRange: 4,
    attackKind: 'basic',
    attackRange: 1,
    charges: 0,
    maxCharges: 0,
    rechargeRate: 0,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [{ type: 'explode_on_death' }],
  },
  {
    id: 'ap_berserker',
    name: 'Berserker',
    faction: 'alien_pigs',
    tier: 'regular',
    hp: 10,
    attack: 3,
    defense: 0,
    moveRange: 3,
    attackKind: 'basic',
    attackRange: 1,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    // +1 ATK per damage taken is handled in CombatActions
  },
  {
    id: 'ap_spawner',
    name: 'Spawner',
    faction: 'alien_pigs',
    tier: 'regular',
    hp: 18,
    attack: 0,
    defense: 1,
    moveRange: 0,
    attackKind: 'basic',
    attackRange: 0,
    charges: 0,
    maxCharges: 0,
    rechargeRate: 0,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [
      { type: 'immobile' },
      { type: 'spawn', spawnTemplateId: 'ap_laser_scout' },
    ],
  },
  {
    id: 'ap_bruiser',
    name: 'Bruiser',
    faction: 'alien_pigs',
    tier: 'regular',
    hp: 36,
    attack: 7,
    defense: 2,
    moveRange: 1,
    attackKind: 'basic',
    attackRange: 1,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    // Charge and Throw are complex abilities handled in AI
  },

  // ── Elites ──
  {
    id: 'ap_alpha_squealer',
    name: 'Alpha Squealer',
    faction: 'alien_pigs',
    tier: 'elite',
    hp: 14,
    attack: 8,
    defense: 0,
    moveRange: 3,
    attackKind: 'basic',
    attackRange: 1,
    charges: 0,
    maxCharges: 0,
    rechargeRate: 0,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [{ type: 'explode_on_death' }],
  },
  {
    id: 'ap_devastator',
    name: 'Devastator',
    faction: 'alien_pigs',
    tier: 'elite',
    hp: 20,
    attack: 6,
    defense: 2,
    moveRange: 2,
    attackKind: 'projectile',
    attackRange: 6,
    charges: 1,
    maxCharges: 1,
    rechargeRate: 1,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [{ type: 'piercing' }],
    onHitEffects: [{ type: 'burn', value: 1, duration: 2 }],
  },
  {
    id: 'ap_brood_mother',
    name: 'Brood Mother',
    faction: 'alien_pigs',
    tier: 'elite',
    hp: 22,
    attack: 2,
    defense: 2,
    moveRange: 0,
    attackKind: 'basic',
    attackRange: 0,
    charges: 0,
    maxCharges: 0,
    rechargeRate: 0,
    exhausting: true,
    assetId: 'unit.enemy',
    specials: [
      { type: 'immobile' },
      // Spawns 1 Scout + 1 Brute every 2 turns (handled in Game.ts spawner logic)
      { type: 'spawn', spawnTemplateId: 'ap_laser_scout' },
      { type: 'spawn', spawnTemplateId: 'ap_laser_brute' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Boss — The Threat (Phase 1: single origin)
// ─────────────────────────────────────────────────────────────────────────────

export interface BossPhase {
  hp: number
  attack: number
  defense: number
  moveRange: number
  attackKind: AttackKind
  attackRange: number
  /** Additional enemies spawned when entering this phase. */
  addTemplateIds: string[]
}

export interface BossTemplate {
  id: string
  name: string
  flavor: string
  assetId: string
  phases: BossPhase[]
}

export const BOSS_TEMPLATES: BossTemplate[] = [
  {
    id: 'boss_entity',
    name: 'The Anomaly',
    flavor: 'A dimensional entity from a failed experiment. Reality warps in its presence.',
    assetId: 'unit.enemy',
    phases: [
      {
        hp: 40,
        attack: 6,
        defense: 3,
        moveRange: 2,
        attackKind: 'lobbed',
        attackRange: 4,
        addTemplateIds: [],
      },
      {
        // Phase 2: faster, gains adds
        hp: 30,
        attack: 8,
        defense: 2,
        moveRange: 3,
        attackKind: 'cleave',
        attackRange: 1,
        addTemplateIds: ['ft_grunt', 'ft_grunt'],
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ALL_ENEMIES = [...FIRE_TECH_ENEMIES, ...ALIEN_PIGS_ENEMIES]
const ENEMY_MAP = new Map<string, EnemyTemplate>(ALL_ENEMIES.map((e) => [e.id, e]))

export function getEnemyTemplate(id: string): EnemyTemplate | undefined {
  return ENEMY_MAP.get(id)
}

export function getEnemiesByFaction(faction: Faction, tier?: EnemyTier): EnemyTemplate[] {
  return ALL_ENEMIES.filter((e) =>
    e.faction === faction && (tier === undefined || e.tier === tier)
  )
}

export function getRegularEnemies(faction: Faction): EnemyTemplate[] {
  return getEnemiesByFaction(faction, 'regular')
}

export function getEliteEnemies(faction: Faction): EnemyTemplate[] {
  return getEnemiesByFaction(faction, 'elite')
}

/** Pick a random faction for a combat node. */
export function randomFaction(rng: () => number): Faction {
  return rng() < 0.5 ? 'fire_tech' : 'alien_pigs'
}

/** Get the boss template for Phase 1. */
export function getBossTemplate(): BossTemplate {
  return BOSS_TEMPLATES[0]
}
