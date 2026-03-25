/**
 * NetworkHost — Host-side network bridge using Steam P2P.
 *
 * The host runs all game logic locally. When a guest sends an ActionRequest,
 * the host validates and processes it, then broadcasts the confirmed result
 * back. The host also broadcasts phase changes, scene transitions, and
 * periodic state syncs.
 */

import type { NetworkBridge } from './NetworkBridge'
import type { NetworkMessage } from './NetworkProtocol'
import { validateNetworkMessage } from './validateNetworkMessage'

interface SteamAPI {
  getSteamId(): Promise<string | null>
  getLobbyMembers(): Promise<string[]>
  sendP2P(targetId: string, data: string): Promise<boolean>
  onP2PMessage(handler: (data: string) => void): void
  removeP2PListeners(): void
}

function getSteamAPI(): SteamAPI {
  return (window as any).steamAPI
}

export class NetworkHost implements NetworkBridge {
  readonly role = 'host' as const
  readonly isOnline = true

  private handlers: ((message: NetworkMessage) => void)[] = []
  private localSteamId: string | null = null

  async init(): Promise<void> {
    const steam = getSteamAPI()
    this.localSteamId = await steam.getSteamId()

    steam.onP2PMessage((raw: string) => {
      try {
        const parsed: unknown = JSON.parse(raw)
        if (!validateNetworkMessage(parsed)) {
          console.warn('[NetworkHost] Rejected malformed or unknown P2P message')
          return
        }
        const message: NetworkMessage = parsed
        for (const handler of this.handlers) handler(message)
      } catch (err) {
        console.warn('[NetworkHost] Failed to parse P2P message:', err)
      }
    })
  }

  send(message: NetworkMessage): void {
    // Broadcast to all guests (all lobby members except self)
    const data = JSON.stringify(message)
    const steam = getSteamAPI()

    steam.getLobbyMembers().then((members) => {
      for (const memberId of members) {
        if (memberId !== this.localSteamId) {
          steam.sendP2P(memberId, data)
        }
      }
    })
  }

  onMessage(handler: (message: NetworkMessage) => void): void {
    this.handlers.push(handler)
  }

  dispose(): void {
    this.handlers = []
    getSteamAPI().removeP2PListeners()
  }
}
