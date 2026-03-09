import * as THREE from 'three'
import type { MapGraph, MapNode } from './MapGraph'
import type { MapRenderer } from './MapRenderer'

type NodeClickHandler = (node: MapNode) => void

export class MapInput {
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private handlers: NodeClickHandler[] = []
  private onClick!: (e: MouseEvent) => void
  private onMove!: (e: MouseEvent) => void

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly renderer: MapRenderer,
    private readonly graph: MapGraph
  ) {}

  enable(): void {
    this.onClick = (e: MouseEvent): void => {
      if (e.button !== 0) return
      this.updatePointer(e)
      const node = this.hitTest()
      if (node) {
        for (const h of this.handlers) h(node)
      }
    }

    this.onMove = (e: MouseEvent): void => {
      this.updatePointer(e)
      const node = this.hitTest()
      this.canvas.style.cursor = node ? 'pointer' : 'default'
    }

    this.canvas.addEventListener('click', this.onClick)
    this.canvas.addEventListener('mousemove', this.onMove)
  }

  disable(): void {
    this.canvas.removeEventListener('click', this.onClick)
    this.canvas.removeEventListener('mousemove', this.onMove)
    this.canvas.style.cursor = 'default'
  }

  on(handler: NodeClickHandler): void {
    this.handlers.push(handler)
  }

  private updatePointer(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )
  }

  private hitTest(): MapNode | null {
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersects = this.raycaster.intersectObjects(this.renderer.group.children, true)
    for (const hit of intersects) {
      const nodeId = this.findNodeId(hit.object)
      if (!nodeId) continue
      const node = this.graph.nodes.get(nodeId)
      if (!node) continue
      if (node.cleared) continue
      if (node.col !== this.graph.currentColumn) continue
      return node
    }
    return null
  }

  /** Walk up the parent chain to find an object with userData.nodeId. */
  private findNodeId(obj: THREE.Object3D): string | null {
    let current: THREE.Object3D | null = obj
    while (current) {
      if (typeof current.userData.nodeId === 'string') return current.userData.nodeId
      current = current.parent
    }
    return null
  }
}
