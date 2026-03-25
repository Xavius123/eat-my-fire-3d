/**
 * ActionQueue — Decouples input sources from combat execution.
 *
 * Local mouse clicks and future remote (co-op) network messages both produce
 * GameAction objects. This class is the single point that translates those
 * actions into CombatActions calls, making it the natural injection point for
 * a network bridge in Phase 7.
 *
 * Usage:
 *   // Local input:
 *   const result = await actionQueue.processAction({ type: 'attack', attackerId, defenderId })
 *
 *   // Future co-op (Phase 7):
 *   // Remote actions: validate with validateGameAction() from ../network/validateNetworkMessage
 *   // before processAction — only the host should call processAction for network-sourced moves.
 */

import type { UnitEntity } from '../entities/UnitEntity'
import type { UnitManager } from '../entities/UnitManager'
import type { Team } from '../entities/UnitData'
import { CombatActions } from './CombatActions'

// ─────────────────────────────────────────────────────────────────────────────
// Action types — the vocabulary of things that can happen in combat.
// All input sources (mouse, keyboard, network) produce these.
// ─────────────────────────────────────────────────────────────────────────────

export type GameAction =
  | { type: 'move';       unitId: string; targetX: number; targetZ: number }
  | { type: 'attack';     attackerId: string; defenderId: string }
  | { type: 'endTurn';    team: Team }
  | { type: 'useAbility'; unitId: string; abilityId: string; targetX: number; targetZ: number }

// ─────────────────────────────────────────────────────────────────────────────
// Result types — returned by processAction so callers can react
// ─────────────────────────────────────────────────────────────────────────────

export type ActionResult =
  | { type: 'move';       success: boolean }
  | { type: 'attack';     damage: number }
  | { type: 'endTurn' }
  | { type: 'useAbility'; success: boolean }

// ─────────────────────────────────────────────────────────────────────────────
// ActionQueue
// ─────────────────────────────────────────────────────────────────────────────

export class ActionQueue {
  constructor(
    private readonly combatActions: CombatActions,
    private readonly unitManager: UnitManager
  ) {}

  /**
   * Translate a GameAction into the appropriate CombatActions call and
   * return the result. Async because combat actions involve animations.
   */
  async processAction(action: GameAction): Promise<ActionResult> {
    switch (action.type) {
      case 'move': {
        const unit = this.unitManager.getUnit(action.unitId)
        if (!unit) return { type: 'move', success: false }
        const success = await this.combatActions.moveUnit(unit, action.targetX, action.targetZ)
        return { type: 'move', success }
      }

      case 'attack': {
        const attacker = this.unitManager.getUnit(action.attackerId)
        const defender = this.unitManager.getUnit(action.defenderId)
        if (!attacker || !defender) return { type: 'attack', damage: 0 }
        const damage = await this.combatActions.attackUnit(attacker, defender)
        return { type: 'attack', damage }
      }

      case 'endTurn':
        // Handled externally by TurnManager; ActionQueue just acknowledges.
        return { type: 'endTurn' }

      case 'useAbility':
        // Placeholder — implemented in Phase 6 (boss abilities / specials).
        return { type: 'useAbility', success: false }
    }
  }

  /**
   * Pass-through query: can attacker reach defender with its current attack type?
   * Kept here so InputManager only needs ActionQueue, not a direct CombatActions ref.
   */
  canAttack(attacker: UnitEntity, defender: UnitEntity): boolean {
    return this.combatActions.canAttack(attacker, defender)
  }
}
