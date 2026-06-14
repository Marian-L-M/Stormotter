import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  CHARACTER_SLOT_DEFINITIONS,
  characterSlotContainerId,
  isCharacterSlotDefinitionId,
} from '../admin/characterSlotTypes'
import {
  createCharacterSlotContainer,
  createEmptyContainer,
  normalizeContainer,
  type Container,
  type ContainerKind,
  type ContainerPatch,
} from '../admin/containerTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

interface CharacterRef {
  id: string
  title: string
}

interface ContainersState {
  containers: Container[]
  addContainer: (kind?: ContainerKind) => string
  updateContainer: (id: string, patch: ContainerPatch) => void
  removeContainer: (id: string) => void
  getContainer: (id: string) => Container | undefined
  getCharacterSlotContainers: (characterId: string) => Container[]
  ensureCharacterInventory: (characterId: string, characterName: string) => void
  removeCharacterInventory: (characterId: string) => string[]
  syncAllCharacterInventories: (characters: CharacterRef[]) => void
  replaceAll: (containers: Container[]) => void
}

function isAutoProvisionedCharacterSlot(container: Container): boolean {
  return (
    container.kind === 'character_slot' &&
    Boolean(container.characterId && container.slotKey && isCharacterSlotDefinitionId(container.slotKey))
  )
}

export const useContainersStore = create<ContainersState>()(
  immer((set, get) => ({
    containers: createDefaultProjectContent().containers,

    addContainer: (kind = 'unique') => {
      if (kind === 'character_slot') {
        throw new Error('Character slot containers are auto-provisioned per character.')
      }

      const index = get().containers.filter((entry) => entry.kind === kind).length + 1
      const label = kind === 'unique' ? 'Unique container' : 'Random container'
      const container = createEmptyContainer(`${label} ${index}`, kind)
      set((state) => {
        state.containers.unshift(container)
      })
      return container.id
    },

    updateContainer: (id, patch) => {
      set((state) => {
        const container = state.containers.find((entry) => entry.id === id)
        if (!container) return

        if (isAutoProvisionedCharacterSlot(container)) {
          if (patch.description !== undefined) container.description = patch.description
          container.updatedAt = new Date().toISOString()
          return
        }

        if (patch.name !== undefined) container.name = patch.name
        if (patch.description !== undefined) container.description = patch.description
        if (patch.visibility !== undefined) container.visibility = patch.visibility
        if (patch.characterId !== undefined) container.characterId = patch.characterId
        if (patch.slotKey !== undefined) container.slotKey = patch.slotKey
        if (patch.lootEntries !== undefined) container.lootEntries = patch.lootEntries

        if (patch.kind !== undefined) {
          container.kind = patch.kind
          if (patch.kind !== 'character_slot') {
            container.slotKey = null
          }
          if (patch.kind !== 'character_slot') {
            container.visibility = 'public'
            container.characterId = null
          }
        }

        container.updatedAt = new Date().toISOString()
      })
    },

    removeContainer: (id) => {
      const container = get().containers.find((entry) => entry.id === id)
      if (container && isAutoProvisionedCharacterSlot(container)) {
        return
      }

      set((state) => {
        state.containers = state.containers.filter((entry) => entry.id !== id)
      })
    },

    getContainer: (id) => get().containers.find((entry) => entry.id === id),

    getCharacterSlotContainers: (characterId) =>
      get()
        .containers.filter(
          (entry) => entry.kind === 'character_slot' && entry.characterId === characterId,
        )
        .sort((left, right) => {
          const leftIndex = CHARACTER_SLOT_DEFINITIONS.findIndex((entry) => entry.slotKey === left.slotKey)
          const rightIndex = CHARACTER_SLOT_DEFINITIONS.findIndex((entry) => entry.slotKey === right.slotKey)
          return leftIndex - rightIndex
        }),

    ensureCharacterInventory: (characterId, characterName) => {
      set((state) => {
        for (const definition of CHARACTER_SLOT_DEFINITIONS) {
          const id = characterSlotContainerId(characterId, definition.slotKey)
          const existing = state.containers.find((entry) => entry.id === id)
          const next = createCharacterSlotContainer(characterId, characterName, definition)

          if (existing) {
            existing.name = next.name
            existing.description = next.description
            existing.kind = 'character_slot'
            existing.visibility = next.visibility
            existing.characterId = characterId
            existing.slotKey = definition.slotKey
          } else {
            state.containers.push(next)
          }
        }
      })
    },

    removeCharacterInventory: (characterId) => {
      const removedIds = get()
        .containers.filter(
          (entry) => entry.kind === 'character_slot' && entry.characterId === characterId,
        )
        .map((entry) => entry.id)

      set((state) => {
        state.containers = state.containers.filter(
          (entry) => !(entry.kind === 'character_slot' && entry.characterId === characterId),
        )
      })

      return removedIds
    },

    syncAllCharacterInventories: (characters) => {
      const characterIds = new Set(characters.map((entry) => entry.id))
      for (const character of characters) {
        get().ensureCharacterInventory(character.id, character.title)
      }

      set((state) => {
        state.containers = state.containers.filter((entry) => {
          if (entry.kind !== 'character_slot') return true
          return Boolean(entry.characterId && characterIds.has(entry.characterId))
        })
      })
    },

    replaceAll: (containers) => {
      set((state) => {
        state.containers = containers.map((entry) => normalizeContainer(entry))
      })
    },
  })),
)
