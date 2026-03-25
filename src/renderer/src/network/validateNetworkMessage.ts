/**
 * Runtime validation for P2P JSON before dispatch. The host must not trust
 * raw guest payloads — validate shape here, then apply game rules in ActionQueue.
 */

import type { ActionResult, GameAction } from '../combat/ActionQueue'
import type { NetworkMessage } from './NetworkProtocol'

export function validateGameAction(action: unknown): action is GameAction {
  if (!action || typeof action !== 'object') return false
  const a = action as Record<string, unknown>
  switch (a.type) {
    case 'move':
      return (
        typeof a.unitId === 'string' &&
        typeof a.targetX === 'number' &&
        Number.isFinite(a.targetX) &&
        typeof a.targetZ === 'number' &&
        Number.isFinite(a.targetZ) &&
        Math.abs(a.targetX) < 512 &&
        Math.abs(a.targetZ) < 512
      )
    case 'attack':
      return (
        typeof a.attackerId === 'string' &&
        a.attackerId.length > 0 &&
        typeof a.defenderId === 'string' &&
        a.defenderId.length > 0
      )
    case 'endTurn':
      return a.team === 'player' || a.team === 'enemy'
    case 'useAbility':
      return (
        typeof a.unitId === 'string' &&
        typeof a.abilityId === 'string' &&
        typeof a.targetX === 'number' &&
        Number.isFinite(a.targetX) &&
        typeof a.targetZ === 'number' &&
        Number.isFinite(a.targetZ)
      )
    default:
      return false
  }
}

export function validateActionResult(r: unknown): r is ActionResult {
  if (!r || typeof r !== 'object') return false
  const o = r as Record<string, unknown>
  switch (o.type) {
    case 'move':
      return typeof o.success === 'boolean'
    case 'attack':
      return typeof o.damage === 'number' && Number.isFinite(o.damage)
    case 'endTurn':
      return true
    case 'useAbility':
      return typeof o.success === 'boolean'
    default:
      return false
  }
}

/** Reject malformed messages so handlers never see attacker-controlled garbage. */
export function validateNetworkMessage(msg: unknown): msg is NetworkMessage {
  if (!msg || typeof msg !== 'object') return false
  const m = msg as Record<string, unknown>
  switch (m.type) {
    case 'actionRequest':
      return validateGameAction(m.action)
    case 'actionConfirm':
      return validateGameAction(m.action) && validateActionResult(m.result)
    case 'actionReject':
      return (
        validateGameAction(m.action) &&
        typeof m.reason === 'string' &&
        m.reason.length < 4000
      )
    case 'stateSync':
      return typeof m.state === 'object' && m.state !== null && !Array.isArray(m.state)
    case 'phaseChange':
      return typeof m.phase === 'string' && m.phase.length < 500
    case 'sceneTransition': {
      if (typeof m.scene !== 'string' || m.scene.length >= 200) return false
      if (m.data !== undefined && (typeof m.data !== 'object' || m.data === null)) return false
      return true
    }
    case 'runStateUpdate':
      return typeof m.data === 'object' && m.data !== null
    case 'loadoutSubmit':
      return typeof m.loadout === 'object' && m.loadout !== null
    case 'unitOwnership':
      return typeof m.assignments === 'object' && m.assignments !== null
    case 'playerReady':
      return m.role === 'host' || m.role === 'guest'
    default:
      return false
  }
}
