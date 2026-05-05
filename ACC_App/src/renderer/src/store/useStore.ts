import { create } from 'zustand'
import { normalizeAutoCloseTimeoutMinutes } from '../lib/autoCloseTimeout'
import { isSettingsUiLocale, type SettingsUiLocale } from '../locales/settingsUi'
import { DEFAULT_HOME_SHORTCUT, DEFAULT_SEARCH_SHORTCUT, parseShortcut } from '../lib/shortcut'
import type { Model, Note, NoteCategory } from '../types'
import { normalizeModel, normalizeNote, normalizeNoteCategory } from '../types'

export type ThemeMode = 'dark' | 'light'

export const DONE_CATEGORY_ID = 'cat_done' as const

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

async function persistNotes(notes: Note[]): Promise<void> {
  try {
    await window.api?.saveNotes?.(notes as unknown[])
  } catch {
    console.warn('[renderer] persistNotes failed')
  }
}

async function persistNoteCategories(cats: NoteCategory[]): Promise<void> {
  try {
    await window.api?.saveNoteCategories?.(cats as unknown[])
  } catch {
    console.warn('[renderer] persistNoteCategories failed')
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
  /** Settings panel copy (persisted; wire UI picker later). */
  settingsUiLocale: SettingsUiLocale
  notes: Note[]
  noteCategories: NoteCategory[]
  addNote: (partial?: Partial<Pick<Note, 'title' | 'color' | 'categoryIds'>>) => string
  updateNote: (
    id: string,
    patch: Partial<Pick<Note, 'title' | 'content' | 'color' | 'categoryIds' | 'isDone'>>
  ) => void
  toggleNoteCategory: (noteId: string, categoryId: string) => void
  deleteNote: (id: string) => void
  reorderNotes: (params: { activeId: string; overId: string }) => void
  applyNotesUpdate: (notes: Note[]) => void
  addNoteCategory: (name: string, color?: string) => string
  renameNoteCategory: (id: string, name: string) => void
  setNoteCategoryColor: (id: string, color: string) => void
  deleteNoteCategory: (id: string) => void
  hydrateNotesFromDisk: () => Promise<void>
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
  setSettingsUiLocale: (locale: SettingsUiLocale) => void
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
  settingsUiLocale: 'en',
  notes: [],
  noteCategories: [],
  addNote: (partial) => {
    const id = `note_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
    set((state) => {
      const now = Date.now()
      const next: Note = normalizeNote({
        id,
        title: partial?.title ?? 'Yeni Not',
        color: partial?.color ?? '#7c3aed',
        categoryIds: Array.isArray(partial?.categoryIds) ? partial?.categoryIds : [],
        content: '',
        isDone: false,
        createdAt: now,
        updatedAt: now
      })
      const notes = [next, ...state.notes]
      void persistNotes(notes)
      return { notes }
    })
    return id
  },
  updateNote: (id, patch) =>
    set((state) => {
      const now = Date.now()
      const notes = state.notes.map((n) =>
        n.id === id ? normalizeNote({ ...n, ...patch, updatedAt: now }) : n
      )
      void persistNotes(notes)
      return { notes }
    }),
  toggleNoteCategory: (noteId, categoryId) =>
    set((state) => {
      const notes = state.notes.map((n) => {
        if (n.id !== noteId) return n
        const exists = n.categoryIds.includes(categoryId)
        const categoryIds = exists
          ? n.categoryIds.filter((x) => x !== categoryId)
          : [...n.categoryIds, categoryId]
        return normalizeNote({ ...n, categoryIds, updatedAt: Date.now() })
      })
      void persistNotes(notes)
      return { notes }
    }),
  deleteNote: (id) =>
    set((state) => {
      const notes = state.notes.filter((n) => n.id !== id)
      void persistNotes(notes)
      return { notes }
    }),
  reorderNotes: ({ activeId, overId }) =>
    set((state) => {
      if (activeId === overId) return state
      const from = state.notes.findIndex((n) => n.id === activeId)
      const to = state.notes.findIndex((n) => n.id === overId)
      if (from === -1 || to === -1) return state
      const next = [...state.notes]
      const moved = next.splice(from, 1)[0]
      next.splice(to, 0, moved)
      void persistNotes(next)
      return { notes: next }
    }),
  applyNotesUpdate: (notes) => {
    void persistNotes(notes)
    set({ notes })
  },
  addNoteCategory: (name, color) => {
    const id = `cat_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
    set((state) => {
      const next = [
        ...state.noteCategories,
        normalizeNoteCategory({ id, name, color: color ?? '#0ea5e9', createdAt: Date.now() })
      ]
      void persistNoteCategories(next)
      return { noteCategories: next }
    })
    return id
  },
  renameNoteCategory: (id, name) =>
    set((state) => {
      const next = state.noteCategories.map((c) => (c.id === id ? { ...c, name: name.trim() || c.name } : c))
      void persistNoteCategories(next)
      return { noteCategories: next }
    }),
  setNoteCategoryColor: (id, color) =>
    set((state) => {
      const next = state.noteCategories.map((c) => (c.id === id ? { ...c, color } : c))
      void persistNoteCategories(next)
      return { noteCategories: next }
    }),
  deleteNoteCategory: (id) =>
    set((state) => {
      if (id === DONE_CATEGORY_ID) return state
      const noteCategories = state.noteCategories.filter((c) => c.id !== id)
      const notes = state.notes.map((n) =>
        n.categoryIds.includes(id) ? { ...n, categoryIds: n.categoryIds.filter((x) => x !== id) } : n
      )
      void persistNoteCategories(noteCategories)
      void persistNotes(notes)
      return { noteCategories, notes }
    }),
  hydrateNotesFromDisk: async () => {
    try {
      const rawNotes = (await window.api?.getNotes?.()) as unknown
      const rawCats = (await window.api?.getNoteCategories?.()) as unknown
      const notes = Array.isArray(rawNotes)
        ? (rawNotes as Record<string, unknown>[]).map((n) => normalizeNote({ ...(n as any), id: String((n as any).id ?? '') })).filter((n) => n.id)
        : []
      const noteCategories = Array.isArray(rawCats)
        ? (rawCats as Record<string, unknown>[])
            .map((c) =>
              normalizeNoteCategory({ ...(c as any), id: String((c as any).id ?? '') })
            )
            .filter((c) => c.id)
        : []

      // Ensure default, non-deletable "Tamamlananlar" category exists.
      const hasDone = noteCategories.some((c) => c.id === DONE_CATEGORY_ID)
      const nextCategories = hasDone
        ? noteCategories
        : [
            ...noteCategories,
            normalizeNoteCategory({
              id: DONE_CATEGORY_ID,
              name: 'Tamamlananlar',
              color: '#10b981',
              createdAt: Date.now()
            })
          ]

      if (!hasDone) void persistNoteCategories(nextCategories)
      set({ notes, noteCategories: nextCategories })
    } catch {
      // ignore
    }
  },
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
  setSettingsUiLocale: (locale) => {
    const next = isSettingsUiLocale(locale) ? locale : 'en'
    void persistSettings({ settingsUiLocale: next })
    set({ settingsUiLocale: next })
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

export type { SettingsUiLocale } from '../locales/settingsUi'
