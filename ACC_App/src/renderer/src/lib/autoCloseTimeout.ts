export const AUTO_CLOSE_TIMEOUT_OPTIONS = [
  { label: '10 dakika', value: 10 },
  { label: '30 dakika', value: 30 },
  { label: '1 saat', value: 60 },
  { label: '2 saat', value: 120 },
  { label: '3 saat', value: 180 }
] as const

const ALLOWED = new Set<number>(AUTO_CLOSE_TIMEOUT_OPTIONS.map((o) => o.value))

/** Geçerli aralık: 10, 30, 60, 120, 180 dk; aksi halde varsayılan 30 dk. */
export function normalizeAutoCloseTimeoutMinutes(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 30
  return ALLOWED.has(value) ? value : 30
}
