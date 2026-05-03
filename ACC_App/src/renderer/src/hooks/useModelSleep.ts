import { useCallback, useEffect, useRef } from 'react'
import type { Model } from '@renderer/types'

function sleepDelayMs(setting: number): number {
  if (setting < 0) return Math.abs(setting) * 1000
  return setting * 60 * 1000
}

export interface UseModelSleepOptions {
  models: Model[]
  /** Şu an odaktaki model; bu id asla uyku zamanlayıcısına girmez (arka plandakiler uyur). */
  activeModelId: string | null
  autoCloseTimeoutMinutes: number
  onModelSleep: (modelId: string) => void
  onModelsUpdate: (updated: Model[]) => void
}

export function useModelSleep({
  models,
  activeModelId,
  autoCloseTimeoutMinutes,
  onModelSleep,
  onModelsUpdate
}: UseModelSleepOptions): {
  recordActivity: (modelId: string) => void
  clearTimer: (modelId: string) => void
  scheduleTimer: (modelId: string) => void
} {
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const clearTimer = useCallback((modelId: string) => {
    const t = timers.current.get(modelId)
    if (t !== undefined) {
      clearTimeout(t)
      timers.current.delete(modelId)
    }
  }, [])

  const scheduleTimer = useCallback(
    (modelId: string) => {
      if (autoCloseTimeoutMinutes === 0) return

      if (modelId === activeModelId) {
        clearTimer(modelId)
        return
      }

      clearTimer(modelId)

      const ms = sleepDelayMs(autoCloseTimeoutMinutes)
      const t = setTimeout(() => {
        timers.current.delete(modelId)
        onModelSleep(modelId)
      }, ms)

      timers.current.set(modelId, t)
    },
    [activeModelId, autoCloseTimeoutMinutes, clearTimer, onModelSleep]
  )

  const recordActivity = useCallback(
    (modelId: string) => {
      const now = Date.now()
      const updated = models.map((m) =>
        m.id === modelId ? { ...m, lastActive: now, isAsleep: false } : m
      )
      onModelsUpdate(updated)
      scheduleTimer(modelId)
    },
    [models, onModelsUpdate, scheduleTimer]
  )

  useEffect(() => {
    if (autoCloseTimeoutMinutes === 0) {
      timers.current.forEach((_, id) => clearTimer(id))
      return
    }

    const now = Date.now()
    const ms = sleepDelayMs(autoCloseTimeoutMinutes)

    models.forEach((model) => {
      if (model.isAsleep) {
        clearTimer(model.id)
        return
      }

      if (model.id === activeModelId) {
        clearTimer(model.id)
        return
      }

      const elapsed = now - (model.lastActive || now)
      const remaining = ms - elapsed

      if (remaining <= 0) {
        onModelSleep(model.id)
      } else {
        clearTimer(model.id)
        const t = setTimeout(() => {
          timers.current.delete(model.id)
          onModelSleep(model.id)
        }, remaining)
        timers.current.set(model.id, t)
      }
    })

    return () => {
      timers.current.forEach((t) => clearTimeout(t))
      timers.current.clear()
    }
  }, [models, activeModelId, autoCloseTimeoutMinutes, onModelSleep, clearTimer])

  return { recordActivity, clearTimer, scheduleTimer }
}
