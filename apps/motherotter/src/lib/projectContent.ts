import {
  normalizeCharacterCategory,
  type CharacterCategory,
} from '../admin/characterTypes'
import type { CharacterClass } from '../admin/characterClassTypes'
import { migrateLegacyCharacterClassId, normalizeCharacterClass } from '../admin/characterClassTypes'
import type { CharacterLineageType } from '../admin/lineageTypes'
import {
  migrateLegacyLineageId,
  normalizeCharacterStats,
  normalizeLineageType,
  normalizeStatRanges,
} from '../admin/lineageTypes'
import { createDefaultHitDice, createEmptyBonusDice, normalizeDiceRoll, normalizeHitPointOverride, normalizeHitPointSource } from '../admin/diceTypes'
import { normalizeCharacterLevel } from '../admin/characterLevelTypes'
import { normalizeLevelAbilityGrants } from '../admin/levelGrantTypes'
import { normalizeAttributesContent } from '../admin/attributeTypes'
import { normalizeAudioProfile } from '../admin/audioProfileTypes'
import { normalizeTaxonomyState } from '../admin/taxonomyTypes'
import type { AdminListItem, StubContentType } from '../admin/types'
import { useAttributesStore } from '../store/attributesStore'
import { useAudioProfilesStore } from '../store/audioProfilesStore'
import { useCharacterClassesStore } from '../store/characterClassesStore'
import { useCharacterMetaStore } from '../store/characterMetaStore'
import { useContentCatalogStore } from '../store/contentCatalogStore'
import { useLineageTypesStore } from '../store/lineageTypesStore'
import { useMediaLibraryStore } from '../store/mediaLibraryStore'
import { useStateVariablesStore } from '../store/stateVariablesStore'
import { getTaxonomySnapshot, useTaxonomyStore } from '../store/taxonomyStore'
import { createDefaultProjectContent } from './defaultProjectContent'
import type { ProjectContent, SerializedCatalogStubs, SerializedCharacter } from './projectRecord'

const CATALOG_STUB_TYPES = ['stories', 'items', 'containers', 'abilities', 'rules'] as const

interface LegacyTraitEntry {
  id: string
  name: string
  description: string
  distinctFeatures?: string[]
  statRanges?: Partial<CharacterLineageType['statRanges']>
  hitDice?: Partial<CharacterClass['hitDice']>
  hitPointBonusDice?: Partial<CharacterLineageType['hitPointBonusDice']>
  abilityIds?: string[]
  updatedAt: string
}

type RawCharacter = Partial<SerializedCharacter> & {
  id: string
  title: string
  updatedAt: string
  category?: string
  raceId?: string | null
  /** @deprecated Use audioProfileId */
  audioMediaId?: string | null
}

type RawProjectContent = Partial<ProjectContent> & {
  races?: LegacyTraitEntry[]
  classes?: LegacyTraitEntry[]
  characters?: RawCharacter[]
}

function migrateLineageType(raw: LegacyTraitEntry): CharacterLineageType {
  return normalizeLineageType({
    id: migrateLegacyLineageId(raw.id),
    name: raw.name,
    description: raw.description ?? '',
    statRanges: normalizeStatRanges(raw.statRanges),
    hitPointBonusDice: normalizeDiceRoll(raw.hitPointBonusDice ?? createEmptyBonusDice()),
    abilityIds: raw.abilityIds ?? [],
    updatedAt: raw.updatedAt,
  })
}

function migrateCharacterClass(raw: LegacyTraitEntry): CharacterClass {
  return normalizeCharacterClass({
    id: migrateLegacyCharacterClassId(raw.id),
    name: raw.name,
    description: raw.description ?? '',
    hitDice: normalizeDiceRoll(raw.hitDice ?? createDefaultHitDice(8)),
    distinctFeatures: raw.distinctFeatures ?? [],
    abilityIds: raw.abilityIds ?? [],
    updatedAt: raw.updatedAt,
  })
}

