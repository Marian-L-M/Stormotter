import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CharacterClass, CharacterClassPatch } from '../admin/characterClassTypes'
import { normalizeCharacterClass } from '../admin/characterClassTypes'
import { createDefaultHitDice } from '../admin/diceTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

function createId(): string {
  return `cclass-${crypto.randomUUID().slice(0, 8)}`
}

function seedCharacterClass(
  name: string,
  description: string,
  distinctFeatures: string[],
): CharacterClass {
  const timestamp = new Date().toISOString()
  return {
    id: createId(),
    name,
    description,
    hitDice: createDefaultHitDice(8),
    distinctFeatures,
    levelAbilities: [],
    slotRules: {},
    hiddenInventoryActivatesUnequipped: null,
    derivedStatBases: {},
    derivedStatModifiers: {},
    renderer: {},
    updatedAt: timestamp,
  }
}

interface CharacterClassesState {
  characterClasses: CharacterClass[]
  addCharacterClass: () => string
  updateCharacterClass: (id: string, patch: CharacterClassPatch) => void
  removeCharacterClass: (id: string) => void
  getCharacterClass: (id: string) => CharacterClass | undefined
  replaceAll: (characterClasses: CharacterClass[]) => void
}

export const useCharacterClassesStore = create<CharacterClassesState>()(
  immer((set, get) => ({
    characterClasses: createDefaultProjectContent().characterClasses,

    addCharacterClass: () => {
      const index = get().characterClasses.length + 1
      const characterClass = seedCharacterClass(`New class ${index}`, '', [])
      set((state) => {
        state.characterClasses.unshift(characterClass)
      })
      return characterClass.id
    },

    updateCharacterClass: (id, patch) => {
      set((state) => {
        const characterClass = state.characterClasses.find((entry) => entry.id === id)
        if (!characterClass) return

        if (patch.name !== undefined) characterClass.name = patch.name
        if (patch.description !== undefined) characterClass.description = patch.description
        if (patch.hitDice !== undefined) characterClass.hitDice = patch.hitDice
        if (patch.distinctFeatures !== undefined) {
          characterClass.distinctFeatures = patch.distinctFeatures
        }
        if (patch.levelAbilities !== undefined) characterClass.levelAbilities = patch.levelAbilities
        if (patch.slotRules !== undefined) characterClass.slotRules = patch.slotRules
        if (patch.hiddenInventoryActivatesUnequipped !== undefined) {
          characterClass.hiddenInventoryActivatesUnequipped = patch.hiddenInventoryActivatesUnequipped
        }
        characterClass.updatedAt = new Date().toISOString()
      })
    },

    removeCharacterClass: (id) => {
      set((state) => {
        state.characterClasses = state.characterClasses.filter((entry) => entry.id !== id)
      })
    },

    getCharacterClass: (id) => get().characterClasses.find((entry) => entry.id === id),

    replaceAll: (characterClasses) => {
      set((state) => {
        state.characterClasses = characterClasses.map((entry) => normalizeCharacterClass(entry))
      })
    },
  })),
)
