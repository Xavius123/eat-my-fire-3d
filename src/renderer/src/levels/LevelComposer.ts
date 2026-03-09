import {
  FootprintCell,
  GridCoord,
  LevelDefinition,
  LevelPropPlacement,
  PrefabDefinition,
  PrefabPiece,
  ProceduralPrefabRule,
  ProceduralPropRule
} from './LevelDefinition'
import { getAssetSemantics } from './AssetSemantics'
import { CardinalSide, isNeighborAllowed } from './AdjacencyRules'
import { mulberry32 } from '../utils/prng'

export interface ComposedLevel {
  id: string
  width: number
  height: number
  playerSpawns: GridCoord[]
  enemySpawns: GridCoord[]
  blockedTiles: GridCoord[]
  tileAssetIds: Record<string, string>
  props: LevelPropPlacement[]
}

const DEFAULT_FOOTPRINT: FootprintCell[] = [{ dx: 0, dz: 0 }]
const QUARTER_TURN = Math.PI / 2
/** Disabled: multi-prop stacking on a single tile. Pending design for layered decoration. */
const PROP_STACKING_ENABLED = false
/** Disabled: cardinal-neighbor asset constraints. See AdjacencyRules.ts for the rule set. */
const ENABLE_ADJACENCY_RULES = false

const DIRS = [
  { x: 0, z: 1 },
  { x: 0, z: -1 },
  { x: 1, z: 0 },
  { x: -1, z: 0 }
]

const SIDED_DIRS: Array<{ side: CardinalSide; x: number; z: number }> = [
  { side: 'north', x: 0, z: -1 },
  { side: 'east', x: 1, z: 0 },
  { side: 'south', x: 0, z: 1 },
  { side: 'west', x: -1, z: 0 }
]

interface PathNode {
  x: number
  z: number
  cost: number
}

interface WeightedCandidate {
  x: number
  z: number
  weight: number
}

interface WeightedPrefabCandidate extends WeightedCandidate {
  rotation: RotationOption
}

interface TaggedAnchor {
  x: number
  z: number
  tag: string
}

interface SpatialRule {
  nearTags?: string[]
  nearRadius?: number
  nearWeight?: number
  nearRequired?: boolean
  minDistanceFromSpawns?: number
  maxDistanceFromSpawns?: number
}

interface PlacementState {
  width: number
  height: number
  occupied: Set<string>
  blocked: Set<string>
  props: LevelPropPlacement[]
  placedTags: TaggedAnchor[]
  cellAssetIds: Map<string, string>
}

interface PlacementDefaults {
  blocksTraversal: boolean
  allowOverlap: boolean
  tag?: string
}

interface RotationOption {
  angle: number
  quarterTurns: number
}

interface ResolvedPrefabPiecePlacement {
  x: number
  z: number
  footprint: FootprintCell[]
  y?: number
  offsetX?: number
  offsetZ?: number
  rotationY?: number
  scale?: number
  blocksTraversal: boolean
  allowOverlap: boolean
  tag?: string
  assetId: string
}

function key(x: number, z: number): string {
  return `${x},${z}`
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '-')
}

function oppositeSide(side: CardinalSide): CardinalSide {
  if (side === 'north') return 'south'
  if (side === 'south') return 'north'
  if (side === 'east') return 'west'
  return 'east'
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function inBounds(x: number, z: number, width: number, height: number): boolean {
  return x >= 0 && x < width && z >= 0 && z < height
}

function normalizeFootprint(footprint?: FootprintCell[]): FootprintCell[] {
  if (!footprint || footprint.length === 0) {
    return [...DEFAULT_FOOTPRINT]
  }

  return footprint.map((cell) => ({ dx: cell.dx, dz: cell.dz }))
}

function rotateGridOffset(dx: number, dz: number, quarterTurns: number): FootprintCell {
  const normalized = ((quarterTurns % 4) + 4) % 4

  if (normalized === 1) {
    return { dx: -dz, dz: dx }
  }

  if (normalized === 2) {
    return { dx: -dx, dz: -dz }
  }

  if (normalized === 3) {
    return { dx: dz, dz: -dx }
  }

  return { dx, dz }
}

function rotateFootprint(footprint: FootprintCell[], quarterTurns: number): FootprintCell[] {
  return footprint.map((cell) => rotateGridOffset(cell.dx, cell.dz, quarterTurns))
}

function rotateVector(x: number, z: number, angle: number): { x: number; z: number } {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: x * cos - z * sin,
    z: x * sin + z * cos
  }
}

