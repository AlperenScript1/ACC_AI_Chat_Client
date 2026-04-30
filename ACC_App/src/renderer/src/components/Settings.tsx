import { Settings as SettingsIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AutoCloseMinutes, ThemeMode } from '../store/useStore'
import { useStore } from '../store/useStore'

function SettingsPanel({
  visible,
  animationsEnabled,
  onClose
}: {
  visible: boolean
  animationsEnabled: boolean
  onClose: () => void
}): React.JSX.Element {
  const theme = useStore((s) => s.theme)
  const autoCloseMinutes = useStore((s) => s.autoCloseMinutes)
  const searchShortcut = useStore((s) => s.searchShortcut)
  const setTheme = useStore((s) => s.setTheme)
  const setAnimationsEnabled = useStore((s) => s.setAnimationsEnabled)
  const setAutoCloseMinutes = useStore((s) => s.setAutoCloseMinutes)
  const setSearchShortcut = useStore((s) => s.setSearchShortcut)

  const [windowBoundsLocked, setWindowBoundsLocked] = useState(true)

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    ;(async (): Promise<void> => {
      try {
        const locked = await window.electron?.ipcRenderer?.invoke?.('acc:get-window-bounds-lock')
        if (cancelled) return
        if (typeof locked === 'boolean') setWindowBoundsLocked(locked)
      } catch {
        // ignore - feature optional in dev
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      className={[
        'absolute right-0 top-0 h-screen w-72 z-50 p-5 flex flex-col gap-6',
        'bg-[#f5f5f5] dark:bg-[#0f0f0f] border-l border-black/5 dark:border-white/5',
        animationsEnabled ? 'transition-all duration-150 ease-out' : '',
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-black dark:text-white">Ayarlar</span>
        <button
          onClick={onClose}
          className="text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Restrict window size */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-black/40 dark:text-white/40">Restrict window size</label>
        <button
          type="button"
          onClick={async () => {
            const next = !windowBoundsLocked
            setWindowBoundsLocked(next)
            try {
              await window.electron?.ipcRenderer?.invoke?.('acc:set-window-bounds-lock', next)
            } catch {
              // ignore
            }
          }}
          className={`w-full py-2 rounded text-xs border transition-colors ${
            windowBoundsLocked
              ? 'bg-black/5 border-black/20 text-black dark:bg-white/10 dark:border-white/20 dark:text-white'
              : 'bg-transparent border-black/10 text-black/60 dark:border-white/10 dark:text-white/60'
          }`}
        >
          {windowBoundsLocked ? 'On' : 'Off'}
        </button>
      </div>

      {/* Animations */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-black/40 dark:text-white/40">Animasyonlar</label>
        <button
          type="button"
          onClick={() => setAnimationsEnabled(!animationsEnabled)}
          className={`w-full py-2 rounded text-xs border transition-colors ${
            animationsEnabled
              ? 'bg-black/5 border-black/20 text-black dark:bg-white/10 dark:border-white/20 dark:text-white'
              : 'bg-transparent border-black/10 text-black/60 dark:border-white/10 dark:text-white/60'
          }`}
        >
          {animationsEnabled ? 'Açık' : 'Kapalı'}
        </button>
      </div>

      {/* Theme */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-black/40 dark:text-white/40">Tema</label>
        <div className="flex gap-2">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t as ThemeMode)}
              className={`flex-1 py-2 rounded text-xs border transition-colors
            ${
              theme === t
                ? 'bg-black/5 border-black/20 text-black dark:bg-white/10 dark:border-white/20 dark:text-white'
                : 'bg-transparent border-black/5 text-black/40 hover:border-black/10 dark:border-white/5 dark:text-white/40 dark:hover:border-white/10'
            }`}
            >
              {t === 'dark' ? 'Karanlık' : 'Aydınlık'}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-close */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-black/40 dark:text-white/40">Otomatik Kapanma</label>
        <select
          value={autoCloseMinutes}
          onChange={(e) => setAutoCloseMinutes(Number(e.target.value) as AutoCloseMinutes)}
          className="bg-white border border-black/10 text-black/80 text-xs rounded px-3 py-2 dark:bg-[#1a1a1a] dark:border-white/5 dark:text-white/70"
        >
          <option value={7}>7 dakika</option>
          <option value={10}>10 dakika</option>
          <option value={30}>30 dakika</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-black/40 dark:text-white/40">Arama Kısayolu</label>
        <select
          value={searchShortcut}
          onChange={(e) => setSearchShortcut(e.target.value)}
          className="bg-white border border-black/10 text-black/80 text-xs rounded px-3 py-2 dark:bg-[#1a1a1a] dark:border-white/5 dark:text-white/70"
        >
          <option value="f">Ctrl + F</option>
          <option value="k">Ctrl + K</option>
          <option value="p">Ctrl + P</option>
        </select>
      </div>
    </div>
  )
}

export default function Settings(): React.JSX.Element {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  const animationsEnabled = useStore((s) => s.animationsEnabled)

  const openPanel = (): void => {
    if (!animationsEnabled) {
      setMounted(true)
      setVisible(true)
      return
    }
    setMounted(true)
    requestAnimationFrame(() => setVisible(true))
  }

  const closePanel = (): void => {
    if (!animationsEnabled) {
      setVisible(false)
      setMounted(false)
      return
    }
    const DURATION_MS = 160
    setVisible(false)
    window.setTimeout(() => setMounted(false), DURATION_MS)
  }

  return (
    <>
      <div className="w-full flex items-center justify-center pb-2">
        <button
          type="button"
          onClick={() => (mounted ? closePanel() : openPanel())}
          className={[
            'h-12 w-12 rounded-full',
            'bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10',
            'border border-black/10 dark:border-white/10',
            'transition',
            'hover:shadow-[0_0_24px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_24px_rgba(255,255,255,0.18)]'
          ].join(' ')}
          title="Ayarlar"
          aria-label="Ayarlar"
        >
          <SettingsIcon className="mx-auto text-black/70 dark:text-white/80" size={18} />
        </button>
      </div>

      {mounted ? (
        <>
          <div className="fixed inset-0 z-40" onClick={closePanel} />
          <SettingsPanel visible={visible} animationsEnabled={animationsEnabled} onClose={closePanel} />
        </>
      ) : null}
    </>
  )
}
