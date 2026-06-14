import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createDefaultStatRanges,
  normalizeLineageType,
  type CharacterLineageType,
  type LineageTypePatch,
} from '../admin/lineageTypes'
import { createEmptyBonusDice } from '../admin/diceTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

function createId(): string {
  return `lineage-${crypto.randomUUID().slice(0, 8)}`
}

function seedLineageType(name: string, description: string): CharacterLineageType {
  const timestamp = new Date().toISOString()
  return {
    id: createId(),
    name,
    description,
    statRanges: createDefaultStatRanges(),
    hitPointBonusDice: createEmptyBonusDice(),
    levelAbilities: [],
    slotRules: {},
    hiddenInventoryActivatesUnequipped: null,
    derivedStatBases: {},
    derivedStatModifiers: {},
    updatedAt: timestamp,
  }
}

interface LineageTypesState {
  lineageTypes: CharacterLineageType[]
  addLineageType: () => string
  updateLineageType: (id: string, patch: LineageTypePatch) => void
  removeLineageType: (id: string) => void
  getLineageType: (id: string) => CharacterLineageType | undefined
  replaceAll: (lineageTypes: CharacterLineageType[]) => void
}

export const useLineageTypesStore = create<LineageTypesState>()(
  immer((set, get) => ({
    lineageTypes: createDefaultProjectContent().characterTypes,

    addLineageType: () => {
      const index = get().lineageTypes.length + 1
      const lineageType = seedLineageType(`New type ${index}`, '')
      set((state) => {
        state.lineageTypes.unshift(lineageType)
      })
      return lineageType.id
    },

    updateLineageType: (id, patch) => {
      set((state) => {
        const lineageType = state.lineageTypes.find((entry) => entry.id === id)
        if (!lineageType) return

        if (patch.name !== undefined) lineageType.name = patch.name
        if (patch.description !== undefined) lineageType.description = patch.description
        if (patch.statRanges !== undefined) lineageType.statRanges = patch.statRanges
        if (patch.hitPointBonusDice !== undefined) lineageType.hitPointBonusDice = patch.hitPointBonusDice
        if (patch.levelAbilities !== undefined) lineageType.levelAbilities = patch.levelAbilities
        if (patch.slotRules !== undefined) lineageType.slotRules = patch.slotRules
        if (patch.hiddenInventoryActivatesUnequipped !== undefined) {
          lineageType.hiddenInventoryActivatesUnequipped = patch.hiddenInventoryActivatesUnequipped
        }
        lineageType.updatedAt = new Date().toISOString()
      })
    },

    removeLineageType: (id) => {
      set((state) => {
        state.lineageTypes = state.lineageTypes.filter((entry) => entry.id !== id)
      })
    },

    getLineageType: (id) => get().lineageTypes.find((entry) => entry.id === id),

    replaceAll: (lineageTypes) => {
      set((state) => {
        state.lineageTypes = lineageTypes.map((entry) => normalizeLineageType(entry))
      })
    },
  })),
)
