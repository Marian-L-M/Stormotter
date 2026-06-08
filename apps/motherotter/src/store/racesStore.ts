import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Race, RacePatch } from '../admin/raceTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

function createId(): string {
  return `race-${crypto.randomUUID().slice(0, 8)}`
}

function seedRace(
  name: string,
  description: string,
  distinctFeatures: string[],
  abilityIds: string[] = [],
): Race {
  const timestamp = new Date().toISOString()
  return {
    id: createId(),
    name,
    description,
    distinctFeatures,
    abilityIds,
    updatedAt: timestamp,
  }
}

interface RacesState {
  races: Race[]
  addRace: () => string
  updateRace: (id: string, patch: RacePatch) => void
  removeRace: (id: string) => void
  getRace: (id: string) => Race | undefined
  replaceAll: (races: Race[]) => void
}

export const useRacesStore = create<RacesState>()(
  immer((set, get) => ({
    races: createDefaultProjectContent().races,

    addRace: () => {
      const index = get().races.length + 1
      const race = seedRace(`New race ${index}`, '', [])
      set((state) => {
        state.races.unshift(race)
      })
      return race.id
    },

    updateRace: (id, patch) => {
      set((state) => {
        const race = state.races.find((entry) => entry.id === id)
        if (!race) return

        if (patch.name !== undefined) race.name = patch.name
        if (patch.description !== undefined) race.description = patch.description
        if (patch.distinctFeatures !== undefined) race.distinctFeatures = patch.distinctFeatures
        if (patch.abilityIds !== undefined) race.abilityIds = patch.abilityIds
        race.updatedAt = new Date().toISOString()
      })
    },

    removeRace: (id) => {
      set((state) => {
        state.races = state.races.filter((entry) => entry.id !== id)
      })
    },

    getRace: (id) => get().races.find((entry) => entry.id === id),

    replaceAll: (races) => {
      set((state) => {
        state.races = structuredClone(races)
      })
    },
  })),
)
