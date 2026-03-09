import * as THREE from 'three'
import { generateMapGraph, type MapGraph } from '../map/MapGraph'
import { MapRenderer } from '../map/MapRenderer'
import { MapInput } from '../map/MapInput'
import { CombatScene } from './CombatScene'
import type { Scene, SceneContext } from './Scene'
import { createRunState, type RunState } from '../run/RunState'

export class MapScene implements Scene {
  private readonly graph: MapGraph
  private readonly runState: RunState
  private renderer!: MapRenderer
  private input!: MapInput
  private worldPivot!: THREE.Group
  private ctx!: SceneContext
  private updateCb!: (dt: number) => void

  constructor(existingGraph?: MapGraph, runState?: RunState) {
    this.graph = existingGraph ?? generateMapGraph(Date.now())
    this.runState = runState ?? createRunState()
  }

  activate(ctx: SceneContext): void {
    this.ctx = ctx

    this.renderer = new MapRenderer(this.graph)

    const mapCenter = this.renderer.mapCenter()

    // Mirror Game.ts pivot pattern: pivot at map center so Q/E rotation stays centered.
    // contentGroup is offset by -mapCenter so nodes rotate about the pivot world position.
    this.worldPivot = new THREE.Group()
    this.worldPivot.position.copy(mapCenter)
    const contentGroup = new THREE.Group()
    contentGroup.position.set(-mapCenter.x, 0, -mapCenter.z)
    contentGroup.add(this.renderer.group)
    this.worldPivot.add(contentGroup)
    ctx.engine.scene.add(this.worldPivot)

    const numCols = this.graph.columns.length
    // viewSize drives camera distance to frame the whole map
    const viewSize = numCols * 4.2

    ctx.engine.setWorldRotator(this.worldPivot)
    ctx.engine.clearGridBounds()
    ctx.engine.setGridCenter(mapCenter, viewSize)
    // viewAngle=0 → worldPivot.rotation.y = baseCameraAngle (PI/4)
    // which maps the +X node axis to the viewport left→right direction
    ctx.engine.setViewAngle(0)
    ctx.engine.setRotationEnabled(false)

    this.input = new MapInput(ctx.engine.canvas, ctx.engine.camera, this.renderer, this.graph)
    this.input.enable()
    this.input.on((node) => {
      node.cleared = true
      this.graph.currentColumn = node.col + 1
      ctx.switchTo(new CombatScene(this.graph, this.runState))
    })

    this.updateCb = (dt: number) => this.renderer.update(dt)
    ctx.engine.onUpdate(this.updateCb)

    ctx.ready()
  }

  deactivate(): void {
    this.input.disable()
    this.ctx.engine.removeUpdate(this.updateCb)
    this.ctx.engine.scene.remove(this.worldPivot)
    this.renderer.dispose()
  }
}
