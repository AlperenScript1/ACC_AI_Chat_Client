export interface Model {
  id: string
  name: string
  url: string
  icon?: string
  isFavorite?: boolean
  /** Unix ms — last webview activity */
  lastActive: number
  /** When true, webview is not mounted */
  isAsleep: boolean
}

export interface NoteCategory {
  id: string
  name: string
  color: string
  createdAt: number
}

export interface Note {
  id: string
  title: string
  content: string
  color: string
  categoryIds: string[]
  isDone: boolean
  createdAt: number
  updatedAt: number
}

export function normalizeModel(
  raw: Partial<Model> & Pick<Model, 'id' | 'name' | 'url'>
): Model {
  const now = Date.now()
  return {
    id: raw.id,
    name: raw.name,
    url: raw.url,
    icon: raw.icon,
    isFavorite: raw.isFavorite ?? false,
    lastActive: typeof raw.lastActive === 'number' ? raw.lastActive : now,
    isAsleep: Boolean(raw.isAsleep)
  }
}

export function normalizeNote(raw: Partial<Note> & Pick<Note, 'id'>): Note {
  const now = Date.now()
  const legacyCategoryId =
    // support old persisted shape (single categoryId)
    (raw as unknown as { categoryId?: unknown }).categoryId

  const categoryIdsRaw = (raw as unknown as { categoryIds?: unknown }).categoryIds
  const categoryIds =
    Array.isArray(categoryIdsRaw)
      ? categoryIdsRaw.filter((x): x is string => typeof x === 'string' && x.length > 0)
      : typeof legacyCategoryId === 'string' && legacyCategoryId.length > 0
        ? [legacyCategoryId]
        : []

  return {
    id: String(raw.id),
    title: typeof raw.title === 'string' ? raw.title : 'Yeni Not',
    content: typeof raw.content === 'string' ? raw.content : '',
    color: typeof raw.color === 'string' ? raw.color : '#7c3aed',
    categoryIds,
    isDone: Boolean(raw.isDone),
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : now
  }
}

export function normalizeNoteCategory(
  raw: Partial<NoteCategory> & Pick<NoteCategory, 'id'>
): NoteCategory {
  return {
    id: String(raw.id),
    name: typeof raw.name === 'string' ? raw.name : 'Yeni Kategori',
    color: typeof raw.color === 'string' ? raw.color : '#0ea5e9',
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now()
  }
}
