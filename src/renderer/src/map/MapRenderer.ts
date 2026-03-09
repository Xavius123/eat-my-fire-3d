import * as THREE from 'three'
import type { MapGraph, MapNode } from './MapGraph'

const COL_SPACING = 6
const ROW_SPACING = 4

function nodePosition(node: MapNode, columns: MapNode[][]): THREE.Vector3 {
  const colNodes = columns[node.col]
  const z = (node.row - (colNodes.length - 1) / 2) * ROW_SPACING
  return new THREE.Vector3(node.col * COL_SPACING, 0, z)
}

export class MapRenderer {
  readonly group = new THREE.Group()

  private readonly nodeMeshes = new Map<string, THREE.Mesh>()
  private readonly selectableMats: THREE.MeshStandardMaterial[] = []
  private pulseTime = 0

  // Shared geometries — disposed in dispose()
  private readonly combatGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8)
  private readonly eliteGeo = new THREE.OctahedronGeometry(0.9)
  private readonly bossGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.7, 8)
  private readonly bossRingGeo = new THREE.TorusGeometry(1.5, 0.12, 8, 24)
  private readonly edgeGeo: THREE.BufferGeometry[] = []

  constructor(private readonly graph: MapGraph) {
    this.build()
  }

  private build(): void {
    const { nodes, columns, currentColumn } = this.graph

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x445566,
      opacity: 0.55,
      transparent: true,
    })

    // Draw edges first (behind nodes)
    for (const node of nodes.values()) {
      const fromPos = nodePosition(node, columns)
      for (const edgeId of node.edges) {
        const toNode = nodes.get(edgeId)!
        const toPos = nodePosition(toNode, columns)
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(fromPos.x, 0.05, fromPos.z),
          new THREE.Vector3(toPos.x, 0.05, toPos.z),
        ])
        this.edgeGeo.push(geo)
        this.group.add(new THREE.Line(geo, edgeMat))
      }
    }

    // Draw nodes
    for (const node of nodes.values()) {
      const pos = nodePosition(node, columns)
      const isSelectable = !node.cleared && node.col === currentColumn

      let geo: THREE.BufferGeometry
      let color: number

      switch (node.type) {
        case 'combat':
          geo = this.combatGeo
          color = node.cleared ? 0x2a2a3a : 0x4488bb
          break
        case 'elite':
          geo = this.eliteGeo
          color = node.cleared ? 0x2a2a3a : 0x9944cc
          break
        case 'boss':
          geo = this.bossGeo
          color = node.cleared ? 0x2a2a3a : 0xcc3333
          break
      }

      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.2,
      })

      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      mesh.userData.nodeId = node.id
      mesh.castShadow = true
      this.group.add(mesh)
      this.nodeMeshes.set(node.id, mesh)

      if (isSelectable) {
        this.selectableMats.push(mat)
      }

      // Boss ring
      if (node.type === 'boss' && !node.cleared) {
        const ringMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.8 })
        const ring = new THREE.Mesh(this.bossRingGeo, ringMat)
        ring.rotation.x = Math.PI / 2
        mesh.add(ring)
        if (isSelectable) this.selectableMats.push(ringMat)
      }
    }
  }

  /** Returns the world-space center of a column (for camera framing). */
  columnCenter(col: number): THREE.Vector3 {
    const colNodes = this.graph.columns[col]
    if (!colNodes || colNodes.length === 0) return new THREE.Vector3()
    const positions = colNodes.map((n) => nodePosition(n, this.graph.columns))
    const avg = positions.reduce((a, b) => a.add(b), new THREE.Vector3()).divideScalar(positions.length)
    return avg
  }

  /** World-space center of the entire map. */
  mapCenter(): THREE.Vector3 {
    const totalCols = this.graph.columns.length
    return new THREE.Vector3(((totalCols - 1) * COL_SPACING) / 2, 0, 0)
  }

  getNodeMesh(nodeId: string): THREE.Mesh | undefined {
    return this.nodeMeshes.get(nodeId)
  }

  update(dt: number): void {
    this.pulseTime += dt
    const pulse = 0.25 + 0.25 * Math.sin(this.pulseTime * 2.5)
    for (const mat of this.selectableMats) {
      mat.emissive.setHex(0xddaa00)
      mat.emissiveIntensity = pulse
    }
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        // Shared geometries are disposed below; per-mesh materials are disposed here.
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of mats) (m as THREE.Material).dispose()
      }
    })
    this.combatGeo.dispose()
    this.eliteGeo.dispose()
    this.bossGeo.dispose()
    this.bossRingGeo.dispose()
    for (const geo of this.edgeGeo) geo.dispose()
    this.edgeGeo.length = 0
    this.nodeMeshes.clear()
    this.selectableMats.length = 0
  }
}
