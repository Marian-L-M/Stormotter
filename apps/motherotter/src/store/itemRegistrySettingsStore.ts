import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  normalizeAllowedSlotTypes,
  type ItemSlotPlacementSettings,
} from '../admin/slotRules'
import type { ItemCategoryId, ItemClassId } from '../admin/itemTypes'

interface ItemRegistrySettingsState {
  categorySettings: Record<string, ItemSlotPlacementSettings>
  classSettings: Record<string, ItemSlotPlacementSettings>
  getCategorySettings: (categoryId: ItemCategoryId) => ItemSlotPlacementSettings
  getClassSettings: (classId: ItemClassId) => ItemSlotPlacementSettings
  updateCategorySettings: (categoryId: ItemCategoryId, patch: Partial<ItemSlotPlacementSettings>) => void
  updateClassSettings: (classId: ItemClassId, patch: Partial<ItemSlotPlacementSettings>) => void
  replaceAll: (payload: {
    categorySettings: Record<string, ItemSlotPlacementSettings>
    classSettings: Record<string, ItemSlotPlacementSettings>
  }) => void
}

function normalizeSettings(raw: Partial<ItemSlotPlacementSettings> | undefined): ItemSlotPlacementSettings {
  return {
    allowedSlotTypes: normalizeAllowedSlotTypes(raw?.allowedSlotTypes),
  }
}

export const useItemRegistrySettingsStore = create<ItemRegistrySettingsState>()(
  immer((set, get) => ({
    categorySettings: {},
    classSettings: {},

    getCategorySettings: (categoryId) => normalizeSettings(get().categorySettings[categoryId]),

    getClassSettings: (classId) => normalizeSettings(get().classSettings[classId]),

    updateCategorySettings: (categoryId, patch) => {
      set((state) => {
        const current = normalizeSettings(state.categorySettings[categoryId])
        state.categorySettings[categoryId] = {
          allowedSlotTypes:
            patch.allowedSlotTypes !== undefined
              ? normalizeAllowedSlotTypes(patch.allowedSlotTypes)
              : current.allowedSlotTypes,
        }
      })
    },

    updateClassSettings: (classId, patch) => {
      set((state) => {
        const current = normalizeSettings(state.classSettings[classId])
        state.classSettings[classId] = {
          allowedSlotTypes:
            patch.allowedSlotTypes !== undefined
              ? normalizeAllowedSlotTypes(patch.allowedSlotTypes)
              : current.allowedSlotTypes,
        }
      })
    },

    replaceAll: ({ categorySettings, classSettings }) => {
      set((state) => {
        state.categorySettings = Object.fromEntries(
          Object.entries(categorySettings).map(([id, settings]) => [id, normalizeSettings(settings)]),
        )
        state.classSettings = Object.fromEntries(
          Object.entries(classSettings).map(([id, settings]) => [id, normalizeSettings(settings)]),
        )
      })
    },
  })),
)
