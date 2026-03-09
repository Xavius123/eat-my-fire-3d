import { MINI_DUNGEON_ASSET_IDS } from '../assets/AssetLibrary'
import { AssetSemanticKind, getAssetSemantics } from './AssetSemantics'

export type CardinalSide = 'north' | 'east' | 'south' | 'west'

type RuleSide = CardinalSide | 'any'

interface NeighborRule {
  allowKinds?: AssetSemanticKind[]
  allowAssetIds?: string[]
  blockKinds?: AssetSemanticKind[]
  blockAssetIds?: string[]
}

interface AdjacencyRule {
  any?: NeighborRule
  north?: NeighborRule
  east?: NeighborRule
  south?: NeighborRule
  west?: NeighborRule
}

const STRUCTURAL_KINDS: AssetSemanticKind[] = ['wall', 'doorway', 'structure']
const PROP_KINDS: AssetSemanticKind[] = ['decor', 'loot', 'attachment']

const NON_HAZARD_KINDS: AssetSemanticKind[] = [
  'floor',
  'wall',
  'doorway',
  'structure',
  'decor',
  'loot',
  'attachment'
]

const LIGHT_PROP_KINDS: AssetSemanticKind[] = ['floor', 'decor', 'loot', 'attachment']
const CLUTTER_COMPATIBLE_KINDS: AssetSemanticKind[] = [
  'floor',
  'wall',
  'doorway',
  'structure',
  'decor',
  'loot'
]

const KIND_RULES: Partial<Record<AssetSemanticKind, AdjacencyRule>> = {
  // Baseline semantic defaults. More specific model rules are in MINI_DUNGEON_ASSET_RULES.
  attachment: {
    any: {
      blockKinds: ['hazard']
    }
  },
  hazard: {
    any: {
      blockKinds: ['hazard', 'attachment']
    }
  }
}

/**
 * Mini-dungeon adjacency matrix. This is the primary tuning surface for
 * "which models can appear on each side of another model".
 */
const MINI_DUNGEON_ASSET_RULES: Record<string, AdjacencyRule> = {
  [MINI_DUNGEON_ASSET_IDS.floor]: {
    any: { allowKinds: NON_HAZARD_KINDS }
  },
  [MINI_DUNGEON_ASSET_IDS.floorDetail]: {
    any: { allowKinds: NON_HAZARD_KINDS }
  },
  [MINI_DUNGEON_ASSET_IDS.dirt]: {
    any: { allowKinds: NON_HAZARD_KINDS }
  },
  [MINI_DUNGEON_ASSET_IDS.stones]: {
    any: { allowKinds: NON_HAZARD_KINDS }
  },

  [MINI_DUNGEON_ASSET_IDS.wall]: {
    any: { blockKinds: ['hazard'] },
    north: { allowKinds: [...STRUCTURAL_KINDS, ...PROP_KINDS] },
    east: { allowKinds: [...STRUCTURAL_KINDS, ...PROP_KINDS] },
    south: { allowKinds: [...STRUCTURAL_KINDS, ...PROP_KINDS] },
    west: { allowKinds: [...STRUCTURAL_KINDS, ...PROP_KINDS] }
  },
  [MINI_DUNGEON_ASSET_IDS.wallHalf]: {
    any: { blockKinds: ['hazard'] },
    north: { allowKinds: [...STRUCTURAL_KINDS, ...PROP_KINDS] },
    east: { allowKinds: [...STRUCTURAL_KINDS, ...PROP_KINDS] },
    south: { allowKinds: [...STRUCTURAL_KINDS, ...PROP_KINDS] },
    west: { allowKinds: [...STRUCTURAL_KINDS, ...PROP_KINDS] }
  },
  [MINI_DUNGEON_ASSET_IDS.wallNarrow]: {
    any: { blockKinds: ['hazard'] },
    north: { allowKinds: [...STRUCTURAL_KINDS, ...PROP_KINDS] },
    east: { allowKinds: [...STRUCTURAL_KINDS, ...PROP_KINDS] },
    south: { allowKinds: [...STRUCTURAL_KINDS, ...PROP_KINDS] },
    west: { allowKinds: [...STRUCTURAL_KINDS, ...PROP_KINDS] }
  },

  [MINI_DUNGEON_ASSET_IDS.wallOpening]: {
    any: { blockKinds: ['hazard'] },
    north: { allowKinds: [...STRUCTURAL_KINDS, ...LIGHT_PROP_KINDS] },
    east: { allowKinds: [...STRUCTURAL_KINDS, ...LIGHT_PROP_KINDS] },
    south: { allowKinds: [...STRUCTURAL_KINDS, ...LIGHT_PROP_KINDS] },
    west: { allowKinds: [...STRUCTURAL_KINDS, ...LIGHT_PROP_KINDS] }
  },
  [MINI_DUNGEON_ASSET_IDS.gate]: {
    any: { blockKinds: ['hazard'] },
    north: { allowKinds: [...STRUCTURAL_KINDS, ...LIGHT_PROP_KINDS] },
    east: { allowKinds: [...STRUCTURAL_KINDS, ...LIGHT_PROP_KINDS] },
    south: { allowKinds: [...STRUCTURAL_KINDS, ...LIGHT_PROP_KINDS] },
    west: { allowKinds: [...STRUCTURAL_KINDS, ...LIGHT_PROP_KINDS] }
  },

  [MINI_DUNGEON_ASSET_IDS.column]: {
    any: { blockKinds: ['hazard'] }
  },
  [MINI_DUNGEON_ASSET_IDS.woodStructure]: {
    any: { blockKinds: ['hazard'] }
  },
  [MINI_DUNGEON_ASSET_IDS.woodSupport]: {
    any: { blockKinds: ['hazard'] }
  },
  [MINI_DUNGEON_ASSET_IDS.stairs]: {
    any: { blockKinds: ['hazard'] }
  },

  [MINI_DUNGEON_ASSET_IDS.banner]: {
    any: { allowKinds: [...STRUCTURAL_KINDS, ...LIGHT_PROP_KINDS], blockKinds: ['hazard'] }
  },
  [MINI_DUNGEON_ASSET_IDS.shieldRectangle]: {
    any: { allowKinds: [...STRUCTURAL_KINDS, ...LIGHT_PROP_KINDS], blockKinds: ['hazard'] }
  },
  [MINI_DUNGEON_ASSET_IDS.shieldRound]: {
    any: { allowKinds: [...STRUCTURAL_KINDS, ...LIGHT_PROP_KINDS], blockKinds: ['hazard'] }
  },

  [MINI_DUNGEON_ASSET_IDS.rocks]: {
    any: { allowKinds: CLUTTER_COMPATIBLE_KINDS, blockKinds: ['attachment'] }
  },
  [MINI_DUNGEON_ASSET_IDS.barrel]: {
    any: { allowKinds: CLUTTER_COMPATIBLE_KINDS, blockKinds: ['attachment'] }
  },

  [MINI_DUNGEON_ASSET_IDS.weaponSpear]: {
    any: { allowKinds: NON_HAZARD_KINDS, blockKinds: ['hazard'] }
  },
  [MINI_DUNGEON_ASSET_IDS.weaponSword]: {
    any: { allowKinds: NON_HAZARD_KINDS, blockKinds: ['hazard'] }
  },

  [MINI_DUNGEON_ASSET_IDS.trap]: {
    any: {
      allowKinds: ['floor', 'wall', 'doorway', 'structure', 'decor'],
      blockKinds: ['hazard', 'loot', 'attachment'],
      blockAssetIds: [MINI_DUNGEON_ASSET_IDS.trap]
    }
  },

  [MINI_DUNGEON_ASSET_IDS.coin]: {
    any: {
      allowKinds: NON_HAZARD_KINDS,
      blockKinds: ['hazard']
    }
  },
  [MINI_DUNGEON_ASSET_IDS.chest]: {
    any: {
      allowKinds: ['floor', 'wall', 'doorway', 'structure', 'decor', 'attachment'],
      blockKinds: ['hazard'],
      blockAssetIds: [MINI_DUNGEON_ASSET_IDS.chest]
    }
  }
}

