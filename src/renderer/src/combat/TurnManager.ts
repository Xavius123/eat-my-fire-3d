import { UnitManager } from '../entities/UnitManager'
import type { Team } from '../entities/UnitData'

export type Phase = 'player' | 'enemy' | 'animating'

export interface TurnEvent {
  type: 'phaseChange' | 'turnStart' | 'gameOver'
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

  endPlayerPhase(unitManager: UnitManager): void {
    if (this.phase !== 'player' || this.gameEnded) return

    // Reset enemy AP
    for (const unit of unitManager.getTeamUnits('enemy')) {
      unit.data.stats.ap = unit.data.stats.maxAp
    }

    this.phase = 'enemy'
    this.emit({ type: 'phaseChange', phase: 'enemy' })
  }

  endEnemyPhase(unitManager: UnitManager): void {
    if (this.gameEnded) return

    this.turnNumber++

    // Reset player AP
    for (const unit of unitManager.getTeamUnits('player')) {
      unit.data.stats.ap = unit.data.stats.maxAp
    }

    this.phase = 'player'
    this.emit({ type: 'phaseChange', phase: 'player' })
    this.emit({ type: 'turnStart' })
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
