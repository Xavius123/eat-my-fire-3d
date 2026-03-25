/**
 * NetworkGuest — Guest-side network bridge using Steam P2P.
 *
 * The guest sends ActionRequests to the host and waits for ActionConfirm
 * or ActionReject messages. All state mutations come from the host —
 * the guest only replays confirmed actions visually.
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

export class NetworkGuest implements NetworkBridge {
  readonly role = 'guest' as const
  readonly isOnline = true

  private handlers: ((message: NetworkMessage) => void)[] = []
  private hostSteamId: string | null = null

  /**
   * @param hostSteamId The Steam ID of the lobby host to send messages to.
   */
  async init(hostSteamId: string): Promise<void> {
    this.hostSteamId = hostSteamId

    getSteamAPI().onP2PMessage((raw: string) => {
      try {
        const parsed: unknown = JSON.parse(raw)
        if (!validateNetworkMessage(parsed)) {
          console.warn('[NetworkGuest] Rejected malformed or unknown P2P message')
          return
        }
        const message: NetworkMessage = parsed
        for (const handler of this.handlers) handler(message)
      } catch (err) {
        console.warn('[NetworkGuest] Failed to parse P2P message:', err)
      }
    })
  }

  send(message: NetworkMessage): void {
    if (!this.hostSteamId) {
      console.warn('[NetworkGuest] Cannot send — no host Steam ID')
      return
    }
    const data = JSON.stringify(message)
    getSteamAPI().sendP2P(this.hostSteamId, data)
  }

  onMessage(handler: (message: NetworkMessage) => void): void {
    this.handlers.push(handler)
  }

  dispose(): void {
    this.handlers = []
    getSteamAPI().removeP2PListeners()
  }
}
