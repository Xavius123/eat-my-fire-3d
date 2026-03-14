import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const steamAPI = {
  isOnline: (): Promise<boolean> =>
    ipcRenderer.invoke('steam:isOnline'),
  getPlayerName: (): Promise<string | null> =>
    ipcRenderer.invoke('steam:getPlayerName'),
}

const displayAPI = {
  setResolution: (width: number, height: number): Promise<void> =>
    ipcRenderer.invoke('display:setResolution', width, height),
  setFullscreen: (enabled: boolean): Promise<void> =>
    ipcRenderer.invoke('display:setFullscreen', enabled),
  getDisplaySettings: (): Promise<{ width: number; height: number; fullscreen: boolean }> =>
    ipcRenderer.invoke('display:getSettings'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('display', displayAPI)
    contextBridge.exposeInMainWorld('steamAPI', steamAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error - non-isolated fallback
  window.electron = electronAPI
  // @ts-expect-error - non-isolated fallback
  window.display = displayAPI
  // @ts-expect-error - non-isolated fallback
  window.steamAPI = steamAPI
}
