import { MINI_DUNGEON_ASSET_IDS } from '../assets/AssetLibrary'
import { mulberry32 } from '../utils/prng'

export interface GridCoord {
  x: number
  z: number
}

export interface FootprintCell {
  dx: number
  dz: number
}

export interface LevelPropPlacement {
  id: string
  assetId: string
  x: number
  z: number
  y?: number
  offsetX?: number
  offsetZ?: number
  rotationY?: number
  scale?: number
  blocksTraversal?: boolean
  footprint?: FootprintCell[]
  allowOverlap?: boolean
  tag?: string
}

export interface ProceduralPropRule {
  assetId: string
  density?: number
  minCount?: number
  maxCount?: number
  perMapChance?: number
  blocksTraversal?: boolean
  footprint?: FootprintCell[]
  minDistanceFromSpawns?: number
  maxDistanceFromSpawns?: number
  rotationChoices?: number[]
  randomYaw?: boolean
  yJitter?: [number, number]
  scaleJitter?: [number, number]
  allowOverlap?: boolean
  tag?: string
  nearTags?: string[]
  nearRadius?: number
  nearWeight?: number
  nearRequired?: boolean
}

export interface PrefabPiece {
  assetId: string
  dx: number
  dz: number
  y?: number
  offsetX?: number
  offsetZ?: number
  rotationY?: number
  scale?: number
  blocksTraversal?: boolean
  footprint?: FootprintCell[]
  allowOverlap?: boolean
  tag?: string
}

export interface PrefabDefinition {
  id: string
  pieces: PrefabPiece[]
}

export interface ProceduralPrefabRule {
  prefabId: string
  minCount?: number
  maxCount?: number
  perMapChance?: number
  minDistanceFromSpawns?: number
  maxDistanceFromSpawns?: number
  rotationChoices?: number[]
  nearTags?: string[]
  nearRadius?: number
  nearWeight?: number
  nearRequired?: boolean
}

export interface ProceduralSettings {
  seed: number
  blockedTileChance?: number
  prefabs?: Record<string, PrefabDefinition>
  prefabRules?: ProceduralPrefabRule[]
  propRules?: ProceduralPropRule[]
}

export interface LevelDefinition {
  id: string
  width: number
  height: number
  playerSpawns: GridCoord[]
  enemySpawns: GridCoord[]
  staticBlockedTiles?: GridCoord[]
  staticTileAssets?: Record<string, string>
  staticProps?: LevelPropPlacement[]
  procedural?: ProceduralSettings
  ensureReachablePath?: boolean
}

const CARDINAL_ROTATIONS = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]

function tileKey(x: number, z: number): string {
  return `${x},${z}`
}

function createRuntimeSeed(levelIndex: number): number {
  const now = Date.now() >>> 0
  const mixed = (now ^ ((levelIndex * 2654435761) >>> 0)) >>> 0
  return mixed === 0 ? 1 : mixed
}

function createStarterTileAssets(
  width: number,
  height: number,
  seed: number
): Record<string, string> {
  const random = mulberry32(seed)
  const raw: boolean[][] = []

  for (let x = 0; x < width; x++) {
    raw[x] = []
    for (let z = 0; z < height; z++) {
      raw[x][z] = random() < 0.22
    }
  }

  // Grow small floor-detail clusters so it feels less noisy.
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < height; z++) {
      let neighbors = 0
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dz === 0) continue
          const nx = x + dx
          const nz = z + dz
          if (nx < 0 || nx >= width || nz < 0 || nz >= height) continue
          if (raw[nx][nz]) neighbors++
        }
      }

      if (!raw[x][z] && neighbors >= 4 && random() < 0.5) {
        raw[x][z] = true
      }
    }
  }

  const result: Record<string, string> = {}
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < height; z++) {
      result[tileKey(x, z)] = raw[x][z]
        ? MINI_DUNGEON_ASSET_IDS.floorDetail
        : MINI_DUNGEON_ASSET_IDS.floor
    }
  }

  return result
}

function createStarterPrefabs(): Record<string, PrefabDefinition> {
  return {
    'chunk.wall-run': {
      id: 'chunk.wall-run',
      pieces: [
        {
          assetId: MINI_DUNGEON_ASSET_IDS.wall,
          dx: 0,
          dz: 0,
          blocksTraversal: true,
          tag: 'wall'
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.wallHalf,
          dx: 1,
          dz: 0,
          blocksTraversal: true,
          tag: 'wall'
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.wallOpening,
          dx: 2,
          dz: 0,
          blocksTraversal: false,
          tag: 'doorway'
        }
      ]
    },
    'chunk.corner-shrine': {
      id: 'chunk.corner-shrine',
      pieces: [
        {
          assetId: MINI_DUNGEON_ASSET_IDS.column,
          dx: 0,
          dz: 0,
          blocksTraversal: true,
          tag: 'structure'
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.wall,
          dx: 1,
          dz: 0,
          blocksTraversal: true,
          tag: 'wall'
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.wall,
          dx: 0,
          dz: 1,
          blocksTraversal: true,
          tag: 'wall'
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.banner,
          dx: 1,
          dz: 1,
          blocksTraversal: false,
          tag: 'attachment'
        }
      ]
    },
    'chunk.guard-post': {
      id: 'chunk.guard-post',
      pieces: [
        {
          assetId: MINI_DUNGEON_ASSET_IDS.wallNarrow,
          dx: 0,
          dz: 0,
          blocksTraversal: true,
          tag: 'wall'
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.shieldRound,
          dx: 1,
          dz: 0,
          blocksTraversal: false,
          tag: 'attachment'
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.weaponSpear,
          dx: 0,
          dz: 1,
          blocksTraversal: false,
          tag: 'decor'
        }
      ]
    }
  }
}

