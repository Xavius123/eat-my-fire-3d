export interface GridCoord {
  x: number
  z: number
}

const DIRS = [
  { x: 0, z: 1 },
  { x: 0, z: -1 },
  { x: 1, z: 0 },
  { x: -1, z: 0 }
]

function key(x: number, z: number): string {
  return `${x},${z}`
}

/**
 * BFS from origin, returns all reachable tiles within `range` steps.
 * Origin tile is NOT included.
 *
 * @param blocksTraversal - Tile cannot be walked through at all (enemies, heavy allies)
 * @param blocksDestination - Tile can be walked through but not stopped on (light allies)
 */
export function getReachableTiles(
  origin: GridCoord,
  range: number,
  gridWidth: number,
  gridHeight: number,
  blocksTraversal: (x: number, z: number) => boolean,
  blocksDestination?: (x: number, z: number) => boolean
): GridCoord[] {
  const visited = new Set<string>()
  visited.add(key(origin.x, origin.z))

  const result: GridCoord[] = []
  let frontier: GridCoord[] = [origin]

  for (let step = 0; step < range; step++) {
    const next: GridCoord[] = []
    for (const pos of frontier) {
      for (const dir of DIRS) {
        const nx = pos.x + dir.x
        const nz = pos.z + dir.z
        const k = key(nx, nz)

        if (
          nx >= 0 &&
          nx < gridWidth &&
          nz >= 0 &&
          nz < gridHeight &&
          !visited.has(k) &&
          !blocksTraversal(nx, nz)
        ) {
          visited.add(k)
          next.push({ x: nx, z: nz }) // BFS expands through this tile

          // Only add as reachable destination if not occupied
          if (!blocksDestination || !blocksDestination(nx, nz)) {
            result.push({ x: nx, z: nz })
          }
        }
      }
    }
    frontier = next
  }

  return result
}

/**
 * BFS shortest path from `from` to `to`.
 * Returns ordered steps (excluding `from`, including `to`), or empty if unreachable.
 *
 * @param blocksTraversal - Tile cannot be walked through (uses same callback as getReachableTiles)
 */
export function findPath(
  from: GridCoord,
  to: GridCoord,
  gridWidth: number,
  gridHeight: number,
  blocksTraversal: (x: number, z: number) => boolean
): GridCoord[] {
  if (from.x === to.x && from.z === to.z) return []

  const visited = new Set<string>()
  visited.add(key(from.x, from.z))

  const parent = new Map<string, GridCoord>()
  let frontier: GridCoord[] = [from]
  const targetKey = key(to.x, to.z)

  while (frontier.length > 0) {
    const next: GridCoord[] = []
    for (const pos of frontier) {
      for (const dir of DIRS) {
        const nx = pos.x + dir.x
        const nz = pos.z + dir.z
        const k = key(nx, nz)

        if (
          nx >= 0 &&
          nx < gridWidth &&
          nz >= 0 &&
          nz < gridHeight &&
          !visited.has(k)
        ) {
          // Allow moving to the target even if it blocks traversal (for attack pathfinding)
          if (k !== targetKey && blocksTraversal(nx, nz)) continue

          visited.add(k)
          parent.set(k, pos)

          if (k === targetKey) {
            // Reconstruct path
            const path: GridCoord[] = []
            let current: GridCoord = { x: nx, z: nz }
            while (
              current.x !== from.x ||
              current.z !== from.z
            ) {
              path.unshift(current)
              current = parent.get(key(current.x, current.z))!
            }
            return path
          }

          next.push({ x: nx, z: nz })
        }
      }
    }
    frontier = next
  }

  return []
}

/**
 * All tiles within Manhattan distance `range` from origin.
 * Does NOT respect obstacles — purely geometric.
 */
export function getTilesInRange(
  origin: GridCoord,
  range: number,
  gridWidth: number,
  gridHeight: number
): GridCoord[] {
  const result: GridCoord[] = []
  for (let dx = -range; dx <= range; dx++) {
    for (let dz = -range; dz <= range; dz++) {
      if (dx === 0 && dz === 0) continue
      if (Math.abs(dx) + Math.abs(dz) > range) continue
      const x = origin.x + dx
      const z = origin.z + dz
      if (x >= 0 && x < gridWidth && z >= 0 && z < gridHeight) {
        result.push({ x, z })
      }
    }
  }
  return result
}
