import { Game, type CombatType } from '../Game'
import { RewardScene } from './RewardScene'
import type { MapGraph, MapNode } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import type { Faction } from '../entities/EnemyData'
import type { Scene, SceneContext } from './Scene'

export class CombatScene implements Scene {
  private game: Game | null = null
  private ctx!: SceneContext
  private active = false

  // Combat uses the default isometric view angle (PI/4 + PI = 5PI/4)
  private static readonly COMBAT_VIEW_ANGLE = Math.PI / 4 + Math.PI

  constructor(
    private readonly mapGraph: MapGraph,
    private readonly runState: RunState,
    private readonly faction?: Faction,
    private readonly combatType: CombatType = 'combat'
  ) {}

  activate(ctx: SceneContext): void {
    this.ctx = ctx
    this.active = true
    ctx.engine.setRotationEnabled(true)
    ctx.engine.setZoomEnabled(true)
    ctx.engine.setViewAngle(CombatScene.COMBAT_VIEW_ANGLE)

    // Store faction in RunState for reward screen
    if (this.faction) {
      this.runState.lastCombatFaction = this.faction
    }

    ctx.devToolbar?.setCombatActive(() => this.game?.devKillEnemies())

    void ctx.assetsReady.then((sharedAssets) => {
      if (!this.active) return
      this.game = new Game(
        ctx.container,
        ctx.engine,
        () => this.onVictory(),
        sharedAssets,
        () => ctx.ready(),
        this.runState,
        this.faction,
        this.combatType
      )
    })
  }

  deactivate(): void {
    this.active = false
    this.ctx.devToolbar?.setCombatActive(null)
    this.game?.dispose()
    this.game = null
  }

  private onVictory(): void {
    this.ctx.switchTo(new RewardScene(this.mapGraph, this.runState))
  }
}
