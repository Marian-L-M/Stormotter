import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CharacterClass, CharacterClassPatch } from '../admin/characterClassTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

function createId(): string {
  return `cclass-${crypto.randomUUID().slice(0, 8)}`
}

function seedCharacterClass(
  name: string,
  description: string,
  distinctFeatures: string[],
  abilityIds: string[] = [],
): CharacterClass {
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
        if (patch.distinctFeatures !== undefined) {
          characterClass.distinctFeatures = patch.distinctFeatures
        }
        if (patch.abilityIds !== undefined) characterClass.abilityIds = patch.abilityIds
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
        state.characterClasses = structuredClone(characterClasses)
      })
    },
  })),
)
