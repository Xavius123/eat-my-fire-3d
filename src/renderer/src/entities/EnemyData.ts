/**
 * EnemyData — All enemies from Eat My Fire ported to 3D engine.
 *
 * Two themes: 'fantasy' (goblins, skeletons, orcs, worms) and 'tech' (robots/drones).
 *
 * 3D assets: `assetId` → AssetLibrary (`unit.kaykit.*`). If missing or load fails,
 * PlaceholderMeshFactory uses `placeholder`.
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
    assetId: 'unit.kaykit.skeleton_warrior',
    placeholder: { color: 0x4aaa44, shape: 'capsule', scale: 1.0 },
  },
  {
    id: 'bone_archer',
    name: 'Bone Archer',
    faction: 'fantasy', theme: 'fantasy', tier: 'regular',
    hp: 12, attack: 3, defense: 0, moveRange: 2,
    attackKind: 'projectile', attackRange: 4,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    assetId: 'unit.kaykit.skeleton_rogue',
    placeholder: { color: 0xccccaa, shape: 'capsule', scale: 1.0 },
  },
  {
    id: 'shaman',
    name: 'Shaman',
    faction: 'fantasy', theme: 'fantasy', tier: 'regular',
    hp: 12, attack: 2, defense: 0, moveRange: 2,
    attackKind: 'lobbed', attackRange: 3,
    charges: 1, maxCharges: 2, rechargeRate: 1, exhausting: false,
    assetId: 'unit.kaykit.skeleton_mage',
    placeholder: { color: 0xff8800, shape: 'sphere', scale: 1.0 },
    onHitEffects: [{ type: 'burn', value: 1, duration: 2 }],
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
    id: 'boss_skeleton_king',
    name: 'Skeleton King',
    flavor: 'The undead tyrant. Commands through fear. His death scepter reaches across the entire field.',
    theme: 'fantasy',
    assetId: 'unit.kaykit.skeleton_boss',
    placeholder: { color: 0xeeeedd, shape: 'capsule', scale: 2.4, emissive: 0xffffff, emissiveIntensity: 0.6 },
    phases: [{
      hp: 45, attack: 7, defense: 4, moveRange: 2,
      attackKind: 'lobbed', attackRange: 3,
      addTemplateIds: ['bone_archer'],
    }],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ALL_STANDARD = [...FANTASY_ENEMIES]
const ENEMY_MAP = new Map<string, EnemyTemplate>(ALL_STANDARD.map((e) => [e.id, e]))

export function getEnemyTemplate(id: string): EnemyTemplate | undefined {
  return ENEMY_MAP.get(id)
}

export function getRegularEnemies(_faction?: Faction): EnemyTemplate[] {
  return FANTASY_ENEMIES
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
  _theme: LevelTheme = 'fantasy',
): Array<EnemyTemplate | BossTemplate> {
  if (isBoss) {
    const boss = getBossTemplate('fantasy', rng)
    const minionCount = depth >= 4 ? 2 : 1
    const minions = sampleWave(FANTASY_ENEMIES, minionCount, rng)
    return [boss, ...minions]
  }
  if (isElite) {
    // No dedicated elite — use a buffed regular wave
    const count = Math.min(3 + Math.floor(depth / 2), 5)
    return sampleWave(FANTASY_ENEMIES, count, rng)
  }
  const count = Math.min(3 + Math.floor(depth / 2), 5)
  return sampleWave(FANTASY_ENEMIES, count, rng)
}

function sampleWave(pool: EnemyTemplate[], count: number, rng: () => number): EnemyTemplate[] {
  if (pool.length === 0) return []
  const shuffled = [...pool].sort(() => rng() - 0.5)
  const wave: EnemyTemplate[] = []
  for (let i = 0; i < count; i++) wave.push(shuffled[i % shuffled.length]!)
  return wave
}
