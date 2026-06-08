import {
  normalizeCharacterCategory,
  type CharacterCategory,
} from '../admin/characterTypes'
import { normalizeTaxonomyState } from '../admin/taxonomyTypes'
import type { AdminListItem, StubContentType } from '../admin/types'
import { useCharacterMetaStore } from '../store/characterMetaStore'
import { useContentCatalogStore } from '../store/contentCatalogStore'
import { useRacesStore } from '../store/racesStore'
import { useStateVariablesStore } from '../store/stateVariablesStore'
import { getTaxonomySnapshot, useTaxonomyStore } from '../store/taxonomyStore'
import { createDefaultProjectContent } from './defaultProjectContent'
import type { ProjectContent, SerializedCatalogStubs, SerializedCharacter } from './projectRecord'

const CATALOG_STUB_TYPES = ['stories', 'items', 'containers', 'abilities', 'rules'] as const

function migrateCharacter(raw: SerializedCharacter & { category?: string }): SerializedCharacter {
  const characterType = raw.characterType
    ? normalizeCharacterCategory(raw.characterType)
    : normalizeCharacterCategory(raw.category ?? 'user-generated')
  return {
    id: raw.id,
    title: raw.title,
    characterType,
    updatedAt: raw.updatedAt,
    raceId: raw.raceId ?? null,
    summary: raw.summary ?? '',
  }
}

export function normalizeProjectContent(raw: ProjectContent | undefined): ProjectContent {
  const defaults = createDefaultProjectContent()
  if (!raw) return defaults
  return {
    stateVariables: structuredClone(raw.stateVariables ?? defaults.stateVariables),
    races: structuredClone(raw.races ?? defaults.races),
    characters: structuredClone((raw.characters ?? defaults.characters).map(migrateCharacter)),
    catalogStubs: structuredClone(raw.catalogStubs ?? defaults.catalogStubs),
    taxonomy: normalizeTaxonomyState(raw.taxonomy),
  }
}

export function getProjectContent(): ProjectContent {
  const variables = useStateVariablesStore.getState().variables
  const races = useRacesStore.getState().races
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
    races: structuredClone(races),
    characters: characters.map((character) => ({
      id: character.id,
      title: character.title,
      characterType: meta[character.id]?.characterType ?? normalizeCharacterCategory(character.category),
      updatedAt: character.updatedAt,
      raceId: meta[character.id]?.raceId ?? null,
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
  useRacesStore.getState().replaceAll(content.races)
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
          raceId: character.raceId,
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
