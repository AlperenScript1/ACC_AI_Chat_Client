import { create } from 'zustand'
import { normalizeAutoCloseTimeoutMinutes } from '../lib/autoCloseTimeout'
import { DEFAULT_HOME_SHORTCUT, DEFAULT_SEARCH_SHORTCUT, parseShortcut } from '../lib/shortcut'
import type { Model } from '../types'
import { normalizeModel } from '../types'

export type ThemeMode = 'dark' | 'light'

async function persistSettings(partial: Record<string, unknown>): Promise<void> {
  try {
    const prev = (await window.api?.getSettings?.()) as Record<string, unknown> | undefined
    const next = { ...(prev ?? {}), ...partial }
    await window.api?.saveSettings?.(next)
  } catch {
    console.warn('[renderer] persistSettings failed')
  }
}

async function persistModels(models: Model[]): Promise<void> {
  try {
    await window.api?.saveModels?.(models as unknown[])
  } catch {
    console.warn('[renderer] persistModels failed')
  }
}

type StoreState = {
  addedModels: Model[]
  activeModelId: string | null
  theme: ThemeMode
  animationsEnabled: boolean
  isSettingsOpen: boolean
  homeShortcut: string
  searchShortcut: string
  isSyncEnabled: boolean
  syncSelection: string[]
  /** Dakika: 10 | 30 | 60 | 120 | 180 (varsayılan 30) */
  autoCloseTimeout: number
  addModel: (model: Omit<Model, 'lastActive' | 'isAsleep'> & Partial<Pick<Model, 'lastActive' | 'isAsleep'>>) => void
  removeModel: (id: string) => void
  toggleFavorite: (id: string) => void
  reorderModelInGroup: (params: {
    activeId: string
    overId: string
    group: 'favorite' | 'normal'
  }) => void
  setActiveModelId: (modelId: string | null) => void
  setTheme: (theme: ThemeMode) => void
  setAnimationsEnabled: (enabled: boolean) => void
  setIsSettingsOpen: (open: boolean) => void
  setHomeShortcut: (shortcut: string) => void
  setSearchShortcut: (key: string) => void
  toggleSync: () => void
  toggleModelInSync: (id: string) => void
  setAutoCloseTimeout: (minutes: number) => void
  /** Wake + bump lastActive; used when opening a model from sidebar / market */
  mountModel: (id: string) => void
  applyModelsUpdate: (models: Model[]) => void
  markModelAsleep: (id: string) => void
}

