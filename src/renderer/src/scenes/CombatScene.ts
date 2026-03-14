import { Game } from '../Game'
import { RewardScene } from './RewardScene'
import type { MapGraph } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import type { Scene, SceneContext } from './Scene'

export class CombatScene implements Scene {
  private game: Game | null = null
  private ctx!: SceneContext
  private active = false

  // Combat uses the default isometric view angle (PI/4 + PI = 5PI/4)
  private static readonly COMBAT_VIEW_ANGLE = Math.PI / 4 + Math.PI

  constructor(
    private readonly mapGraph: MapGraph,
    private readonly runState: RunState
  ) {}

  activate(ctx: SceneContext): void {
    this.ctx = ctx
    this.active = true
    ctx.engine.setRotationEnabled(true)
    ctx.engine.setZoomEnabled(true)
    ctx.engine.setViewAngle(CombatScene.COMBAT_VIEW_ANGLE)

    // Assets are preloaded by SceneManager; this Promise is already resolved
    // by the time the player clicks a node. Game applies them synchronously
    // and calls onReady immediately, so the fade overlay lifts only after
    // real models are in the scene — no placeholder flash.
    void ctx.assetsReady.then((sharedAssets) => {
      if (!this.active) return
      this.game = new Game(
        ctx.container,
        ctx.engine,
        () => this.onVictory(),
        sharedAssets,
        () => ctx.ready(),
        this.runState
      )
    })
  }

  deactivate(): void {
    this.active = false
    this.game?.dispose()
    this.game = null
  }

  private onVictory(): void {
    this.ctx.switchTo(new RewardScene(this.mapGraph, this.runState))
  }
}
