/**
 * EnemyData — All enemies from Eat My Fire ported to 3D engine.
 *
 * Two themes: 'fantasy' (goblins, skeletons, orcs, worms) and 'tech' (robots/drones).
 * Each enemy carries a PlaceholderConfig describing how to render it with
 * Three.js primitives until real 3D models are commissioned.
 */

import type { AttackKind } from './UnitData'

// ── Theme / Faction ────────────────────────────────────────────────────────────
export type LevelTheme = 'fantasy' | 'tech'
/** Backward-compat alias so existing combat/reward code still compiles. */
export type Faction = LevelTheme
export type EnemyTier = 'regular' | 'elite'

// ── Placeholder visual config ─────────────────────────────────────────────────
export type PlaceholderShape = 'capsule' | 'box' | 'sphere' | 'octahedron' | 'cylinder'

export interface PlaceholderConfig {
  /** THREE hex color for the body material. */
  color: number
  shape: PlaceholderShape
  /** Scale multiplier applied to the base capsule geometry. */
  scale: number
  /** Optional emissive glow color (for elites and bosses). */
  emissive?: number
  emissiveIntensity?: number
}

// ── Special abilities ─────────────────────────────────────────────────────────
export interface OnHitEffect {
  type: 'burn'
  value: number
  duration: number
}

export interface AuraEffect {
  type: 'atk_boost' | 'damage_reduction' | 'charge_boost'
  value: number
  range: number
}

export interface SpecialAbility {
  type: 'aura' | 'splash' | 'piercing' | 'explode_on_death' | 'spawn' | 'immobile'
  aura?: AuraEffect
  splashRadius?: number
  spawnTemplateId?: string
}

