import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getStoreData: (key?: string) => Promise<unknown>
      setStoreData: (key: string, value: unknown) => Promise<unknown>
      getSettings: () => Promise<{
        language: string
        homeHotkey: string
        windowBoundsLocked: boolean
        theme?: string
        animationsEnabled?: boolean
        searchShortcut?: string
      }>
      saveSettings: (s: Record<string, unknown>) => Promise<unknown>
      getModels: () => Promise<unknown>
      saveModels: (m: unknown[]) => Promise<unknown>
      getChatHistory: () => Promise<unknown>
      saveChatHistory: (h: unknown[]) => Promise<unknown>
      resetStore: () => Promise<void>
      onNavigateHome: (cb: () => void) => () => void
    }
  }
}
