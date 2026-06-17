import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createEmptyQuest,
  createEmptyQuestCategory,
  defaultQuestCategories,
  normalizeQuest,
  normalizeQuestCategory,
  type Quest,
  type QuestCategory,
  type QuestCategoryPatch,
  type QuestPatch,
} from '../admin/questTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

interface QuestsState {
  quests: Quest[]
  categories: QuestCategory[]
  addQuest: () => string
  updateQuest: (id: string, patch: QuestPatch) => void
  removeQuest: (id: string) => void
  getQuest: (id: string) => Quest | undefined
  addCategory: () => string
  updateCategory: (id: string, patch: QuestCategoryPatch) => void
  removeCategory: (id: string) => void
  getCategory: (id: string) => QuestCategory | undefined
  replaceAll: (quests: Quest[], categories: QuestCategory[]) => void
}

export const useQuestsStore = create<QuestsState>()(
  immer((set, get) => ({
    quests: createDefaultProjectContent().quests,
    categories: createDefaultProjectContent().questCategories,

    addQuest: () => {
      const index = get().quests.length + 1
      const quest = createEmptyQuest(`New Quest ${index}`)
      set((state) => {
        state.quests.unshift(quest)
      })
      return quest.id
    },

    updateQuest: (id, patch) => {
      set((state) => {
        const quest = state.quests.find((entry) => entry.id === id)
        if (!quest) return
        if (patch.name !== undefined) quest.name = patch.name
        if (patch.summary !== undefined) quest.summary = patch.summary
        if (patch.categoryId !== undefined) quest.categoryId = patch.categoryId
        if (patch.journalPreview !== undefined) quest.journalPreview = patch.journalPreview
        if (patch.trigger !== undefined) quest.trigger = patch.trigger
        if (patch.objectives !== undefined) quest.objectives = patch.objectives
        if (patch.objectiveJoin !== undefined) quest.objectiveJoin = patch.objectiveJoin
        if (patch.rewards !== undefined) quest.rewards = patch.rewards
        if (patch.completionActions !== undefined) quest.completionActions = patch.completionActions
        quest.updatedAt = new Date().toISOString()
      })
    },

    removeQuest: (id) => {
      set((state) => {
        state.quests = state.quests.filter((entry) => entry.id !== id)
      })
    },

    getQuest: (id) => get().quests.find((entry) => entry.id === id),

    addCategory: () => {
      const index = get().categories.length + 1
      const category = createEmptyQuestCategory(`New Category ${index}`)
      set((state) => {
        state.categories.push(category)
      })
      return category.id
    },

    updateCategory: (id, patch) => {
      set((state) => {
        const category = state.categories.find((entry) => entry.id === id)
        if (!category) return
        if (patch.name !== undefined) category.name = patch.name
        if (patch.description !== undefined) category.description = patch.description
        category.updatedAt = new Date().toISOString()
      })
    },

    removeCategory: (id) => {
      set((state) => {
        state.categories = state.categories.filter((entry) => entry.id !== id)
        for (const quest of state.quests) {
          if (quest.categoryId === id) {
            quest.categoryId = null
            quest.updatedAt = new Date().toISOString()
          }
        }
      })
    },

    getCategory: (id) => get().categories.find((entry) => entry.id === id),

    replaceAll: (quests, categories) => {
      set((state) => {
        state.quests = quests.map((entry) => normalizeQuest(entry))
        state.categories =
          categories.length > 0
            ? categories.map((entry) => normalizeQuestCategory(entry))
            : defaultQuestCategories()
      })
    },
  })),
)
