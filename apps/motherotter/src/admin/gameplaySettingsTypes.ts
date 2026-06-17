export interface GameplaySettings {
  /** Real-time seconds per combat/exploration round. */
  roundDurationSeconds: number
  /** In-game minutes advanced each round tick. */
  gameMinutesPerRound: number
  /** Hour (0–23) when a new run begins on day 1. */
  startHour: number
  /** Minute (0–59) when a new run begins on day 1. */
  startMinute: number
  /** Hour (0–23) when daytime begins. */
  dayStartHour: number
  /** Hour (0–23) when nighttime begins. */
  nightStartHour: number
}

export type GameplaySettingsPatch = Partial<GameplaySettings>

export function createDefaultGameplaySettings(): GameplaySettings {
  return {
    roundDurationSeconds: 10,
    gameMinutesPerRound: 10,
    startHour: 8,
    startMinute: 0,
    dayStartHour: 6,
    nightStartHour: 20,
  }
}

function clampHour(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(23, Math.max(0, Math.floor(value)))
}

function clampMinute(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.min(59, Math.max(0, Math.floor(value)))
}

export function normalizeGameplaySettings(raw: Partial<GameplaySettings> | undefined): GameplaySettings {
  const defaults = createDefaultGameplaySettings()
  if (!raw) return defaults
  const dayStartHour = clampHour(raw.dayStartHour ?? defaults.dayStartHour, defaults.dayStartHour)
  const nightStartHour = clampHour(raw.nightStartHour ?? defaults.nightStartHour, defaults.nightStartHour)
  return {
    roundDurationSeconds:
      typeof raw.roundDurationSeconds === 'number' && raw.roundDurationSeconds > 0
        ? raw.roundDurationSeconds
        : defaults.roundDurationSeconds,
    gameMinutesPerRound:
      typeof raw.gameMinutesPerRound === 'number' && raw.gameMinutesPerRound >= 0
        ? raw.gameMinutesPerRound
        : defaults.gameMinutesPerRound,
    startHour: clampHour(raw.startHour ?? defaults.startHour, defaults.startHour),
    startMinute: clampMinute(raw.startMinute ?? defaults.startMinute, defaults.startMinute),
    dayStartHour,
    nightStartHour: nightStartHour === dayStartHour ? defaults.nightStartHour : nightStartHour,
  }
}