function normalizeQuarterTurns(angle: number): number {
  return ((Math.round(angle / QUARTER_TURN) % 4) + 4) % 4
}

function buildRotationOptions(rotationChoices?: number[]): RotationOption[] {
  const source = rotationChoices && rotationChoices.length > 0 ? rotationChoices : [0]
  return source.map((angle) => ({
    angle,
    quarterTurns: normalizeQuarterTurns(angle)
  }))
}

function manhattan(a: GridCoord, b: GridCoord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.z - b.z)
}

function expandFootprint(
  originX: number,
  originZ: number,
  footprint: FootprintCell[]
): GridCoord[] {
  return footprint.map((cell) => ({ x: originX + cell.dx, z: originZ + cell.dz }))
}

function nearestDistanceToAnySpawn(x: number, z: number, spawns: GridCoord[]): number {
  let best = Infinity
  for (const spawn of spawns) {
    const distance = manhattan({ x, z }, spawn)
    if (distance < best) {
      best = distance
    }
  }
  return best
}

function passesSpawnDistanceRule(
  rule: SpatialRule,
  x: number,
  z: number,
  spawns: GridCoord[]
): boolean {
  if (spawns.length === 0) return true
  const nearest = nearestDistanceToAnySpawn(x, z, spawns)

  if (rule.minDistanceFromSpawns !== undefined && nearest < rule.minDistanceFromSpawns) {
    return false
  }

  if (rule.maxDistanceFromSpawns !== undefined && nearest > rule.maxDistanceFromSpawns) {
    return false
  }

  return true
}

function canPlaceFootprint(
  x: number,
  z: number,
  footprint: FootprintCell[],
  occupied: Set<string>,
  spawnTiles: Set<string>,
  width: number,
  height: number,
  allowOverlap: boolean
): boolean {
  const cells = expandFootprint(x, z, footprint)
  for (const cell of cells) {
    if (!inBounds(cell.x, cell.z, width, height)) return false

    const cellKey = key(cell.x, cell.z)
    if (spawnTiles.has(cellKey)) {
      return false
    }

    if (!allowOverlap && occupied.has(cellKey)) {
      return false
    }
  }

  return true
}

function passesAdjacencyRules(
  assetId: string,
  x: number,
  z: number,
  footprint: FootprintCell[],
  width: number,
  height: number,
  cellAssetIds: Map<string, string>,
  stagedAssets?: Map<string, string>
): boolean {
  if (!ENABLE_ADJACENCY_RULES) return true

  const occupiedCells = expandFootprint(x, z, footprint)
  const occupiedSet = new Set(occupiedCells.map((cell) => key(cell.x, cell.z)))

  for (const cell of occupiedCells) {
    for (const dir of SIDED_DIRS) {
      const nx = cell.x + dir.x
      const nz = cell.z + dir.z
      if (!inBounds(nx, nz, width, height)) continue

      const neighborKey = key(nx, nz)
      if (occupiedSet.has(neighborKey)) continue

      const neighborAssetId = stagedAssets?.get(neighborKey) ?? cellAssetIds.get(neighborKey)
      if (!neighborAssetId) continue

      if (!isNeighborAllowed(assetId, dir.side, neighborAssetId)) {
        return false
      }

      if (!isNeighborAllowed(neighborAssetId, oppositeSide(dir.side), assetId)) {
        return false
      }
    }
  }

  return true
}

