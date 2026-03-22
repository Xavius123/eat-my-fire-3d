/**
 * BiomeRegistry — defines combat arena biomes and selects the right one
 * based on faction, depth, and node type.
 *
 * Adding a new biome: define a BiomeDef object and add a case to selectBiome().
 * The level composer needs zero changes — everything flows through LevelDefinition.
 */

import { MINI_DUNGEON_ASSET_IDS } from '../assets/AssetLibrary'
import type { Faction } from '../entities/EnemyData'
import type { NodeType } from '../map/MapGraph'
import {
  createBiomeTileAssets,
  createStarterPrefabs,
  type LevelDefinition,
  type LevelPropPlacement,
  type ProceduralPropRule,
  type PrefabDefinition,
  type ProceduralPrefabRule,
} from './LevelDefinition'

export type BiomeId = 'dungeon' | 'forest' | 'tech'

const CARDINAL_ROTATIONS = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]

// ── Biome definition ──────────────────────────────────────────────────────────

export interface BiomeDef {
  id: BiomeId
  floorAssetIds: { base: string; detail: string }
  /** Static centerpiece props. cx/cz = computed center of the grid. */
  anchors: (cx: number, cz: number) => LevelPropPlacement[]
  propRules: ProceduralPropRule[]
  prefabs?: Record<string, PrefabDefinition>
  prefabRules?: ProceduralPrefabRule[]
  /** Extra blocked tile probability (scaled up with depth). */
  blockedTileChance: number
}

// ── Dungeon biome ─────────────────────────────────────────────────────────────

const DUNGEON_BIOME: BiomeDef = {
  id: 'dungeon',
  floorAssetIds: {
    base: MINI_DUNGEON_ASSET_IDS.floor,
    detail: MINI_DUNGEON_ASSET_IDS.floorDetail,
  },
  anchors: (cx, cz) => [
    {
      id: 'center-column',
      assetId: MINI_DUNGEON_ASSET_IDS.column,
      x: cx, z: cz,
      blocksTraversal: true, tag: 'structure',
    },
    {
      id: 'center-wall',
      assetId: MINI_DUNGEON_ASSET_IDS.wall,
      x: cx, z: cz - 1,
      blocksTraversal: true, tag: 'wall',
    },
    {
      id: 'center-opening',
      assetId: MINI_DUNGEON_ASSET_IDS.wallOpening,
      x: cx + 1, z: cz - 1,
      blocksTraversal: false, tag: 'doorway',
    },
    {
      id: 'center-banner',
      assetId: MINI_DUNGEON_ASSET_IDS.banner,
      x: cx - 1, z: cz - 1,
      blocksTraversal: false, tag: 'attachment',
    },
    {
      id: 'center-stairs',
      assetId: MINI_DUNGEON_ASSET_IDS.stairs,
      x: cx, z: cz + 1,
      blocksTraversal: false, tag: 'structure',
    },
  ],
  propRules: [
    {
      assetId: MINI_DUNGEON_ASSET_IDS.rocks,
      perMapChance: 0.85, minCount: 1, maxCount: 5,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      randomYaw: true, yJitter: [-0.01, 0.03], scaleJitter: [0.9, 1.15],
      tag: 'clutter',
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.barrel,
      perMapChance: 0.85, minCount: 1, maxCount: 5,
      blocksTraversal: true, minDistanceFromSpawns: 1,
      randomYaw: true, yJitter: [-0.01, 0.02], scaleJitter: [0.92, 1.08],
      tag: 'clutter', nearTags: ['wall', 'structure'], nearRadius: 2, nearWeight: 2,
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.trap,
      perMapChance: 0.45, minCount: 0, maxCount: 2,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'hazard',
      nearTags: ['wall'], nearRadius: 2, nearWeight: 1,
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.coin,
      perMapChance: 0.8, minCount: 1, maxCount: 4,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      randomYaw: true, yJitter: [0, 0.03], scaleJitter: [0.95, 1.05],
      tag: 'loot', nearTags: ['wall', 'structure'], nearRadius: 2, nearWeight: 1,
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.chest,
      perMapChance: 0.32, minCount: 0, maxCount: 1,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'treasure',
      nearTags: ['wall', 'doorway'], nearRadius: 2, nearWeight: 2,
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.weaponSword,
      perMapChance: 0.24, minCount: 0, maxCount: 1,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'loot',
      nearTags: ['wall'], nearRadius: 2, nearWeight: 1,
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.weaponSpear,
      perMapChance: 0.2, minCount: 0, maxCount: 1,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'loot',
      nearTags: ['wall'], nearRadius: 2, nearWeight: 1,
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.shieldRound,
      perMapChance: 0.3, minCount: 0, maxCount: 2,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'decor',
      nearTags: ['wall'], nearRadius: 2, nearWeight: 1,
    },
  ],
  prefabs: createStarterPrefabs(),
  prefabRules: [
    {
      prefabId: 'chunk.wall-run',
      perMapChance: 0.75, minCount: 1, maxCount: 2,
      minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS,
    },
    {
      prefabId: 'chunk.corner-shrine',
      perMapChance: 0.45, minCount: 0, maxCount: 1,
      minDistanceFromSpawns: 3,
      rotationChoices: CARDINAL_ROTATIONS,
    },
    {
      prefabId: 'chunk.guard-post',
      perMapChance: 0.5, minCount: 0, maxCount: 1,
      minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS,
    },
  ],
  blockedTileChance: 0,
}

