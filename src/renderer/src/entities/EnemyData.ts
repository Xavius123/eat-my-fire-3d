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
// Tech — testing: single drone type (+ larger drone mesh for tech boss only).
// IDs align with GuideSprites ENEMY_SPRITES (tech_*).
// ─────────────────────────────────────────────────────────────────────────────

export const TECH_ENEMIES: EnemyTemplate[] = [
  {
    id: 'tech_drone',
    name: 'Combat Drone',
    faction: 'tech', theme: 'tech', tier: 'regular',
    hp: 9, attack: 3, defense: 0, moveRange: 3,
    attackKind: 'projectile', attackRange: 3,
    charges: 1, maxCharges: 1, rechargeRate: 1, exhausting: true,
    /** `assets/test/Model/Drone/model/Drone.fbx` */
    assetId: 'unit.model.drone',
    placeholder: { color: 0x44ccff, shape: 'capsule', scale: 0.95 },
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
  {
    id: 'boss_tech_overlord',
    name: 'Tech Overlord',
    flavor: 'Command core of the machine war. Floods the field with directed energy.',
    theme: 'tech',
    /** Same Drone.fbx as grunts, larger scale via `unit.model.drone_boss`. */
    assetId: 'unit.model.drone_boss',
    placeholder: { color: 0x4488ff, shape: 'capsule', scale: 2.4, emissive: 0x4488ff, emissiveIntensity: 0.5 },
    phases: [{
      hp: 42, attack: 7, defense: 3, moveRange: 2,
      attackKind: 'projectile', attackRange: 4,
      addTemplateIds: ['tech_drone'],
    }],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ALL_STANDARD = [...FANTASY_ENEMIES, ...TECH_ENEMIES]
const ENEMY_MAP = new Map<string, EnemyTemplate>(ALL_STANDARD.map((e) => [e.id, e]))

export function getEnemyTemplate(id: string): EnemyTemplate | undefined {
  return ENEMY_MAP.get(id)
}

export function getRegularEnemies(faction?: Faction): EnemyTemplate[] {
  if (faction === 'tech') return TECH_ENEMIES
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

/** Combat role bucket for wave diversity (melee / ranged / lobbed). */
export function attackRoleBucket(t: EnemyTemplate): 'melee' | 'ranged' | 'lobbed' {
  const k = t.attackKind
  if (k === 'basic') return 'melee'
  if (k === 'lobbed') return 'lobbed'
  return 'ranged'
}

/**
 * Elite overlay: stronger variant of a regular template (used for one slot in elite waves).
 */
export function applyEliteVariant(template: EnemyTemplate): EnemyTemplate {
  return {
    ...template,
    tier: 'elite',
    hp: Math.round(template.hp * 1.35),
    attack: template.attack + 1,
    defense: template.defense + 1,
  }
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]!]
  }
}

/**
 * Sample a wave with role diversity, duplicate caps, and stable RNG.
 * When count ≥ 3 and the pool covers all three roles, at least one of each role is included.
 */
export function sampleWave(pool: EnemyTemplate[], count: number, rng: () => number): EnemyTemplate[] {
  if (pool.length === 0 || count <= 0) return []

  /** At most this many copies of the same template id (keeps waves from being triple-grunt). */
  const maxPerId = count >= 4 ? 2 : 2
  const counts = new Map<string, number>()
  const wave: EnemyTemplate[] = []

  const canTake = (id: string): boolean => (counts.get(id) ?? 0) < maxPerId
  const take = (t: EnemyTemplate): void => {
    counts.set(t.id, (counts.get(t.id) ?? 0) + 1)
    wave.push(t)
  }

  const buckets = {
    melee: pool.filter((t) => attackRoleBucket(t) === 'melee'),
    ranged: pool.filter((t) => attackRoleBucket(t) === 'ranged'),
    lobbed: pool.filter((t) => attackRoleBucket(t) === 'lobbed'),
  }

  const roleOrder = (['melee', 'ranged', 'lobbed'] as const)
    .map((r) => ({ r, k: rng() }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.r)

  if (count >= 3 && buckets.melee.length && buckets.ranged.length && buckets.lobbed.length) {
    for (const role of roleOrder) {
      if (wave.length >= count) break
      const bucket = buckets[role]
      const candidates = bucket.filter((t) => canTake(t.id))
      if (candidates.length === 0) continue
      take(candidates[Math.floor(rng() * candidates.length)]!)
    }
  }

  const shuffled = [...pool]
  shuffleInPlace(shuffled, rng)
  let guard = 0
  while (wave.length < count && guard++ < count * 24) {
    const t = shuffled[Math.floor(rng() * shuffled.length)]!
    if (canTake(t.id)) {
      take(t)
    } else {
      const fallback = pool.find((p) => canTake(p.id))
      if (fallback) take(fallback)
      else break
    }
  }
  while (wave.length < count) {
    take(pool[Math.floor(rng() * pool.length)]!)
  }
  return wave.slice(0, count)
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
  const pool = theme === 'tech' ? TECH_ENEMIES : FANTASY_ENEMIES
  if (isBoss) {
    const boss = getBossTemplate(theme, rng)
    const minionCount = depth >= 4 ? 2 : 1
    const minions = sampleWave(pool, minionCount, rng)
    return [boss, ...minions]
  }
  if (isElite) {
    const count = Math.min(3 + Math.floor(depth / 2), 5)
    const wave = sampleWave(pool, count, rng)
    if (wave.length === 0) return wave
    const eliteIdx = Math.floor(rng() * wave.length)
    wave[eliteIdx] = applyEliteVariant(wave[eliteIdx]!)
    return wave
  }
  const count = Math.min(3 + Math.floor(depth / 2), 5)
  return sampleWave(pool, count, rng)
}
