import { mulberry32 } from '../utils/prng'
import type { Faction } from '../entities/EnemyData'

export type NodeType = 'combat' | 'event' | 'shop' | 'elite' | 'miniboss' | 'boss' | 'rest' | 'camp'

export interface MapNode {
  id: string
  col: number
  row: number
  type: NodeType
  /** IDs of nodes in the next column this node connects to */
  edges: string[]
  cleared: boolean
  /** Enemy faction for combat/elite nodes. Determines enemy types and reward mod type. */
  faction?: Faction
}

export interface MapGraph {
  nodes: Map<string, MapNode>
  /** columns[col] = array of nodes in that column */
  columns: MapNode[][]
  /** Index of the column the player can currently select from */
  currentColumn: number
}

export interface MapGraphOptions {
  numCols?: number
  maxPerCol?: number
  /** If set, all combat/elite/miniboss nodes use this faction. */
  lockedFaction?: Faction
}

export function generateMapGraph(seed: number, options: MapGraphOptions = {}): MapGraph {
  const { numCols = 7, maxPerCol = 3, lockedFaction } = options
  const rng = mulberry32(seed)
  const nodes = new Map<string, MapNode>()
  const columns: MapNode[][] = []

  // Structured checkpoints — rest gives a guaranteed exhale mid-run
  const restCol    = Math.floor(numCols / 2)         // col 3 of 7: guaranteed rest
  const miniBossCol = Math.floor(numCols / 2) + 1    // col 4 of 7: miniboss checkpoint
  const eliteCol   = numCols - 2                     // col 5 of 7: elite before boss

  for (let col = 0; col < numCols; col++) {
    let count: number
    let type: NodeType

    if (col === numCols - 1) {
      // Final column: boss
      count = 1
      type = 'boss'
    } else if (col === eliteCol) {
      // Pre-boss: elite encounters
      count = Math.max(1, Math.floor(rng() * 2) + 1)
      type = 'elite'
    } else if (col === miniBossCol) {
      // Miniboss checkpoint — single node, no path choice
      count = 1
      type = 'miniboss'
    } else if (col === restCol) {
      // Guaranteed rest — single node, the party stops
      count = 1
      type = 'rest'
    } else if (col === 0) {
      // Entry: always combat
      count = Math.max(1, Math.floor(rng() * maxPerCol) + 1)
      type = 'combat'
    } else {
      // Early mix (cols 1–2): combat, events, camp fires
      // Late mix (col after miniboss): combat, events, shop
      count = Math.max(1, Math.floor(rng() * maxPerCol) + 1)
      type = 'combat' // overridden per-node below
    }

    const colNodes: MapNode[] = []
    for (let row = 0; row < count; row++) {
      let nodeType = type
      if (col > 0 && col !== restCol && col !== miniBossCol && col < eliteCol) {
        const roll = rng()
        if (col < restCol) {
          // Early columns: camps are the treat, shops come later
          if (roll < 0.20) nodeType = 'camp'
          else if (roll < 0.42) nodeType = 'event'
          else nodeType = 'combat'
        } else {
          // Late columns: shops open up, no more camp nodes
          if (roll < 0.15) nodeType = 'shop'
          else if (roll < 0.35) nodeType = 'event'
          else nodeType = 'combat'
        }
      }
      // Assign faction for combat-type nodes (mix tech / fantasy unless map is locked)
      let faction: Faction | undefined
      if (nodeType === 'combat' || nodeType === 'elite' || nodeType === 'miniboss') {
        faction = lockedFaction ?? (rng() < 0.35 ? 'tech' : 'fantasy')
      }

      const node: MapNode = {
        id: `node-${col}-${row}`,
        col,
        row,
        type: nodeType,
        edges: [],
        cleared: false,
        faction,
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

/**
 * When the final-column boss is cleared, `currentColumn` becomes `columns.length` and there
 * are no nodes to select — the run would soft-lock. Appending a new "act" fixes endless play.
 *
 * Idempotent: if `currentColumn` already points at an existing column, does nothing.
 */
export function extendMapGraph(
  graph: MapGraph,
  seed: number,
  options: MapGraphOptions & { numCols?: number } = {}
): void {
  if (graph.currentColumn < graph.columns.length) return

  const { numCols: segmentCols = 7, maxPerCol = 3, lockedFaction } = options
  const n = Math.max(7, Math.min(16, segmentCols))

  const rng = mulberry32(seed)
  const startCol = graph.columns.length
  const prevCol = graph.columns[startCol - 1]
  if (!prevCol?.length) return

  const restCol = Math.floor(n / 2)
  const miniBossCol = Math.floor(n / 2) + 1
  const eliteCol = n - 2

  for (let c = 0; c < n; c++) {
    const col = startCol + c
    let count: number
    let type: NodeType

    if (c === n - 1) {
      count = 1
      type = 'boss'
    } else if (c === eliteCol) {
      count = Math.max(1, Math.floor(rng() * 2) + 1)
      type = 'elite'
    } else if (c === miniBossCol) {
      count = 1
      type = 'miniboss'
    } else if (c === restCol) {
      count = 1
      type = 'rest'
    } else if (c === 0) {
      count = Math.max(1, Math.floor(rng() * maxPerCol) + 1)
      type = 'combat'
    } else {
      count = Math.max(1, Math.floor(rng() * maxPerCol) + 1)
      type = 'combat'
    }

    const colNodes: MapNode[] = []
    for (let row = 0; row < count; row++) {
      let nodeType = type
      if (c > 0 && c !== restCol && c !== miniBossCol && c < eliteCol) {
        const roll = rng()
        if (c < restCol) {
          if (roll < 0.2) nodeType = 'camp'
          else if (roll < 0.42) nodeType = 'event'
          else nodeType = 'combat'
        } else {
          if (roll < 0.15) nodeType = 'shop'
          else if (roll < 0.35) nodeType = 'event'
          else nodeType = 'combat'
        }
      }

      let faction: Faction | undefined
      if (nodeType === 'combat' || nodeType === 'elite' || nodeType === 'miniboss') {
        faction = lockedFaction ?? (rng() < 0.35 ? 'tech' : 'fantasy')
      }

      const node: MapNode = {
        id: `node-${col}-${row}`,
        col,
        row,
        type: nodeType,
        edges: [],
        cleared: false,
        faction,
      }
      graph.nodes.set(node.id, node)
      colNodes.push(node)
    }
    graph.columns.push(colNodes)
  }

  // Edges within the new segment (same pattern as generateMapGraph)
  for (let c = 0; c < n - 1; c++) {
    const curr = graph.columns[startCol + c]!
    const next = graph.columns[startCol + c + 1]!
    const reached = new Set<string>()

    for (const node of curr) {
      const numEdges = next.length === 1 ? 1 : rng() < 0.5 ? 1 : 2
      const indices = next.map((_, i) => i)
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j]!, indices[i]!]
      }
      for (let k = 0; k < numEdges; k++) {
        const target = next[indices[k]!]!
        if (!node.edges.includes(target.id)) {
          node.edges.push(target.id)
        }
        reached.add(target.id)
      }
    }

    for (const nextNode of next) {
      if (!reached.has(nextNode.id)) {
        const from = curr[Math.floor(rng() * curr.length)]!
        if (!from.edges.includes(nextNode.id)) {
          from.edges.push(nextNode.id)
        }
      }
    }
  }

  // Bridge from prior act (boss column) into the new segment
  for (const prev of prevCol) {
    for (const first of graph.columns[startCol]!) {
      if (!prev.edges.includes(first.id)) {
        prev.edges.push(first.id)
      }
    }
  }
}

/** Safe to call on every MapScene entry — extends only when the party is past the last column. */
export function ensureMapPlayable(graph: MapGraph, seed: number, options: MapGraphOptions & { numCols?: number } = {}): void {
  extendMapGraph(graph, seed, options)
}