// ── Enemy template ────────────────────────────────────────────────────────────
export interface EnemyTemplate {
  id: string
  name: string
  /** Theme doubles as faction for wave-pool filtering. */
  faction: Faction
  theme: LevelTheme
  tier: EnemyTier
  hp: number
  attack: number
  defense: number
  moveRange: number
  attackKind: AttackKind
  attackRange: number
  charges: number
  maxCharges: number
  rechargeRate: number
  exhausting: boolean
  /** 3D asset ID — falls back to PlaceholderMeshFactory when not found. */
  assetId: string
  /** Placeholder visual until a real 3D model is commissioned. */
  placeholder: PlaceholderConfig
  specials?: SpecialAbility[]
  onHitEffects?: OnHitEffect[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Fantasy standard enemies
// ─────────────────────────────────────────────────────────────────────────────

export const FANTASY_ENEMIES: EnemyTemplate[] = [
  {
    id: 'grunt',
    name: 'Grunt',
    faction: 'fantasy', theme: 'fantasy', tier: 'regular',
    hp: 10, attack: 3, defense: 0, moveRange: 3,
    attackKind: 'basic', attackRange: 1,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.enemy',
    placeholder: { color: 0x4aaa44, shape: 'capsule', scale: 1.0 },
  },
  {
    id: 'raider',
    name: 'Raider',
    faction: 'fantasy', theme: 'fantasy', tier: 'regular',
    hp: 8, attack: 3, defense: 0, moveRange: 4,
    attackKind: 'basic', attackRange: 1,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.enemy',
    placeholder: { color: 0x88dd33, shape: 'capsule', scale: 0.85 },
  },
  {
    id: 'brute',
    name: 'Brute',
    faction: 'fantasy', theme: 'fantasy', tier: 'regular',
    hp: 18, attack: 4, defense: 1, moveRange: 2,
    attackKind: 'basic', attackRange: 1,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.enemy',
    placeholder: { color: 0x8855bb, shape: 'box', scale: 1.35 },
  },
  {
    id: 'bone_archer',
    name: 'Bone Archer',
    faction: 'fantasy', theme: 'fantasy', tier: 'regular',
    hp: 12, attack: 3, defense: 0, moveRange: 2,
    attackKind: 'projectile', attackRange: 4,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.enemy',
    placeholder: { color: 0xccccaa, shape: 'capsule', scale: 1.0 },
  },
  {
    id: 'scout',
    name: 'Scout',
    faction: 'fantasy', theme: 'fantasy', tier: 'regular',
    hp: 6, attack: 2, defense: 0, moveRange: 4,
    attackKind: 'projectile', attackRange: 4,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.enemy',
    placeholder: { color: 0x22ff88, shape: 'capsule', scale: 0.7 },
  },
  {
    id: 'shaman',
    name: 'Shaman',
    faction: 'fantasy', theme: 'fantasy', tier: 'regular',
    hp: 12, attack: 2, defense: 0, moveRange: 2,
    attackKind: 'lobbed', attackRange: 3,
    charges: 1, maxCharges: 2, rechargeRate: 1, exhausting: false,
    assetId: 'unit.enemy',
    placeholder: { color: 0xff8800, shape: 'sphere', scale: 1.0 },
  },
  {
    id: 'orc_warrior',
    name: 'Orc Warrior',
    faction: 'fantasy', theme: 'fantasy', tier: 'regular',
    hp: 14, attack: 4, defense: 1, moveRange: 3,
    attackKind: 'basic', attackRange: 1,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.enemy',
    placeholder: { color: 0x336611, shape: 'box', scale: 1.3 },
  },
  {
    id: 'fire_worm',
    name: 'Fire Worm',
    faction: 'fantasy', theme: 'fantasy', tier: 'regular',
    hp: 14, attack: 4, defense: 0, moveRange: 2,
    attackKind: 'lobbed', attackRange: 3,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.enemy',
    placeholder: { color: 0xff3300, shape: 'cylinder', scale: 1.1 },
    onHitEffects: [{ type: 'burn', value: 1, duration: 2 }],
  },
  {
    id: 'blob',
    name: 'Blob',
    faction: 'fantasy', theme: 'fantasy', tier: 'regular',
    hp: 16, attack: 2, defense: 1, moveRange: 1,
    attackKind: 'basic', attackRange: 1,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.enemy',
    placeholder: { color: 0x99dd00, shape: 'sphere', scale: 1.15 },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Tech standard enemies — robots, drones, turrets
// ─────────────────────────────────────────────────────────────────────────────

export const TECH_ENEMIES: EnemyTemplate[] = [
  {
    id: 'tech_drone',
    name: 'Tech Drone',
    faction: 'tech', theme: 'tech', tier: 'regular',
    hp: 8, attack: 2, defense: 0, moveRange: 4,
    attackKind: 'basic', attackRange: 1,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.enemy',
    placeholder: { color: 0x0099ff, shape: 'octahedron', scale: 0.8 },
  },
  {
    id: 'tech_sentinel',
    name: 'Tech Sentinel',
    faction: 'tech', theme: 'tech', tier: 'regular',
    hp: 14, attack: 3, defense: 1, moveRange: 2,
    attackKind: 'projectile', attackRange: 4,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.enemy',
    placeholder: { color: 0x4477cc, shape: 'box', scale: 1.1 },
  },
  {
    id: 'tech_crawler',
    name: 'Tech Crawler',
    faction: 'tech', theme: 'tech', tier: 'regular',
    hp: 12, attack: 4, defense: 0, moveRange: 3,
    attackKind: 'basic', attackRange: 1,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.enemy',
    placeholder: { color: 0x00ccff, shape: 'capsule', scale: 1.0 },
  },
  {
    id: 'tech_stalker',
    name: 'Tech Stalker',
    faction: 'tech', theme: 'tech', tier: 'regular',
    hp: 6, attack: 3, defense: 0, moveRange: 5,
    attackKind: 'basic', attackRange: 1,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.enemy',
    placeholder: { color: 0x0033aa, shape: 'capsule', scale: 0.9 },
  },
  {
    id: 'tech_turret',
    name: 'Tech Turret',
    faction: 'tech', theme: 'tech', tier: 'regular',
    hp: 20, attack: 3, defense: 2, moveRange: 0,
    attackKind: 'lobbed', attackRange: 5,
    charges: 1, maxCharges: 2, rechargeRate: 1, exhausting: false,
    assetId: 'unit.enemy',
    placeholder: { color: 0x5577ff, shape: 'cylinder', scale: 1.2 },
    specials: [{ type: 'immobile' }],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Elite enemies — one per theme
// ─────────────────────────────────────────────────────────────────────────────

export const ELITE_ENEMIES: EnemyTemplate[] = [
  {
    id: 'elite_champion',
    name: 'Champion',
    faction: 'fantasy', theme: 'fantasy', tier: 'elite',
    hp: 24, attack: 5, defense: 2, moveRange: 3,
    attackKind: 'cleave', attackRange: 1,
    charges: 2, maxCharges: 2, rechargeRate: 1, exhausting: false,
    assetId: 'unit.enemy',
    placeholder: { color: 0xffaa00, shape: 'capsule', scale: 1.6, emissive: 0xff8800, emissiveIntensity: 0.5 },
  },
  {
    id: 'elite_tech_commander',
    name: 'Tech Commander',
    faction: 'tech', theme: 'tech', tier: 'elite',
    hp: 22, attack: 4, defense: 2, moveRange: 3,
    attackKind: 'projectile', attackRange: 5,
    charges: 2, maxCharges: 2, rechargeRate: 1, exhausting: false,
    assetId: 'unit.enemy',
    placeholder: { color: 0x00ffee, shape: 'box', scale: 1.5, emissive: 0x00aaff, emissiveIntensity: 0.5 },
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Boss templates — one per boss, single-phase
// ─────────────────────────────────────────────────────────────────────────────

export interface BossPhase {
  hp: number
  attack: number
  defense: number
  moveRange: number
  attackKind: AttackKind
  attackRange: number
  addTemplateIds: string[]
}

export interface BossTemplate {
  id: string
  name: string
  flavor: string
  theme: LevelTheme
  assetId: string
  placeholder: PlaceholderConfig
  phases: BossPhase[]
}

export const BOSS_TEMPLATES: BossTemplate[] = [
  {
    id: 'boss_warlord',
    name: 'Warlord',
    flavor: 'Ancient war-king who refuses to die. Charges with impossible speed for his size.',
    theme: 'fantasy',
    assetId: 'unit.enemy',
    placeholder: { color: 0xcc2200, shape: 'capsule', scale: 2.2, emissive: 0xff4400, emissiveIntensity: 0.7 },
    phases: [{
      hp: 40, attack: 6, defense: 3, moveRange: 2,
      attackKind: 'cleave', attackRange: 2,
      addTemplateIds: [],
    }],
  },
  {
    id: 'boss_goblin_king',
    name: 'Goblin King',
    flavor: 'Crowned with the bones of fallen heroes. His mob fights harder in his presence.',
    theme: 'fantasy',
    assetId: 'unit.enemy',
    placeholder: { color: 0x22aa00, shape: 'capsule', scale: 2.0, emissive: 0x44ff00, emissiveIntensity: 0.5 },
    phases: [{
      hp: 35, attack: 5, defense: 2, moveRange: 3,
      attackKind: 'cleave', attackRange: 1,
      addTemplateIds: ['grunt'],
    }],
  },
  {
    id: 'boss_skeleton_king',
    name: 'Skeleton King',
    flavor: 'The undead tyrant. Commands through fear. His death scepter reaches across the entire field.',
    theme: 'fantasy',
    assetId: 'unit.enemy',
    placeholder: { color: 0xeeeedd, shape: 'capsule', scale: 2.4, emissive: 0xffffff, emissiveIntensity: 0.6 },
    phases: [{
      hp: 45, attack: 7, defense: 4, moveRange: 2,
      attackKind: 'lobbed', attackRange: 3,
      addTemplateIds: ['bone_archer'],
    }],
  },
  {
    id: 'boss_slime_king',
    name: 'Slime King',
    flavor: 'A mountain of corrosive slime. Slow but absorbs attacks. Every hit just makes it angrier.',
    theme: 'fantasy',
    assetId: 'unit.enemy',
    placeholder: { color: 0x88ff00, shape: 'sphere', scale: 2.0, emissive: 0xaaff00, emissiveIntensity: 0.6 },
    phases: [{
      hp: 50, attack: 5, defense: 2, moveRange: 1,
      attackKind: 'cleave', attackRange: 2,
      addTemplateIds: ['blob'],
    }],
  },
  {
    id: 'boss_tech_overlord',
    name: 'Tech Overlord',
    flavor: 'The machine that started the war. A walking weapons platform with no mercy protocol.',
    theme: 'tech',
    assetId: 'unit.enemy',
    placeholder: { color: 0x0044ff, shape: 'box', scale: 2.3, emissive: 0x00aaff, emissiveIntensity: 0.8 },
    phases: [{
      hp: 45, attack: 6, defense: 3, moveRange: 2,
      attackKind: 'cleave', attackRange: 2,
      addTemplateIds: ['tech_drone', 'tech_drone'],
    }],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ALL_STANDARD = [...FANTASY_ENEMIES, ...TECH_ENEMIES, ...ELITE_ENEMIES]
const ENEMY_MAP = new Map<string, EnemyTemplate>(ALL_STANDARD.map((e) => [e.id, e]))

export function getEnemyTemplate(id: string): EnemyTemplate | undefined {
  return ENEMY_MAP.get(id)
}

export function getEnemiesByFaction(faction: Faction, tier?: EnemyTier): EnemyTemplate[] {
  return ALL_STANDARD.filter(
    (e) => e.theme === faction && (tier === undefined || e.tier === tier)
  )
}

export function getRegularEnemies(faction: Faction): EnemyTemplate[] {
  return getEnemiesByFaction(faction, 'regular')
}

export function getEliteEnemies(faction: Faction): EnemyTemplate[] {
  return getEnemiesByFaction(faction, 'elite')
}

/** Pick a random theme for a combat node. */
export function randomFaction(rng: () => number): Faction {
  return rng() < 0.5 ? 'fantasy' : 'tech'
}

/**
 * Return the boss template for the given theme.
 * Falls back to a random boss if no theme match.
 */
export function getBossTemplate(theme: LevelTheme = 'fantasy', rng: () => number = Math.random): BossTemplate {
  const pool = BOSS_TEMPLATES.filter((b) => b.theme === theme)
  const candidates = pool.length > 0 ? pool : BOSS_TEMPLATES
  return candidates[Math.floor(rng() * candidates.length)]!
}

/** Scale enemy stats per depth layer (8% increase per layer). */
export function scaleEnemyForDepth(template: EnemyTemplate, depth: number): EnemyTemplate {
  const scale = 1 + depth * 0.08
  return {
    ...template,
    hp:      Math.round(template.hp * scale),
    attack:  Math.round(template.attack * scale),
    defense: Math.round(template.defense * scale),
  }
}

/**
 * Build a wave of enemies for a given combat node.
 * Mirrors eat-my-fire's getEnemyWave logic.
 */
export function getEnemyWave(
  depth: number,
  isElite: boolean,
  isBoss: boolean,
  rng: () => number = Math.random,
  theme: LevelTheme = 'fantasy',
): Array<EnemyTemplate | BossTemplate> {
  if (isBoss) {
    const boss = getBossTemplate(theme, rng)
    const minionCount = depth >= 4 ? 2 : 1
    const minionPool = getRegularEnemies(theme)
    const minions = sampleWave(minionPool, minionCount, rng)
    return [boss, ...minions]
  }
  if (isElite) {
    const elites = getEliteEnemies(theme)
    const elite = elites[Math.floor(rng() * elites.length)] ?? ELITE_ENEMIES[0]!
    const escortCount = depth >= 4 ? 3 : depth >= 2 ? 2 : 1
    const escorts = sampleWave(getRegularEnemies(theme), escortCount, rng)
    return [elite, ...escorts]
  }
  const count = Math.min(3 + Math.floor(depth / 2), 5)
  return sampleWave(getRegularEnemies(theme), count, rng)
}

function sampleWave(pool: EnemyTemplate[], count: number, rng: () => number): EnemyTemplate[] {
  if (pool.length === 0) return []
  const shuffled = [...pool].sort(() => rng() - 0.5)
  const wave: EnemyTemplate[] = []
  for (let i = 0; i < count; i++) wave.push(shuffled[i % shuffled.length]!)
  return wave
}