export const useStore = create<StoreState>((set) => ({
  addedModels: [],
  activeModelId: null,
  theme: 'dark',
  animationsEnabled: true,
  isSettingsOpen: false,
  homeShortcut: DEFAULT_HOME_SHORTCUT,
  searchShortcut: DEFAULT_SEARCH_SHORTCUT,
  isSyncEnabled: false,
  syncSelection: [],
  autoCloseTimeout: 30,
  addModel: (model) =>
    set((state) => {
      const duplicateByUrl = state.addedModels.some((m) => m.url === model.url)
      if (duplicateByUrl) {
        return state
      }

      const normalized = normalizeModel({
        ...model,
        isFavorite: model.isFavorite ?? false,
        lastActive: model.lastActive ?? Date.now(),
        isAsleep: model.isAsleep ?? false
      })
      const exists = state.addedModels.some((m) => m.id === normalized.id)
      const addedModels = exists
        ? state.addedModels.map((m) =>
            m.id === normalized.id ? normalizeModel({ ...m, ...model }) : m
          )
        : [...state.addedModels, normalized]

      void persistModels(addedModels)
      return {
        addedModels,
        activeModelId: normalized.id
      }
    }),
  removeModel: (id) =>
    set((state) => {
      const addedModels = state.addedModels.filter((m) => m.id !== id)
      const activeModelId = state.activeModelId === id ? null : state.activeModelId
      void persistModels(addedModels)
      return { addedModels, activeModelId }
    }),
  toggleFavorite: (id) =>
    set((state) => {
      const addedModels = state.addedModels.map((m) =>
        m.id === id ? { ...m, isFavorite: !(m.isFavorite ?? false) } : m
      )
      void persistModels(addedModels)
      return { addedModels }
    }),
  reorderModelInGroup: ({ activeId, overId, group }) =>
    set((state) => {
      if (activeId === overId) return state
      const isInGroup = (m: Model): boolean =>
        group === 'favorite' ? m.isFavorite === true : m.isFavorite !== true

      const groupModels = state.addedModels.filter(isInGroup)
      const otherModels = state.addedModels.filter((m) => !isInGroup(m))

      const from = groupModels.findIndex((m) => m.id === activeId)
      const to = groupModels.findIndex((m) => m.id === overId)
      if (from === -1 || to === -1) return state

      const moved = groupModels.splice(from, 1)[0]
      groupModels.splice(to, 0, moved)

      const favoriteModels =
        group === 'favorite' ? groupModels : otherModels.filter((m) => m.isFavorite === true)
      const normalModels =
        group === 'normal' ? groupModels : otherModels.filter((m) => m.isFavorite !== true)

      const addedModels = [...favoriteModels, ...normalModels]
      void persistModels(addedModels)
      return { ...state, addedModels }
    }),
  setActiveModelId: (modelId) => set({ activeModelId: modelId }),
  setTheme: (theme) => {
    void persistSettings({ theme })
    set({ theme })
  },
  setAnimationsEnabled: (enabled) => {
    void persistSettings({ animationsEnabled: enabled })
    set({ animationsEnabled: enabled })
  },
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setHomeShortcut: (shortcut) => {
    void persistSettings({ homeHotkey: shortcut.trim() })
    set({ homeShortcut: shortcut.trim() })
  },
  setSearchShortcut: (key) => {
    const t = key.trim()
    const next = parseShortcut(t) ? t : DEFAULT_SEARCH_SHORTCUT
    void persistSettings({ searchShortcut: next })
    set({ searchShortcut: next })
  },
  toggleSync: () =>
    set((s) => {
      const nextEnabled = !s.isSyncEnabled
      if (!nextEnabled) return { isSyncEnabled: false }

      const activeId = s.activeModelId
      const canAutoSelectActive =
        Boolean(activeId) &&
        activeId !== 'market' &&
        s.addedModels.some((m) => m.id === activeId) &&
        s.addedModels.some((m) => m.id === activeId && !m.isAsleep)

      if (s.syncSelection.length === 0 && canAutoSelectActive) {
        return { isSyncEnabled: true, syncSelection: [activeId!] }
      }
      return { isSyncEnabled: true }
    }),
  toggleModelInSync: (id) =>
    set((s) => {
      const exists = s.syncSelection.includes(id)
      return {
        syncSelection: exists ? s.syncSelection.filter((x) => x !== id) : [...s.syncSelection, id]
      }
    }),
  setAutoCloseTimeout: (minutes) => {
    const next = normalizeAutoCloseTimeoutMinutes(minutes)
    void persistSettings({ autoCloseTimeout: next })
    set({ autoCloseTimeout: next })
  },
  mountModel: (id) =>
    set((state) => {
      const addedModels = state.addedModels.map((m) =>
        m.id === id ? { ...m, isAsleep: false, lastActive: Date.now() } : m
      )
      void persistModels(addedModels)
      return { addedModels }
    }),
  applyModelsUpdate: (models) => {
    void persistModels(models)
    set({ addedModels: models })
  },
  markModelAsleep: (id) =>
    set((state) => {
      const addedModels = state.addedModels.map((m) =>
        m.id === id ? { ...m, isAsleep: true } : m
      )
      void persistModels(addedModels)
      return { addedModels }
    })
}))

export function selectActiveModel(
  state: Pick<StoreState, 'addedModels' | 'activeModelId'>
): Model | null {
  if (!state.activeModelId) return null
  return state.addedModels.find((m) => m.id === state.activeModelId) ?? null
}

/** @deprecated use Model from '../types' */
export type AddedModel = Model
