import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { AdminListItem } from '../admin/types'
import {
  createEmptyStoryline,
  migrateStubStoryToStoryline,
  normalizeStoryline,
  type Storyline,
  type StorylinePatch,
} from '../admin/storylineTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

interface StorylinesState {
  storylines: Storyline[]
  addStoryline: () => string
  updateStoryline: (id: string, patch: StorylinePatch) => void
  removeStoryline: (id: string) => void
  getStoryline: (id: string) => Storyline | undefined
  replaceAll: (storylines: Storyline[], legacyStubs?: AdminListItem[]) => void
}

export const useStorylinesStore = create<StorylinesState>()(
  immer((set, get) => ({
    storylines: createDefaultProjectContent().storylines,

    addStoryline: () => {
      const index = get().storylines.length + 1
      const storyline = createEmptyStoryline(`New Storyline ${index}`)
      set((state) => {
        state.storylines.unshift(storyline)
      })
      return storyline.id
    },

    updateStoryline: (id, patch) => {
      set((state) => {
        const storyline = state.storylines.find((entry) => entry.id === id)
        if (!storyline) return
        if (patch.name !== undefined) storyline.name = patch.name
        if (patch.summary !== undefined) storyline.summary = patch.summary
        if (patch.flow !== undefined) storyline.flow = patch.flow
        storyline.updatedAt = new Date().toISOString()
      })
    },

    removeStoryline: (id) => {
      set((state) => {
        state.storylines = state.storylines.filter((entry) => entry.id !== id)
      })
    },

    getStoryline: (id) => get().storylines.find((entry) => entry.id === id),

    replaceAll: (storylines, legacyStubs = []) => {
      set((state) => {
        let normalized = storylines.map((entry) => normalizeStoryline(entry))
        if (normalized.length === 0 && legacyStubs.length > 0) {
          normalized = legacyStubs.map((stub) => migrateStubStoryToStoryline(stub))
        }
        state.storylines = normalized
      })
    },
  })),
)
