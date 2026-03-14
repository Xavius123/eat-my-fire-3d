/**
 * NetworkProtocol — Message type definitions for co-op multiplayer.
 *
 * All network communication uses this discriminated union.
 * Messages are serialized as JSON over Steam P2P.
 */

import type { GameAction, ActionResult } from '../combat/ActionQueue'

// ── Player identity ──

export type PlayerRole = 'host' | 'guest'

// ── Network messages ──

export type NetworkMessage =
  | { type: 'actionRequest';    action: GameAction }
  | { type: 'actionConfirm';    action: GameAction; result: ActionResult }
  | { type: 'actionReject';     action: GameAction; reason: string }
  | { type: 'stateSync';        state: Record<string, unknown> }
  | { type: 'phaseChange';      phase: string }
  | { type: 'sceneTransition';  scene: string; data?: Record<string, unknown> }
  | { type: 'runStateUpdate';   data: Record<string, unknown> }
  | { type: 'loadoutSubmit';    loadout: Record<string, unknown> }
  | { type: 'unitOwnership';    assignments: Record<string, PlayerRole> }
  | { type: 'playerReady';      role: PlayerRole }
