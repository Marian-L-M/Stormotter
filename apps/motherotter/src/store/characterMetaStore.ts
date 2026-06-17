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
import { MAIN_HAND_SLOT_COUNT, OFF_HAND_SLOT_COUNT } from '../admin/characterSlotTypes'
import { normalizeSlotRules, type SlotRulesMap } from '../admin/slotRules'
import {
  normalizeCharacterLocationRules,
  normalizeMapCellReference,
  type CharacterLocationRule,
  type MapCellReference,
} from '../admin/characterLocationTypes'
import {
  normalizeDerivedStatBaseMap,
  normalizeDerivedStatModifierMap,
  type DerivedStatBaseMap,
  type DerivedStatModifierMap,
} from '../admin/derivedStatTypes'
import {
  normalizeCharacterEntityRenderer,
  type EntityRendererSettings,
} from '../admin/entityRendererTypes'

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
  slotRules: SlotRulesMap
  hiddenInventoryActivatesUnequipped: boolean | null
  activeMainHandSlot: number
  activeOffHandSlot: number
  derivedStatBases: DerivedStatBaseMap
  derivedStatModifiers: DerivedStatModifierMap
  isMain: boolean
  isInGroup: boolean
  isGroupAddable: boolean
  activeLocation: MapCellReference | null
  spawnLocationRules: CharacterLocationRule[]
  despawnLocationRules: CharacterLocationRule[]
  renderer: EntityRendererSettings
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
  slotRules: {},
  hiddenInventoryActivatesUnequipped: null,
  activeMainHandSlot: 0,
  activeOffHandSlot: 0,
  derivedStatBases: {},
  derivedStatModifiers: {},
  isMain: false,
  isInGroup: false,
  isGroupAddable: false,
  activeLocation: null,
  spawnLocationRules: [],
  despawnLocationRules: [],
  renderer: {},
}

export { DEFAULT_META }

interface CharacterMetaState {
  metaByCharacterId: Record<string, CharacterMeta>
  getMeta: (characterId: string) => CharacterMeta
  updateMeta: (characterId: string, patch: Partial<CharacterMeta>) => void
  removeMeta: (characterId: string) => void
  replaceAll: (metaByCharacterId: Record<string, CharacterMeta>) => void
}

function normalizeHandSlotIndex(raw: number | undefined, max: number): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0
  return Math.min(Math.max(Math.floor(raw), 0), max - 1)
}

function normalizeMeta(
  raw: Partial<CharacterMeta> & { raceId?: string | null; classId?: string | null; audioMediaId?: string | null },
): CharacterMeta {
  const shared = {
    slotRules: normalizeSlotRules(raw.slotRules),
    hiddenInventoryActivatesUnequipped:
      raw.hiddenInventoryActivatesUnequipped === true ||
      raw.hiddenInventoryActivatesUnequipped === false
        ? raw.hiddenInventoryActivatesUnequipped
        : null,
    activeMainHandSlot: normalizeHandSlotIndex(raw.activeMainHandSlot, MAIN_HAND_SLOT_COUNT),
    activeOffHandSlot: normalizeHandSlotIndex(raw.activeOffHandSlot, OFF_HAND_SLOT_COUNT),
    derivedStatBases: normalizeDerivedStatBaseMap(raw.derivedStatBases),
    derivedStatModifiers: normalizeDerivedStatModifierMap(raw.derivedStatModifiers),
    isMain: raw.isMain === true,
    isInGroup: raw.isInGroup === true,
    isGroupAddable: raw.isGroupAddable === true,
    activeLocation: normalizeMapCellReference(raw.activeLocation),
    spawnLocationRules: normalizeCharacterLocationRules(raw.spawnLocationRules),
    despawnLocationRules: normalizeCharacterLocationRules(raw.despawnLocationRules),
    renderer: normalizeCharacterEntityRenderer(raw.renderer),
  }

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
      ...shared,
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
    ...shared,
  }
}

export const useCharacterMetaStore = create<CharacterMetaState>()(
  immer((set, get) => ({
    metaByCharacterId: {},

    getMeta: (characterId) => get().metaByCharacterId[characterId] ?? DEFAULT_META,

    updateMeta: (characterId, patch) => {
      set((state) => {
        const current = state.metaByCharacterId[characterId] ?? { ...DEFAULT_META }
        state.metaByCharacterId[characterId] = normalizeMeta({
          ...current,
          ...patch,
        })
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
