import {
  normalizeCharacterLocationRules,
  normalizeMapCellReference,
} from '../admin/characterLocationTypes'
import { normalizeCharacterCategory, type CharacterCategory } from '../admin/characterTypes'
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
import { normalizeAbilitiesContent } from '../admin/abilityTypes'
import { normalizeAnimationsContent } from '../admin/animationTypes'
import { normalizeAttributesContent } from '../admin/attributeTypes'
import { migrateStubToItem, normalizeItem } from '../admin/itemTypes'
import { normalizeDialog, normalizeDialogCategory } from '../admin/dialogTypes'
import { normalizeJournalCategory, normalizeJournalEntry } from '../admin/journalTypes'
import { normalizeQuest, normalizeQuestCategory } from '../admin/questTypes'
import { normalizeStoryline } from '../admin/storylineTypes'
import { migrateStubToContainer, migrateLegacyContainers, normalizeContainer } from '../admin/containerTypes'
import { normalizeAudioProfile } from '../admin/audioProfileTypes'
import {
  normalizeDeOttererIcon,
  type DeOttererIcon,
  type LegacyDeOttererIcon,
} from '../admin/deOttererIconTypes'
import { normalizeGameplaySettings } from '../admin/gameplaySettingsTypes'
import { normalizeTaxonomyState } from '../admin/taxonomyTypes'
import type { AdminListItem, StubContentType } from '../admin/types'
import { useAbilitiesStore } from '../store/abilitiesStore'
import { useAnimationsStore } from '../store/animationsStore'
import { useAttributesStore } from '../store/attributesStore'
import { useAudioProfilesStore } from '../store/audioProfilesStore'
import { useCharacterClassesStore } from '../store/characterClassesStore'
import { useCharacterMetaStore } from '../store/characterMetaStore'
import { useItemRegistrySettingsStore } from '../store/itemRegistrySettingsStore'
import { useContentCatalogStore } from '../store/contentCatalogStore'
import { useContainersStore } from '../store/containersStore'
import { useDialogsStore } from '../store/dialogsStore'
import { useJournalStore } from '../store/journalStore'
import { useQuestsStore } from '../store/questsStore'
import { useStorylinesStore } from '../store/storylinesStore'
import { useItemsStore } from '../store/itemsStore'
import { useLineageTypesStore } from '../store/lineageTypesStore'
import { useMediaLibraryStore } from '../store/mediaLibraryStore'
import { useStateVariablesStore } from '../store/stateVariablesStore'
import { useGameplaySettingsStore } from '../store/gameplaySettingsStore'
import { useDeOttererIconsStore } from '../store/deOttererIconsStore'
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
      slotRules: raw.slotRules,
      hiddenInventoryActivatesUnequipped: raw.hiddenInventoryActivatesUnequipped ?? null,
      activeMainHandSlot: raw.activeMainHandSlot,
      activeOffHandSlot: raw.activeOffHandSlot,
      derivedStatBases: raw.derivedStatBases,
      derivedStatModifiers: raw.derivedStatModifiers,
      isMain: raw.isMain === true,
      isInGroup: raw.isInGroup === true,
      isGroupAddable: raw.isGroupAddable === true,
      activeLocation: normalizeMapCellReference(raw.activeLocation),
      spawnLocationRules: normalizeCharacterLocationRules(raw.spawnLocationRules),
      despawnLocationRules: normalizeCharacterLocationRules(raw.despawnLocationRules),
      renderer: raw.renderer,
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
    slotRules: raw.slotRules,
    hiddenInventoryActivatesUnequipped: raw.hiddenInventoryActivatesUnequipped ?? null,
    activeMainHandSlot: raw.activeMainHandSlot,
    activeOffHandSlot: raw.activeOffHandSlot,
    derivedStatBases: raw.derivedStatBases,
    derivedStatModifiers: raw.derivedStatModifiers,
    isMain: raw.isMain === true,
    isInGroup: raw.isInGroup === true,
    isGroupAddable: raw.isGroupAddable === true,
    activeLocation: normalizeMapCellReference(raw.activeLocation),
    spawnLocationRules: normalizeCharacterLocationRules(raw.spawnLocationRules),
    despawnLocationRules: normalizeCharacterLocationRules(raw.despawnLocationRules),
    renderer: raw.renderer,
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

  let items = (raw.items ?? []).map((entry) => normalizeItem(entry))
  if (items.length === 0 && raw.catalogStubs?.items?.length) {
    items = raw.catalogStubs.items.map(migrateStubToItem)
  }

  let containers = (raw.containers ?? []).map((entry) => normalizeContainer(entry))
  if (containers.length === 0 && raw.catalogStubs?.containers?.length) {
    containers = raw.catalogStubs.containers.map(migrateStubToContainer)
  }

  const { containers: migratedContainers, containerIdMap } = migrateLegacyContainers(containers)
  containers = migratedContainers

  if (containerIdMap.size > 0) {
    items = items.map((item) => {
      if (item.containerId && containerIdMap.has(item.containerId)) {
        return { ...item, containerId: containerIdMap.get(item.containerId)! }
      }
      return item
    })
  }

  const catalogStubs = structuredClone(raw.catalogStubs ?? defaults.catalogStubs)
  catalogStubs.items = []
  catalogStubs.containers = []

  const legacyAbilityStubs = catalogStubs.abilities
  catalogStubs.abilities = []

  const legacyLevelGrantsByEntity: Record<string, ReturnType<typeof normalizeLevelAbilityGrants>> = {}
  for (const entry of characterTypes) {
    if (entry.levelAbilities.length > 0) {
      legacyLevelGrantsByEntity[entry.id] = entry.levelAbilities
    }
  }
  for (const entry of characterClasses) {
    if (entry.levelAbilities.length > 0) {
      legacyLevelGrantsByEntity[entry.id] = entry.levelAbilities
    }
  }
  for (const character of raw.characters ?? defaults.characters) {
    const migrated = migrateCharacter(character)
    if (migrated.levelAbilities.length > 0) {
      legacyLevelGrantsByEntity[migrated.id] = migrated.levelAbilities
    }
  }
  const abilities = normalizeAbilitiesContent(raw.abilities ?? defaults.abilities, {
    legacyStubAbilities: legacyAbilityStubs,
    legacyLevelGrantsByEntity,
  })

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
        ...items.map((entry) => entry.id),
      ]),
    }),
    abilities,
    animations: normalizeAnimationsContent(raw.animations ?? defaults.animations),
    items: structuredClone(items),
    containers: structuredClone(containers),
    dialogs: structuredClone((raw.dialogs ?? defaults.dialogs).map((entry) => normalizeDialog(entry))),
    dialogCategories: structuredClone(
      (raw.dialogCategories ?? defaults.dialogCategories).map((entry) => normalizeDialogCategory(entry)),
    ),
    quests: structuredClone((raw.quests ?? defaults.quests).map((entry) => normalizeQuest(entry))),
    questCategories: structuredClone(
      (raw.questCategories ?? defaults.questCategories).map((entry) => normalizeQuestCategory(entry)),
    ),
    journalEntries: structuredClone(
      (raw.journalEntries ?? defaults.journalEntries).map((entry) => normalizeJournalEntry(entry)),
    ),
    journalCategories: structuredClone(
      (raw.journalCategories ?? defaults.journalCategories).map((entry) =>
        normalizeJournalCategory(entry),
      ),
    ),
    storylines: structuredClone(
      (raw.storylines ?? defaults.storylines).map((entry) => normalizeStoryline(entry)),
    ),
    characters: structuredClone((raw.characters ?? defaults.characters).map(migrateCharacter)),
    catalogStubs,
    taxonomy: normalizeTaxonomyState(raw.taxonomy),
    itemCategorySlotSettings: structuredClone(
      raw.itemCategorySlotSettings ?? defaults.itemCategorySlotSettings,
    ),
    itemClassSlotSettings: structuredClone(raw.itemClassSlotSettings ?? defaults.itemClassSlotSettings),
    deOttererIcons: structuredClone(
      (raw.deOttererIcons ?? defaults.deOttererIcons).map((icon) =>
        normalizeDeOttererIcon(icon as LegacyDeOttererIcon | DeOttererIcon),
      ),
    ),
    gameplaySettings: normalizeGameplaySettings(raw.gameplaySettings ?? defaults.gameplaySettings),
  }
}

