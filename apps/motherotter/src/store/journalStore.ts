import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createEmptyJournalCategory,
  createEmptyJournalEntry,
  defaultJournalCategories,
  normalizeJournalCategory,
  normalizeJournalEntry,
  type JournalCategory,
  type JournalCategoryPatch,
  type JournalEntry,
  type JournalEntryPatch,
} from '../admin/journalTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

interface JournalState {
  entries: JournalEntry[]
  categories: JournalCategory[]
  addEntry: () => string
  updateEntry: (id: string, patch: JournalEntryPatch) => void
  removeEntry: (id: string) => void
  getEntry: (id: string) => JournalEntry | undefined
  addCategory: () => string
  updateCategory: (id: string, patch: JournalCategoryPatch) => void
  removeCategory: (id: string) => void
  getCategory: (id: string) => JournalCategory | undefined
  replaceAll: (entries: JournalEntry[], categories: JournalCategory[]) => void
}

export const useJournalStore = create<JournalState>()(
  immer((set, get) => ({
    entries: createDefaultProjectContent().journalEntries,
    categories: createDefaultProjectContent().journalCategories,

    addEntry: () => {
      const index = get().entries.length + 1
      const entry = createEmptyJournalEntry(`Journal Entry ${index}`)
      set((state) => {
        state.entries.unshift(entry)
      })
      return entry.id
    },

    updateEntry: (id, patch) => {
      set((state) => {
        const entry = state.entries.find((item) => item.id === id)
        if (!entry) return
        if (patch.title !== undefined) entry.title = patch.title
        if (patch.body !== undefined) entry.body = patch.body
        if (patch.categoryId !== undefined) entry.categoryId = patch.categoryId
        if (patch.linkedQuestId !== undefined) entry.linkedQuestId = patch.linkedQuestId
        if (patch.displayConditions !== undefined) entry.displayConditions = patch.displayConditions
        entry.updatedAt = new Date().toISOString()
      })
    },

    removeEntry: (id) => {
      set((state) => {
        state.entries = state.entries.filter((item) => item.id !== id)
      })
    },

    getEntry: (id) => get().entries.find((item) => item.id === id),

    addCategory: () => {
      const index = get().categories.length + 1
      const category = createEmptyJournalCategory(`New Category ${index}`)
      set((state) => {
        state.categories.push(category)
      })
      return category.id
    },

    updateCategory: (id, patch) => {
      set((state) => {
        const category = state.categories.find((item) => item.id === id)
        if (!category) return
        if (patch.name !== undefined) category.name = patch.name
        if (patch.description !== undefined) category.description = patch.description
        category.updatedAt = new Date().toISOString()
      })
    },

    removeCategory: (id) => {
      set((state) => {
        state.categories = state.categories.filter((item) => item.id !== id)
        for (const entry of state.entries) {
          if (entry.categoryId === id) {
            entry.categoryId = null
            entry.updatedAt = new Date().toISOString()
          }
        }
      })
    },

    getCategory: (id) => get().categories.find((item) => item.id === id),

    replaceAll: (entries, categories) => {
      set((state) => {
        state.entries = entries.map((item) => normalizeJournalEntry(item))
        state.categories =
          categories.length > 0
            ? categories.map((item) => normalizeJournalCategory(item))
            : defaultJournalCategories()
      })
    },
  })),
)
