/**
 * BiomeRegistry — defines combat arena biomes and selects the right one
 * based on faction, depth, and node type.
 *
 * Adding a new biome: define a BiomeDef object and add a case to selectBiome().
 * The level composer needs zero changes — everything flows through LevelDefinition.
 */

import { MINI_DUNGEON_ASSET_IDS, FOREST_ASSET_IDS, BLOCK_ASSET_IDS } from '../assets/AssetLibrary'
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

// ── Forest biome ───────────────────────────────────────────────────────────────

const FOREST_BIOME: BiomeDef = {
  ...DUNGEON_BIOME,
  id: 'forest',
  // Floor stays dungeon panels — BlockBits cubes are full 1-unit blocks, not flat tiles.
  // Forest identity comes from props (trees, bushes, rocks) and green ambient tinting.
  // Natural clearing — trees and rocks, no dungeon stonework
  anchors: (cx, cz) => [
    { id: 'forest-tree-c',  assetId: FOREST_ASSET_IDS.tree1, x: cx,     z: cz,     blocksTraversal: true,  tag: 'structure' },
    { id: 'forest-tree-l',  assetId: FOREST_ASSET_IDS.tree2, x: cx - 1, z: cz - 1, blocksTraversal: true,  tag: 'structure' },
    { id: 'forest-bush-r',  assetId: FOREST_ASSET_IDS.bush1, x: cx + 1, z: cz,     blocksTraversal: false, tag: 'decor' },
    { id: 'forest-rock-bl', assetId: FOREST_ASSET_IDS.rock1, x: cx - 1, z: cz + 1, blocksTraversal: true,  tag: 'clutter' },
    { id: 'forest-grass-a', assetId: FOREST_ASSET_IDS.grass, x: cx + 1, z: cz - 1, blocksTraversal: false, tag: 'decor' },
  ],
  propRules: [
    // Trees — primary blockers
    {
      assetId: FOREST_ASSET_IDS.tree1,
      perMapChance: 0.9, minCount: 1, maxCount: 4,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      randomYaw: true, scaleJitter: [0.85, 1.1], tag: 'clutter',
    },
    {
      assetId: FOREST_ASSET_IDS.tree2,
      perMapChance: 0.7, minCount: 0, maxCount: 3,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      randomYaw: true, scaleJitter: [0.85, 1.1], tag: 'clutter',
    },
    // Bushes — passable scatter
    {
      assetId: FOREST_ASSET_IDS.bush1,
      perMapChance: 0.85, minCount: 1, maxCount: 4,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      randomYaw: true, scaleJitter: [0.8, 1.2], tag: 'decor',
    },
    {
      assetId: FOREST_ASSET_IDS.bush2,
      perMapChance: 0.65, minCount: 0, maxCount: 3,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      randomYaw: true, scaleJitter: [0.8, 1.15], tag: 'decor',
    },
    // Rocks
    {
      assetId: FOREST_ASSET_IDS.rock1,
      perMapChance: 0.8, minCount: 1, maxCount: 4,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      randomYaw: true, scaleJitter: [0.85, 1.2], tag: 'clutter',
    },
    {
      assetId: FOREST_ASSET_IDS.rock2,
      perMapChance: 0.6, minCount: 0, maxCount: 3,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      randomYaw: true, scaleJitter: [0.85, 1.15], tag: 'clutter',
    },
    // Grass tufts — ground decor
    {
      assetId: FOREST_ASSET_IDS.grass,
      perMapChance: 0.9, minCount: 2, maxCount: 6,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      randomYaw: true, scaleJitter: [0.8, 1.2], tag: 'decor',
    },
    // Keep dungeon coins/chests as loot pickups (lore: left behind by previous travelers)
    {
      assetId: MINI_DUNGEON_ASSET_IDS.coin,
      perMapChance: 0.65, minCount: 0, maxCount: 3,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      randomYaw: true, yJitter: [0, 0.02], scaleJitter: [0.95, 1.05], tag: 'loot',
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.chest,
      perMapChance: 0.25, minCount: 0, maxCount: 1,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'treasure',
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.trap,
      perMapChance: 0.4, minCount: 0, maxCount: 2,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'hazard',
    },
  ],
  prefabRules: [],
  blockedTileChance: 0.02,
}

// ── Tech biome ─────────────────────────────────────────────────────────────────

