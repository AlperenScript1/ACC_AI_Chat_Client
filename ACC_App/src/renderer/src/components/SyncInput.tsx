import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'

type SyncInputProps = {
  open: boolean
  onSend: (message: string) => void
}

export default function SyncInput({ open, onSend }: SyncInputProps): React.JSX.Element | null {
  const [value, setValue] = useState('')
  const [toastOpen, setToastOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const animationsEnabled = useStore((s) => s.animationsEnabled)
  const syncSelection = useStore((s) => s.syncSelection)
  const models = useStore((s) => s.addedModels)
  const mountedModels = useStore((s) => s.mountedModels)

  const selectedModels = models.filter((m) => syncSelection.includes(m.id))
  const canSend = syncSelection.length > 0 && mountedModels.some((id) => syncSelection.includes(id))

  useEffect(() => {
    if (!toastOpen) return
    const t = window.setTimeout(() => setToastOpen(false), 3000)
    return () => window.clearTimeout(t)
  }, [toastOpen])

  useEffect(() => {
    const DURATION_MS = 180

    if (!animationsEnabled) {
      setMounted(open)
      setVisible(open)
      return
    }

    if (open) {
      setMounted(true)
      setVisible(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true))
      })
      return
    }

    setVisible(false)
    const t = window.setTimeout(() => setMounted(false), DURATION_MS)
    return () => window.clearTimeout(t)
  }, [open, animationsEnabled])

  const showNoSelectionToast = (): void => {
    setToastOpen(false)
    window.setTimeout(() => setToastOpen(true), 0)
  }

  const trySend = (): void => {
    if (!value.trim()) return
    if (!canSend) {
      showNoSelectionToast()
      return
    }
    onSend(value.trim())
    setValue('')
  }

  if (!mounted) return null

  return (
    <>
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-200 ease-out
          ${toastOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
      >
        <div className="rounded-xl border border-[#47848F]/25 bg-[#47848F]/10 text-[#0b2a30] px-4 py-3 shadow-lg dark:border-[#47848F]/25 dark:bg-[#47848F]/10 dark:text-[#9fe3ee]">
          <div className="text-xs font-medium">Sync modu için en az bir model seçmelisiniz</div>
        </div>
      </div>

      <div
        className={`fixed bottom-0 left-16 right-0 z-40 bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-md border-t border-black/10 dark:border-white/5 px-4 py-3 flex items-center gap-3
        ${!animationsEnabled ? '' : 'transition-all duration-200 ease-out'}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
      >
        <div className="flex-1 flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-lg px-3 py-2">
          <span className="text-xs text-black/30 dark:text-white/30 shrink-0"><span className="text-purple-400 select-none"><i>Sync</i></span></span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              trySend()
            }}
            placeholder={!canSend ? "Sidebar'dan model seç" : 'Seçili modellere gönder...'}
            className="bg-transparent flex-1 text-sm outline-none focus-visible:outline-none focus-visible:ring-0 text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/20"
          />

          <button
            type="button"
            onClick={trySend}
            className={[
              'shrink-0 px-3 py-1.5 rounded-md text-xs border',
              'border-black/10 dark:border-white/10',
              'bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10',
              'text-black/60 dark:text-white/60',
              !animationsEnabled ? '' : 'transition-all duration-150 ease-out',
              value.trim()
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 translate-x-2 pointer-events-none'
            ].join(' ')}
          >
            Gönder
          </button>
        </div>
      <div className="flex items-center gap-2 shrink-0 select-none">
        {selectedModels
          .filter((m) => Boolean(m.icon))
          .map((m) => (
            <img
              key={m.id}
              src={m.icon}
              className="w-5 h-5 rounded-md opacity-70"
              title={m.name}
              alt={m.name}
            />
          ))}
        <span className="text-xs text-white/20 dark:text-white/20 text-black/30 whitespace-nowrap select-none">
          {selectedModels.length} model seçili
        </span>
      </div>
      </div>
    </>
  )
}
