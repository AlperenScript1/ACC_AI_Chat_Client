import { useEffect, useMemo, useRef, useState } from 'react'
import CommandPalette from './components/CommandPalette'
import { ConfigRecoveryBanner } from './components/ConfigRecoveryBanner'
import ModelMarket from './components/ModelMarket'
import Sidebar from './components/Sidebar'
import SyncInput from './components/SyncInput'
import { useGlobalEsc } from './hooks/useGlobalEsc'
import { buildInjectScript } from './lib/syncInjector'
import { matchesShortcut } from './lib/shortcut'
import { useStore } from './store/useStore'
import pkg from '../../../package.json'

function Welcome(): React.JSX.Element {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-xs tracking-widest text-black/50 dark:text-white/40 uppercase">
            ACC - AI Chat Client 
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-black via-black/70 to-black/40 dark:from-white dark:via-white/80 dark:to-white/40">
            Başlamak için bir model seçin
          </div>
          <div className="mt-3 text-sm text-black/60 dark:text-white/45">
            Soldaki <span className="text-black/80 dark:text-white/70 font-semibold">+</span> ile bir
            model ekleyin.
          </div>
        </div>
      </div>

      <div className="pb-6 text-center text-xs text-[#47848F] select-none">
        <span className="relative inline-block px-3 py-1">
          <span className="acc-electron-bloom" />
          <span className="relative">Power by <i>Electron & React</i></span>
        </span>
      </div>
    </div>
  )
}

function App(): React.JSX.Element {
  const [paletteOpen, setPaletteOpen] = useState(false)

  const addedModels = useStore((s) => s.addedModels)
  const mountedModels = useStore((s) => s.mountedModels)
  const activeModelId = useStore((s) => s.activeModelId)
  const theme = useStore((s) => s.theme)
  const searchShortcut = useStore((s) => s.searchShortcut)
  const isSyncEnabled = useStore((s) => s.isSyncEnabled)
  const syncSelection = useStore((s) => s.syncSelection)
  const toggleSync = useStore((s) => s.toggleSync)
  const isSettingsOpen = useStore((s) => s.isSettingsOpen)
  const setIsSettingsOpen = useStore((s) => s.setIsSettingsOpen)
  const homeShortcut = useStore((s) => s.homeShortcut)
  const setHomeShortcut = useStore((s) => s.setHomeShortcut)
  const setActiveModelId = useStore((s) => s.setActiveModelId)
  const autoCloseMinutes = useStore((s) => s.autoCloseMinutes)
  const lastActiveAt = useStore((s) => s.lastActiveAt)
  const unmountModel = useStore((s) => s.unmountModel)

  type WebviewLike = HTMLElement & { executeJavaScript: (code: string) => Promise<unknown> }
  const webviewRefs = useRef<Record<string, WebviewLike | null>>({})

  const modelsById = useMemo(() => {
    const map: Record<string, { url: string }> = {}
    for (const m of addedModels) map[m.id] = { url: m.url }
    return map
  }, [addedModels])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    let cleanup: (() => void) | null = null
    ;(async (): Promise<void> => {
      try {
        const settings = await window.api.getSettings()
        if (settings?.homeHotkey) setHomeShortcut(settings.homeHotkey)
        if (settings?.theme === 'dark' || settings?.theme === 'light')
          useStore.setState({ theme: settings.theme })
        if (typeof settings?.animationsEnabled === 'boolean')
          useStore.setState({ animationsEnabled: settings.animationsEnabled })
        if (settings?.searchShortcut) useStore.setState({ searchShortcut: settings.searchShortcut })
      } catch {
        // ignore (dev / API unavailable)
      }

      try {
        const models = await window.api.getModels()
        if (Array.isArray(models)) useStore.setState({ addedModels: models as any[] })
      } catch {
        // ignore
      }

      try {
        cleanup = window.api.onNavigateHome(() => {
          setPaletteOpen(false)
          setActiveModelId(null)
        })
      } catch {
        // ignore
      }
    })()
    return () => cleanup?.()
  }, [setActiveModelId, setHomeShortcut])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        toggleSync()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === searchShortcut) {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      } else if (matchesShortcut(e, homeShortcut)) {
        e.preventDefault()
        setPaletteOpen(false)
        setActiveModelId(null)
      } else if (e.key === 'Escape' && !isSettingsOpen && !isSyncEnabled) {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [searchShortcut, toggleSync, isSettingsOpen, isSyncEnabled, homeShortcut, setActiveModelId])

  useGlobalEsc({
    isSyncOpen: isSyncEnabled,
    isSettingsOpen,
    closeSync: () => {
      if (isSyncEnabled) toggleSync()
    },
    closeSettings: () => setIsSettingsOpen(false)
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const limit = autoCloseMinutes * 60 * 1000
      Object.entries(lastActiveAt).forEach(([id, ts]) => {
        if (id !== activeModelId && now - ts > limit) unmountModel(id)
      })
    }, 60_000)
    return () => clearInterval(interval)
  }, [autoCloseMinutes, activeModelId, lastActiveAt, unmountModel])

  const sendToAllModels = async (message: string): Promise<void> => {
    const script = buildInjectScript(message)
    const targets = syncSelection.filter((id) => mountedModels.includes(id))
    for (const id of targets) {
      const wv = webviewRefs.current[id]
      if (wv) {
        try {
          await wv.executeJavaScript(script)
        } catch (e) {
          console.warn('Sync failed for', id, e)
        }
      }
    }
  }

  return (
    <>
      <ConfigRecoveryBanner />

      <div className="h-screen w-screen bg-[#f5f5f5] text-black dark:bg-[#050505] dark:text-white flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 h-screen bg-[#f5f5f5] dark:bg-[#050505] overflow-hidden">
          <div className="absolute left-20 top-3 z-40 text-[11px] tracking-wide text-black/40 dark:text-white/30 select-none">
            v{pkg.version} <span className="mx-1">•</span>{' '}
            <span style={{ color: 'red' }}>Pre-Alpha</span>
          </div>
          <div className={`relative flex-1 h-screen overflow-hidden ${isSyncEnabled ? 'pb-14' : ''}`}>
            {activeModelId === 'market' ? <ModelMarket /> : null}

            <div className={activeModelId === 'market' ? 'hidden' : 'h-full w-full'}>
              {mountedModels.length === 0 || !activeModelId ? <Welcome /> : null}

              {mountedModels.map((id) => (
                <div
                  key={id}
                  className="absolute inset-0 transition-opacity duration-150 ease-out"
                  style={{
                    opacity: activeModelId === id ? 1 : 0,
                    pointerEvents: activeModelId === id ? 'auto' : 'none'
                  }}
                >
                  {/* eslint-disable react/no-unknown-property */}
                  {modelsById[id]?.url ? (
                    <webview
                      ref={(el) => {
                        webviewRefs.current[id] = el as unknown as WebviewLike
                      }}
                      src={modelsById[id]?.url}
                      className="w-full h-full"
                      allowpopups={true}
                      partition="persist:acc"
                    />
                  ) : null}
                  {/* eslint-enable react/no-unknown-property */}
                </div>
              ))}
            </div>
          </div>
        </main>

        {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
        <SyncInput open={isSyncEnabled} onSend={sendToAllModels} />
      </div>
    </>
  )
}

export default App
