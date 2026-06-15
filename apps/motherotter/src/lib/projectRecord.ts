import type { Container } from '../admin/containerTypes'
import type { Item } from '../admin/itemTypes'
import type { AbilitiesContent } from '../admin/abilityTypes'
import type { AttributesContent } from '../admin/attributeTypes'
import type { AudioProfile } from '../admin/audioProfileTypes'
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
import type { DerivedStatBaseMap, DerivedStatModifierMap } from '../admin/derivedStatTypes'
import type { EditorMode } from '../editorModes'
import type { EditorTool } from '../editorTools'

export interface SerializedCharacter {
  id: string
  title: string
  characterType: CharacterCategory
  updatedAt: string
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
  slotRules?: SlotRulesMap
  hiddenInventoryActivatesUnequipped?: boolean | null
  activeMainHandSlot?: number
  activeOffHandSlot?: number
  derivedStatBases?: DerivedStatBaseMap
  derivedStatModifiers?: DerivedStatModifierMap
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
  attributes: AttributesContent
  abilities: AbilitiesContent
  items: Item[]
  containers: Container[]
  characters: SerializedCharacter[]
  catalogStubs: SerializedCatalogStubs
  taxonomy: TaxonomyState
  itemCategorySlotSettings: Record<string, ItemSlotPlacementSettings>
  itemClassSlotSettings: Record<string, ItemSlotPlacementSettings>
}

export interface SerializedCell {
  x: number
  y: number
  layer: string
  contentId: string
}

export interface SerializedWorld {
  width: number
  height: number
  layers: string[]
  cells: SerializedCell[]
}

export interface StoredProject {
  projectId: string
  gameId: string
  title: string
  mapId: string
  activeLayer: string
  selectedTool: EditorTool
  activeMode: EditorMode
  mapBackdropMediaId: string | null
  mediaMaxFileBytes: number
  mediaProjectSoftBudgetBytes: number
  world: SerializedWorld
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