function countNearbyTags(
  x: number,
  z: number,
  radius: number,
  tags: Set<string>,
  placedTags: TaggedAnchor[]
): number {
  let count = 0
  for (const placed of placedTags) {
    if (!tags.has(placed.tag)) continue

    const dist = manhattan({ x, z }, { x: placed.x, z: placed.z })
    if (dist <= radius) {
      count += 1
    }
  }
  return count
}

function computeCandidateWeight(
  rule: SpatialRule,
  x: number,
  z: number,
  placedTags: TaggedAnchor[]
): number {
  const nearTags = rule.nearTags ?? []
  if (nearTags.length === 0) return 1

  const radius = Math.max(1, Math.floor(rule.nearRadius ?? 2))
  const nearWeight = Math.max(0, rule.nearWeight ?? 2)
  const nearbyCount = countNearbyTags(x, z, radius, new Set(nearTags), placedTags)

  if (rule.nearRequired && nearbyCount === 0) {
    return 0
  }

  return 1 + nearbyCount * nearWeight
}

function pickWeightedCandidate<T extends { weight: number }>(
  candidates: T[],
  random: () => number
): T | null {
  if (candidates.length === 0) return null

  let total = 0
  for (const candidate of candidates) {
    total += candidate.weight
  }

  if (total <= 0) return null

  let roll = random() * total
  for (const candidate of candidates) {
    roll -= candidate.weight
    if (roll <= 0) return candidate
  }

  return candidates[candidates.length - 1]
}

function resolveRuleTargetCount(
  rule: ProceduralPropRule,
  width: number,
  height: number,
  random: () => number
): number {
  const hasCountRange = rule.minCount !== undefined || rule.maxCount !== undefined
  if (hasCountRange) {
    const min = Math.max(0, Math.floor(rule.minCount ?? 0))
    const max = Math.max(min, Math.floor(rule.maxCount ?? min))
    return min + Math.floor(random() * (max - min + 1))
  }

  const density = clamp01(rule.density ?? 0)
  return Math.max(0, Math.round(density * width * height))
}

function resolvePrefabTargetCount(rule: ProceduralPrefabRule, random: () => number): number {
  const min = Math.max(0, Math.floor(rule.minCount ?? 0))
  const max = Math.max(min, Math.floor(rule.maxCount ?? min))
  return min + Math.floor(random() * (max - min + 1))
}

function sampleRange(range: [number, number] | undefined, random: () => number): number | undefined {
  if (!range) return undefined

  const min = Math.min(range[0], range[1])
  const max = Math.max(range[0], range[1])
  return min + (max - min) * random()
}

function resolvePropRotation(rule: ProceduralPropRule, random: () => number): number | undefined {
  if (rule.randomYaw) {
    return random() * Math.PI * 2
  }

  const rotationChoices = rule.rotationChoices ?? []
  if (rotationChoices.length === 0) return undefined

  const idx = Math.floor(random() * rotationChoices.length)
  return rotationChoices[idx]
}

function resolvePlacementDefaults(
  assetId: string,
  blocksTraversal: boolean | undefined,
  allowOverlap: boolean | undefined,
  tag: string | undefined
): PlacementDefaults {
  const semantics = getAssetSemantics(assetId)
  return {
    blocksTraversal: blocksTraversal ?? semantics?.blocksTraversal ?? false,
    allowOverlap: PROP_STACKING_ENABLED
      ? (allowOverlap ?? semantics?.allowOverlap ?? false)
      : false,
    tag: tag ?? semantics?.defaultTag
  }
}

