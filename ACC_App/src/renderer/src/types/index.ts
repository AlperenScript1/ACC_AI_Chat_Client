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