export function getProjectContent(): ProjectContent {
  const variables = useStateVariablesStore.getState().variables
  const characterTypes = useLineageTypesStore.getState().lineageTypes
  const characterClasses = useCharacterClassesStore.getState().characterClasses
  const mediaAssets = useMediaLibraryStore.getState().assets
  const audioProfiles = useAudioProfilesStore.getState().audioProfiles
  const attributes = useAttributesStore.getState().getSnapshot()
  const abilities = useAbilitiesStore.getState().getSnapshot()
  const animations = useAnimationsStore.getState().getSnapshot()
  const items = useItemsStore.getState().items
  const containers = useContainersStore.getState().containers
  const dialogs = useDialogsStore.getState().dialogs
  const dialogCategories = useDialogsStore.getState().categories
  const quests = useQuestsStore.getState().quests
  const questCategories = useQuestsStore.getState().categories
  const journalEntries = useJournalStore.getState().entries
  const journalCategories = useJournalStore.getState().categories
  const storylines = useStorylinesStore.getState().storylines
  const characters = useContentCatalogStore.getState().stubs.characters
  const meta = useCharacterMetaStore.getState().metaByCharacterId
  const itemRegistrySettings = useItemRegistrySettingsStore.getState()
  const stubs = useContentCatalogStore.getState().stubs

  const catalogStubs: SerializedCatalogStubs = {
    stories: structuredClone(stubs.stories),
    items: structuredClone(stubs.items),
    containers: structuredClone(stubs.containers),
    abilities: [],
    rules: structuredClone(stubs.rules),
  }

  return {
    stateVariables: structuredClone(variables),
    characterTypes: structuredClone(characterTypes),
    characterClasses: structuredClone(characterClasses),
    mediaAssets: structuredClone(mediaAssets),
    audioProfiles: structuredClone(audioProfiles),
    attributes: structuredClone(attributes),
    abilities: structuredClone(abilities),
    animations: structuredClone(animations),
    items: structuredClone(items),
    containers: structuredClone(containers),
    dialogs: structuredClone(dialogs),
    dialogCategories: structuredClone(dialogCategories),
    quests: structuredClone(quests),
    questCategories: structuredClone(questCategories),
    journalEntries: structuredClone(journalEntries),
    journalCategories: structuredClone(journalCategories),
    storylines: structuredClone(storylines),
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
      slotRules: meta[character.id]?.slotRules,
      hiddenInventoryActivatesUnequipped: meta[character.id]?.hiddenInventoryActivatesUnequipped ?? null,
      activeMainHandSlot: meta[character.id]?.activeMainHandSlot,
      activeOffHandSlot: meta[character.id]?.activeOffHandSlot,
      derivedStatBases: meta[character.id]?.derivedStatBases,
      derivedStatModifiers: meta[character.id]?.derivedStatModifiers,
      isMain: meta[character.id]?.isMain ?? false,
      isInGroup: meta[character.id]?.isInGroup ?? false,
      isGroupAddable: meta[character.id]?.isGroupAddable ?? false,
      activeLocation: meta[character.id]?.activeLocation ?? null,
      spawnLocationRules: meta[character.id]?.spawnLocationRules ?? [],
      despawnLocationRules: meta[character.id]?.despawnLocationRules ?? [],
      renderer: meta[character.id]?.renderer ?? {},
    })),
    catalogStubs,
    taxonomy: getTaxonomySnapshot(),
    itemCategorySlotSettings: structuredClone(itemRegistrySettings.categorySettings),
    itemClassSlotSettings: structuredClone(itemRegistrySettings.classSettings),
    deOttererIcons: structuredClone(useDeOttererIconsStore.getState().customIcons),
    gameplaySettings: structuredClone(useGameplaySettingsStore.getState().settings),
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
  useAbilitiesStore.getState().replaceAll(content.abilities)
  useAnimationsStore.getState().replaceAll(content.animations)
  useItemsStore.getState().replaceAll(content.items)
  useContainersStore.getState().replaceAll(content.containers)
  useDialogsStore.getState().replaceAll(content.dialogs, content.dialogCategories)
  useQuestsStore.getState().replaceAll(content.quests, content.questCategories)
  useJournalStore.getState().replaceAll(content.journalEntries, content.journalCategories)
  useStorylinesStore.getState().replaceAll(content.storylines, content.catalogStubs.stories)
  useContainersStore.getState().syncAllCharacterInventories(
    content.characters.map((character) => ({ id: character.id, title: character.title })),
  )
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
          slotRules: character.slotRules ?? {},
          hiddenInventoryActivatesUnequipped: character.hiddenInventoryActivatesUnequipped ?? null,
          activeMainHandSlot: character.activeMainHandSlot ?? 0,
          activeOffHandSlot: character.activeOffHandSlot ?? 0,
          derivedStatBases: character.derivedStatBases ?? {},
          derivedStatModifiers: character.derivedStatModifiers ?? {},
          isMain: character.isMain ?? false,
          isInGroup: character.isInGroup ?? false,
          isGroupAddable: character.isGroupAddable ?? false,
          activeLocation: character.activeLocation ?? null,
          spawnLocationRules: character.spawnLocationRules ?? [],
          despawnLocationRules: character.despawnLocationRules ?? [],
          renderer: character.renderer ?? {},
        },
      ]),
    ),
  )

  useItemRegistrySettingsStore.getState().replaceAll({
    categorySettings: content.itemCategorySlotSettings,
    classSettings: content.itemClassSlotSettings,
  })
  useDeOttererIconsStore.getState().setCustomIcons(content.deOttererIcons)
  useGameplaySettingsStore.getState().replaceAll(content.gameplaySettings)

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
