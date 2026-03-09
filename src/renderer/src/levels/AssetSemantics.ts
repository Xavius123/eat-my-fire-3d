import { MINI_DUNGEON_ASSET_IDS } from '../assets/AssetLibrary'

export type AssetSemanticKind =
  | 'floor'
  | 'wall'
  | 'doorway'
  | 'structure'
  | 'decor'
  | 'attachment'
  | 'hazard'
  | 'loot'
  | 'unit'

export interface AssetSemantics {
  assetId: string
  kind: AssetSemanticKind
  defaultTag?: string
  blocksTraversal?: boolean
  allowOverlap?: boolean
}

const registry = new Map<string, AssetSemantics>()

export function registerAssetSemantics(entries: AssetSemantics[]): void {
  for (const entry of entries) {
    registry.set(entry.assetId, entry)
  }
}

export function getAssetSemantics(assetId: string): AssetSemantics | undefined {
  return registry.get(assetId)
}

registerAssetSemantics([
  {
    assetId: MINI_DUNGEON_ASSET_IDS.floor,
    kind: 'floor',
    defaultTag: 'floor',
    blocksTraversal: false
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.floorDetail,
    kind: 'floor',
    defaultTag: 'floor',
    blocksTraversal: false
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.dirt,
    kind: 'floor',
    defaultTag: 'floor',
    blocksTraversal: false
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.stones,
    kind: 'floor',
    defaultTag: 'floor',
    blocksTraversal: false
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.wall,
    kind: 'wall',
    defaultTag: 'wall',
    blocksTraversal: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.wallHalf,
    kind: 'wall',
    defaultTag: 'wall',
    blocksTraversal: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.wallNarrow,
    kind: 'wall',
    defaultTag: 'wall',
    blocksTraversal: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.wallOpening,
    kind: 'doorway',
    defaultTag: 'doorway',
    blocksTraversal: false
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.gate,
    kind: 'doorway',
    defaultTag: 'doorway',
    blocksTraversal: false,
    allowOverlap: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.stairs,
    kind: 'structure',
    defaultTag: 'structure',
    blocksTraversal: false
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.column,
    kind: 'structure',
    defaultTag: 'structure',
    blocksTraversal: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.woodStructure,
    kind: 'structure',
    defaultTag: 'structure',
    blocksTraversal: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.woodSupport,
    kind: 'structure',
    defaultTag: 'structure',
    blocksTraversal: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.banner,
    kind: 'attachment',
    defaultTag: 'attachment',
    blocksTraversal: false,
    allowOverlap: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.shieldRectangle,
    kind: 'attachment',
    defaultTag: 'attachment',
    blocksTraversal: false,
    allowOverlap: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.shieldRound,
    kind: 'attachment',
    defaultTag: 'attachment',
    blocksTraversal: false,
    allowOverlap: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.rocks,
    kind: 'decor',
    defaultTag: 'clutter',
    blocksTraversal: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.barrel,
    kind: 'decor',
    defaultTag: 'clutter',
    blocksTraversal: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.weaponSpear,
    kind: 'decor',
    defaultTag: 'decor',
    blocksTraversal: false
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.weaponSword,
    kind: 'decor',
    defaultTag: 'decor',
    blocksTraversal: false
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.trap,
    kind: 'hazard',
    defaultTag: 'hazard',
    blocksTraversal: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.coin,
    kind: 'loot',
    defaultTag: 'loot',
    blocksTraversal: false,
    allowOverlap: true
  },
  {
    assetId: MINI_DUNGEON_ASSET_IDS.chest,
    kind: 'loot',
    defaultTag: 'treasure',
    blocksTraversal: true
  }
])



