/// <reference types="vite/client" />
/// <reference types="react" />

declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string
      partition?: string
      allowpopups?: string | boolean
    }
  }
}

declare global {
  interface Window {
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
      resetStore: () => Promise<void>
      onNavigateHome: (cb: () => void) => () => void
    }
  }
}