function applyPlacement(state: PlacementState, placement: LevelPropPlacement): void {
  const footprint = normalizeFootprint(placement.footprint)
  const allowOverlap = placement.allowOverlap ?? false
  const blocksTraversal = placement.blocksTraversal ?? false

  const normalized: LevelPropPlacement = {
    ...placement,
    footprint,
    allowOverlap,
    blocksTraversal
  }

  state.props.push(normalized)

  if (normalized.tag) {
    state.placedTags.push({ x: normalized.x, z: normalized.z, tag: normalized.tag })
  }

  for (const cell of expandFootprint(normalized.x, normalized.z, footprint)) {
    if (!inBounds(cell.x, cell.z, state.width, state.height)) continue

    const cellKey = key(cell.x, cell.z)
    if (!allowOverlap) {
      state.occupied.add(cellKey)
      state.cellAssetIds.set(cellKey, normalized.assetId)
    }

    if (blocksTraversal) {
      state.blocked.add(cellKey)
    }
  }
}

function resolvePrefabPiecePlacement(
  piece: PrefabPiece,
  originX: number,
  originZ: number,
  rotation: RotationOption
): ResolvedPrefabPiecePlacement {
  const defaults = resolvePlacementDefaults(
    piece.assetId,
    piece.blocksTraversal,
    piece.allowOverlap,
    piece.tag
  )

  const originOffset = rotateGridOffset(piece.dx, piece.dz, rotation.quarterTurns)
  const x = originX + originOffset.dx
  const z = originZ + originOffset.dz

  const footprint = rotateFootprint(normalizeFootprint(piece.footprint), rotation.quarterTurns)

  const hasLocalOffset = piece.offsetX !== undefined || piece.offsetZ !== undefined
  const rotatedOffset = hasLocalOffset
    ? rotateVector(piece.offsetX ?? 0, piece.offsetZ ?? 0, rotation.angle)
    : undefined

  const rotationY = (piece.rotationY ?? 0) + rotation.angle

  return {
    x,
    z,
    footprint,
    y: piece.y,
    offsetX: rotatedOffset?.x,
    offsetZ: rotatedOffset?.z,
    rotationY,
    scale: piece.scale,
    blocksTraversal: defaults.blocksTraversal,
    allowOverlap: defaults.allowOverlap,
    tag: defaults.tag,
    assetId: piece.assetId
  }
}

function canPlacePrefab(
  prefab: PrefabDefinition,
  originX: number,
  originZ: number,
  rotation: RotationOption,
  occupied: Set<string>,
  spawnTiles: Set<string>,
  cellAssetIds: Map<string, string>,
  width: number,
  height: number
): boolean {
  const reserved = new Set<string>()
  const stagedAssets = new Map<string, string>()

  for (const piece of prefab.pieces) {
    const resolved = resolvePrefabPiecePlacement(piece, originX, originZ, rotation)
    const footprintCells = expandFootprint(resolved.x, resolved.z, resolved.footprint)

    for (const cell of footprintCells) {
      if (!inBounds(cell.x, cell.z, width, height)) {
        return false
      }

      const cellKey = key(cell.x, cell.z)
      if (spawnTiles.has(cellKey)) {
        return false
      }

      if (!resolved.allowOverlap && (occupied.has(cellKey) || reserved.has(cellKey))) {
        return false
      }
    }

    if (
      !passesAdjacencyRules(
        resolved.assetId,
        resolved.x,
        resolved.z,
        resolved.footprint,
        width,
        height,
        cellAssetIds,
        stagedAssets
      )
    ) {
      return false
    }

    if (!resolved.allowOverlap) {
      for (const cell of footprintCells) {
        const cellKey = key(cell.x, cell.z)
        reserved.add(cellKey)
        stagedAssets.set(cellKey, resolved.assetId)
      }
    }
  }

  return true
}

