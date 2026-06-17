import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createEmptyDialog,
  createEmptyDialogCategory,
  defaultDialogCategories,
  normalizeDialog,
  normalizeDialogCategory,
  type Dialog,
  type DialogCategory,
  type DialogCategoryPatch,
  type DialogPatch,
} from '../admin/dialogTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

interface DialogsState {
  dialogs: Dialog[]
  categories: DialogCategory[]
  addDialog: () => string
  updateDialog: (id: string, patch: DialogPatch) => void
  removeDialog: (id: string) => void
  getDialog: (id: string) => Dialog | undefined
  addCategory: () => string
  updateCategory: (id: string, patch: DialogCategoryPatch) => void
  removeCategory: (id: string) => void
  getCategory: (id: string) => DialogCategory | undefined
  replaceAll: (dialogs: Dialog[], categories: DialogCategory[]) => void
}

export const useDialogsStore = create<DialogsState>()(
  immer((set, get) => ({
    dialogs: createDefaultProjectContent().dialogs,
    categories: createDefaultProjectContent().dialogCategories,

    addDialog: () => {
      const index = get().dialogs.length + 1
      const dialog = createEmptyDialog(`New Dialog ${index}`)
      set((state) => {
        state.dialogs.unshift(dialog)
      })
      return dialog.id
    },

    updateDialog: (id, patch) => {
      set((state) => {
        const dialog = state.dialogs.find((entry) => entry.id === id)
        if (!dialog) return

        if (patch.name !== undefined) dialog.name = patch.name
        if (patch.summary !== undefined) dialog.summary = patch.summary
        if (patch.categoryId !== undefined) dialog.categoryId = patch.categoryId
        if (patch.characterId !== undefined) dialog.characterId = patch.characterId
        if (patch.trigger !== undefined) dialog.trigger = patch.trigger
        if (patch.conversation !== undefined) dialog.conversation = patch.conversation

        dialog.updatedAt = new Date().toISOString()
      })
    },

    removeDialog: (id) => {
      set((state) => {
        state.dialogs = state.dialogs.filter((entry) => entry.id !== id)
      })
    },

    getDialog: (id) => get().dialogs.find((entry) => entry.id === id),

    addCategory: () => {
      const index = get().categories.length + 1
      const category = createEmptyDialogCategory(`New Category ${index}`)
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
        for (const dialog of state.dialogs) {
          if (dialog.categoryId === id) {
            dialog.categoryId = null
            dialog.updatedAt = new Date().toISOString()
          }
        }
      })
    },

    getCategory: (id) => get().categories.find((entry) => entry.id === id),

    replaceAll: (dialogs, categories) => {
      set((state) => {
        state.dialogs = dialogs.map((entry) => normalizeDialog(entry))
        state.categories =
          categories.length > 0
            ? categories.map((entry) => normalizeDialogCategory(entry))
            : defaultDialogCategories()
      })
    },
  })),
)
