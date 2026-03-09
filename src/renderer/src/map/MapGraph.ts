import { mulberry32 } from '../utils/prng'

export type NodeType = 'combat' | 'elite' | 'boss'

export interface MapNode {
  id: string
  col: number
  row: number
  type: NodeType
  /** IDs of nodes in the next column this node connects to */
  edges: string[]
  cleared: boolean
}

export interface MapGraph {
  nodes: Map<string, MapNode>
  /** columns[col] = array of nodes in that column */
  columns: MapNode[][]
  /** Index of the column the player can currently select from */
  currentColumn: number
}

export function generateMapGraph(seed: number, numCols = 6, maxPerCol = 3): MapGraph {
  const rng = mulberry32(seed)
  const nodes = new Map<string, MapNode>()
  const columns: MapNode[][] = []

  for (let col = 0; col < numCols; col++) {
    let count: number
    let type: NodeType

    if (col === numCols - 1) {
      count = 1
      type = 'boss'
    } else if (col === numCols - 2) {
      count = Math.max(1, Math.floor(rng() * 2) + 1)
      type = 'elite'
    } else {
      count = Math.max(1, Math.floor(rng() * maxPerCol) + 1)
      type = 'combat'
    }

    const colNodes: MapNode[] = []
    for (let row = 0; row < count; row++) {
      const node: MapNode = {
        id: `node-${col}-${row}`,
        col,
        row,
        type,
        edges: [],
        cleared: false,
      }
      nodes.set(node.id, node)
      colNodes.push(node)
    }
    columns.push(colNodes)
  }

  // Connect edges forward: each node connects to 1-2 nodes in the next column.
  // Guarantee every next-column node has at least one incoming edge.
  for (let col = 0; col < numCols - 1; col++) {
    const curr = columns[col]
    const next = columns[col + 1]
    const reached = new Set<string>()

    for (const node of curr) {
      const numEdges = next.length === 1 ? 1 : rng() < 0.5 ? 1 : 2
      // Fisher-Yates shuffle of next indices
      const indices = next.map((_, i) => i)
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
      }
      for (let k = 0; k < numEdges; k++) {
        const target = next[indices[k]]
        if (!node.edges.includes(target.id)) {
          node.edges.push(target.id)
        }
        reached.add(target.id)
      }
    }

    // Ensure every next-column node is reachable
    for (const nextNode of next) {
      if (!reached.has(nextNode.id)) {
        const from = curr[Math.floor(rng() * curr.length)]
        if (!from.edges.includes(nextNode.id)) {
          from.edges.push(nextNode.id)
        }
      }
    }
  }

  return { nodes, columns, currentColumn: 0 }
}