function evaluateNeighborRule(
  rule: NeighborRule | undefined,
  neighborAssetId: string,
  neighborKind: AssetSemanticKind | undefined
): boolean {
  if (!rule) return true

  if (rule.blockAssetIds?.includes(neighborAssetId)) {
    return false
  }

  if (neighborKind && rule.blockKinds?.includes(neighborKind)) {
    return false
  }

  const hasAllowConstraint =
    (rule.allowAssetIds?.length ?? 0) > 0 || (rule.allowKinds?.length ?? 0) > 0

  if (!hasAllowConstraint) {
    return true
  }

  const passesAssetAllow = rule.allowAssetIds?.includes(neighborAssetId) ?? false
  const passesKindAllow = neighborKind ? rule.allowKinds?.includes(neighborKind) ?? false : false
  return passesAssetAllow || passesKindAllow
}

function getSideRule(rule: AdjacencyRule | undefined, side: RuleSide): NeighborRule | undefined {
  if (!rule) return undefined
  return side === 'any' ? rule.any : rule[side]
}

/**
 * Returns true when `neighborAssetId` is allowed on `side` of `anchorAssetId`.
 * Rules are resolved from semantic-kind defaults + model matrix overrides.
 */
export function isNeighborAllowed(
  anchorAssetId: string,
  side: CardinalSide,
  neighborAssetId: string
): boolean {
  const anchorKind = getAssetSemantics(anchorAssetId)?.kind
  const neighborKind = getAssetSemantics(neighborAssetId)?.kind

  const rulesToCheck: AdjacencyRule[] = []
  if (anchorKind && KIND_RULES[anchorKind]) {
    rulesToCheck.push(KIND_RULES[anchorKind]!)
  }
  if (MINI_DUNGEON_ASSET_RULES[anchorAssetId]) {
    rulesToCheck.push(MINI_DUNGEON_ASSET_RULES[anchorAssetId])
  }

  for (const rule of rulesToCheck) {
    const anyRule = getSideRule(rule, 'any')
    if (!evaluateNeighborRule(anyRule, neighborAssetId, neighborKind)) {
      return false
    }

    const sideRule = getSideRule(rule, side)
    if (!evaluateNeighborRule(sideRule, neighborAssetId, neighborKind)) {
      return false
    }
  }

  return true
}