// ── Forest biome (placeholder — uses dungeon assets until forest GLBs are wired) ──

const FOREST_BIOME: BiomeDef = {
  ...DUNGEON_BIOME,
  id: 'forest',
  // TODO: swap floorAssetIds and propRules for forest GLBs when available.
  // For now, forest uses the dungeon tile set with adjusted prop weights.
  propRules: [
    // More rocks/clutter, no weapons/shields — forest feel with current assets
    {
      assetId: MINI_DUNGEON_ASSET_IDS.rocks,
      perMapChance: 0.95, minCount: 2, maxCount: 7,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      randomYaw: true, yJitter: [-0.01, 0.05], scaleJitter: [0.85, 1.25],
      tag: 'clutter',
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.stones,
      perMapChance: 0.8, minCount: 1, maxCount: 4,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      randomYaw: true, yJitter: [-0.01, 0.02], scaleJitter: [0.9, 1.1],
      tag: 'decor',
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.trap,
      perMapChance: 0.5, minCount: 0, maxCount: 3,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'hazard',
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.coin,
      perMapChance: 0.7, minCount: 1, maxCount: 3,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      randomYaw: true, yJitter: [0, 0.02], scaleJitter: [0.95, 1.05],
      tag: 'loot',
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.chest,
      perMapChance: 0.28, minCount: 0, maxCount: 1,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'treasure',
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.woodStructure,
      perMapChance: 0.6, minCount: 1, maxCount: 3,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      randomYaw: true, yJitter: [-0.02, 0.02], scaleJitter: [0.9, 1.15],
      tag: 'clutter',
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.woodSupport,
      perMapChance: 0.5, minCount: 0, maxCount: 2,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      randomYaw: true, yJitter: [-0.01, 0.01], scaleJitter: [0.9, 1.1],
      tag: 'clutter',
      nearTags: ['clutter'], nearRadius: 2, nearWeight: 2,
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.dirt,
      perMapChance: 0.65, minCount: 1, maxCount: 3,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      randomYaw: true, yJitter: [-0.02, 0.0], scaleJitter: [0.9, 1.1],
      tag: 'decor',
    },
  ],
  prefabRules: [
    // Fallen-log style wall-runs feel like forest deadfall
    {
      prefabId: 'chunk.wall-run',
      perMapChance: 0.8, minCount: 1, maxCount: 3,
      minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS,
    },
  ],
  blockedTileChance: 0.02, // slightly denser — forest feels tighter
}

// ── Tech biome (placeholder — uses dungeon assets with tech prop feel) ─────────

const TECH_BIOME: BiomeDef = {
  ...DUNGEON_BIOME,
  id: 'tech',
  anchors: (cx, cz) => [
    // Central generator core — reuse column + gate as terminal cluster
    {
      id: 'tech-core',
      assetId: MINI_DUNGEON_ASSET_IDS.column,
      x: cx, z: cz,
      blocksTraversal: true, tag: 'structure',
    },
    {
      id: 'tech-gate',
      assetId: MINI_DUNGEON_ASSET_IDS.gate,
      x: cx + 1, z: cz,
      blocksTraversal: true, tag: 'wall',
    },
    {
      id: 'tech-panel-l',
      assetId: MINI_DUNGEON_ASSET_IDS.wallNarrow,
      x: cx - 1, z: cz,
      blocksTraversal: true, tag: 'wall',
    },
    {
      id: 'tech-panel-r',
      assetId: MINI_DUNGEON_ASSET_IDS.wallNarrow,
      x: cx + 2, z: cz,
      blocksTraversal: true, tag: 'wall',
    },
  ],
  propRules: [
    // Crates (barrels as stand-ins)
    {
      assetId: MINI_DUNGEON_ASSET_IDS.barrel,
      perMapChance: 0.9, minCount: 2, maxCount: 6,
      blocksTraversal: true, minDistanceFromSpawns: 1,
      rotationChoices: CARDINAL_ROTATIONS, yJitter: [-0.01, 0.01], scaleJitter: [0.92, 1.08],
      tag: 'clutter', nearTags: ['wall'], nearRadius: 2, nearWeight: 2,
    },
    // Energy mines (traps)
    {
      assetId: MINI_DUNGEON_ASSET_IDS.trap,
      perMapChance: 0.65, minCount: 1, maxCount: 3,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'hazard',
    },
    // Scrap loot (coins)
    {
      assetId: MINI_DUNGEON_ASSET_IDS.coin,
      perMapChance: 0.75, minCount: 1, maxCount: 3,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      randomYaw: true, yJitter: [0, 0.02], scaleJitter: [0.95, 1.05],
      tag: 'loot',
    },
    // Supply crate (chest)
    {
      assetId: MINI_DUNGEON_ASSET_IDS.chest,
      perMapChance: 0.35, minCount: 0, maxCount: 1,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'treasure',
      nearTags: ['wall'], nearRadius: 2, nearWeight: 2,
    },
    // Conduit rocks (rocks as debris)
    {
      assetId: MINI_DUNGEON_ASSET_IDS.rocks,
      perMapChance: 0.5, minCount: 0, maxCount: 3,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      randomYaw: true, yJitter: [-0.01, 0.02], scaleJitter: [0.9, 1.1],
      tag: 'clutter',
    },
  ],
  prefabRules: [
    // Conduit runs (wall-run used as pipe/corridor divider)
    {
      prefabId: 'chunk.wall-run',
      perMapChance: 0.85, minCount: 1, maxCount: 3,
      minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS,
    },
    {
      prefabId: 'chunk.guard-post',
      perMapChance: 0.55, minCount: 0, maxCount: 2,
      minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS,
    },
  ],
  blockedTileChance: 0,
}

