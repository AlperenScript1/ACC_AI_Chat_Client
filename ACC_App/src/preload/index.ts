import { contextBridge, ipcRenderer } from 'electron'

// Whitelist of valid IPC channels renderer may invoke
const INVOKE_CHANNELS = ['get-store-data', 'set-store-data', 'reset-store'] as const
const SEND_CHANNELS = ['quit-app'] as const

void INVOKE_CHANNELS
void SEND_CHANNELS

contextBridge.exposeInMainWorld('api', {
  getStoreData: (key?: string) => ipcRenderer.invoke('get-store-data', key),

  setStoreData: (key: string, value: unknown) => ipcRenderer.invoke('set-store-data', key, value),

  getSettings: () => ipcRenderer.invoke('get-store-data', 'settings'),

  saveSettings: (s: Record<string, unknown>) => ipcRenderer.invoke('set-store-data', 'settings', s),

  getModels: () => ipcRenderer.invoke('get-store-data', 'models'),

  saveModels: (m: unknown[]) => ipcRenderer.invoke('set-store-data', 'models', m),

  resetStore: async () => {
    await ipcRenderer.invoke('reset-store')
    ipcRenderer.send('quit-app')
  },

  onNavigateHome: (callback: () => void) => {
    ipcRenderer.on('navigate-home', callback)
    return () => ipcRenderer.removeAllListeners('navigate-home')
  }
})
