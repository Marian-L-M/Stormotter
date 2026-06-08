import type { CharacterCategory } from '../admin/characterTypes'
import type { Race } from '../admin/raceTypes'
import type { StateVariable } from '../admin/stateTypes'
import type { TaxonomyState } from '../admin/taxonomyTypes'
import type { AdminListItem } from '../admin/types'
import type { EditorMode } from '../editorModes'
import type { EditorTool } from '../editorTools'

export interface SerializedCharacter {
  id: string
  title: string
  characterType: CharacterCategory
  updatedAt: string
  raceId: string | null
  summary: string
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
  races: Race[]
  characters: SerializedCharacter[]
  catalogStubs: SerializedCatalogStubs
  taxonomy: TaxonomyState
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
