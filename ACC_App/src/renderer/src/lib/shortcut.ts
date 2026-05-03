export type ParsedShortcut = {
  ctrl: boolean
  meta: boolean
  shift: boolean
  alt: boolean
  key: string
}

function normalizeKeyToken(token: string): string {
  const t = token.trim().toLowerCase()
  if (t === 'cmd') return 'meta'
  if (t === 'command') return 'meta'
  if (t === 'meta') return 'meta'
  if (t === 'ctrl') return 'ctrl'
  if (t === 'control') return 'ctrl'
  if (t === 'shift') return 'shift'
  if (t === 'alt') return 'alt'
  if (t === 'option') return 'alt'
  return token.trim()
}

/** Varsayılan arama paleti kısayolu (şema / reset ile uyumlu) */
export const DEFAULT_SEARCH_SHORTCUT = 'Ctrl+F'

/** Varsayılan home / ana ekran kısayolu (şema / reset ile uyumlu) */
export const DEFAULT_HOME_SHORTCUT = 'Ctrl+H'

export function parseShortcut(input: string): ParsedShortcut | null {
  const raw = input.trim()
  if (!raw) return null

  const parts = raw
    .split('+')
    .map(normalizeKeyToken)
    .filter(Boolean)

  let ctrl = false
  let meta = false
  let shift = false
  let alt = false
  let key: string | null = null

  for (const p of parts) {
    const pl = p.toLowerCase()
    if (pl === 'ctrl') ctrl = true
    else if (pl === 'meta') meta = true
    else if (pl === 'shift') shift = true
    else if (pl === 'alt') alt = true
    else key = p
  }

  if (!key) return null
  return { ctrl, meta, shift, alt, key: key.toLowerCase() }
}

/** Eski tek tuş (`f`) veya tam kombinasyon; geçersizse varsayılan. */
export function normalizeStoredSearchShortcut(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_SEARCH_SHORTCUT
  const t = raw.trim()
  if (!t) return DEFAULT_SEARCH_SHORTCUT
  if (/^[a-z0-9]$/i.test(t)) {
    return `Ctrl+${t.toUpperCase()}`
  }
  return parseShortcut(t) ? t : DEFAULT_SEARCH_SHORTCUT
}

export function shortcutFromEvent(e: KeyboardEvent): string | null {
  const k = e.key
  if (!k) return null

  const lower = k.toLowerCase()
  if (lower === 'control' || lower === 'shift' || lower === 'alt' || lower === 'meta') return null

  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.metaKey) parts.push('Cmd')
  if (e.shiftKey) parts.push('Shift')
  if (e.altKey) parts.push('Alt')

  const key =
    lower.length === 1 ? lower.toUpperCase() : lower === ' ' ? 'Space' : k

  parts.push(key)
  return parts.join('+')
}

export function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut)
  if (!parsed) return false

  const key = e.key?.toLowerCase?.() ?? ''
  if (key !== parsed.key) return false

  if (Boolean(e.ctrlKey) !== parsed.ctrl) return false
  if (Boolean(e.metaKey) !== parsed.meta) return false
  if (Boolean(e.shiftKey) !== parsed.shift) return false
  if (Boolean(e.altKey) !== parsed.alt) return false

  return true
}

