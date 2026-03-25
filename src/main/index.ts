import { app, BrowserWindow, ipcMain, shell, globalShortcut } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { is } from '@electron-toolkit/utils'
import * as SteamManager from './SteamManager'

let mainWindow: BrowserWindow | null = null

// ── Settings persistence ──

interface DisplaySettings {
  width: number
  height: number
  fullscreen: boolean
}

const DEFAULTS: DisplaySettings = { width: 1280, height: 900, fullscreen: false }

/** Match BrowserWindow minWidth/minHeight; cap to avoid absurd IPC values. */
const DISPLAY_MIN_W = 1100
const DISPLAY_MIN_H = 800
const DISPLAY_MAX_W = 7680
const DISPLAY_MAX_H = 4320

const LOBBY_PLAYERS_MIN = 2
const LOBBY_PLAYERS_MAX = 16

const MAX_P2P_PAYLOAD_CHARS = 512_000

function clampDisplaySize(width: unknown, height: unknown): { width: number; height: number } | null {
  if (typeof width !== 'number' || typeof height !== 'number') return null
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null
  const w = Math.min(Math.max(Math.round(width), DISPLAY_MIN_W), DISPLAY_MAX_W)
  const h = Math.min(Math.max(Math.round(height), DISPLAY_MIN_H), DISPLAY_MAX_H)
  return { width: w, height: h }
}

function clampLobbyPlayers(n: unknown): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return 4
  const i = Math.round(n)
  return Math.min(Math.max(i, LOBBY_PLAYERS_MIN), LOBBY_PLAYERS_MAX)
}

function sanitizeLobbyId(id: unknown): string | null {
  if (typeof id !== 'string') return null
  if (id.length === 0 || id.length > 64) return null
  if (!/^\d+$/.test(id)) return null
  return id
}

/** SteamID64 is a numeric string (typical length 17). */
function sanitizeSteamId64(id: unknown): string | null {
  if (typeof id !== 'string') return null
  if (id.length < 5 || id.length > 32) return null
  if (!/^\d+$/.test(id)) return null
  return id
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function loadSettings(): DisplaySettings {
  try {
    const raw = readFileSync(settingsPath(), 'utf-8')
    const data = JSON.parse(raw)
    return {
      width: Math.max(data.width ?? DEFAULTS.width, 1100),
      height: Math.max(data.height ?? DEFAULTS.height, 800),
      fullscreen: data.fullscreen ?? DEFAULTS.fullscreen,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function saveSettings(settings: DisplaySettings): void {
  try {
    mkdirSync(join(app.getPath('userData')), { recursive: true })
    writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
  } catch (err) {
    console.warn('Failed to save settings:', err)
  }
}

// ── Window creation ──

function createWindow(): void {
  const settings = loadSettings()

  mainWindow = new BrowserWindow({
    width: settings.width,
    height: settings.height,
    minWidth: 1100,
    minHeight: 800,
    fullscreen: settings.fullscreen,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // steamworks.js enables the Steam overlay via native hooks; sandboxing is disabled
      // so the native module can load. Keep contextIsolation + no nodeIntegration.
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Alt+Enter toggles fullscreen; F12 toggles DevTools
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.type !== 'keyDown') return
    if (input.alt && input.key === 'Enter') {
      const win = mainWindow!
      const goFullscreen = !win.isFullScreen()
      win.setFullScreen(goFullscreen)
      const [width, height] = win.getSize()
      saveSettings({ width, height, fullscreen: goFullscreen })
    }
    if (input.key === 'F12') {
      mainWindow?.webContents.toggleDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── Display settings IPC ──

ipcMain.handle('display:setResolution', (_event, width: unknown, height: unknown) => {
  const size = clampDisplaySize(width, height)
  if (!size || !mainWindow) return
  if (mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false)
  }
  mainWindow.setSize(size.width, size.height)
  mainWindow.center()
  saveSettings({ ...size, fullscreen: false })
})

ipcMain.handle('display:setFullscreen', (_event, enabled: unknown) => {
  if (typeof enabled !== 'boolean' || !mainWindow) return
  mainWindow.setFullScreen(enabled)
  const [width, height] = mainWindow.getSize()
  saveSettings({ width, height, fullscreen: enabled })
})

ipcMain.handle('display:getSettings', () => {
  if (!mainWindow) return { ...DEFAULTS }
  const [width, height] = mainWindow.getSize()
  const fullscreen = mainWindow.isFullScreen()
  return { width, height, fullscreen }
})

// ── Steam IPC ──

ipcMain.handle('steam:isOnline', () => SteamManager.isInitialized())
ipcMain.handle('steam:getPlayerName', () => SteamManager.getPlayerName())
ipcMain.handle('steam:getSteamId', () => SteamManager.getSteamId())
ipcMain.handle('steam:createLobby', (_e, maxPlayers: unknown) =>
  SteamManager.createLobby(clampLobbyPlayers(maxPlayers))
)
ipcMain.handle('steam:joinLobby', (_e, lobbyId: unknown) => {
  const id = sanitizeLobbyId(lobbyId)
  if (!id) return false
  return SteamManager.joinLobby(id)
})
ipcMain.handle('steam:leaveLobby', () => SteamManager.leaveLobby())
ipcMain.handle('steam:getLobbyMembers', () => SteamManager.getLobbyMembers())
ipcMain.handle('steam:getCurrentLobbyId', () => SteamManager.getCurrentLobbyId())
ipcMain.handle('steam:sendP2P', (_e, targetId: unknown, data: unknown) => {
  const id = sanitizeSteamId64(targetId)
  if (!id || typeof data !== 'string') return false
  if (data.length > MAX_P2P_PAYLOAD_CHARS) return false
  return SteamManager.sendP2PMessage(id, data)
})

app.whenReady().then(() => {
  SteamManager.init(480) // Spacewar test app ID

  // Forward P2P messages from Steam to renderer
  SteamManager.setP2PMessageHandler((data: string) => {
    mainWindow?.webContents.send('steam:p2pMessage', data)
  })

  createWindow()

  globalShortcut.register('F12', () => {
    mainWindow?.webContents.toggleDevTools()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  SteamManager.shutdown()
  if (process.platform !== 'darwin') app.quit()
})
