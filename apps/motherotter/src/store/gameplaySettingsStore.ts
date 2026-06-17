import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createDefaultGameplaySettings,
  normalizeGameplaySettings,
  type GameplaySettings,
  type GameplaySettingsPatch,
} from '../admin/gameplaySettingsTypes'

interface GameplaySettingsState {
  settings: GameplaySettings
  updateSettings: (patch: GameplaySettingsPatch) => void
  replaceAll: (settings: GameplaySettings) => void
}

export const useGameplaySettingsStore = create<GameplaySettingsState>()(
  immer((set) => ({
    settings: createDefaultGameplaySettings(),

    updateSettings: (patch) => {
      set((state) => {
        if (patch.roundDurationSeconds !== undefined) {
          state.settings.roundDurationSeconds = patch.roundDurationSeconds
        }
        if (patch.gameMinutesPerRound !== undefined) {
          state.settings.gameMinutesPerRound = patch.gameMinutesPerRound
        }
        if (patch.startHour !== undefined) {
          state.settings.startHour = patch.startHour
        }
        if (patch.startMinute !== undefined) {
          state.settings.startMinute = patch.startMinute
        }
        if (patch.dayStartHour !== undefined) {
          state.settings.dayStartHour = patch.dayStartHour
        }
        if (patch.nightStartHour !== undefined) {
          state.settings.nightStartHour = patch.nightStartHour
        }
      })
    },

    replaceAll: (settings) => {
      set((state) => {
        state.settings = normalizeGameplaySettings(settings)
      })
    },
  })),
)
