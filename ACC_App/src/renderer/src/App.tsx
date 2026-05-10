import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CommandPalette from './components/CommandPalette'
import { ConfigRecoveryBanner } from './components/ConfigRecoveryBanner'
import { ModelWebview, type WebviewLike } from './components/ModelWebview'
import ModelMarket from './components/ModelMarket'
import Notes from './components/Notes'
import Sidebar from './components/Sidebar'
import SyncInput from './components/SyncInput'
import { useModelSleep } from './hooks/useModelSleep'
import { useGlobalEsc } from './hooks/useGlobalEsc'
import { isSettingsUiLocale } from './locales/settingsUi'
import { normalizeAutoCloseTimeoutMinutes } from './lib/autoCloseTimeout'
import { buildInjectScript } from './lib/syncInjector'
import { matchesShortcut, normalizeStoredNotesShortcut, normalizeStoredSearchShortcut } from './lib/shortcut'
import { useStore } from './store/useStore'
import { normalizeModel } from './types'
import pkg from '../../../package.json'

function Welcome(): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 w-full flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-xs tracking-widest text-black/50 dark:text-white/40 uppercase select-none">
            {t('app.brand')}
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-black via-black/70 to-black/40 dark:from-white dark:via-white/80 dark:to-white/40 select-none">
            {t('app.welcomeTitle')}
          </div>
          <div className="mt-3 text-sm text-black/60 dark:text-white/45 select-none">
            {t('app.welcomeHintPrefix')}{' '}
            <span className="text-black/80 dark:text-white/70 font-semibold">+</span>{' '}
            {t('app.welcomeHintSuffix')}
          </div>
        </div>
      </div>

      <div className="pb-6 text-center text-xs text-[#47848F] select-none">
        <span className="relative inline-block px-3 py-1">
          <span className="acc-electron-bloom" />
          <span className="relative">
            {t('app.poweredBy')}
          </span>
        </span>
      </div>
    </div>
  )
}

