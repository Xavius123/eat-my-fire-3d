/**
 * NetworkBridge — Abstraction layer for multiplayer communication.
 *
 * OfflineNetworkBridge is the default — it immediately confirms all actions
 * locally, preserving single-player behavior with zero overhead.
 *
 * Future implementations (NetworkHost, NetworkGuest) will handle Steam P2P.
 */

import type { NetworkMessage, PlayerRole } from './NetworkProtocol'

export interface NetworkBridge {
  readonly role: PlayerRole
  readonly isOnline: boolean

  /** Send a message to the remote peer. No-op in offline mode. */
  send(message: NetworkMessage): void

  /** Register a handler for incoming messages. */
  onMessage(handler: (message: NetworkMessage) => void): void

  /** Clean up listeners and connections. */
  dispose(): void
}

/**
 * Offline passthrough — used in single-player mode.
 * All actions are local; no network traffic occurs.
 */
export class OfflineNetworkBridge implements NetworkBridge {
  readonly role: PlayerRole = 'host'
  readonly isOnline = false

  send(_message: NetworkMessage): void {
    // No-op: single-player mode, no remote peer
  }

  onMessage(_handler: (message: NetworkMessage) => void): void {
    // No-op: no incoming messages in offline mode
  }

  dispose(): void {
    // Nothing to clean up
  }
}