// ── Registry ──────────────────────────────────────────────────────────────────

const BIOME_REGISTRY: Record<BiomeId, BiomeDef> = {
  dungeon: DUNGEON_BIOME,
  forest: FOREST_BIOME,
  tech: TECH_BIOME,
}

export function getBiomeDef(id: BiomeId): BiomeDef {
  return BIOME_REGISTRY[id]
}

/**
 * Select the appropriate biome for a map node.
 * - tech faction → always tech biome
 * - fantasy faction + col 0–1 → dungeon
 * - fantasy faction + col 2+ even columns → forest (odd columns stay dungeon)
 * - boss/miniboss → dungeon (grand hall feel)
 */
export function selectBiome(faction: Faction | undefined, nodeType: NodeType, depth: number): BiomeId {
  if (nodeType === 'boss' || nodeType === 'miniboss') return 'dungeon'
  if (faction === 'tech') return 'tech'
  if (depth >= 2 && depth % 2 === 0) return 'forest'
  return 'dungeon'
}

// ── Grid sizing per node type ─────────────────────────────────────────────────

function gridSizeForNode(nodeType: NodeType): { width: number; height: number } {
  if (nodeType === 'boss') return { width: 14, height: 12 }
  if (nodeType === 'miniboss') return { width: 12, height: 12 }
  if (nodeType === 'elite') return { width: 12, height: 10 }
  return { width: 10, height: 10 }
}

function spawnsForGrid(width: number, height: number): {
  playerSpawns: { x: number; z: number }[]
  enemySpawns: { x: number; z: number }[]
} {
  return {
    playerSpawns: [
      { x: 1, z: 1 }, { x: 2, z: 1 },
      { x: 1, z: 2 }, { x: 2, z: 2 },
    ],
    enemySpawns: [
      { x: width - 3, z: height - 3 },
      { x: width - 2, z: height - 3 },
      { x: width - 3, z: height - 2 },
    ],
  }
}

// ── Level factory ─────────────────────────────────────────────────────────────

/**
 * Build a LevelDefinition for the given biome, seed, and node type.
 * This is the main entry point used by Game.ts instead of createStarterLevelDefinition.
 */
export function createLevelDefinitionForBiome(
  biomeId: BiomeId,
  seed: number,
  nodeType: NodeType
): LevelDefinition {
  const biome = getBiomeDef(biomeId)
  const { width, height } = gridSizeForNode(nodeType)
  const { playerSpawns, enemySpawns } = spawnsForGrid(width, height)

  // Center of the grid (biased slightly away from exact center to avoid spawn overlap)
  const cx = Math.floor(width / 2) - 1
  const cz = Math.floor(height / 2) - 1

  const staticTileAssets = createBiomeTileAssets(
    width, height, seed,
    biome.floorAssetIds.base,
    biome.floorAssetIds.detail
  )

  return {
    id: `${biomeId}-${nodeType}-${seed}`,
    width,
    height,
    ensureReachablePath: true,
    playerSpawns,
    enemySpawns,
    staticTileAssets,
    staticProps: biome.anchors(cx, cz),
    procedural: {
      seed,
      blockedTileChance: biome.blockedTileChance,
      propRules: biome.propRules,
      prefabs: biome.prefabs,
      prefabRules: biome.prefabRules,
    },
  }
}