function migrateCharacter(raw: RawCharacter): SerializedCharacter {
  const characterType = raw.characterType
    ? normalizeCharacterCategory(raw.characterType)
    : normalizeCharacterCategory(raw.category ?? 'user-generated')

  const hasNewShape = raw.lineageTypeId !== undefined
  if (!hasNewShape) {
    const oldLink = raw.classId ?? raw.raceId ?? null
    return {
      id: raw.id,
      title: raw.title,
      characterType,
      updatedAt: raw.updatedAt,
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
    id: raw.id,
    title: raw.title,
    characterType,
    updatedAt: raw.updatedAt,
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

export function normalizeProjectContent(raw: RawProjectContent | undefined): ProjectContent {
  const defaults = createDefaultProjectContent()
  if (!raw) return defaults

  let characterTypes = (raw.characterTypes ?? raw.races ?? []).map(migrateLineageType)
  let characterClasses = (raw.characterClasses ?? []).map(migrateCharacterClass)

  if (raw.classes?.length && characterTypes.length === 0 && characterClasses.length === 0) {
    characterTypes = raw.classes.map(migrateLineageType)
  }

  return {
    stateVariables: structuredClone(raw.stateVariables ?? defaults.stateVariables),
    characterTypes: structuredClone(characterTypes),
    characterClasses: structuredClone(characterClasses),
    mediaAssets: structuredClone(raw.mediaAssets ?? defaults.mediaAssets),
    audioProfiles: structuredClone(
      (raw.audioProfiles ?? defaults.audioProfiles).map((profile) => normalizeAudioProfile(profile)),
    ),
    attributes: normalizeAttributesContent(raw.attributes ?? defaults.attributes, {
      levelGrantEntityIds: new Set([
        ...characterTypes.map((entry) => entry.id),
        ...characterClasses.map((entry) => entry.id),
      ]),
    }),
    characters: structuredClone((raw.characters ?? defaults.characters).map(migrateCharacter)),
    catalogStubs: structuredClone(raw.catalogStubs ?? defaults.catalogStubs),
    taxonomy: normalizeTaxonomyState(raw.taxonomy),
  }
}

export function getProjectContent(): ProjectContent {
  const variables = useStateVariablesStore.getState().variables
  const characterTypes = useLineageTypesStore.getState().lineageTypes
  const characterClasses = useCharacterClassesStore.getState().characterClasses
  const mediaAssets = useMediaLibraryStore.getState().assets
  const audioProfiles = useAudioProfilesStore.getState().audioProfiles
  const attributes = useAttributesStore.getState().getSnapshot()
  const characters = useContentCatalogStore.getState().stubs.characters
  const meta = useCharacterMetaStore.getState().metaByCharacterId
  const stubs = useContentCatalogStore.getState().stubs

  const catalogStubs: SerializedCatalogStubs = {
    stories: structuredClone(stubs.stories),
    items: structuredClone(stubs.items),
    containers: structuredClone(stubs.containers),
    abilities: structuredClone(stubs.abilities),
    rules: structuredClone(stubs.rules),
  }

  return {
    stateVariables: structuredClone(variables),
    characterTypes: structuredClone(characterTypes),
    characterClasses: structuredClone(characterClasses),
    mediaAssets: structuredClone(mediaAssets),
    audioProfiles: structuredClone(audioProfiles),
    attributes: structuredClone(attributes),
    characters: characters.map((character) => ({
      id: character.id,
      title: character.title,
      characterType: meta[character.id]?.characterType ?? normalizeCharacterCategory(character.category),
      updatedAt: character.updatedAt,
      lineageTypeId: meta[character.id]?.lineageTypeId ?? null,
      classId: meta[character.id]?.classId ?? null,
      level: meta[character.id]?.level ?? normalizeCharacterLevel(undefined),
      levelAbilities: meta[character.id]?.levelAbilities ?? [],
      portraitMediaId: meta[character.id]?.portraitMediaId ?? null,
      audioProfileId: meta[character.id]?.audioProfileId ?? null,
      stats: meta[character.id]?.stats ?? normalizeCharacterStats(undefined),
      hitPointSource: meta[character.id]?.hitPointSource ?? 'derived',
      hitPointOverride: meta[character.id]?.hitPointOverride ?? null,
      summary: meta[character.id]?.summary ?? '',
    })),
    catalogStubs,
    taxonomy: getTaxonomySnapshot(),
  }
}

function toAdminListItem(character: SerializedCharacter): AdminListItem {
  return {
    id: character.id,
    title: character.title,
    category: character.characterType,
    updatedAt: character.updatedAt,
  }
}

export function applyProjectContent(raw: ProjectContent | undefined): void {
  const content = normalizeProjectContent(raw)

  useStateVariablesStore.getState().replaceAll(content.stateVariables)
  useLineageTypesStore.getState().replaceAll(content.characterTypes)
  useCharacterClassesStore.getState().replaceAll(content.characterClasses)
  useMediaLibraryStore.getState().replaceAll(content.mediaAssets)
  useAudioProfilesStore.getState().replaceAll(content.audioProfiles)
  useAttributesStore.getState().replaceAll(content.attributes)
  useContentCatalogStore.getState().replaceCharacters(content.characters.map(toAdminListItem))

  for (const type of CATALOG_STUB_TYPES) {
    useContentCatalogStore.getState().replaceStubType(type, content.catalogStubs[type])
  }

  useCharacterMetaStore.getState().replaceAll(
    Object.fromEntries(
      content.characters.map((character) => [
        character.id,
        {
          characterType: character.characterType,
          lineageTypeId: character.lineageTypeId,
          classId: character.classId,
          level: character.level,
          levelAbilities: character.levelAbilities,
          portraitMediaId: character.portraitMediaId,
          audioProfileId: character.audioProfileId,
          stats: character.stats,
          hitPointSource: character.hitPointSource,
          hitPointOverride: character.hitPointOverride,
          summary: character.summary,
        },
      ]),
    ),
  )

  useTaxonomyStore.getState().replaceAll(content.taxonomy)
}

export function projectContentEquals(a: ProjectContent, b: ProjectContent): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export { createDefaultProjectContent }

export function isCatalogStubType(type: StubContentType): type is Exclude<StubContentType, 'characters'> {
  return type !== 'characters'
}

export function filterCharactersByType(
  items: AdminListItem[],
  metaByCharacterId: Record<string, { characterType: CharacterCategory }>,
  type: CharacterCategory,
): AdminListItem[] {
  return items.filter((item) => {
    const characterType = metaByCharacterId[item.id]?.characterType ?? normalizeCharacterCategory(item.category)
    return characterType === type
  })
}
