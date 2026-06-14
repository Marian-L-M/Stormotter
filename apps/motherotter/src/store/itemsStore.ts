import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createEmptyItem,
  normalizeItem,
  validateItemClassForCategory,
  type Item,
  type ItemCategoryId,
  type ItemPatch,
  type ItemScope,
} from '../admin/itemTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

interface ItemsState {
  items: Item[]
  addItem: (scope?: ItemScope) => string
  updateItem: (id: string, patch: ItemPatch) => void
  removeItem: (id: string) => void
  clearContainerFromItems: (containerId: string) => void
  assignItemToContainer: (itemId: string, containerId: string) => void
  unassignItemFromContainer: (itemId: string) => void
  getItemsInContainer: (containerId: string) => Item[]
  getItem: (id: string) => Item | undefined
  replaceAll: (items: Item[]) => void
}

export const useItemsStore = create<ItemsState>()(
  immer((set, get) => ({
    items: createDefaultProjectContent().items,

    addItem: (scope = 'generic') => {
      const index = get().items.length + 1
      const item = createEmptyItem(`New Item ${index}`, scope)
      set((state) => {
        state.items.unshift(item)
      })
      return item.id
    },

    updateItem: (id, patch) => {
      set((state) => {
        const item = state.items.find((entry) => entry.id === id)
        if (!item) return

        if (patch.name !== undefined) item.name = patch.name
        if (patch.description !== undefined) item.description = patch.description
        if (patch.tooltipText !== undefined) item.tooltipText = patch.tooltipText
        if (patch.iconMediaId !== undefined) item.iconMediaId = patch.iconMediaId
        if (patch.detailMediaId !== undefined) item.detailMediaId = patch.detailMediaId
        if (patch.pickupSoundMediaId !== undefined) item.pickupSoundMediaId = patch.pickupSoundMediaId
        if (patch.actionSoundMediaId !== undefined) item.actionSoundMediaId = patch.actionSoundMediaId
        if (patch.requirements !== undefined) item.requirements = patch.requirements
        if (patch.effects !== undefined) item.effects = patch.effects

        if (patch.scope !== undefined) {
          item.scope = patch.scope
          if (patch.scope === 'generic') {
            item.containerId = null
          }
        }
        if (patch.containerId !== undefined) {
          item.containerId = patch.containerId
          if (patch.containerId) {
            item.scope = 'unique'
          }
        }

        if (patch.categoryId !== undefined) {
          item.categoryId = patch.categoryId as ItemCategoryId
          item.classId = validateItemClassForCategory(item.classId, item.categoryId)
        }
        if (patch.classId !== undefined) {
          item.classId = validateItemClassForCategory(patch.classId, item.categoryId)
        }
        if (patch.allowedSlotTypes !== undefined) {
          item.allowedSlotTypes = patch.allowedSlotTypes
        }
        if (patch.droppable !== undefined) item.droppable = patch.droppable
        if (patch.stealable !== undefined) item.stealable = patch.stealable

        item.updatedAt = new Date().toISOString()
      })
    },

    removeItem: (id) => {
      set((state) => {
        state.items = state.items.filter((entry) => entry.id !== id)
      })
    },

    clearContainerFromItems: (containerId) => {
      set((state) => {
        for (const item of state.items) {
          if (item.containerId === containerId) {
            item.containerId = null
            item.updatedAt = new Date().toISOString()
          }
        }
      })
    },

    assignItemToContainer: (itemId, containerId) => {
      set((state) => {
        for (const item of state.items) {
          if (item.id === itemId) {
            item.scope = 'unique'
            item.containerId = containerId
            item.updatedAt = new Date().toISOString()
            return
          }
        }
      })
    },

    unassignItemFromContainer: (itemId) => {
      set((state) => {
        const item = state.items.find((entry) => entry.id === itemId)
        if (!item) return
        item.containerId = null
        item.updatedAt = new Date().toISOString()
      })
    },

    getItemsInContainer: (containerId) =>
      get().items.filter((entry) => entry.scope === 'unique' && entry.containerId === containerId),

    getItem: (id) => get().items.find((entry) => entry.id === id),

    replaceAll: (items) => {
      set((state) => {
        state.items = items.map((entry) => normalizeItem(entry))
      })
    },
  })),
)
