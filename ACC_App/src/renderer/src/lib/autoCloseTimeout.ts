/** Negative entry = seconds for dev/test (e.g. -5 → 5s). Positive = minutes. 0 = off (no auto sleep). */
export const AUTO_CLOSE_TIMEOUT_VALUES = [-5, 10, 30, 60, 120, 180, 0] as const

const ALLOWED = new Set<number>([...AUTO_CLOSE_TIMEOUT_VALUES])

export function normalizeAutoCloseTimeoutMinutes(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 30
  return ALLOWED.has(value) ? value : 30
}