/**
 * Procedural starter definition with crafted center + randomized dressing.
 * Seed changes per generated level.
 */
export function createStarterLevelDefinition(levelIndex: number = 1): LevelDefinition {
  const width = 10
  const height = 10
  const seed = createRuntimeSeed(levelIndex)

  return {
    id: `starter-mini-dungeon-${levelIndex}`,
    width,
    height,
    ensureReachablePath: true,
    playerSpawns: [
      { x: 1, z: 1 },
      { x: 2, z: 1 },
      { x: 1, z: 2 },
      { x: 2, z: 2 }
    ],
    enemySpawns: [
      { x: 7, z: 7 },
      { x: 8, z: 7 },
      { x: 7, z: 8 },
    ],
    staticTileAssets: createStarterTileAssets(width, height, seed),
    staticProps: [
      {
        id: 'center-column',
        assetId: MINI_DUNGEON_ASSET_IDS.column,
        x: 4,
        z: 4,
        blocksTraversal: true,
        tag: 'structure'
      },
      {
        id: 'center-wall',
        assetId: MINI_DUNGEON_ASSET_IDS.wall,
        x: 4,
        z: 3,
        blocksTraversal: true,
        tag: 'wall'
      },
      {
        id: 'center-opening',
        assetId: MINI_DUNGEON_ASSET_IDS.wallOpening,
        x: 5,
        z: 3,
        blocksTraversal: false,
        tag: 'doorway'
      },
      {
        id: 'center-banner',
        assetId: MINI_DUNGEON_ASSET_IDS.banner,
        x: 3,
        z: 3,
        blocksTraversal: false,
        tag: 'attachment'
      },
      {
        id: 'center-stairs',
        assetId: MINI_DUNGEON_ASSET_IDS.stairs,
        x: 4,
        z: 5,
        blocksTraversal: false,
        tag: 'structure'
      }
    ],
    procedural: {
      seed,
      blockedTileChance: 0,
      propRules: [
        {
          assetId: MINI_DUNGEON_ASSET_IDS.rocks,
          perMapChance: 0.85,
          minCount: 1,
          maxCount: 5,
          blocksTraversal: true,
          minDistanceFromSpawns: 2,
          randomYaw: true,
          yJitter: [-0.01, 0.03],
          scaleJitter: [0.9, 1.15],
          tag: 'clutter'
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.barrel,
          perMapChance: 0.85,
          minCount: 1,
          maxCount: 5,
          blocksTraversal: true,
          minDistanceFromSpawns: 1,
          randomYaw: true,
          yJitter: [-0.01, 0.02],
          scaleJitter: [0.92, 1.08],
          tag: 'clutter',
          nearTags: ['wall', 'structure'],
          nearRadius: 2,
          nearWeight: 2
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.trap,
          perMapChance: 0.45,
          minCount: 0,
          maxCount: 2,
          blocksTraversal: true,
          minDistanceFromSpawns: 2,
          rotationChoices: CARDINAL_ROTATIONS,
          tag: 'hazard',
          nearTags: ['wall'],
          nearRadius: 2,
          nearWeight: 1
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.coin,
          perMapChance: 0.8,
          minCount: 1,
          maxCount: 4,
          blocksTraversal: false,
          minDistanceFromSpawns: 1,
          randomYaw: true,
          yJitter: [0, 0.03],
          scaleJitter: [0.95, 1.05],
          tag: 'loot',
          nearTags: ['wall', 'structure'],
          nearRadius: 2,
          nearWeight: 1
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.chest,
          perMapChance: 0.32,
          minCount: 0,
          maxCount: 1,
          blocksTraversal: true,
          minDistanceFromSpawns: 2,
          rotationChoices: CARDINAL_ROTATIONS,
          tag: 'treasure',
          nearTags: ['wall', 'doorway'],
          nearRadius: 2,
          nearWeight: 2
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.weaponSword,
          perMapChance: 0.24,
          minCount: 0,
          maxCount: 1,
          blocksTraversal: false,
          minDistanceFromSpawns: 1,
          rotationChoices: CARDINAL_ROTATIONS,
          tag: 'loot',
          nearTags: ['wall'],
          nearRadius: 2,
          nearWeight: 1
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.weaponSpear,
          perMapChance: 0.2,
          minCount: 0,
          maxCount: 1,
          blocksTraversal: false,
          minDistanceFromSpawns: 1,
          rotationChoices: CARDINAL_ROTATIONS,
          tag: 'loot',
          nearTags: ['wall'],
          nearRadius: 2,
          nearWeight: 1
        },
        {
          assetId: MINI_DUNGEON_ASSET_IDS.shieldRound,
          perMapChance: 0.3,
          minCount: 0,
          maxCount: 2,
          blocksTraversal: false,
          minDistanceFromSpawns: 1,
          rotationChoices: CARDINAL_ROTATIONS,
          tag: 'decor',
          nearTags: ['wall'],
          nearRadius: 2,
          nearWeight: 1
        }
      ]
    }
  }
}
