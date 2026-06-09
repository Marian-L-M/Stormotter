export const DEFAULT_CHARACTER_LEVEL = 1
export const MAX_CHARACTER_LEVEL = 40

export function normalizeCharacterLevel(raw: number | null | undefined): number {
  if (raw === null || raw === undefined || !Number.isFinite(raw)) {
    return DEFAULT_CHARACTER_LEVEL
  }
  return Math.max(DEFAULT_CHARACTER_LEVEL, Math.min(MAX_CHARACTER_LEVEL, Math.round(raw)))
}
