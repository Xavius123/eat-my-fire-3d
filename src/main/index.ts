import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { is } from '@electron-toolkit/utils'

let mainWindow: BrowserWindow | null = null

// ── Settings persistence ──

interface DisplaySettings {
  width: number
  height: number
  fullscreen: boolean
}

const DEFAULTS: DisplaySettings = { width: 1280, height: 720, fullscreen: false }

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function loadSettings(): DisplaySettings {
  try {
    const raw = readFileSync(settingsPath(), 'utf-8')
    const data = JSON.parse(raw)
    return {
      width: data.width ?? DEFAULTS.width,
      height: data.height ?? DEFAULTS.height,
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

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
