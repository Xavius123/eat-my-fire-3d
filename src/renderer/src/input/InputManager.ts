import * as THREE from 'three'
import { UnitManager } from '../entities/UnitManager'
import { UnitEntity } from '../entities/UnitEntity'
import { Grid } from '../grid/Grid'
import { TurnManager } from '../combat/TurnManager'
import { ActionQueue } from '../combat/ActionQueue'
import { getReachableTiles } from '../combat/Pathfinding'
import { getAttackableTiles, getCleaveExtraTiles } from '../combat/AttackTypes'

export type SelectionState =
  | { kind: 'idle' }
  | { kind: 'unitSelected'; unitId: string }

export interface InputEvent {
  type:
    | 'unitSelected'
    | 'unitDeselected'
    | 'unitMoved'
    | 'unitAttacked'
  unitId?: string
  attackerId?: string
  defenderId?: string
  damage?: number
}

type InputListener = (event: InputEvent) => void

export class InputManager {
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private state: SelectionState = { kind: 'idle' }
  private listeners: InputListener[] = []
  private clickHandler: ((e: MouseEvent) => void) | null = null
  private hoverHandler: ((e: MouseEvent) => void) | null = null

  // Targeting overlay visuals
  private targetingLine: THREE.Line | null = null
  private overlayMeshes: THREE.Mesh[] = []
  private lastHoverKey = ''

  constructor(
    private canvas: HTMLCanvasElement,
    private camera: THREE.PerspectiveCamera,
    private worldContent: THREE.Group,
    private grid: Grid,
    private unitManager: UnitManager,
    private turnManager: TurnManager,
    private actionQueue: ActionQueue
  ) {}

  enable(): void {
    this.clickHandler = (e: MouseEvent) => {
      if (e.button === 0) this.handleClick(e)
    }
    this.canvas.addEventListener('click', this.clickHandler)

    this.hoverHandler = (e: MouseEvent) => this.handleHover(e)
    this.canvas.addEventListener('mousemove', this.hoverHandler)
  }

  disable(): void {
    if (this.clickHandler) {
      this.canvas.removeEventListener('click', this.clickHandler)
      this.clickHandler = null
    }
    if (this.hoverHandler) {
      this.canvas.removeEventListener('mousemove', this.hoverHandler)
      this.hoverHandler = null
    }
    this.clearTargetingVisuals()
  }

  on(listener: InputListener): void {
    this.listeners.push(listener)
  }

  getSelectionState(): SelectionState {
    return this.state
  }

  deselect(): void {
    this.grid.clearHighlights()
    this.clearTargetingVisuals()
    this.state = { kind: 'idle' }
    this.emit({ type: 'unitDeselected' })
  }

  private async handleClick(event: MouseEvent): Promise<void> {
    // Block input during enemy turn or animations
    if (this.turnManager.getPhase() !== 'player') return
    if (this.turnManager.isGameOver()) return

    const hit = this.raycast(event)
    if (!hit) {
      if (this.state.kind === 'unitSelected') this.deselect()
      return
    }

    if (this.state.kind === 'idle') {
      this.handleIdleClick(hit)
    } else if (this.state.kind === 'unitSelected') {
      await this.handleSelectedClick(hit)
    }
  }

  private handleIdleClick(
    hit:
      | { type: 'unit'; entity: UnitEntity }
      | { type: 'tile'; gridX: number; gridZ: number }
  ): void {
    if (hit.type === 'unit' && hit.entity.data.team === 'player') {
      this.selectUnit(hit.entity)
    }
  }

