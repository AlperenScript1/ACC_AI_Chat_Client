import { Settings as SettingsIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ThemeMode } from '../store/useStore'
import { useStore } from '../store/useStore'
import { shortcutFromEvent } from '../lib/shortcut'

function ResetDataSection(): React.JSX.Element {
  const [step, setStep] = useState<'idle' | 'confirm' | 'warning'>('idle')

  const handleFinalConfirm = async (): Promise<void> => {
    await window.api.resetStore()
  }

  return (
    <div className="mt-2 pt-4 border-t border-black/10 dark:border-white/10">
      <div className="text-xs font-semibold tracking-wide text-red-600 dark:text-red-400">
        Danger zone
      </div>

      {step === 'idle' && (
        <button
          type="button"
          className="mt-3 w-full text-left px-3 py-2 rounded-md border border-red-500/20 text-red-700 dark:text-red-300 bg-transparent"
          onClick={() => setStep('confirm')}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Verileri Sil
        </button>
      )}

      {step === 'confirm' && (
        <div className="mt-3 rounded-md border border-red-500/20 p-3">
          <div className="text-xs text-black/70 dark:text-white/70">
            Emin misiniz? Tüm ayarlar, modeller ve sohbet geçmişi kalıcı olarak silinecektir.
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setStep('idle')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent',
                color: 'inherit',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={() => setStep('warning')}
              className="flex-1 px-2 py-2 rounded-md bg-red-600 text-white text-[13px]"
            >
              Sil
            </button>
          </div>
        </div>
      )}

      {step === 'warning' && (
        <div className="mt-3 rounded-md border border-red-500/20 p-3">
          <div className="text-xs text-black/70 dark:text-white/70">
            Uygulama tüm veriler silindikten sonra kapanacaktır. Devam etmek istiyor musunuz?
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setStep('idle')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent',
                color: 'inherit',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleFinalConfirm}
              className="flex-1 px-2 py-2 rounded-md bg-red-600 text-white text-[13px]"
            >
              Tamam, kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AutoCloseTimeoutSetting({
  value,
  onChange
}: {
  value: number
  onChange: (v: number) => void
}): React.JSX.Element {
  const options = [
    { label: 'Devre Dışı', value: 0 },
    { label: '30 saniye (test)', value: 0.5 },
    { label: '10 dakika', value: 10 },
    { label: '20 dakika', value: 20 },
    { label: '30 dakika', value: 30 },
    { label: '1 saat', value: 60 },
    { label: '2 saat', value: 120 }
  ]

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label className="text-xs text-black/40 dark:text-white/40">Otomatik uyku modu</label>
        <p className="mt-1 text-[10px] text-black/35 dark:text-white/35 leading-snug">
          Belirtilen süre boyunca etkileşim olmazsa model uyku moduna geçer; webview kaldırılarak bellek
          boşaltılır.
        </p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-white border border-black/10 text-black/80 text-xs rounded px-3 py-2 dark:bg-[#1a1a1a] dark:border-white/5 dark:text-white/70"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

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
  const autoCloseTimeout = useStore((s) => s.autoCloseTimeout)
  const searchShortcut = useStore((s) => s.searchShortcut)
  const setTheme = useStore((s) => s.setTheme)
  const setAnimationsEnabled = useStore((s) => s.setAnimationsEnabled)
  const setAutoCloseTimeout = useStore((s) => s.setAutoCloseTimeout)
  const setSearchShortcut = useStore((s) => s.setSearchShortcut)
  const homeShortcut = useStore((s) => s.homeShortcut)
  const setHomeShortcut = useStore((s) => s.setHomeShortcut)

  const [windowBoundsLocked, setWindowBoundsLocked] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async (): Promise<void> => {
      try {
        const settings = await window.api.getSettings()
        if (cancelled) return
        if (typeof settings?.windowBoundsLocked === 'boolean')
          setWindowBoundsLocked(settings.windowBoundsLocked)
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
        'absolute right-0 top-0 h-screen w-72 z-50 p-5 flex flex-col gap-6 overflow-y-auto',
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
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
              const prev = await window.api.getSettings()
              await window.api.saveSettings({ ...(prev ?? {}), windowBoundsLocked: next })
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

      <AutoCloseTimeoutSetting value={autoCloseTimeout} onChange={setAutoCloseTimeout} />

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

      <div className="flex flex-col gap-2">
        <label className="text-xs text-black/40 dark:text-white/40">Home Kısayolu</label>
        <input
          value={homeShortcut}
          readOnly
          onKeyDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const next = shortcutFromEvent(e.nativeEvent)
            if (!next) return
            setHomeShortcut(next)
            ;(async (): Promise<void> => {
              try {
                const prev = await window.api.getSettings()
                await window.api.saveSettings({ ...(prev ?? {}), homeHotkey: next })
              } catch {
                // ignore
              }
            })()
          }}
          className="bg-white border border-black/10 text-black/80 text-xs rounded px-3 py-2 dark:bg-[#1a1a1a] dark:border-white/5 dark:text-white/70"
        />
        <div className="text-[10px] text-black/35 dark:text-white/35 leading-snug">
          Değiştirmek için bu alana tıklayıp istediğin kombinasyonu bas (ör. Ctrl+Shift+H).
        </div>
      </div>

      <ResetDataSection />
    </div>
  )
}

export default function Settings(): React.JSX.Element {
  const animationsEnabled = useStore((s) => s.animationsEnabled)
  const isSettingsOpen = useStore((s) => s.isSettingsOpen)
  const setIsSettingsOpen = useStore((s) => s.setIsSettingsOpen)

  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const closeTimeoutRef = useRef<number | null>(null)

  useEffect((): void | (() => void) => {
    if (!isSettingsOpen) {
      if (!animationsEnabled) {
        if (closeTimeoutRef.current !== null) {
          window.clearTimeout(closeTimeoutRef.current)
          closeTimeoutRef.current = null
        }
        setVisible(false)
        setMounted(false)
        return
      }

      // If settings is closed externally (e.g. ESC global handler),
      // keep it mounted long enough for the exit animation to play.
      const DURATION_MS = 160
      setVisible(false)
      if (closeTimeoutRef.current !== null) window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = window.setTimeout(() => {
        setMounted(false)
        closeTimeoutRef.current = null
      }, DURATION_MS)
      return () => {
        if (closeTimeoutRef.current !== null) {
          window.clearTimeout(closeTimeoutRef.current)
          closeTimeoutRef.current = null
        }
      }
    }

    // Opening: cancel any pending close unmount
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    if (!animationsEnabled) {
      setMounted(true)
      setVisible(true)
      return
    }

    setMounted(true)
    // Ensure at least one paint occurs before toggling visible,
    // otherwise the opening transition may be skipped on some systems.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
  }, [isSettingsOpen, animationsEnabled])

  const openPanel = (): void => {
    setIsSettingsOpen(true)
  }

  const closePanel = (): void => {
    // Close via store; the effect above handles unmount timing for exit animation.
    setIsSettingsOpen(false)
  }

  return (
    <>
      <div className="w-full flex items-center justify-center pb-2">
        <button
          type="button"
          onClick={() => (isSettingsOpen ? closePanel() : openPanel())}
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
