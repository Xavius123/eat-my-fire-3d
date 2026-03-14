/**
 * LocalNetworkBridge — In-process fake network for dev/testing.
 *
 * Creates a paired host + guest bridge that pass messages through memory.
 * No Steam required. Use `createLocalPair()` to get both sides.
 */

import type { NetworkBridge } from './NetworkBridge'
import type { NetworkMessage, PlayerRole } from './NetworkProtocol'

class LocalBridge implements NetworkBridge {
  readonly isOnline = true
  private handlers: ((message: NetworkMessage) => void)[] = []
  private peer: LocalBridge | null = null

  constructor(readonly role: PlayerRole) {}

  /** Connect this bridge to its counterpart. */
  connect(peer: LocalBridge): void {
    this.peer = peer
  }

  send(message: NetworkMessage): void {
    if (!this.peer) return
    // Simulate async network delivery (next microtask)
    const target = this.peer
    Promise.resolve().then(() => {
      for (const handler of target.handlers) handler(message)
    })
  }

  onMessage(handler: (message: NetworkMessage) => void): void {
    this.handlers.push(handler)
  }

  dispose(): void {
    this.handlers = []
    this.peer = null
  }
}

export interface LocalNetworkPair {
  host: NetworkBridge
  guest: NetworkBridge
}

/**
 * Create a connected host + guest bridge pair for local testing.
 * Messages sent by one side are received by the other.
 */
export function createLocalPair(): LocalNetworkPair {
  const host = new LocalBridge('host')
  const guest = new LocalBridge('guest')
  host.connect(guest)
  guest.connect(host)
  return { host, guest }
}
