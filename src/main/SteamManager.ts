/**
 * SteamManager — Wraps steamworks.js in the main process.
 *
 * Handles initialization, callback pumping, and graceful fallback
 * when Steam isn't running (offline/development mode).
 */

let steamClient: any = null
let callbackInterval: ReturnType<typeof setInterval> | null = null

export function init(appId: number): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const steamworks = require('steamworks.js')
    steamClient = steamworks.init(appId)

    // Enable Steam overlay for Electron windows
    steamworks.electronEnableSteamOverlay()

    // Pump Steam callbacks at ~60 Hz
    callbackInterval = setInterval(() => {
      steamClient.runCallbacks()
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

export function shutdown(): void {
  if (callbackInterval) {
    clearInterval(callbackInterval)
    callbackInterval = null
  }
  steamClient = null
  console.log('[Steam] Shutdown')
}
