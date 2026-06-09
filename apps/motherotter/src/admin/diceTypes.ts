/** N×dS notation — e.g. { count: 1, sides: 10 } → 1d10 */
export interface DiceRoll {
  count: number
  sides: number
}

/** Baldur's Gate 2–style class hit die sizes */
export const HIT_DIE_SIDES = [4, 6, 8, 10, 12] as const

export type HitDieSides = (typeof HIT_DIE_SIDES)[number]

export function createDefaultHitDice(sides: HitDieSides = 8): DiceRoll {
  return { count: 1, sides }
}

export function createEmptyBonusDice(): DiceRoll {
  return { count: 0, sides: 6 }
}

export function normalizeDiceRoll(raw: Partial<DiceRoll> | null | undefined): DiceRoll {
  const countRaw = Number(raw?.count ?? 0)
  const sidesRaw = Number(raw?.sides ?? 6)
  const count = Number.isFinite(countRaw) ? Math.max(0, Math.min(99, Math.round(countRaw))) : 0
  const sides = Number.isFinite(sidesRaw) ? Math.max(2, Math.min(100, Math.round(sidesRaw))) : 6
  return { count, sides }
}

export function isEmptyDiceRoll(dice: DiceRoll): boolean {
  return dice.count <= 0
}

export function formatDiceRoll(dice: DiceRoll): string {
  const normalized = normalizeDiceRoll(dice)
  if (isEmptyDiceRoll(normalized)) return '—'
  return `${normalized.count}d${normalized.sides}`
}

export function diceMin(dice: DiceRoll): number {
  const normalized = normalizeDiceRoll(dice)
  if (isEmptyDiceRoll(normalized)) return 0
  return normalized.count
}

export function diceMax(dice: DiceRoll): number {
  const normalized = normalizeDiceRoll(dice)
  if (isEmptyDiceRoll(normalized)) return 0
  return normalized.count * normalized.sides
}

export function formatDiceRange(dice: DiceRoll): string {
  const normalized = normalizeDiceRoll(dice)
  if (isEmptyDiceRoll(normalized)) return '—'
  const min = diceMin(normalized)
  const max = diceMax(normalized)
  return min === max ? String(min) : `${min}–${max}`
}

export interface CombinedDiceSummary {
  parts: DiceRoll[]
  expression: string
  min: number
  max: number
}

export function combineDiceRolls(...rolls: (DiceRoll | null | undefined)[]): CombinedDiceSummary {
  const parts = rolls
    .map((roll) => normalizeDiceRoll(roll))
    .filter((roll) => !isEmptyDiceRoll(roll))

  if (parts.length === 0) {
    return { parts: [], expression: '—', min: 0, max: 0 }
  }

  const expression = parts.map(formatDiceRoll).join(' + ')
  const min = parts.reduce((sum, roll) => sum + diceMin(roll), 0)
  const max = parts.reduce((sum, roll) => sum + diceMax(roll), 0)

  return { parts, expression, min, max }
}

export function formatCombinedDiceRange(summary: CombinedDiceSummary): string {
  if (summary.parts.length === 0) return '—'
  if (summary.min === summary.max) return String(summary.min)
  return `${summary.min}–${summary.max}`
}

/** Scale per-level dice by character level (e.g. 1d10 at level 5 → 5d10). */
export function scaleDiceRollByLevel(dice: DiceRoll, level: number): DiceRoll {
  const normalized = normalizeDiceRoll(dice)
  if (isEmptyDiceRoll(normalized)) return normalized
  const safeLevel = Math.max(1, Math.round(level))
  return { count: normalized.count * safeLevel, sides: normalized.sides }
}

export function combineLevelHitPoints(
  level: number,
  ...rolls: (DiceRoll | null | undefined)[]
): CombinedDiceSummary {
  return combineDiceRolls(...rolls.map((roll) => scaleDiceRollByLevel(roll ?? { count: 0, sides: 6 }, level)))
}

export type HitPointSource = 'derived' | 'override'

export function normalizeHitPointSource(raw: string | undefined): HitPointSource {
  return raw === 'override' ? 'override' : 'derived'
}

export function normalizeHitPointOverride(raw: number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null
  if (!Number.isFinite(raw)) return null
  return Math.max(0, Math.round(raw))
}
