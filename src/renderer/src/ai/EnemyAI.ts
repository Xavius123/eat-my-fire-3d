import { UnitManager } from '../entities/UnitManager'
import { UnitEntity } from '../entities/UnitEntity'
import { CombatActions } from '../combat/CombatActions'
import { TurnManager } from '../combat/TurnManager'
import { Grid } from '../grid/Grid'
import { getReachableTiles } from '../combat/Pathfinding'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function manhattan(ax: number, az: number, bx: number, bz: number): number {
  return Math.abs(ax - bx) + Math.abs(az - bz)
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
    const kind = enemy.data.attackType.kind
    if (kind === 'projectile') {
      await this.executeRangedTurn(enemy)
    } else if (kind === 'lobbed') {
      await this.executeLobbedTurn(enemy)
    } else {
      await this.executeMeleeTurn(enemy)
    }
  }

  // ── Melee (Grunt) — rush the weakest player ────────────────────────────────

  private async executeMeleeTurn(enemy: UnitEntity): Promise<void> {
    if (!enemy.data.alive) return

    // Attack first if already adjacent
    if (enemy.data.charges > 0) {
      const target = this.findAttackTarget(enemy)
      if (target) {
        await this.doAttack(enemy, target)
        if (!enemy.data.alive) return
        await delay(200)
      }
    }

    // Move toward nearest player
    if (enemy.data.movementLeft > 0) {
      const moved = await this.moveTowardPlayer(enemy)
      if (moved) await delay(200)

      // Attack again after closing in
      if (enemy.data.charges > 0) {
        const target = this.findAttackTarget(enemy)
        if (target) {
          await this.doAttack(enemy, target)
          await delay(200)
        }
      }
    }
  }

  // ── Ranged (Bone Archer) — kite at max range ───────────────────────────────
  // Prefers tiles that keep it at attack range. Retreats if a player gets
  // within safeDistance tiles, to avoid melee trades.

  private async executeRangedTurn(enemy: UnitEntity): Promise<void> {
    if (!enemy.data.alive) return

    const SAFE_DISTANCE = 2

    // Attack if already in range
    if (enemy.data.charges > 0) {
      const target = this.findAttackTarget(enemy)
      if (target) {
        await this.doAttack(enemy, target)
        if (!enemy.data.alive) return
        await delay(200)
      }
    }

    if (enemy.data.movementLeft === 0) return

    const players = this.unitManager.getTeamUnits('player').filter((p) => p.data.alive)
    if (players.length === 0) return

    const nearestPlayer = this.nearestPlayer(enemy, players)
    const distToNearest = manhattan(
      enemy.data.gridX, enemy.data.gridZ,
      nearestPlayer.data.gridX, nearestPlayer.data.gridZ
    )

    const reachable = this.getReachable(enemy)
    if (reachable.length === 0) return

    const attackRange = enemy.data.stats.attackRange

    if (distToNearest <= SAFE_DISTANCE) {
      // Too close — retreat to the reachable tile farthest from all players
      const retreatTile = reachable
        .map((t) => ({
          t,
          minDist: Math.min(...players.map((p) => manhattan(t.x, t.z, p.data.gridX, p.data.gridZ))),
        }))
        .sort((a, b) => b.minDist - a.minDist)[0]

      if (retreatTile && retreatTile.minDist > distToNearest) {
        await this.doMove(enemy, retreatTile.t.x, retreatTile.t.z)
        await delay(200)
      }
    } else if (distToNearest > attackRange) {
      // Out of range — advance to a tile that puts nearest player within attack range
      const advanceTile = reachable
        .filter((t) => {
          const d = manhattan(t.x, t.z, nearestPlayer.data.gridX, nearestPlayer.data.gridZ)
          return d <= attackRange && d > SAFE_DISTANCE
        })
        .sort((a, b) => {
          // Prefer tiles closest to ideal range (attackRange - 1)
          const ideal = attackRange - 1
          return (
            Math.abs(manhattan(a.x, a.z, nearestPlayer.data.gridX, nearestPlayer.data.gridZ) - ideal) -
            Math.abs(manhattan(b.x, b.z, nearestPlayer.data.gridX, nearestPlayer.data.gridZ) - ideal)
          )
        })[0]

      if (advanceTile) {
        await this.doMove(enemy, advanceTile.x, advanceTile.z)
        await delay(200)
      } else {
        // No ideal tile — get as close as possible without entering safe distance
        await this.moveTowardPlayer(enemy)
        await delay(200)
      }
    }
    // else: already at good range — don't move, hold position

    // Attack after repositioning
    if (enemy.data.charges > 0) {
      const target = this.findAttackTarget(enemy)
      if (target) {
        await this.doAttack(enemy, target)
        await delay(200)
      }
    }
  }

  // ── Lobbed (Shaman) — hold position and bombard ───────────────────────────
  // Does not move if any player is already within lob range.
  // Only advances if it has no valid target at all.

  private async executeLobbedTurn(enemy: UnitEntity): Promise<void> {
    if (!enemy.data.alive) return

    const attackRange = enemy.data.stats.attackRange
    const players = this.unitManager.getTeamUnits('player').filter((p) => p.data.alive)

    const playerInRange = players.some(
      (p) => manhattan(enemy.data.gridX, enemy.data.gridZ, p.data.gridX, p.data.gridZ) <= attackRange
    )

    if (playerInRange) {
      // Hold position — drain charges attacking
      while (enemy.data.charges > 0) {
        const target = this.findAttackTarget(enemy)
        if (!target) break
        await this.doAttack(enemy, target)
        if (!enemy.data.alive) return
        await delay(250)
      }
    } else {
      // No target in range — advance until one is
      if (enemy.data.movementLeft > 0) {
        await this.moveTowardPlayer(enemy)
        await delay(200)
      }
      // Attack after closing in
      if (enemy.data.charges > 0) {
        const target = this.findAttackTarget(enemy)
        if (target) {
          await this.doAttack(enemy, target)
          await delay(200)
        }
      }
    }
  }

  // ── Shared helpers ─────────────────────────────────────────────────────────

  private async doAttack(enemy: UnitEntity, target: UnitEntity): Promise<void> {
    this.turnManager.setAnimating()
    await this.combatActions.attackUnit(enemy, target)
    this.turnManager.restorePhase()
    this.turnManager.checkGameOver(this.unitManager)
  }

  private async doMove(enemy: UnitEntity, x: number, z: number): Promise<boolean> {
    this.turnManager.setAnimating()
    const moved = await this.combatActions.moveUnit(enemy, x, z)
    this.turnManager.restorePhase()
    return moved
  }

  private findAttackTarget(enemy: UnitEntity): UnitEntity | null {
    const players = this.unitManager.getTeamUnits('player')
    let bestTarget: UnitEntity | null = null
    let lowestHp = Infinity

    for (const player of players) {
      if (this.combatActions.canAttack(enemy, player)) {
        if (player.data.stats.hp < lowestHp) {
          lowestHp = player.data.stats.hp
          bestTarget = player
        }
      }
    }
    return bestTarget
  }

  private nearestPlayer(enemy: UnitEntity, players: UnitEntity[]): UnitEntity {
    return players.reduce((nearest, p) => {
      const dNearest = manhattan(enemy.data.gridX, enemy.data.gridZ, nearest.data.gridX, nearest.data.gridZ)
      const dP = manhattan(enemy.data.gridX, enemy.data.gridZ, p.data.gridX, p.data.gridZ)
      return dP < dNearest ? p : nearest
    })
  }

  private getReachable(enemy: UnitEntity): Array<{ x: number; z: number }> {
    return getReachableTiles(
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
  }

  private async moveTowardPlayer(enemy: UnitEntity): Promise<boolean> {
    const players = this.unitManager.getTeamUnits('player')
    if (players.length === 0) return false

    const reachable = this.getReachable(enemy)
    if (reachable.length === 0) return false

    const sorted = [...players].sort((a, b) => {
      const dA = manhattan(enemy.data.gridX, enemy.data.gridZ, a.data.gridX, a.data.gridZ)
      const dB = manhattan(enemy.data.gridX, enemy.data.gridZ, b.data.gridX, b.data.gridZ)
      return dA - dB
    })

    for (const target of sorted) {
      const currentDist = manhattan(
        enemy.data.gridX, enemy.data.gridZ,
        target.data.gridX, target.data.gridZ
      )

      let bestTile = reachable[0]
      let bestDist = Infinity

      for (const tile of reachable) {
        const dist = manhattan(tile.x, tile.z, target.data.gridX, target.data.gridZ)
        if (dist < bestDist) {
          bestDist = dist
          bestTile = tile
        }
      }

      if (bestDist < currentDist) {
        return this.doMove(enemy, bestTile.x, bestTile.z)
      }
    }

    // Fallback: sidestep to help unblock allies
    const nearest = sorted[0]
    const currentDist = manhattan(
      enemy.data.gridX, enemy.data.gridZ,
      nearest.data.gridX, nearest.data.gridZ
    )

    for (const tile of reachable) {
      const dist = manhattan(tile.x, tile.z, nearest.data.gridX, nearest.data.gridZ)
      if (dist === currentDist) {
        return this.doMove(enemy, tile.x, tile.z)
      }
    }

    return false
  }
}
