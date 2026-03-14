import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const steamAPI = {
  isOnline: (): Promise<boolean> =>
    ipcRenderer.invoke('steam:isOnline'),
  getPlayerName: (): Promise<string | null> =>
    ipcRenderer.invoke('steam:getPlayerName'),
  getSteamId: (): Promise<string | null> =>
    ipcRenderer.invoke('steam:getSteamId'),
  createLobby: (maxPlayers: number): Promise<string | null> =>
    ipcRenderer.invoke('steam:createLobby', maxPlayers),
  joinLobby: (lobbyId: string): Promise<boolean> =>
    ipcRenderer.invoke('steam:joinLobby', lobbyId),
  leaveLobby: (): Promise<void> =>
    ipcRenderer.invoke('steam:leaveLobby'),
  getLobbyMembers: (): Promise<string[]> =>
    ipcRenderer.invoke('steam:getLobbyMembers'),
  getCurrentLobbyId: (): Promise<string | null> =>
    ipcRenderer.invoke('steam:getCurrentLobbyId'),
  sendP2P: (targetId: string, data: string): Promise<boolean> =>
    ipcRenderer.invoke('steam:sendP2P', targetId, data),
  onP2PMessage: (handler: (data: string) => void): void => {
    ipcRenderer.on('steam:p2pMessage', (_event, data: string) => handler(data))
  },
  removeP2PListeners: (): void => {
    ipcRenderer.removeAllListeners('steam:p2pMessage')
  },
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
