import { normalizeGameplaySettings, type GameplaySettings } from './gameplaySettingsTypes'

export type TimeOfDayPeriod = 'day' | 'night'

export interface GameTimeSnapshot {
  /** Minutes elapsed since the current run started. */
  elapsedMinutes: number
  /** Calendar day number (1-indexed from run start). */
  day: number
  hour: number
  minute: number
  /** Wall-clock label HH:MM on the current calendar day. */
  clock: string
  period: TimeOfDayPeriod
  periodLabel: string
  /** Whole days since run start (0 on day 1). */
  elapsedDays: number
  /** Whole hours since run start. */
  elapsedHours: number
  /** Hours within the current elapsed-day remainder (0–23). */
  elapsedHoursRemainder: number
}

export function resolveStartOffsetMinutes(settings: GameplaySettings): number {
  const hour = settings.startHour
  const minute = settings.startMinute
  return hour * 60 + minute
}

export function resolveGameTime(elapsedMinutes: number, settings: GameplaySettings): GameTimeSnapshot {
  const normalized = normalizeGameplaySettings(settings)
  const safeElapsed = Math.max(0, Math.floor(elapsedMinutes))
  const calendarMinutes = resolveStartOffsetMinutes(normalized) + safeElapsed
  const minuteOfDay = ((calendarMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const day = Math.floor(calendarMinutes / (24 * 60)) + 1
  const hour = Math.floor(minuteOfDay / 60)
  const minute = minuteOfDay % 60
  const period = resolveTimeOfDayPeriod(hour, normalized)
  const elapsedDays = Math.floor(safeElapsed / (24 * 60))
  const elapsedHours = Math.floor(safeElapsed / 60)
  const elapsedHoursRemainder = Math.floor((safeElapsed % (24 * 60)) / 60)

  return {
    elapsedMinutes: safeElapsed,
    day,
    hour,
    minute,
    clock: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    period,
    periodLabel: period === 'day' ? 'Daytime' : 'Night',
    elapsedDays,
    elapsedHours,
    elapsedHoursRemainder,
  }
}

export function resolveTimeOfDayPeriod(hour: number, settings: GameplaySettings): TimeOfDayPeriod {
  const normalized = normalizeGameplaySettings(settings)
  if (hour >= normalized.dayStartHour && hour < normalized.nightStartHour) {
    return 'day'
  }
  return 'night'
}

export function formatElapsedSinceRunStart(snapshot: GameTimeSnapshot): string {
  if (snapshot.elapsedDays <= 0 && snapshot.elapsedHoursRemainder <= 0) {
    return snapshot.elapsedHours <= 0 ? 'Run just started' : `${snapshot.elapsedHours}h elapsed`
  }
  if (snapshot.elapsedDays <= 0) {
    return `${snapshot.elapsedHoursRemainder}h elapsed`
  }
  if (snapshot.elapsedHoursRemainder <= 0) {
    return `${snapshot.elapsedDays}d elapsed`
  }
  return `${snapshot.elapsedDays}d ${snapshot.elapsedHoursRemainder}h elapsed`
}

export function formatGameTimeClock(snapshot: GameTimeSnapshot): string {
  return `Day ${snapshot.day} · ${snapshot.clock}`
}

export function formatGameTimeHud(snapshot: GameTimeSnapshot): string {
  return `${formatGameTimeClock(snapshot)} · ${snapshot.periodLabel}`
}

export function formatGameTimeDetailed(snapshot: GameTimeSnapshot): string {
  return `${formatGameTimeHud(snapshot)} · ${formatElapsedSinceRunStart(snapshot)}`
}

/** @deprecated Use resolveGameTime + formatGameTimeClock for settings-aware time. */
export function formatGameTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60
  const days = Math.floor(totalMinutes / (60 * 24))
  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  return days > 0 ? `Day ${days + 1} · ${time}` : time
}

export function describeTimeAdvance(
  previousElapsedMinutes: number,
  nextElapsedMinutes: number,
  settings: GameplaySettings,
): string | null {
  const before = resolveGameTime(previousElapsedMinutes, settings)
  const after = resolveGameTime(nextElapsedMinutes, settings)
  if (before.period === after.period && before.day === after.day) return null
  if (before.day !== after.day && after.hour === settings.dayStartHour) {
    return `Day ${after.day} begins.`
  }
  if (before.period === 'day' && after.period === 'night') {
    return 'Night falls.'
  }
  if (before.period === 'night' && after.period === 'day') {
    return 'Day breaks.'
  }
  return null
}