  private async handleSelectedClick(
    hit:
      | { type: 'unit'; entity: UnitEntity }
      | { type: 'tile'; gridX: number; gridZ: number }
  ): Promise<void> {
    const selectedUnit = this.unitManager.getUnit(
      (this.state as { kind: 'unitSelected'; unitId: string }).unitId
    )
    if (!selectedUnit) {
      this.deselect()
      return
    }

    if (hit.type === 'unit') {
      if (hit.entity.data.id === selectedUnit.data.id) {
        // Clicked same unit - deselect
        this.deselect()
        return
      }

      if (hit.entity.data.team === 'player') {
        // Clicked another player unit - switch selection
        this.selectUnit(hit.entity)
        return
      }

      // Clicked enemy - try to attack
      if (
        selectedUnit.data.stats.ap >= 1 &&
        this.actionQueue.canAttack(selectedUnit, hit.entity)
      ) {
        this.turnManager.setAnimating()
        this.grid.clearHighlights()
        this.clearTargetingVisuals()

        const attackerId = selectedUnit.data.id
        const defenderId = hit.entity.data.id
        const result = await this.actionQueue.processAction({
          type: 'attack',
          attackerId,
          defenderId,
        })
        const damage = result.type === 'attack' ? result.damage : 0
        this.emit({ type: 'unitAttacked', attackerId, defenderId, damage })

        this.turnManager.restorePhase()

        // Check if unit still has AP
        if (selectedUnit.data.stats.ap > 0 && selectedUnit.data.alive) {
          this.selectUnit(selectedUnit)
        } else {
          this.deselect()
        }
        return
      }

      // Enemy out of range
      this.deselect()
      return
    }

    // Clicked a tile
    if (hit.type === 'tile') {
      if (!this.grid.isHighlighted(hit.gridX, hit.gridZ)) {
        this.deselect()
        return
      }

      // Move to highlighted tile
      if (selectedUnit.data.stats.ap >= 1) {
        this.turnManager.setAnimating()
        this.grid.clearHighlights()
        this.clearTargetingVisuals()

        await this.actionQueue.processAction({
          type: 'move',
          unitId: selectedUnit.data.id,
          targetX: hit.gridX,
          targetZ: hit.gridZ,
        })
        this.emit({ type: 'unitMoved', unitId: selectedUnit.data.id })

        this.turnManager.restorePhase()

        // Recompute highlights if AP remains
        if (selectedUnit.data.stats.ap > 0) {
          this.selectUnit(selectedUnit)
        } else {
          this.deselect()
        }
      }
    }
  }

  private selectUnit(entity: UnitEntity): void {
    this.grid.clearHighlights()
    this.clearTargetingVisuals()
    this.state = { kind: 'unitSelected', unitId: entity.data.id }
    this.emit({ type: 'unitSelected', unitId: entity.data.id })

    if (entity.data.stats.ap < 1) return

    // Show movement range
    const reachable = getReachableTiles(
      { x: entity.data.gridX, z: entity.data.gridZ },
      entity.data.stats.moveRange,
      this.grid.width,
      this.grid.height,
      // Blocks traversal: blocked terrain + enemies + heavy allies.
      (x, z) => {
        if (!this.grid.isWalkable(x, z)) return true

        const unit = this.unitManager.getUnitAt(x, z)
        if (!unit) return false
        if (unit.data.team !== entity.data.team) return true
        return unit.data.blocksAllies
      },
      // Blocks destination: blocked terrain + any occupied tile.
      (x, z) => !this.grid.isWalkable(x, z) || this.unitManager.isOccupied(x, z)
    )
    this.grid.highlightTiles(reachable, 'move')

    // Show attack range based on attack type
    const attackableTiles = getAttackableTiles(
      { x: entity.data.gridX, z: entity.data.gridZ },
      entity.data.attackType,
      this.grid,
      this.unitManager,
      entity.data.team
    )
    this.grid.highlightTiles(attackableTiles, 'attack')
  }

  // ── Hover & Targeting Visuals ──

  private handleHover(event: MouseEvent): void {
    if (this.state.kind !== 'unitSelected') {
      this.clearTargetingVisuals()
      return
    }
    if (this.turnManager.getPhase() !== 'player') return

    const selectedUnit = this.unitManager.getUnit(
      (this.state as { kind: 'unitSelected'; unitId: string }).unitId
    )
    if (!selectedUnit || selectedUnit.data.stats.ap < 1) {
      this.clearTargetingVisuals()
      return
    }

    const attackKind = selectedUnit.data.attackType.kind
    if (attackKind === 'basic') {
      // No hover overlay for basic attack
      this.clearTargetingVisuals()
      return
    }

    const hit = this.raycast(event)
    let targetUnit: UnitEntity | undefined

    if (hit?.type === 'unit' && hit.entity.data.team !== selectedUnit.data.team) {
      targetUnit = hit.entity
    } else if (hit?.type === 'tile') {
      const u = this.unitManager.getUnitAt(hit.gridX, hit.gridZ)
      if (u && u.data.team !== selectedUnit.data.team) {
        targetUnit = u
      }
    }

    if (!targetUnit || !this.actionQueue.canAttack(selectedUnit, targetUnit)) {
      this.clearTargetingVisuals()
      return
    }

    // Avoid rebuilding if hovering same target
    const hoverKey = targetUnit.data.id
    if (hoverKey === this.lastHoverKey) return
    this.lastHoverKey = hoverKey

    this.clearTargetingVisuals()

    const tileSize = this.grid.getTileSize()
    const from = new THREE.Vector3(
      selectedUnit.data.gridX * tileSize, 0.5,
      selectedUnit.data.gridZ * tileSize
    )
    const to = new THREE.Vector3(
      targetUnit.data.gridX * tileSize, 0.5,
      targetUnit.data.gridZ * tileSize
    )

    if (attackKind === 'lobbed') {
      this.showTargetingArc(from, to, selectedUnit, targetUnit)
    } else if (attackKind === 'projectile') {
      this.showTargetingLine(from, to)
    } else if (attackKind === 'cleave') {
      this.showCleaveOverlay(selectedUnit, targetUnit)
    }
  }

