import type { Container } from '../admin/containerTypes'
import type { Dialog, DialogCategory } from '../admin/dialogTypes'
import type { JournalCategory, JournalEntry } from '../admin/journalTypes'
import type { Quest, QuestCategory } from '../admin/questTypes'
import type { Storyline } from '../admin/storylineTypes'
import type { Item } from '../admin/itemTypes'
import type { AbilitiesContent } from '../admin/abilityTypes'
import type { AnimationsContent } from '../admin/animationTypes'
import type { AttributesContent } from '../admin/attributeTypes'
import type { AudioProfile } from '../admin/audioProfileTypes'
import type { AiProfile } from '../admin/aiProfileTypes'
import type { CharacterCategory } from '../admin/characterTypes'
import type { MediaAsset } from '../admin/mediaTypes'
import type { CharacterClass } from '../admin/characterClassTypes'
import type { CharacterLineageType } from '../admin/lineageTypes'
import type { HitPointSource } from '../admin/diceTypes'
import type { LevelAbilityGrant } from '../admin/levelGrantTypes'
import type { CharacterStatValues } from '../admin/lineageTypes'
import type { StateVariable } from '../admin/stateTypes'
import type { TaxonomyState } from '../admin/taxonomyTypes'
import type { AdminListItem } from '../admin/types'
import type { ItemSlotPlacementSettings } from '../admin/slotRules'
import type { SlotRulesMap } from '../admin/slotRules'
import type { EntranceTarget, RestZone, SpawnPointConfig } from '@otter/game-state'
import type { CharacterLocationRule, MapCellReference } from '../admin/characterLocationTypes'
import type { DerivedStatBaseMap, DerivedStatModifierMap } from '../admin/derivedStatTypes'
import type { CharacterProgression } from '../admin/progressionTypes'
import type { CharacterCastPreviewState } from '../admin/abilityCastSlotTypes'
import type { EditorMode } from '../editorModes'
import type { DeOttererIcon } from '../admin/deOttererIconTypes'
import type { EntityRendererSettings } from '../admin/entityRendererTypes'
import type { MapRenderEngine } from '../admin/renderEngineTypes'
import type { GameplaySettings } from '../admin/gameplaySettingsTypes'
import type { MapToolKind } from '../editorTools'

export interface SerializedCharacter {
  id: string
  title: string
  characterType: CharacterCategory
  updatedAt: string
  lineageTypeId: string | null
  classId: string | null
  level: number
  progression?: CharacterProgression
  levelAbilities: LevelAbilityGrant[]
  portraitMediaId: string | null
  audioProfileId: string | null
  aiProfileId: string | null
  stats: CharacterStatValues
  hitPointSource: HitPointSource
  hitPointOverride: number | null
  summary: string
  slotRules?: SlotRulesMap
  hiddenInventoryActivatesUnequipped?: boolean | null
  activeMainHandSlot?: number
  activeOffHandSlot?: number
  derivedStatBases?: DerivedStatBaseMap
  derivedStatModifiers?: DerivedStatModifierMap
  isMain?: boolean
  isInGroup?: boolean
  isGroupAddable?: boolean
  activeLocation?: MapCellReference | null
  spawnLocationRules?: CharacterLocationRule[]
  despawnLocationRules?: CharacterLocationRule[]
  renderer?: EntityRendererSettings
  castSlotPreview?: CharacterCastPreviewState
}

export interface SerializedCatalogStubs {
  stories: AdminListItem[]
  items: AdminListItem[]
  containers: AdminListItem[]
  abilities: AdminListItem[]
  rules: AdminListItem[]
}

export interface ProjectContent {
  stateVariables: StateVariable[]
  characterTypes: CharacterLineageType[]
  characterClasses: CharacterClass[]
  mediaAssets: MediaAsset[]
  audioProfiles: AudioProfile[]
  aiProfiles: AiProfile[]
  attributes: AttributesContent
  abilities: AbilitiesContent
  animations: AnimationsContent
  items: Item[]
  containers: Container[]
  dialogs: Dialog[]
  dialogCategories: DialogCategory[]
  quests: Quest[]
  questCategories: QuestCategory[]
  journalEntries: JournalEntry[]
  journalCategories: JournalCategory[]
  storylines: Storyline[]
  characters: SerializedCharacter[]
  catalogStubs: SerializedCatalogStubs
  taxonomy: TaxonomyState
  itemCategorySlotSettings: Record<string, ItemSlotPlacementSettings>
  itemClassSlotSettings: Record<string, ItemSlotPlacementSettings>
  deOttererIcons: DeOttererIcon[]
  gameplaySettings: GameplaySettings
}

export interface SerializedCell {
  x: number
  y: number
  layer: string
  contentId: string
  entranceTarget?: EntranceTarget
  spawnPoint?: SpawnPointConfig
}

export interface SerializedTile {
  x: number
  y: number
  layer: string
  passable: boolean
  backgroundColor: string | null
  backgroundIconId: string | null
}

export interface SerializedWorld {
  width: number
  height: number
  layers: string[]
  cells: SerializedCell[]
  tiles?: SerializedTile[]
}

export interface StoredMapEntry {
  id: string
  title: string
  backdropMediaId: string | null
  restZone?: RestZone
  world: SerializedWorld
}

export interface StoredProject {
  projectId: string
  gameId: string
  title: string
  mapId: string
  activeLayer: string
  mapToolKind?: MapToolKind
  mapPlacementEntityId?: string | null
  /** @deprecated Migrated to mapToolKind + mapPlacementEntityId on load. */
  selectedTool?: string
  activeMode: EditorMode
  mapBackdropMediaId: string | null
  mapRenderEngine?: MapRenderEngine
  enabledMapRenderEngines?: MapRenderEngine[]
  mediaMaxFileBytes: number
  mediaProjectSoftBudgetBytes: number
  world: SerializedWorld
  /** All maps in the project. When absent, legacy single-map fields are used. */
  maps?: StoredMapEntry[]
  content?: ProjectContent
  formatVersion: string
  createdAt: string
  updatedAt: string
}

export interface ProjectSummary {
  projectId: string
  gameId: string
  title: string
  updatedAt: string
  formatVersion: string
}

export interface AppSettings {
  id: 'settings'
  lastProjectId: string | null
  autosaveEnabled: boolean
}

export function toProjectSummary(project: StoredProject): ProjectSummary {
  return {
    projectId: project.projectId,
    gameId: project.gameId,
    title: project.title,
    updatedAt: project.updatedAt,
    formatVersion: project.formatVersion,
  }
}

export function createProjectId(): string {
  return `proj_${crypto.randomUUID()}`
}

export function createDefaultGameId(): string {
  return `game-${crypto.randomUUID().slice(0, 8)}`
}

export function createMapId(): string {
  return `map-${crypto.randomUUID().slice(0, 8)}`
}