function App(): React.JSX.Element {
  const { t } = useTranslation()
  const [paletteOpen, setPaletteOpen] = useState(false)

  const addedModels = useStore((s) => s.addedModels)
  const activeModelId = useStore((s) => s.activeModelId)
  const theme = useStore((s) => s.theme)
  const searchShortcut = useStore((s) => s.searchShortcut)
  const notesShortcut = useStore((s) => s.notesShortcut)
  const isSyncEnabled = useStore((s) => s.isSyncEnabled)
  const syncSelection = useStore((s) => s.syncSelection)
  const toggleSync = useStore((s) => s.toggleSync)
  const isSettingsOpen = useStore((s) => s.isSettingsOpen)
  const setIsSettingsOpen = useStore((s) => s.setIsSettingsOpen)
  const homeShortcut = useStore((s) => s.homeShortcut)
  const setHomeShortcut = useStore((s) => s.setHomeShortcut)
  const setActiveModelId = useStore((s) => s.setActiveModelId)
  const autoCloseTimeout = useStore((s) => s.autoCloseTimeout)
  const applyModelsUpdate = useStore((s) => s.applyModelsUpdate)
  const markModelAsleep = useStore((s) => s.markModelAsleep)
  const mountModel = useStore((s) => s.mountModel)
  const hydrateNotesFromDisk = useStore((s) => s.hydrateNotesFromDisk)

  const webviewRefs = useRef<Record<string, WebviewLike | null>>({})

  const registerWebview = useCallback((modelId: string, el: WebviewLike | null) => {
    webviewRefs.current[modelId] = el
  }, [])

  const sleepExcludedModelId =
    activeModelId && activeModelId !== 'market' ? activeModelId : null

  const { recordActivity } = useModelSleep({
    models: addedModels,
    activeModelId: sleepExcludedModelId,
    autoCloseTimeoutMinutes: autoCloseTimeout,
    onModelSleep: markModelAsleep,
    onModelsUpdate: applyModelsUpdate
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    let cleanup: (() => void) | null = null
    ;(async (): Promise<void> => {
      let autoCloseForHydration = useStore.getState().autoCloseTimeout
      try {
        const settings = await window.api.getSettings()
        if (settings?.homeHotkey) setHomeShortcut(settings.homeHotkey)
        if (settings?.theme === 'dark' || settings?.theme === 'light')
          useStore.setState({ theme: settings.theme })
        if (typeof settings?.animationsEnabled === 'boolean')
          useStore.setState({ animationsEnabled: settings.animationsEnabled })
        if (typeof settings?.searchShortcut === 'string') {
          useStore.setState({
            searchShortcut: normalizeStoredSearchShortcut(settings.searchShortcut)
          })
        }
        if (typeof settings?.notesShortcut === 'string') {
          useStore.setState({
            notesShortcut: normalizeStoredNotesShortcut(settings.notesShortcut)
          })
        }
        if (typeof settings?.autoCloseTimeout === 'number') {
          autoCloseForHydration = normalizeAutoCloseTimeoutMinutes(settings.autoCloseTimeout)
          useStore.setState({
            autoCloseTimeout: autoCloseForHydration
          })
        }
        if (isSettingsUiLocale(settings?.settingsUiLocale)) {
          useStore.setState({ settingsUiLocale: settings.settingsUiLocale })
        }
      } catch {
        // ignore (dev / API unavailable)
      }

      try {
        const models = await window.api.getModels()
        if (Array.isArray(models)) {
          const raw = models as Record<string, unknown>[]
          const sleepOnLaunch = autoCloseForHydration !== 0
          useStore.setState({
            addedModels: raw.map((m) =>
              normalizeModel({
                id: String(m.id ?? ''),
                name: String(m.name ?? ''),
                url: String(m.url ?? ''),
                icon: typeof m.icon === 'string' ? m.icon : undefined,
                isFavorite: Boolean(m.isFavorite),
                lastActive: typeof m.lastActive === 'number' ? m.lastActive : undefined,
                isAsleep: sleepOnLaunch
              })
            ).filter((m) => m.id && m.url)
          })
        }
      } catch {
        // ignore
      }

      void hydrateNotesFromDisk()

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
  }, [setActiveModelId, setHomeShortcut, hydrateNotesFromDisk])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        toggleSync()
      } else if (matchesShortcut(e, searchShortcut)) {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      } else if (matchesShortcut(e, homeShortcut)) {
        e.preventDefault()
        setPaletteOpen(false)
        setActiveModelId(null)
      } else if (matchesShortcut(e, notesShortcut)) {
        e.preventDefault()
        setPaletteOpen(false)
        setActiveModelId('notes')
      } else if (e.key === 'Escape' && !isSettingsOpen && !isSyncEnabled) {
        setPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    searchShortcut,
    notesShortcut,
    toggleSync,
    isSettingsOpen,
    isSyncEnabled,
    homeShortcut,
    setActiveModelId
  ])

  useGlobalEsc({
    isSyncOpen: isSyncEnabled,
    isSettingsOpen,
    closeSync: () => {
      if (isSyncEnabled) toggleSync()
    },
    closeSettings: () => setIsSettingsOpen(false)
  })

  const sendToAllModels = async (message: string): Promise<void> => {
    const script = buildInjectScript(message)
    const targets = syncSelection.filter((id) =>
      addedModels.some((m) => m.id === id && !m.isAsleep)
    )
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
            <span style={{ color: 'red' }}>{t('app.preAlpha')}</span>
          </div>
          <div className={`relative flex-1 h-screen overflow-hidden ${isSyncEnabled ? 'pb-14' : ''}`}>
            {activeModelId === 'market' ? <ModelMarket /> : null}
            {activeModelId === 'notes' ? <Notes /> : null}

            <div
              className={activeModelId === 'market' || activeModelId === 'notes' ? 'hidden' : 'h-full w-full'}
            >
              {!activeModelId ? <Welcome /> : null}

              {addedModels.map((model) => {
                const isActive = activeModelId === model.id
                if (model.isAsleep && !isActive) return null

                return (
                  <div
                    key={model.id}
                    className="absolute inset-0 transition-opacity duration-150 ease-out"
                    style={{
                      opacity: isActive ? 1 : 0,
                      pointerEvents: isActive ? 'auto' : 'none'
                    }}
                  >
                    <ModelWebview
                      model={model}
                      isActive={isActive}
                      onActivity={recordActivity}
                      onWake={mountModel}
                      registerWebview={registerWebview}
                    />
                  </div>
                )
              })}
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
