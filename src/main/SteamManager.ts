/**
 * SteamManager — Wraps steamworks.js in the main process.
 *
 * Handles initialization, callback pumping, lobby management,
 * P2P messaging, and graceful fallback when Steam isn't running.
 */

let steamClient: any = null
let callbackInterval: ReturnType<typeof setInterval> | null = null
let currentLobbyId: string | null = null

// Callback for relaying received P2P messages to the renderer
let onP2PMessage: ((data: string) => void) | null = null

export function init(appId: number): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const steamworks = require('steamworks.js')
    steamClient = steamworks.init(appId)

    // Enable Steam overlay for Electron windows
    steamworks.electronEnableSteamOverlay()

    // Poll for P2P messages at ~60 Hz (Steam callbacks are pumped automatically)
    callbackInterval = setInterval(() => {
      pollP2PMessages()
    }, 16)

    console.log('[Steam] Initialized successfully')
    return true
  } catch (err) {
    console.warn('[Steam] Not available, continuing offline:', (err as Error).message)
    steamClient = null
    return false
  }
}

export function isInitialized(): boolean {
  return steamClient !== null
}

export function getPlayerName(): string | null {
  if (!steamClient) return null
  try {
    return steamClient.localplayer.getName()
  } catch {
    return null
  }
}

export function getSteamId(): string | null {
  if (!steamClient) return null
  try {
    return steamClient.localplayer.getSteamId().steamId64.toString()
  } catch {
    return null
  }
}

// ── Lobby Management ──

export async function createLobby(maxPlayers: number): Promise<string | null> {
  if (!steamClient) return null
  try {
    const lobby = await steamClient.matchmaking.createLobby(
      'friendsOnly',
      maxPlayers
    )
    currentLobbyId = lobby.id.toString()
    console.log('[Steam] Created lobby:', currentLobbyId)
    return currentLobbyId
  } catch (err) {
    console.error('[Steam] Failed to create lobby:', err)
    return null
  }
}

export async function joinLobby(lobbyId: string): Promise<boolean> {
  if (!steamClient) return false
  try {
    await steamClient.matchmaking.joinLobby(lobbyId)
    currentLobbyId = lobbyId
    console.log('[Steam] Joined lobby:', lobbyId)
    return true
  } catch (err) {
    console.error('[Steam] Failed to join lobby:', err)
    return false
  }
}

export function leaveLobby(): void {
  if (!steamClient || !currentLobbyId) return
  try {
    steamClient.matchmaking.leaveLobby(currentLobbyId)
    console.log('[Steam] Left lobby:', currentLobbyId)
  } catch (err) {
    console.warn('[Steam] Failed to leave lobby:', err)
  }
  currentLobbyId = null
}

export function getLobbyMembers(): string[] {
  if (!steamClient || !currentLobbyId) return []
  try {
    const members = steamClient.matchmaking.getLobbyMembers(currentLobbyId)
    return members.map((m: any) => m.steamId64.toString())
  } catch {
    return []
  }
}

export function getCurrentLobbyId(): string | null {
  return currentLobbyId
}

// ── P2P Messaging ──

export function sendP2PMessage(targetSteamId: string, data: string): boolean {
  if (!steamClient) return false
  try {
    const buffer = Buffer.from(data, 'utf-8')
    steamClient.networking.sendP2PPacket(targetSteamId, buffer, 'reliable', 0)
    return true
  } catch (err) {
    console.error('[Steam] Failed to send P2P message:', err)
    return false
  }
}

export function setP2PMessageHandler(handler: ((data: string) => void) | null): void {
  onP2PMessage = handler
}

function pollP2PMessages(): void {
  if (!steamClient || !onP2PMessage) return
  try {
    while (steamClient.networking.isP2PPacketAvailable(0)) {
      const packet = steamClient.networking.readP2PPacket(0)
      if (packet && packet.data) {
        const message = Buffer.from(packet.data).toString('utf-8')
        onP2PMessage(message)
      }
    }
  } catch {
    // Silently ignore polling errors
  }
}

export function shutdown(): void {
  leaveLobby()
  if (callbackInterval) {
    clearInterval(callbackInterval)
    callbackInterval = null
  }
  onP2PMessage = null
  steamClient = null
  console.log('[Steam] Shutdown')
}
