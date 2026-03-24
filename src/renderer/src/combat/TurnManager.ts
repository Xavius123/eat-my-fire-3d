import { UnitManager } from '../entities/UnitManager'
import type { Team } from '../entities/UnitData'
import { tickStatuses, isInStasis } from './StatusEffects'
import { getEnemyTemplate } from '../entities/EnemyData'
import { getMod, effectiveValue } from '../run/ModData'

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
      // Tick status effects at turn start
      if (unit.data.statusEffects.length > 0) {
        const tickResult = tickStatuses(unit.data.statusEffects)

        // Apply damage (burn, leeched) — reduced by status_damage_reduction armor mods
        if (tickResult.damage > 0) {
          let statusDmgReduction = 0
          for (const equipped of unit.data.armorMods) {
            const def = getMod(equipped.modId)
            if (!def) continue
            for (const effect of def.effects) {
              if (effect.kind === 'status_damage_reduction') {
                statusDmgReduction += effectiveValue(effect, equipped.stacks)
              }
            }
          }
          const finalDamage = Math.max(0, tickResult.damage - statusDmgReduction)
          unit.data.stats.hp = Math.max(0, unit.data.stats.hp - finalDamage)
          unit.refreshHPBar()
          if (unit.data.stats.hp <= 0) {
            unitManager.removeUnit(unit.data.id)
            continue
          }
        }

        // Apply leech heal-back to source units
        for (const leech of tickResult.leechHeal) {
          const source = unitManager.getUnit(leech.sourceUnitId)
          if (source && source.data.alive) {
            source.data.stats.hp = Math.min(
              source.data.stats.maxHp,
              source.data.stats.hp + leech.amount
            )
            source.refreshHPBar()
          }
        }

        // Apply corrosion (DEF reduction)
        if (tickResult.defReduction > 0) {
          unit.data.stats.defense = Math.max(0, unit.data.stats.defense - tickResult.defReduction)
        }
      }

      // Stasis: skip movement and charge recharge
      if (isInStasis(unit.data.statusEffects)) {
        unit.data.movementLeft = 0
        continue
      }

      unit.data.movementLeft = unit.data.stats.moveRange
      // Recharge weapon charges (base + aura boost from nearby allies)
      let rechargeAmount = unit.data.rechargeRate
      // Check for charge_boost auras from nearby allies
      const allies = unitManager.getTeamUnits(team)
      for (const ally of allies) {
        if (ally.data.id === unit.data.id) continue
        if (!ally.data.enemyTemplateId) continue
        const template = getEnemyTemplate(ally.data.enemyTemplateId)
        if (!template?.specials) continue
        for (const special of template.specials) {
          if (special.type === 'aura' && special.aura?.type === 'charge_boost') {
            const dist = Math.abs(ally.data.gridX - unit.data.gridX) +
              Math.abs(ally.data.gridZ - unit.data.gridZ)
            if (dist <= special.aura.range) {
              rechargeAmount += special.aura.value
            }
          }
        }
      }
      if (rechargeAmount > 0) {
        unit.data.charges = Math.min(
          unit.data.charges + rechargeAmount,
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
