import { create } from 'zustand'

export type AddedModel = {
  id: string
  name: string
  url: string
  icon?: string
  isFavorite?: boolean
}

export type ThemeMode = 'dark' | 'light'
export type AutoCloseMinutes = 7 | 10 | 30

type StoreState = {
  addedModels: AddedModel[]
  activeModelId: string | null
  theme: ThemeMode
  animationsEnabled: boolean
  searchShortcut: string
  isSyncEnabled: boolean
  syncSelection: string[]
  autoCloseMinutes: AutoCloseMinutes
  mountedModels: string[]
  lastActiveAt: Record<string, number>
  addModel: (model: AddedModel) => void
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
  setSearchShortcut: (key: string) => void
  toggleSync: () => void
  toggleModelInSync: (id: string) => void
  setAutoCloseMinutes: (minutes: AutoCloseMinutes) => void
  mountModel: (id: string) => void
  unmountModel: (id: string) => void
}

export const useStore = create<StoreState>((set) => ({
  addedModels: [],
  activeModelId: null,
  theme: 'dark',
  animationsEnabled: true,
  searchShortcut: 'f',
  isSyncEnabled: false,
  syncSelection: [],
  autoCloseMinutes: 10,
  mountedModels: [],
  lastActiveAt: {},
  addModel: (model) =>
    set((state) => {
      const duplicateByUrl = state.addedModels.some((m) => m.url === model.url)
      if (duplicateByUrl) {
        console.log('[acc] model already added:', model.url)
        return state
      }

      const normalized: AddedModel = {
        ...model,
        isFavorite: model.isFavorite ?? false
      }
      const exists = state.addedModels.some((m) => m.id === model.id)
      const addedModels = exists
        ? state.addedModels.map((m) => (m.id === model.id ? { ...m, ...normalized } : m))
        : [...state.addedModels, normalized]

      return {
        addedModels,
        activeModelId: normalized.id
      }
    }),
  removeModel: (id) =>
    set((state) => {
      const addedModels = state.addedModels.filter((m) => m.id !== id)
      const activeModelId = state.activeModelId === id ? null : state.activeModelId
      const mountedModels = state.mountedModels.filter((x) => x !== id)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: __, ...lastActiveAt } = state.lastActiveAt
      return { addedModels, activeModelId, mountedModels, lastActiveAt }
    }),
  toggleFavorite: (id) =>
    set((state) => ({
      addedModels: state.addedModels.map((m) =>
        m.id === id ? { ...m, isFavorite: !(m.isFavorite ?? false) } : m
      )
    })),
  reorderModelInGroup: ({ activeId, overId, group }) =>
    set((state) => {
      if (activeId === overId) return state
      const isInGroup = (m: AddedModel): boolean =>
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

      // Keep groups separate: favorites first, then normals.
      const addedModels = [...favoriteModels, ...normalModels]
      return { ...state, addedModels }
    }),
  setActiveModelId: (modelId) => set({ activeModelId: modelId }),
  setTheme: (theme) => set({ theme }),
  setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
  setSearchShortcut: (key) => set({ searchShortcut: key }),
  toggleSync: () =>
    set((s) => {
      const nextEnabled = !s.isSyncEnabled
      if (!nextEnabled) return { isSyncEnabled: false }

      if (s.syncSelection.length === 0 && s.activeModelId) {
        return { isSyncEnabled: true, syncSelection: [s.activeModelId] }
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
  setAutoCloseMinutes: (minutes) => set({ autoCloseMinutes: minutes }),
  mountModel: (id) =>
    set((state) => ({
      mountedModels: state.mountedModels.includes(id)
        ? state.mountedModels
        : [...state.mountedModels, id],
      lastActiveAt: { ...state.lastActiveAt, [id]: Date.now() }
    })),
  unmountModel: (id) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: __, ...rest } = state.lastActiveAt
      return {
        mountedModels: state.mountedModels.filter((x) => x !== id),
        lastActiveAt: rest
      }
    })
}))

export function selectActiveModel(
  state: Pick<StoreState, 'addedModels' | 'activeModelId'>
): AddedModel | null {
  if (!state.activeModelId) return null
  return state.addedModels.find((m) => m.id === state.activeModelId) ?? null
}
