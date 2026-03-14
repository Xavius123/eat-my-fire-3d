import { UnitManager } from '../entities/UnitManager'
import type { Team } from '../entities/UnitData'

export type Phase = 'player' | 'enemy' | 'animating'

export interface TurnEvent {
  type: 'phaseChange' | 'turnStart' | 'gameOver' | 'allPlayersReady'
  phase?: Phase
  winner?: 'player' | 'enemy'
}

type TurnListener = (event: TurnEvent) => void

export class TurnManager {
  private phase: Phase = 'player'
  private previousPhase: Phase = 'player'
  private turnNumber = 1
  private listeners: TurnListener[] = []
  private gameEnded = false

  // ── Multiplayer ready tracking ──
  private expectedPlayers = 1
  private readyPlayers = new Set<string>()

  getPhase(): Phase {
    return this.phase
  }

  getTurnNumber(): number {
    return this.turnNumber
  }

  isGameOver(): boolean {
    return this.gameEnded
  }

  on(listener: TurnListener): void {
    this.listeners.push(listener)
  }

  // ── Multiplayer ready API ──

  /** Set the number of players that must signal ready before phase transition. */
  setExpectedPlayers(count: number): void {
    this.expectedPlayers = count
  }

  /**
   * Signal that a player is ready to end the player phase.
   * In single-player (expectedPlayers=1), this immediately ends the phase.
   * In multiplayer, waits until all expected players have signalled.
   */
  signalReady(playerId: string, unitManager: UnitManager): void {
    this.readyPlayers.add(playerId)
    if (this.readyPlayers.size >= this.expectedPlayers) {
      this.readyPlayers.clear()
      this.emit({ type: 'allPlayersReady' })
      this.endPlayerPhase(unitManager)
    }
  }

  /** Clear ready signals (e.g. on new turn). */
  clearReady(): void {
    this.readyPlayers.clear()
  }

  endPlayerPhase(unitManager: UnitManager): void {
    if (this.phase !== 'player' || this.gameEnded) return

    // Reset enemy actions and recharge weapons
    this.resetTeamActions(unitManager, 'enemy')

    this.phase = 'enemy'
    this.emit({ type: 'phaseChange', phase: 'enemy' })
  }

  endEnemyPhase(unitManager: UnitManager): void {
    if (this.gameEnded) return

    this.turnNumber++

    // Reset player actions and recharge weapons
    this.resetTeamActions(unitManager, 'player')

    this.phase = 'player'
    this.emit({ type: 'phaseChange', phase: 'player' })
    this.emit({ type: 'turnStart' })
  }

  private resetTeamActions(unitManager: UnitManager, team: import('../entities/UnitData').Team): void {
    for (const unit of unitManager.getTeamUnits(team)) {
      unit.data.movementLeft = unit.data.stats.moveRange
      // Recharge weapon charges
      if (unit.data.rechargeRate > 0) {
        unit.data.charges = Math.min(
          unit.data.charges + unit.data.rechargeRate,
          unit.data.maxCharges
        )
      }
    }
  }

  setAnimating(): void {
    if (this.phase !== 'animating') {
      this.previousPhase = this.phase
    }
    this.phase = 'animating'
  }

  restorePhase(): void {
    this.phase = this.previousPhase
  }

  checkGameOver(unitManager: UnitManager): 'player' | 'enemy' | null {
    if (this.gameEnded) return null

    const playerAlive = unitManager.getTeamUnits('player').length > 0
    const enemyAlive = unitManager.getTeamUnits('enemy').length > 0

    if (!enemyAlive) {
      this.gameEnded = true
      this.emit({ type: 'gameOver', winner: 'player' })
      return 'player'
    }
    if (!playerAlive) {
      this.gameEnded = true
      this.emit({ type: 'gameOver', winner: 'enemy' })
      return 'enemy'
    }
    return null
  }

  private emit(event: TurnEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}