function placePrefab(
  state: PlacementState,
  prefab: PrefabDefinition,
  originX: number,
  originZ: number,
  rotation: RotationOption,
  instanceIndex: number
): void {
  const prefabId = sanitizeId(prefab.id)

  prefab.pieces.forEach((piece, pieceIndex) => {
    const resolved = resolvePrefabPiecePlacement(piece, originX, originZ, rotation)
    const placement: LevelPropPlacement = {
      id: `proc-prefab-${prefabId}-${instanceIndex}-${pieceIndex}-${originX}-${originZ}`,
      assetId: resolved.assetId,
      x: resolved.x,
      z: resolved.z,
      y: resolved.y,
      offsetX: resolved.offsetX,
      offsetZ: resolved.offsetZ,
      rotationY: resolved.rotationY,
      scale: resolved.scale,
      blocksTraversal: resolved.blocksTraversal,
      footprint: resolved.footprint,
      allowOverlap: resolved.allowOverlap,
      tag: resolved.tag
    }

    applyPlacement(state, placement)
  })
}

function hasAnyTeamPath(
  width: number,
  height: number,
  players: GridCoord[],
  enemies: GridCoord[],
  blocked: Set<string>
): boolean {
  if (players.length === 0 || enemies.length === 0) return true

  const targetSet = new Set(enemies.map((coord) => key(coord.x, coord.z)))
  const visited = new Set<string>()
  const queue: GridCoord[] = []

  for (const player of players) {
    const playerKey = key(player.x, player.z)
    if (!inBounds(player.x, player.z, width, height)) continue
    if (blocked.has(playerKey)) continue
    visited.add(playerKey)
    queue.push(player)
  }

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]
    const currentKey = key(current.x, current.z)
    if (targetSet.has(currentKey)) return true

    for (const dir of DIRS) {
      const nx = current.x + dir.x
      const nz = current.z + dir.z
      if (!inBounds(nx, nz, width, height)) continue

      const nextKey = key(nx, nz)
      if (visited.has(nextKey) || blocked.has(nextKey)) continue

      visited.add(nextKey)
      queue.push({ x: nx, z: nz })
    }
  }

  return false
}

function findLowCostPath(
  start: GridCoord,
  goal: GridCoord,
  width: number,
  height: number,
  blocked: Set<string>
): GridCoord[] {
  if (!inBounds(start.x, start.z, width, height)) return []
  if (!inBounds(goal.x, goal.z, width, height)) return []

  const startKey = key(start.x, start.z)
  const goalKey = key(goal.x, goal.z)

  const frontier: PathNode[] = [{ x: start.x, z: start.z, cost: 0 }]
  const bestCost = new Map<string, number>()
  const parent = new Map<string, string>()
  bestCost.set(startKey, 0)

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.cost - b.cost)
    const current = frontier.shift()
    if (!current) break

    const currentKey = key(current.x, current.z)

    if (currentKey === goalKey) break
    if (current.cost > (bestCost.get(currentKey) ?? Infinity)) continue

    for (const dir of DIRS) {
      const nx = current.x + dir.x
      const nz = current.z + dir.z
      if (!inBounds(nx, nz, width, height)) continue

      const nextKey = key(nx, nz)
      const stepCost = blocked.has(nextKey) ? 6 : 1
      const total = current.cost + stepCost

      if (total >= (bestCost.get(nextKey) ?? Infinity)) continue
      bestCost.set(nextKey, total)
      parent.set(nextKey, currentKey)
      frontier.push({ x: nx, z: nz, cost: total })
    }
  }

  if (!bestCost.has(goalKey)) return []

  const path: GridCoord[] = []
  let cursor = goalKey

  while (true) {
    const [xText, zText] = cursor.split(',')
    path.unshift({ x: Number(xText), z: Number(zText) })

    if (cursor === startKey) break

    const prev = parent.get(cursor)
    if (!prev) return []
    cursor = prev
  }

  return path
}