const TECH_BIOME: BiomeDef = {
  ...DUNGEON_BIOME,
  id: 'tech',
  // Floor stays dungeon panels — BlockBits cubes are full 1-unit blocks, not flat tiles.
  // Tech identity comes from props (colored blocks, panels, gate) and blue ambient tinting.
  anchors: (cx, cz) => [
    // Central control terminal cluster
    { id: 'tech-terminal',  assetId: BLOCK_ASSET_IDS.blockBlue,   x: cx,     z: cz,     blocksTraversal: true, tag: 'structure' },
    { id: 'tech-panel-l',   assetId: BLOCK_ASSET_IDS.decoBlue,    x: cx - 1, z: cz,     blocksTraversal: true, tag: 'wall' },
    { id: 'tech-panel-r',   assetId: BLOCK_ASSET_IDS.decoBlue,    x: cx + 1, z: cz,     blocksTraversal: true, tag: 'wall' },
    { id: 'tech-gate',      assetId: MINI_DUNGEON_ASSET_IDS.gate, x: cx,     z: cz - 1, blocksTraversal: true, tag: 'wall' },
    { id: 'tech-danger',    assetId: BLOCK_ASSET_IDS.blockRed,    x: cx + 1, z: cz + 1, blocksTraversal: true, tag: 'clutter' },
  ],
  propRules: [
    // Crates
    {
      assetId: BLOCK_ASSET_IDS.blockBlue,
      perMapChance: 0.9, minCount: 2, maxCount: 5,
      blocksTraversal: true, minDistanceFromSpawns: 1,
      rotationChoices: CARDINAL_ROTATIONS, scaleJitter: [0.9, 1.1],
      tag: 'clutter', nearTags: ['wall', 'structure'], nearRadius: 2, nearWeight: 2,
    },
    {
      assetId: BLOCK_ASSET_IDS.blockRed,
      perMapChance: 0.7, minCount: 1, maxCount: 3,
      blocksTraversal: true, minDistanceFromSpawns: 1,
      rotationChoices: CARDINAL_ROTATIONS, scaleJitter: [0.9, 1.1],
      tag: 'clutter',
    },
    {
      assetId: BLOCK_ASSET_IDS.stripedBlue,
      perMapChance: 0.6, minCount: 0, maxCount: 3,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS, scaleJitter: [0.9, 1.05],
      tag: 'clutter', nearTags: ['wall'], nearRadius: 2, nearWeight: 2,
    },
    {
      assetId: BLOCK_ASSET_IDS.wood,
      perMapChance: 0.5, minCount: 0, maxCount: 2,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS, scaleJitter: [0.9, 1.1],
      tag: 'clutter',
    },
    // Traps — energy mines
    {
      assetId: MINI_DUNGEON_ASSET_IDS.trap,
      perMapChance: 0.7, minCount: 1, maxCount: 3,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'hazard',
    },
    // Loot
    {
      assetId: MINI_DUNGEON_ASSET_IDS.coin,
      perMapChance: 0.75, minCount: 1, maxCount: 3,
      blocksTraversal: false, minDistanceFromSpawns: 1,
      randomYaw: true, yJitter: [0, 0.02], scaleJitter: [0.95, 1.05], tag: 'loot',
    },
    {
      assetId: MINI_DUNGEON_ASSET_IDS.chest,
      perMapChance: 0.35, minCount: 0, maxCount: 1,
      blocksTraversal: true, minDistanceFromSpawns: 2,
      rotationChoices: CARDINAL_ROTATIONS, tag: 'treasure',
      nearTags: ['wall'], nearRadius: 2, nearWeight: 2,
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

export interface BiomeLighting {
  /** Hemisphere sky colour (hex) */
  sky: number
  /** Hemisphere ground colour (hex) */
  ground: number
  /** Renderer clear / background colour (hex) */
  bg: number
}

const BIOME_LIGHTING: Record<BiomeId, BiomeLighting> = {
  // Warm amber dungeon torchlight
  dungeon: { sky: 0xe6eeff, ground: 0x2b2430, bg: 0x1a1a2e },
  // Cool green forest canopy
  forest:  { sky: 0xc8f0b8, ground: 0x2a3a1a, bg: 0x0c1a08 },
  // Cold blue-grey tech facility
  tech:    { sky: 0xaac8ff, ground: 0x1a1a2e, bg: 0x080e1e },
}

export function getBiomeLighting(id: BiomeId): BiomeLighting {
  return BIOME_LIGHTING[id]
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
