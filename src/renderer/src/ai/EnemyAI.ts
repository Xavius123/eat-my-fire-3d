import { UnitManager } from '../entities/UnitManager'
import { UnitEntity } from '../entities/UnitEntity'
import { CombatActions } from '../combat/CombatActions'
import { TurnManager } from '../combat/TurnManager'
import { Grid } from '../grid/Grid'
import { getReachableTiles } from '../combat/Pathfinding'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class EnemyAI {
  constructor(
    private unitManager: UnitManager,
    private combatActions: CombatActions,
    private turnManager: TurnManager,
    private grid: Grid
  ) {}

  async executeTurn(): Promise<void> {
    const enemies = this.unitManager.getTeamUnits('enemy')

    for (const enemy of enemies) {
      if (!enemy.data.alive) continue
      await this.executeUnitTurn(enemy)
      await delay(300)
    }
  }

  private async executeUnitTurn(enemy: UnitEntity): Promise<void> {
    if (!enemy.data.alive) return

    const canAttack = enemy.data.charges > 0
    const canMove = enemy.data.movementLeft > 0

    // Try to attack first (if already in range)
    if (canAttack) {
      const target = this.findAttackTarget(enemy)
      if (target) {
        this.turnManager.setAnimating()
        await this.combatActions.attackUnit(enemy, target)
        this.turnManager.restorePhase()

        const result = this.turnManager.checkGameOver(this.unitManager)
        if (result) return

        await delay(200)
        // After attacking, still try to move (retreat or reposition)
      }
    }

    // Try to move toward nearest player
    if (canMove) {
      const moved = await this.moveTowardPlayer(enemy)
      if (moved) await delay(200)

      // After moving, try to attack if we haven't yet
      if (enemy.data.charges > 0) {
        const newTarget = this.findAttackTarget(enemy)
        if (newTarget) {
          this.turnManager.setAnimating()
          await this.combatActions.attackUnit(enemy, newTarget)
          this.turnManager.restorePhase()

          const result = this.turnManager.checkGameOver(this.unitManager)
          if (result) return

          await delay(200)
        }
      }
    }
  }

  private findAttackTarget(enemy: UnitEntity): UnitEntity | null {
    const players = this.unitManager.getTeamUnits('player')
    let bestTarget: UnitEntity | null = null
    let lowestHp = Infinity

    for (const player of players) {
      if (this.combatActions.canAttack(enemy, player)) {
        // Prioritize low-HP targets
        if (player.data.stats.hp < lowestHp) {
          lowestHp = player.data.stats.hp
          bestTarget = player
        }
      }
    }
    return bestTarget
  }

  private async moveTowardPlayer(enemy: UnitEntity): Promise<boolean> {
    const players = this.unitManager.getTeamUnits('player')
    if (players.length === 0) return false

    // Find reachable tiles — same-team units are traversable but not stoppable
    const reachable = getReachableTiles(
      { x: enemy.data.gridX, z: enemy.data.gridZ },
      enemy.data.movementLeft,
      this.grid.width,
      this.grid.height,
      (x, z) => {
        if (!this.grid.isWalkable(x, z)) return true
        const unit = this.unitManager.getUnitAt(x, z)
        if (!unit) return false
        return unit.data.team !== enemy.data.team
      },
      (x, z) => !this.grid.isWalkable(x, z) || this.unitManager.isOccupied(x, z)
    )

    if (reachable.length === 0) return false

    // Sort players by distance so we try the nearest first
    const sorted = [...players].sort((a, b) => {
      const dA = Math.abs(enemy.data.gridX - a.data.gridX) + Math.abs(enemy.data.gridZ - a.data.gridZ)
      const dB = Math.abs(enemy.data.gridX - b.data.gridX) + Math.abs(enemy.data.gridZ - b.data.gridZ)
      return dA - dB
    })

    // Try to find a tile that gets strictly closer to any player
    for (const target of sorted) {
      const currentDist =
        Math.abs(enemy.data.gridX - target.data.gridX) +
        Math.abs(enemy.data.gridZ - target.data.gridZ)

      let bestTile = reachable[0]
      let bestDist = Infinity

      for (const tile of reachable) {
        const dist =
          Math.abs(tile.x - target.data.gridX) +
          Math.abs(tile.z - target.data.gridZ)
        if (dist < bestDist) {
          bestDist = dist
          bestTile = tile
        }
      }

      if (bestDist < currentDist) {
        this.turnManager.setAnimating()
        const moved = await this.combatActions.moveUnit(enemy, bestTile.x, bestTile.z)
        this.turnManager.restorePhase()
        return moved
      }
    }

    // Fallback: move sideways (same distance to nearest player) to help unblock allies
    const nearest = sorted[0]
    const currentDist =
      Math.abs(enemy.data.gridX - nearest.data.gridX) +
      Math.abs(enemy.data.gridZ - nearest.data.gridZ)

    for (const tile of reachable) {
      const dist =
        Math.abs(tile.x - nearest.data.gridX) +
        Math.abs(tile.z - nearest.data.gridZ)
      if (dist === currentDist) {
        this.turnManager.setAnimating()
        const moved = await this.combatActions.moveUnit(enemy, tile.x, tile.z)
        this.turnManager.restorePhase()
        return moved
      }
    }

    return false
  }
}
