import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getStoreData: (key?: string) => Promise<unknown>
      setStoreData: (key: string, value: unknown) => Promise<unknown>
      wasConfigRecreated: () => Promise<boolean>
      acknowledgeConfigRecreated: () => Promise<boolean>
      getSettings: () => Promise<{
        language: string
        homeHotkey: string
        windowBoundsLocked: boolean
        theme?: string
        animationsEnabled?: boolean
        searchShortcut?: string
        autoCloseTimeout?: number
      }>
      saveSettings: (s: Record<string, unknown>) => Promise<unknown>
      getModels: () => Promise<unknown>
      saveModels: (m: unknown[]) => Promise<unknown>
      resetStore: () => Promise<void>
      onNavigateHome: (cb: () => void) => () => void
    }
  }
}
