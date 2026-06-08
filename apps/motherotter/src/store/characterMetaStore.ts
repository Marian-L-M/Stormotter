import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  DEFAULT_CHARACTER_CATEGORY,
  normalizeCharacterCategory,
  type CharacterCategory,
} from '../admin/characterTypes'

export interface CharacterMeta {
  characterType: CharacterCategory
  raceId: string | null
  summary: string
}

const DEFAULT_META: CharacterMeta = {
  characterType: DEFAULT_CHARACTER_CATEGORY,
  raceId: null,
  summary: '',
}

export { DEFAULT_META }

interface CharacterMetaState {
  metaByCharacterId: Record<string, CharacterMeta>
  getMeta: (characterId: string) => CharacterMeta
  updateMeta: (characterId: string, patch: Partial<CharacterMeta>) => void
  removeMeta: (characterId: string) => void
  replaceAll: (metaByCharacterId: Record<string, CharacterMeta>) => void
}

export const useCharacterMetaStore = create<CharacterMetaState>()(
  immer((set, get) => ({
    metaByCharacterId: {},

    getMeta: (characterId) => get().metaByCharacterId[characterId] ?? DEFAULT_META,

    updateMeta: (characterId, patch) => {
      set((state) => {
        const current = state.metaByCharacterId[characterId] ?? { ...DEFAULT_META }
        state.metaByCharacterId[characterId] = {
          characterType:
            patch.characterType !== undefined
              ? patch.characterType
              : current.characterType,
          raceId: patch.raceId !== undefined ? patch.raceId : current.raceId,
          summary: patch.summary !== undefined ? patch.summary : current.summary,
        }
      })
    },

    removeMeta: (characterId) => {
      set((state) => {
        delete state.metaByCharacterId[characterId]
      })
    },

    replaceAll: (metaByCharacterId) => {
      set((state) => {
        state.metaByCharacterId = Object.fromEntries(
          Object.entries(metaByCharacterId).map(([id, meta]) => [
            id,
            {
              characterType: normalizeCharacterCategory(meta.characterType),
              raceId: meta.raceId,
              summary: meta.summary,
            },
          ]),
        )
      })
    },
  })),
)
