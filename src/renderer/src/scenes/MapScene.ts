import * as THREE from 'three'
import { generateMapGraph, type MapGraph } from '../map/MapGraph'
import { MapRenderer } from '../map/MapRenderer'
import { MapInput } from '../map/MapInput'
import { CombatScene } from './CombatScene'
import { EventScene } from './EventScene'
import { ShopScene } from './ShopScene'
import { RestScene } from './RestScene'
import { CampScene } from './CampScene'
import { LoadoutScene } from './LoadoutScene'
import type { Scene, SceneContext } from './Scene'
import { createRunState, type RunState } from '../run/RunState'
import { getCampaign } from '../run/CampaignData'

export class MapScene implements Scene {
  private readonly graph: MapGraph
  private readonly runState: RunState
  private renderer!: MapRenderer
  private input!: MapInput
  private worldPivot!: THREE.Group
  private legend!: HTMLElement
  private ctx!: SceneContext
  private updateCb!: (dt: number) => void

  constructor(existingGraph?: MapGraph, runState?: RunState) {
    this.runState = runState ?? createRunState()
    if (existingGraph) {
      this.graph = existingGraph
    } else {
      const campaign = getCampaign(this.runState.campaignId)
      this.graph = generateMapGraph(Date.now(), {
        numCols: campaign.numCols,
        lockedFaction: campaign.lockedFaction,
      })
    }
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
    ctx.engine.setZoomEnabled(false)

    this.input = new MapInput(ctx.engine.canvas, ctx.engine.camera, this.renderer, this.graph)
    this.input.enable()
    this.input.on((node) => {
      node.cleared = true
      this.graph.currentColumn = node.col + 1
      switch (node.type) {
        case 'rest':
          ctx.switchTo(new RestScene(this.graph, this.runState))
          break
        case 'camp':
          ctx.switchTo(new CampScene(this.graph, this.runState, node.col * 7 + node.row))
          break
        case 'event':
          ctx.switchTo(new EventScene(this.graph, this.runState, node.col * 7 + node.row))
          break
        case 'shop':
          ctx.switchTo(new ShopScene(this.graph, this.runState))
          break
        case 'elite':
          ctx.switchTo(new CombatScene(this.graph, this.runState, node.faction, 'elite', node.id, node.col))
          break
        case 'miniboss':
          ctx.switchTo(new CombatScene(this.graph, this.runState, node.faction, 'miniboss', node.id, node.col))
          break
        case 'boss':
          ctx.switchTo(new CombatScene(this.graph, this.runState, undefined, 'boss', node.id, node.col))
          break
        default:
          ctx.switchTo(new CombatScene(this.graph, this.runState, node.faction, 'combat', node.id, node.col))
          break
      }
    })

    // Map legend overlay + back button
    this.legend = document.createElement('div')
    this.legend.id = 'map-legend'
    this.legend.innerHTML = `
      <button id="map-back-btn" style="display:block;width:100%;margin-bottom:8px;padding:5px 8px;background:#1a1a1a;color:#aaa;border:1px solid #444;cursor:pointer;font-family:monospace;font-size:11px;text-align:left;">&#8592; Loadout</button>
      <div class="map-legend-entry"><span class="map-legend-swatch" style="background:#4488bb"></span>Combat</div>
      <div class="map-legend-entry"><span class="map-legend-swatch" style="background:#44bb66"></span>Event</div>
      <div class="map-legend-entry"><span class="map-legend-swatch" style="background:#ddaa33"></span>Shop</div>
      <div class="map-legend-entry"><span class="map-legend-swatch" style="background:#5599aa"></span>Rest</div>
      <div class="map-legend-entry"><span class="map-legend-swatch" style="background:#bb7733"></span>Camp</div>
      <div class="map-legend-entry"><span class="map-legend-swatch" style="background:#9944cc"></span>Elite</div>
      <div class="map-legend-entry"><span class="map-legend-swatch" style="background:#dd6600"></span>Mini Boss</div>
      <div class="map-legend-entry"><span class="map-legend-swatch" style="background:#cc3333"></span>Boss</div>
    `
    this.legend.querySelector('#map-back-btn')?.addEventListener('click', () => {
      ctx.switchTo(new LoadoutScene())
    })
    ctx.container.appendChild(this.legend)

    this.updateCb = (dt: number) => this.renderer.update(dt)
    ctx.engine.onUpdate(this.updateCb)

    ctx.ready()
  }

  deactivate(): void {
    this.input.disable()
    this.legend.remove()
    this.ctx.engine.removeUpdate(this.updateCb)
    this.ctx.engine.scene.remove(this.worldPivot)
    this.renderer.dispose()
  }
}