function ensureReachablePath(
  width: number,
  height: number,
  players: GridCoord[],
  enemies: GridCoord[],
  blocked: Set<string>
): Set<string> {
  const carved = new Set<string>()
  if (hasAnyTeamPath(width, height, players, enemies, blocked)) return carved

  const pairs: Array<{ player: GridCoord; enemy: GridCoord; distance: number }> = []
  for (const player of players) {
    for (const enemy of enemies) {
      pairs.push({
        player,
        enemy,
        distance: manhattan(player, enemy)
      })
    }
  }

  pairs.sort((a, b) => a.distance - b.distance)

  for (const pair of pairs) {
    const carvePath = findLowCostPath(pair.player, pair.enemy, width, height, blocked)
    for (const cell of carvePath) {
      const cellKey = key(cell.x, cell.z)
      if (blocked.delete(cellKey)) {
        carved.add(cellKey)
      }
    }

    if (hasAnyTeamPath(width, height, players, enemies, blocked)) return carved
  }

  return carved
}

export function composeLevel(definition: LevelDefinition): ComposedLevel {
  const tileAssetIds = { ...(definition.staticTileAssets ?? {}) }

  const state: PlacementState = {
    width: definition.width,
    height: definition.height,
    occupied: new Set<string>(),
    blocked: new Set<string>(),
    props: [],
    placedTags: [],
    cellAssetIds: new Map<string, string>()
  }

  const spawnTiles = [...definition.playerSpawns, ...definition.enemySpawns]
  const spawnTileKeys = new Set(spawnTiles.map((spawn) => key(spawn.x, spawn.z)))

  for (const spawn of spawnTiles) {
    state.occupied.add(key(spawn.x, spawn.z))
  }

  for (const tile of definition.staticBlockedTiles ?? []) {
    const tileKey = key(tile.x, tile.z)
    state.blocked.add(tileKey)
    state.occupied.add(tileKey)
  }

  for (const prop of definition.staticProps ?? []) {
    const defaults = resolvePlacementDefaults(
      prop.assetId,
      prop.blocksTraversal,
      prop.allowOverlap,
      prop.tag
    )

    const footprint = normalizeFootprint(prop.footprint)
    if (
      !canPlaceFootprint(
        prop.x,
        prop.z,
        footprint,
        state.occupied,
        spawnTileKeys,
        definition.width,
        definition.height,
        defaults.allowOverlap
      )
    ) {
      continue
    }

    if (
      !passesAdjacencyRules(
        prop.assetId,
        prop.x,
        prop.z,
        footprint,
        definition.width,
        definition.height,
        state.cellAssetIds
      )
    ) {
      continue
    }

    applyPlacement(state, {
      ...prop,
      blocksTraversal: defaults.blocksTraversal,
      allowOverlap: defaults.allowOverlap,
      tag: defaults.tag,
      footprint
    })
  }

  const procedural = definition.procedural
  if (procedural) {
    const random = mulberry32(procedural.seed)

    const blockedChance = clamp01(procedural.blockedTileChance ?? 0)
    if (blockedChance > 0) {
      for (let x = 0; x < definition.width; x++) {
        for (let z = 0; z < definition.height; z++) {
          const tileKey = key(x, z)
          if (state.occupied.has(tileKey)) continue
          if (random() <= blockedChance) {
            state.blocked.add(tileKey)
            state.occupied.add(tileKey)
          }
        }
      }
    }

    const prefabRules = procedural.prefabRules ?? []
    const prefabMap = procedural.prefabs ?? {}

    for (const rule of prefabRules) {
      const prefab = prefabMap[rule.prefabId]
      if (!prefab || prefab.pieces.length === 0) continue

      const perMapChance = clamp01(rule.perMapChance ?? 1)
      if (random() > perMapChance) continue

      const targetCount = resolvePrefabTargetCount(rule, random)
      const rotations = buildRotationOptions(rule.rotationChoices)

      for (let n = 0; n < targetCount; n++) {
        const candidates: WeightedPrefabCandidate[] = []

        for (let x = 0; x < definition.width; x++) {
          for (let z = 0; z < definition.height; z++) {
            if (!passesSpawnDistanceRule(rule, x, z, spawnTiles)) continue

            const weight = computeCandidateWeight(rule, x, z, state.placedTags)
            if (weight <= 0) continue

            for (const rotation of rotations) {
              if (
                !canPlacePrefab(
                  prefab,
                  x,
                  z,
                  rotation,
                  state.occupied,
                  spawnTileKeys,
                  state.cellAssetIds,
                  definition.width,
                  definition.height
                )
              ) {
                continue
              }

              candidates.push({ x, z, rotation, weight })
            }
          }
        }

        const chosen = pickWeightedCandidate(candidates, random)
        if (!chosen) break

        placePrefab(state, prefab, chosen.x, chosen.z, chosen.rotation, n)
      }
    }

    for (const rule of procedural.propRules ?? []) {
      const perMapChance = clamp01(rule.perMapChance ?? 1)
      if (random() > perMapChance) continue

      const targetCount = resolveRuleTargetCount(rule, definition.width, definition.height, random)
      const defaults = resolvePlacementDefaults(
        rule.assetId,
        rule.blocksTraversal,
        rule.allowOverlap,
        rule.tag
      )
      const footprint = normalizeFootprint(rule.footprint)

      for (let n = 0; n < targetCount; n++) {
        const candidates: WeightedCandidate[] = []

        for (let x = 0; x < definition.width; x++) {
          for (let z = 0; z < definition.height; z++) {
            if (!passesSpawnDistanceRule(rule, x, z, spawnTiles)) continue

            if (
              !canPlaceFootprint(
                x,
                z,
                footprint,
                state.occupied,
                spawnTileKeys,
                definition.width,
                definition.height,
                defaults.allowOverlap
              )
            ) {
              continue
            }

            if (
              !passesAdjacencyRules(
                rule.assetId,
                x,
                z,
                footprint,
                definition.width,
                definition.height,
                state.cellAssetIds
              )
            ) {
              continue
            }

            const weight = computeCandidateWeight(rule, x, z, state.placedTags)
            if (weight <= 0) continue
            candidates.push({ x, z, weight })
          }
        }

        const chosen = pickWeightedCandidate(candidates, random)
        if (!chosen) break

        const y = sampleRange(rule.yJitter, random)
        const sampledScale = sampleRange(rule.scaleJitter, random)
        const scale = sampledScale !== undefined ? Math.max(0.01, sampledScale) : undefined

        applyPlacement(state, {
          id: `proc-${sanitizeId(rule.assetId)}-${chosen.x}-${chosen.z}-${n}`,
          assetId: rule.assetId,
          x: chosen.x,
          z: chosen.z,
          y,
          rotationY: resolvePropRotation(rule, random),
          scale,
          blocksTraversal: defaults.blocksTraversal,
          footprint,
          allowOverlap: defaults.allowOverlap,
          tag: defaults.tag
        })
      }
    }
  }

  for (const spawn of spawnTiles) {
    state.blocked.delete(key(spawn.x, spawn.z))
  }

  let carvedCells = new Set<string>()
  if (definition.ensureReachablePath ?? true) {
    carvedCells = ensureReachablePath(
      definition.width,
      definition.height,
      definition.playerSpawns,
      definition.enemySpawns,
      state.blocked
    )
  }

  if (carvedCells.size > 0) {
    for (let i = state.props.length - 1; i >= 0; i--) {
      const prop = state.props[i]
      if (!prop.blocksTraversal) continue

      const footprint = normalizeFootprint(prop.footprint)
      const overlapsCarved = expandFootprint(prop.x, prop.z, footprint).some((cell) =>
        carvedCells.has(key(cell.x, cell.z))
      )

      if (overlapsCarved) {
        state.props.splice(i, 1)
      }
    }
  }

  const blockedTiles = Array.from(state.blocked).map((entry) => {
    const [xText, zText] = entry.split(',')
    return { x: Number(xText), z: Number(zText) }
  })

  return {
    id: definition.id,
    width: definition.width,
    height: definition.height,
    playerSpawns: definition.playerSpawns,
    enemySpawns: definition.enemySpawns,
    blockedTiles,
    tileAssetIds,
    props: state.props
  }
}










