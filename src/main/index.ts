import { app, BrowserWindow, ipcMain, shell } from 'electron'
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
      sandbox: false,
      contextIsolation: true
    }
  })

  // Alt+Enter toggles fullscreen
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.alt && input.key === 'Enter' && input.type === 'keyDown') {
      const win = mainWindow!
      const goFullscreen = !win.isFullScreen()
      win.setFullScreen(goFullscreen)
      const [width, height] = win.getSize()
      saveSettings({ width, height, fullscreen: goFullscreen })
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

ipcMain.handle('display:setResolution', (_event, width: number, height: number) => {
  if (!mainWindow) return
  if (mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false)
  }
  mainWindow.setSize(width, height)
  mainWindow.center()
  saveSettings({ width, height, fullscreen: false })
})

ipcMain.handle('display:setFullscreen', (_event, enabled: boolean) => {
  if (!mainWindow) return
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
ipcMain.handle('steam:createLobby', (_e, maxPlayers: number) => SteamManager.createLobby(maxPlayers))
ipcMain.handle('steam:joinLobby', (_e, lobbyId: string) => SteamManager.joinLobby(lobbyId))
ipcMain.handle('steam:leaveLobby', () => SteamManager.leaveLobby())
ipcMain.handle('steam:getLobbyMembers', () => SteamManager.getLobbyMembers())
ipcMain.handle('steam:getCurrentLobbyId', () => SteamManager.getCurrentLobbyId())
ipcMain.handle('steam:sendP2P', (_e, targetId: string, data: string) =>
  SteamManager.sendP2PMessage(targetId, data)
)

app.whenReady().then(() => {
  SteamManager.init(480) // Spacewar test app ID

  // Forward P2P messages from Steam to renderer
  SteamManager.setP2PMessageHandler((data: string) => {
    mainWindow?.webContents.send('steam:p2pMessage', data)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  SteamManager.shutdown()
  if (process.platform !== 'darwin') app.quit()
})