  private showTargetingArc(
    from: THREE.Vector3,
    to: THREE.Vector3,
    attacker: UnitEntity,
    target: UnitEntity
  ): void {
    const dx = Math.abs(target.data.gridX - attacker.data.gridX)
    const dz = Math.abs(target.data.gridZ - attacker.data.gridZ)
    const dist = dx + dz
    const arcHeight = 0.5 + dist * 0.3
    const segments = 24

    const points: THREE.Vector3[] = []
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const p = new THREE.Vector3().lerpVectors(from, to, t)
      p.y = 0.5 + Math.sin(t * Math.PI) * arcHeight
      points.push(p)
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineDashedMaterial({
      color: 0xffaa44,
      dashSize: 0.1,
      gapSize: 0.05,
    })

    this.targetingLine = new THREE.Line(geometry, material)
    this.targetingLine.computeLineDistances()
    this.worldContent.add(this.targetingLine)
  }

  private showTargetingLine(from: THREE.Vector3, to: THREE.Vector3): void {
    const geometry = new THREE.BufferGeometry().setFromPoints([from, to])
    const material = new THREE.LineDashedMaterial({
      color: 0xff6644,
      dashSize: 0.12,
      gapSize: 0.06,
    })

    this.targetingLine = new THREE.Line(geometry, material)
    this.targetingLine.computeLineDistances()
    this.worldContent.add(this.targetingLine)
  }

  private showCleaveOverlay(attacker: UnitEntity, target: UnitEntity): void {
    const extraTiles = getCleaveExtraTiles(
      { x: attacker.data.gridX, z: attacker.data.gridZ },
      { x: target.data.gridX, z: target.data.gridZ }
    )

    const tileSize = this.grid.getTileSize()
    const geo = new THREE.PlaneGeometry(tileSize * 0.85, tileSize * 0.85)
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    for (const tile of extraTiles) {
      if (!this.grid.isInBounds(tile.x, tile.z)) continue
      const mesh = new THREE.Mesh(geo.clone(), mat.clone())
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(tile.x * tileSize, 0.08, tile.z * tileSize)
      this.worldContent.add(mesh)
      this.overlayMeshes.push(mesh)
    }
  }

  private clearTargetingVisuals(): void {
    this.lastHoverKey = ''

    if (this.targetingLine) {
      this.worldContent.remove(this.targetingLine)
      this.targetingLine.geometry.dispose()
      ;(this.targetingLine.material as THREE.Material).dispose()
      this.targetingLine = null
    }

    for (const mesh of this.overlayMeshes) {
      this.worldContent.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
    }
    this.overlayMeshes = []
  }

  // ── Raycasting ──

  private raycast(
    event: MouseEvent
  ):
    | { type: 'unit'; entity: UnitEntity }
    | { type: 'tile'; gridX: number; gridZ: number }
    | null {
    const rect = this.canvas.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(
      this.worldContent.children,
      true
    )

    for (const hit of intersects) {
      // Check if we hit a unit
      const unit = this.unitManager.getUnitByMesh(hit.object)
      if (unit && unit.data.alive) {
        return { type: 'unit', entity: unit }
      }

      // Check if we hit a tile or tile decoration
      const tileHit = this.getTileFromObject(hit.object)
      if (tileHit) return tileHit
    }

    return null
  }

  private getTileFromObject(
    object: THREE.Object3D
  ): { type: 'tile'; gridX: number; gridZ: number } | null {
    let current: THREE.Object3D | null = object
    while (current) {
      const { gridX, gridZ } = current.userData ?? {}
      if (gridX !== undefined && gridZ !== undefined) {
        return { type: 'tile', gridX, gridZ }
      }
      current = current.parent
    }
    return null
  }

  private emit(event: InputEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}
