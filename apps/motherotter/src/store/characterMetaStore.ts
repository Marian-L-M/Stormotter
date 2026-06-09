import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  DEFAULT_CHARACTER_CATEGORY,
  normalizeCharacterCategory,
  type CharacterCategory,
} from '../admin/characterTypes'
import { migrateLegacyCharacterClassId } from '../admin/characterClassTypes'
import {
  createEmptyCharacterStats,
  migrateLegacyLineageId,
  normalizeCharacterStats,
  type CharacterStatValues,
} from '../admin/lineageTypes'

import {
  normalizeHitPointOverride,
  normalizeHitPointSource,
  type HitPointSource,
} from '../admin/diceTypes'
import { DEFAULT_CHARACTER_LEVEL, normalizeCharacterLevel } from '../admin/characterLevelTypes'
import { normalizeLevelAbilityGrants, type LevelAbilityGrant } from '../admin/levelGrantTypes'

export interface CharacterMeta {
  characterType: CharacterCategory
  lineageTypeId: string | null
  classId: string | null
  level: number
  levelAbilities: LevelAbilityGrant[]
  portraitMediaId: string | null
  audioProfileId: string | null
  stats: CharacterStatValues
  hitPointSource: HitPointSource
  hitPointOverride: number | null
  summary: string
}

const DEFAULT_META: CharacterMeta = {
  characterType: DEFAULT_CHARACTER_CATEGORY,
  lineageTypeId: null,
  classId: null,
  level: DEFAULT_CHARACTER_LEVEL,
  levelAbilities: [],
  portraitMediaId: null,
  audioProfileId: null,
  stats: createEmptyCharacterStats(),
  hitPointSource: 'derived',
  hitPointOverride: null,
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

function normalizeMeta(
  raw: Partial<CharacterMeta> & { raceId?: string | null; classId?: string | null; audioMediaId?: string | null },
): CharacterMeta {
  const hasNewShape = raw.lineageTypeId !== undefined
  if (!hasNewShape) {
    const oldLink = raw.classId ?? raw.raceId ?? null
    return {
      characterType: normalizeCharacterCategory(raw.characterType ?? DEFAULT_CHARACTER_CATEGORY),
      lineageTypeId: oldLink ? migrateLegacyLineageId(oldLink) : null,
      classId: null,
      level: normalizeCharacterLevel(raw.level),
      levelAbilities: normalizeLevelAbilityGrants(raw.levelAbilities),
      portraitMediaId: raw.portraitMediaId ?? null,
      audioProfileId: raw.audioProfileId ?? null,
      stats: normalizeCharacterStats(raw.stats),
      hitPointSource: normalizeHitPointSource(raw.hitPointSource),
      hitPointOverride: normalizeHitPointOverride(raw.hitPointOverride),
      summary: raw.summary ?? '',
    }
  }

  return {
    characterType: normalizeCharacterCategory(raw.characterType ?? DEFAULT_CHARACTER_CATEGORY),
    lineageTypeId: raw.lineageTypeId ? migrateLegacyLineageId(raw.lineageTypeId) : null,
    classId: raw.classId ? migrateLegacyCharacterClassId(raw.classId) : null,
    level: normalizeCharacterLevel(raw.level),
    levelAbilities: normalizeLevelAbilityGrants(raw.levelAbilities),
    portraitMediaId: raw.portraitMediaId ?? null,
    audioProfileId: raw.audioProfileId ?? null,
    stats: normalizeCharacterStats(raw.stats),
    hitPointSource: normalizeHitPointSource(raw.hitPointSource),
    hitPointOverride: normalizeHitPointOverride(raw.hitPointOverride),
    summary: raw.summary ?? '',
  }
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
          lineageTypeId:
            patch.lineageTypeId !== undefined ? patch.lineageTypeId : current.lineageTypeId,
          classId: patch.classId !== undefined ? patch.classId : current.classId,
          level: patch.level !== undefined ? normalizeCharacterLevel(patch.level) : current.level,
          levelAbilities:
            patch.levelAbilities !== undefined
              ? normalizeLevelAbilityGrants(patch.levelAbilities)
              : current.levelAbilities,
          portraitMediaId:
            patch.portraitMediaId !== undefined ? patch.portraitMediaId : current.portraitMediaId,
          audioProfileId:
            patch.audioProfileId !== undefined ? patch.audioProfileId : current.audioProfileId,
          stats: patch.stats !== undefined ? patch.stats : current.stats,
          hitPointSource:
            patch.hitPointSource !== undefined ? patch.hitPointSource : current.hitPointSource,
          hitPointOverride:
            patch.hitPointOverride !== undefined ? patch.hitPointOverride : current.hitPointOverride,
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
          Object.entries(metaByCharacterId).map(([id, meta]) => [id, normalizeMeta(meta)]),
        )
      })
    },
  })),
)
