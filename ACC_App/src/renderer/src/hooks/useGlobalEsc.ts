import { useEffect } from 'react'

interface UseGlobalEscOptions {
  isSyncOpen: boolean
  isSettingsOpen: boolean
  closeSync: () => void
  closeSettings: () => void
}

export function useGlobalEsc({
  isSyncOpen,
  isSettingsOpen,
  closeSync,
  closeSettings,
}: UseGlobalEscOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return

      // Priority: close whichever panel is open, settings first
      if (isSettingsOpen) {
        closeSettings()
        return
      }
      if (isSyncOpen) {
        closeSync()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSyncOpen, isSettingsOpen, closeSync, closeSettings])
}

