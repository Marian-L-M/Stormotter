import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { cellKey, type EntranceTarget, type WorldModel } from '@otter/game-state'
import { createEntranceContentId, createEventContentId, createSpawnPointContentId } from '../admin/mapCellUtils'
import { clampWorldDimensions } from '../admin/mapWorldUtils'
import {
  applyTileDecoration,
  rectangleTileKeys,
  setTilePassable,
} from '../admin/mapTileUtils'
import {
  createDefaultSpawnPointDraft,
  spawnPointDraftIsReady,
  type SpawnPointDraft,
} from '../admin/mapSpawnPointTypes'
import {
  DEFAULT_MAP_RENDER_ENGINE,
  isMapRenderEngine,
  type MapRenderEngine,
} from '../admin/renderEngineTypes'
import {
  isValidLayerName,
  layerNameTaken,
  MAX_LAYER_COUNT,
  normalizeLayerName,
} from '../admin/mapLayerUtils'
import { packOtterfile, type OtterfileDocument } from '@otter/otterfile-core'
import type { AttributeSource } from '../admin/attributeTypes'
import type { CharacterCategory } from '../admin/characterTypes'
import type { ContainerSectionTab } from '../admin/containerTypes'
import type { DialogSectionTab } from '../admin/dialogTypes'
import type { ItemSectionTab } from '../admin/itemTypes'
import type { JournalSectionTab } from '../admin/journalTypes'
import type { QuestSectionTab } from '../admin/questTypes'
import {
  DEFAULT_MEDIA_MAX_FILE_BYTES,
  DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES,
} from '../admin/mediaTypes'
import { DEFAULT_CHARACTER_CATEGORY, isUniqueNpcCharacter } from '../admin/characterTypes'
import {
  canAddUniqueCharacterFixedPlacement,
  findCharacterGridPlacement,
  moveCellInWorld,
  toActiveLocationFromCell,
} from '../admin/mapCharacterPlacementUtils'
import { getCellContentKind, getCellEntityId } from '../admin/mapCellUtils'
import type { MapCellReference } from '../admin/characterLocationTypes'
import { useCharacterMetaStore } from './characterMetaStore'
import { isCharacterSectionMode, normalizeEditorMode, type EditorMode } from '../editorModes'
import type { EditorScreen } from '../admin/types'
import {
  buildContentId,
  DEFAULT_MAP_TOOL_KIND,
  type MapToolKind,
} from '../editorTools'
import type { ProjectSummary } from '../lib/projectRecord'
import { applyProjectContent, getProjectContent } from '../lib/projectContent'
import { readAppSettings, writeAppSettings } from '../lib/db'
import {
  cloneWorld,
  contentFromBytes,
  createDefaultMapEntry,
  createDefaultWorld,
  createStoredProject,
  fetchProjectSummaries,
  importBytesAsNewProject,
  loadInitialSnapshot,
  loadSnapshot,
  removeStoredProject,
  saveSnapshot,
  snapshotMapsForPersistence,
  snapshotToDocument,
  type EditorMapEntry,
  type EditorSnapshot,
} from '../lib/projectRepository'
import { createMapId } from '../lib/projectRecord'

export { MAP_TOOL_KINDS, type MapToolKind } from '../editorTools'

function createDefaultEntranceDraft(mapId: string, layer: string): EntranceTarget {
  return { mapId, x: 0, y: 0, layer }
}

function getCharacterCategory(characterId: string): CharacterCategory {
  return (
    useCharacterMetaStore.getState().metaByCharacterId[characterId]?.characterType ??
    DEFAULT_CHARACTER_CATEGORY
  )
}

function syncUniqueCharacterActiveLocation(
  characterId: string,
  location: MapCellReference | null,
) {
  const category = getCharacterCategory(characterId)
  if (!isUniqueNpcCharacter(category)) return
  useCharacterMetaStore.getState().updateMeta(characterId, { activeLocation: location })
}

export type PersistStatus = 'booting' | 'ready' | 'saving' | 'error'

export interface MapGridClickModifiers {
  ctrlKey: boolean
  shiftKey: boolean
}

export interface EditorState {
  hydrating: boolean
  persistStatus: PersistStatus
  isDirty: boolean
  lastSavedAt: string | null
  persistError: string | null
  projectId: string
  projects: ProjectSummary[]
  activeMode: EditorMode
  characterTypeTab: CharacterCategory
  itemSectionTab: ItemSectionTab
  dialogSectionTab: DialogSectionTab
  questSectionTab: QuestSectionTab
  journalSectionTab: JournalSectionTab
  containerSectionTab: ContainerSectionTab
  attributeSourceTab: AttributeSource
  editorScreen: EditorScreen
  mapPreviewOpen: boolean
  mapPreviewSessionKey: number
  selectedEntityId: string | null
  gameId: string
  title: string
  mapId: string
  activeLayer: string
  mapToolKind: MapToolKind
  mapPlacementEntityId: string | null
  entranceDraft: EntranceTarget
  spawnPointDraft: SpawnPointDraft
  selectedMapCellKey: string | null
  selectedTileKeys: string[]
  tileSelectionAnchorKey: string | null
  mapEditorNotice: string | null
  mapBackdropMediaId: string | null
  mapRenderEngine: MapRenderEngine
  enabledMapRenderEngines: MapRenderEngine[]
  mediaMaxFileBytes: number
  mediaProjectSoftBudgetBytes: number
  world: WorldModel
  maps: EditorMapEntry[]
  exportError: string | null
  importError: string | null
  autosaveEnabled: boolean
  initializeProjects: () => Promise<void>
  persistCurrentProject: () => Promise<void>
  switchProject: (projectId: string) => Promise<void>
  createProject: () => Promise<void>
  deleteProject: (projectId: string) => Promise<void>
  setActiveMode: (mode: EditorMode) => void
  setCharacterTypeTab: (tab: CharacterCategory) => void
  setItemSectionTab: (tab: ItemSectionTab) => void
  setDialogSectionTab: (tab: DialogSectionTab) => void
  setQuestSectionTab: (tab: QuestSectionTab) => void
  setJournalSectionTab: (tab: JournalSectionTab) => void
  setContainerSectionTab: (tab: ContainerSectionTab) => void
  setAttributeSourceTab: (tab: AttributeSource) => void
  openEntityEditor: (id: string) => void
  closeEntityEditor: () => void
  openMapPreview: () => void
  closeMapPreview: () => void
  setGameId: (gameId: string) => void
  setTitle: (title: string) => void
  setMapTitle: (title: string) => void
  addMap: () => void
  setActiveLayer: (layer: string) => void
  setMapToolKind: (kind: MapToolKind) => void
  setMapPlacementEntityId: (entityId: string | null) => void
  setEntranceDraft: (draft: EntranceTarget) => void
  setSpawnPointDraft: (draft: SpawnPointDraft) => void
  clearSelectedMapCell: () => void
  clearMapSelection: () => void
  clearMapEditorNotice: () => void
  removeCharacterGridPlacement: (characterId: string) => void
  removeSelectedMapCell: () => void
  updateSelectedCellEntranceTarget: (target: EntranceTarget) => void
  setMapBackdropMediaId: (mediaId: string | null) => void
  setMediaMaxFileBytes: (bytes: number) => void
  setMediaProjectSoftBudgetBytes: (bytes: number) => void
  setWorldDimensions: (width: number, height: number, options?: { pruneOutOfBounds?: boolean }) => void
  addWorldLayer: (name: string) => boolean
  renameWorldLayer: (fromLayer: string, toLayer: string) => boolean
  removeWorldLayer: (layer: string) => boolean
  moveWorldLayer: (layer: string, direction: 'up' | 'down') => boolean
  applyMapGridClick: (
    x: number,
    y: number,
    layer: string,
    modifiers?: MapGridClickModifiers,
  ) => void
  setSelectedTilesPassable: (passable: boolean) => void
  applyTileBackgroundColor: (color: string | null) => void
  applyTileBackgroundIcon: (iconId: string | null) => void
  setMapRenderEngine: (engine: MapRenderEngine) => void
  setEnabledMapRenderEngines: (engines: MapRenderEngine[]) => void
  buildDocument: () => OtterfileDocument
  exportOtterfile: () => Promise<Uint8Array>
  importOtterfileIntoCurrent: (bytes: Uint8Array) => Promise<void>
  importOtterfileAsNew: (bytes: Uint8Array) => Promise<void>
  setAutosaveEnabled: (enabled: boolean) => Promise<void>
  clearErrors: () => void
  markDirty: () => void
  markSaved: () => void
}

function flushActiveMapToCollection(state: EditorState) {
  const index = state.maps.findIndex((map) => map.id === state.mapId)
  if (index < 0) return
  state.maps[index] = {
    id: state.mapId,
    title: state.maps[index]!.title,
    backdropMediaId: state.mapBackdropMediaId,
    world: cloneWorld(state.world),
  }
}

function activateMapById(state: EditorState, mapId: string) {
  const entry = state.maps.find((map) => map.id === mapId)
  if (!entry) return
  state.mapId = entry.id
  state.mapBackdropMediaId = entry.backdropMediaId
  assignWorld(state, entry.world)
  state.activeLayer = normalizeActiveLayer(state.activeLayer, state.world.layers)
  state.entranceDraft = createDefaultEntranceDraft(entry.id, state.activeLayer)
  state.spawnPointDraft = createDefaultSpawnPointDraft(entry.id, state.activeLayer)
  state.selectedMapCellKey = null
  state.selectedTileKeys = []
  state.tileSelectionAnchorKey = null
}

function getSnapshot(state: EditorState): EditorSnapshot {
  const maps = snapshotMapsForPersistence({
    mapId: state.mapId,
    mapBackdropMediaId: state.mapBackdropMediaId,
    world: state.world,
    maps: state.maps,
  })

  return {
    projectId: state.projectId,
    gameId: state.gameId,
    title: state.title,
    mapId: state.mapId,
    activeLayer: state.activeLayer,
    mapToolKind: state.mapToolKind,
    mapPlacementEntityId: state.mapPlacementEntityId,
    activeMode: state.activeMode,
    mapBackdropMediaId: state.mapBackdropMediaId,
    mapRenderEngine: state.mapRenderEngine,
    enabledMapRenderEngines: state.enabledMapRenderEngines,
    mediaMaxFileBytes: state.mediaMaxFileBytes,
    mediaProjectSoftBudgetBytes: state.mediaProjectSoftBudgetBytes,
    world: maps.find((map) => map.id === state.mapId)?.world ?? state.world,
    maps,
  }
}

function assignWorld(state: EditorState, world: WorldModel) {
  state.world = cloneWorld(world)
}

function normalizeActiveLayer(activeLayer: string, layers: readonly string[]): string {
  if (layers.includes(activeLayer)) return activeLayer
  return layers[0] ?? 'ground'
}

function applySnapshot(
  set: (fn: (state: EditorState) => void) => void,
  snapshot: EditorSnapshot,
  content?: Parameters<typeof applyProjectContent>[0],
) {
  set((state) => {
    state.hydrating = true
    state.projectId = snapshot.projectId
    state.gameId = snapshot.gameId
    state.title = snapshot.title
    state.mapId = snapshot.mapId
    state.mapToolKind = snapshot.mapToolKind
    state.mapPlacementEntityId = snapshot.mapPlacementEntityId
    state.activeMode = normalizeEditorMode(snapshot.activeMode)
    state.mapBackdropMediaId = snapshot.mapBackdropMediaId
    state.mediaMaxFileBytes = snapshot.mediaMaxFileBytes
    state.mediaProjectSoftBudgetBytes = snapshot.mediaProjectSoftBudgetBytes
    state.maps = snapshot.maps.map((entry) => ({
      id: entry.id,
      title: entry.title,
      backdropMediaId: entry.backdropMediaId,
      world: cloneWorld(entry.world) as unknown as typeof state.maps[number]['world'],
    }))
    assignWorld(state, snapshot.world)
    state.activeLayer = normalizeActiveLayer(snapshot.activeLayer, state.world.layers)
    state.entranceDraft = createDefaultEntranceDraft(snapshot.mapId, state.activeLayer)
    state.spawnPointDraft = createDefaultSpawnPointDraft(snapshot.mapId, state.activeLayer)
    state.selectedMapCellKey = null
    state.selectedTileKeys = []
    state.tileSelectionAnchorKey = null
    state.mapRenderEngine = snapshot.mapRenderEngine
    state.enabledMapRenderEngines = snapshot.enabledMapRenderEngines
  })
  if (content !== undefined) {
    applyProjectContent(content)
  }
  set((state) => {
    state.isDirty = false
    state.hydrating = false
  })
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    hydrating: false,
    persistStatus: 'booting',
    isDirty: false,
    lastSavedAt: null,
    persistError: null,
    projectId: '',
    projects: [],
    activeMode: 'maps',
    characterTypeTab: DEFAULT_CHARACTER_CATEGORY,
    itemSectionTab: 'items' as ItemSectionTab,
    dialogSectionTab: 'dialogs' as DialogSectionTab,
    questSectionTab: 'quests' as QuestSectionTab,
    journalSectionTab: 'entries' as JournalSectionTab,
    containerSectionTab: 'unique' as ContainerSectionTab,
    attributeSourceTab: 'standard' as AttributeSource,
    editorScreen: 'list',
    mapPreviewOpen: false,
    mapPreviewSessionKey: 0,
    selectedEntityId: null,
    gameId: '',
    title: '',
    mapId: 'main',
    mapBackdropMediaId: null,
    mediaMaxFileBytes: DEFAULT_MEDIA_MAX_FILE_BYTES,
    mediaProjectSoftBudgetBytes: DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES,
    activeLayer: 'ground',
    mapToolKind: DEFAULT_MAP_TOOL_KIND,
    mapPlacementEntityId: null,
    entranceDraft: createDefaultEntranceDraft('main', 'ground'),
    spawnPointDraft: createDefaultSpawnPointDraft('main', 'ground'),
    selectedMapCellKey: null,
    selectedTileKeys: [],
    tileSelectionAnchorKey: null,
    mapEditorNotice: null,
    mapRenderEngine: DEFAULT_MAP_RENDER_ENGINE,
    enabledMapRenderEngines: [DEFAULT_MAP_RENDER_ENGINE],
    world: createDefaultWorld(),
    maps: [createDefaultMapEntry()],
    exportError: null,
    importError: null,
    autosaveEnabled: true,

    initializeProjects: async () => {
      try {
        const [appSettings, { snapshot, content, summaries }] = await Promise.all([
          readAppSettings(),
          loadInitialSnapshot(),
        ])
        applySnapshot(set, snapshot, content)
        set((state) => {
          state.autosaveEnabled = appSettings.autosaveEnabled
          state.projects = summaries
          state.lastSavedAt = summaries.find((p) => p.projectId === snapshot.projectId)?.updatedAt ?? null
          state.persistStatus = 'ready'
          state.persistError = null
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load projects'
        set((state) => {
          state.persistStatus = 'error'
          state.persistError = message
        })
      }
    },

    persistCurrentProject: async () => {
      const state = get()
      if (state.hydrating || !state.projectId) return
      if (state.persistStatus === 'booting' || state.persistStatus === 'saving') return

      set((draft) => {
        draft.persistStatus = 'saving'
        draft.persistError = null
      })

      try {
        const summary = await saveSnapshot(getSnapshot(get()), getProjectContent())
        set((draft) => {
          draft.persistStatus = 'ready'
          draft.isDirty = false
          draft.lastSavedAt = summary.updatedAt
          const index = draft.projects.findIndex((p) => p.projectId === summary.projectId)
          if (index >= 0) {
            draft.projects[index] = summary
          } else {
            draft.projects.unshift(summary)
          }
          draft.projects.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Autosave failed'
        set((draft) => {
          draft.persistStatus = 'error'
          draft.persistError = message
        })
      }
    },

    switchProject: async (projectId) => {
      if (projectId === get().projectId) return

      await get().persistCurrentProject()

      try {
        const { snapshot, content } = await loadSnapshot(projectId)
        const summaries = await fetchProjectSummaries()
        applySnapshot(set, snapshot, content)
        set((state) => {
          state.projects = summaries
          state.lastSavedAt =
            summaries.find((p) => p.projectId === snapshot.projectId)?.updatedAt ?? null
          state.persistStatus = 'ready'
          state.persistError = null
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to switch project'
        set((state) => {
          state.persistError = message
          state.persistStatus = 'error'
        })
      }
    },

    createProject: async () => {
      await get().persistCurrentProject()

      try {
        const { snapshot, content } = await createStoredProject()
        const summaries = await fetchProjectSummaries()
        applySnapshot(set, snapshot, content)
        set((state) => {
          state.projects = summaries
          state.lastSavedAt = summaries.find((p) => p.projectId === snapshot.projectId)?.updatedAt ?? null
          state.persistStatus = 'ready'
          state.persistError = null
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create project'
        set((state) => {
          state.persistError = message
          state.persistStatus = 'error'
        })
      }
    },

    deleteProject: async (projectId) => {
      const wasActive = projectId === get().projectId
      await removeStoredProject(projectId)
      let summaries = await fetchProjectSummaries()

      if (summaries.length === 0) {
        const { snapshot, content } = await createStoredProject()
        summaries = await fetchProjectSummaries()
        applySnapshot(set, snapshot, content)
        set((state) => {
          state.projects = summaries
          state.lastSavedAt = summaries[0]?.updatedAt ?? null
          state.persistStatus = 'ready'
          state.persistError = null
        })
        return
      }

      if (wasActive) {
        const next = summaries[0]!
        const { snapshot, content } = await loadSnapshot(next.projectId)
        applySnapshot(set, snapshot, content)
        set((state) => {
          state.projects = summaries
          state.lastSavedAt = next.updatedAt
          state.editorScreen = 'list'
          state.selectedEntityId = null
          state.persistStatus = 'ready'
          state.persistError = null
        })
        return
      }

      set((state) => {
        state.projects = summaries
      })
    },

    setActiveMode: (mode) => {
      set((state) => {
        state.activeMode = mode
        state.editorScreen = 'list'
        state.selectedEntityId = null
        if (!isCharacterSectionMode(mode)) {
          state.characterTypeTab = DEFAULT_CHARACTER_CATEGORY
        }
        if (mode !== 'attributes') {
          state.attributeSourceTab = 'standard'
        }
      })
    },

    setCharacterTypeTab: (tab) => {
      set((state) => {
        state.characterTypeTab = tab
      })
    },

    setItemSectionTab: (tab) => {
      set((state) => {
        state.itemSectionTab = tab
      })
    },

    setDialogSectionTab: (tab) => {
      set((state) => {
        state.dialogSectionTab = tab
      })
    },

    setQuestSectionTab: (tab) => {
      set((state) => {
        state.questSectionTab = tab
      })
    },

    setJournalSectionTab: (tab) => {
      set((state) => {
        state.journalSectionTab = tab
      })
    },

    setContainerSectionTab: (tab) => {
      set((state) => {
        state.containerSectionTab = tab
      })
    },

    setAttributeSourceTab: (tab) => {
      set((state) => {
        state.attributeSourceTab = tab
      })
    },

    openEntityEditor: (id) => {
      set((state) => {
        if (state.maps.some((map) => map.id === id) && id !== state.mapId) {
          flushActiveMapToCollection(state)
          activateMapById(state, id)
        }
        state.editorScreen = 'edit'
        state.selectedEntityId = id
      })
    },

    closeEntityEditor: () => {
      set((state) => {
        flushActiveMapToCollection(state)
        state.editorScreen = 'list'
        state.selectedEntityId = null
        state.mapPreviewOpen = false
      })
    },

    openMapPreview: () => {
      set((state) => {
        flushActiveMapToCollection(state)
        state.mapPreviewOpen = true
        state.mapPreviewSessionKey += 1
      })
    },

    closeMapPreview: () => {
      set((state) => {
        state.mapPreviewOpen = false
      })
    },

    setGameId: (gameId) => {
      set((state) => {
        state.gameId = gameId
      })
    },

    setTitle: (title) => {
      set((state) => {
        state.title = title
      })
    },

    setMapTitle: (title) => {
      set((state) => {
        const index = state.maps.findIndex((map) => map.id === state.mapId)
        if (index >= 0) {
          state.maps[index]!.title = title
        }
      })
    },

    addMap: () => {
      set((state) => {
        flushActiveMapToCollection(state)
        const id = createMapId()
        state.maps.push({
          id,
          title: `Map ${state.maps.length + 1}`,
          backdropMediaId: null,
          world: createDefaultWorld() as unknown as typeof state.maps[number]['world'],
        })
        activateMapById(state, id)
        state.editorScreen = 'edit'
        state.selectedEntityId = id
        state.isDirty = true
      })
    },

    setActiveLayer: (layer) => {
      set((state) => {
        state.activeLayer = layer
        if (state.selectedMapCellKey) {
          const cell = state.world.cells.get(state.selectedMapCellKey)
          if (!cell || cell.layer !== layer) {
            state.selectedMapCellKey = null
          }
        }
        state.selectedTileKeys = state.selectedTileKeys.filter((key) => key.endsWith(`,${layer}`))
        if (state.tileSelectionAnchorKey && !state.tileSelectionAnchorKey.endsWith(`,${layer}`)) {
          state.tileSelectionAnchorKey = null
        }
        if (state.entranceDraft.mapId === state.mapId) {
          state.entranceDraft = { ...state.entranceDraft, layer }
        }
        if (state.spawnPointDraft.entranceTarget.mapId === state.mapId) {
          state.spawnPointDraft = {
            ...state.spawnPointDraft,
            entranceTarget: { ...state.spawnPointDraft.entranceTarget, layer },
          }
        }
      })
    },

    setMapToolKind: (kind) => {
      set((state) => {
        state.mapToolKind = kind
        state.selectedMapCellKey = null
        state.selectedTileKeys = []
        state.tileSelectionAnchorKey = null
        if (kind !== 'entrance' && kind !== 'spawn-point') {
          state.mapPlacementEntityId = null
        }
        if (kind === 'spawn-point') {
          state.mapPlacementEntityId = null
        }
      })
    },

    setMapPlacementEntityId: (entityId) => {
      set((state) => {
        state.mapPlacementEntityId = entityId
        state.mapEditorNotice = null
        if (!entityId) {
          state.selectedMapCellKey = null
          return
        }
        if (state.mapToolKind === 'character') {
          const category = getCharacterCategory(entityId)
          if (isUniqueNpcCharacter(category)) {
            const placement = findCharacterGridPlacement(state.world, entityId)
            if (placement) {
              state.mapToolKind = 'select'
              state.selectedMapCellKey = placement.key
              if (state.world.layers.includes(placement.cell.layer)) {
                state.activeLayer = placement.cell.layer
              }
              return
            }
          }
        }
        state.selectedMapCellKey = null
      })
    },

    setEntranceDraft: (draft) => {
      set((state) => {
        state.entranceDraft = draft
      })
    },

    setSpawnPointDraft: (draft) => {
      set((state) => {
        state.spawnPointDraft = draft
      })
    },

    clearSelectedMapCell: () => {
      get().clearMapSelection()
    },

    clearMapSelection: () => {
      set((state) => {
        state.selectedMapCellKey = null
        state.selectedTileKeys = []
        state.tileSelectionAnchorKey = null
        state.mapEditorNotice = null
      })
    },

    clearMapEditorNotice: () => {
      set((state) => {
        state.mapEditorNotice = null
      })
    },

    removeCharacterGridPlacement: (characterId) => {
      let removed = false
      set((state) => {
        const placement = findCharacterGridPlacement(state.world, characterId)
        if (!placement) return
        state.world.cells.delete(placement.key)
        if (state.selectedMapCellKey === placement.key) {
          state.selectedMapCellKey = null
        }
        removed = true
      })
      if (removed) {
        syncUniqueCharacterActiveLocation(characterId, null)
        get().markDirty()
      }
    },

    removeSelectedMapCell: () => {
      let removed = false
      let characterId: string | null = null
      set((state) => {
        if (!state.selectedMapCellKey) return
        const cell = state.world.cells.get(state.selectedMapCellKey)
        if (!cell) {
          state.selectedMapCellKey = null
          return
        }
        if (getCellContentKind(cell) === 'character') {
          characterId = getCellEntityId(cell)
        }
        state.world.cells.delete(state.selectedMapCellKey)
        state.selectedMapCellKey = null
        removed = true
      })
      if (removed) {
        if (characterId) {
          syncUniqueCharacterActiveLocation(characterId, null)
        }
        get().markDirty()
      }
    },

    updateSelectedCellEntranceTarget: (target) => {
      let updated = false
      set((state) => {
        if (!state.selectedMapCellKey) return
        const cell = state.world.cells.get(state.selectedMapCellKey)
        if (!cell || !cell.contentId.startsWith('entrance:')) return
        cell.entranceTarget = { ...target }
        updated = true
      })
      if (updated) get().markDirty()
    },

    setMapBackdropMediaId: (mediaId) => {
      set((state) => {
        state.mapBackdropMediaId = mediaId
        const index = state.maps.findIndex((map) => map.id === state.mapId)
        if (index >= 0) {
          state.maps[index]!.backdropMediaId = mediaId
        }
      })
    },

    setMediaMaxFileBytes: (bytes) => {
      set((state) => {
        state.mediaMaxFileBytes = bytes
      })
    },

    setMediaProjectSoftBudgetBytes: (bytes) => {
      set((state) => {
        state.mediaProjectSoftBudgetBytes = bytes
      })
    },

    moveWorldLayer: (layer, direction) => {
      let moved = false
      set((state) => {
        const index = state.world.layers.indexOf(layer)
        if (index < 0) return
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= state.world.layers.length) return
        const nextLayers = [...state.world.layers]
        const [entry] = nextLayers.splice(index, 1)
        nextLayers.splice(targetIndex, 0, entry!)
        state.world.layers = nextLayers
        moved = true
      })
      if (moved) get().markDirty()
      return moved
    },

    setWorldDimensions: (width, height, options) => {
      set((state) => {
        const { width: nextWidth, height: nextHeight } = clampWorldDimensions(width, height)
        state.world.width = nextWidth
        state.world.height = nextHeight
        if (options?.pruneOutOfBounds === false) return
        for (const [key, cell] of [...state.world.cells.entries()]) {
          if (cell.x >= nextWidth || cell.y >= nextHeight) {
            state.world.cells.delete(key)
          }
        }
        for (const [key, tile] of [...state.world.tiles.entries()]) {
          if (tile.x >= nextWidth || tile.y >= nextHeight) {
            state.world.tiles.delete(key)
          }
        }
      })
    },

    addWorldLayer: (name) => {
      const normalized = normalizeLayerName(name)
      if (!isValidLayerName(normalized)) return false

      let added = false
      set((state) => {
        if (state.world.layers.length >= MAX_LAYER_COUNT) return
        if (layerNameTaken(state.world.layers, normalized)) return
        state.world.layers = [...state.world.layers, normalized]
        state.activeLayer = normalized
        added = true
      })
      if (added) get().markDirty()
      return added
    },

    renameWorldLayer: (fromLayer, toLayer) => {
      const nextName = normalizeLayerName(toLayer)
      if (!isValidLayerName(nextName)) return false
      if (fromLayer === nextName) return true

      let renamed = false
      set((state) => {
        const index = state.world.layers.indexOf(fromLayer)
        if (index < 0) return
        if (layerNameTaken(state.world.layers, nextName, fromLayer)) return

        const nextLayers = [...state.world.layers]
        nextLayers[index] = nextName
        state.world.layers = nextLayers

        for (const cell of state.world.cells.values()) {
          if (cell.layer === fromLayer) {
            cell.layer = nextName
          }
        }

        if (state.activeLayer === fromLayer) {
          state.activeLayer = nextName
        }
        renamed = true
      })
      if (renamed) get().markDirty()
      return renamed
    },

    removeWorldLayer: (layer) => {
      let removed = false
      set((state) => {
        if (state.world.layers.length <= 1) return
        const index = state.world.layers.indexOf(layer)
        if (index < 0) return

        state.world.layers = state.world.layers.filter((entry) => entry !== layer)
        for (const [key, cell] of [...state.world.cells.entries()]) {
          if (cell.layer === layer) {
            state.world.cells.delete(key)
          }
        }
        for (const [key, tile] of [...state.world.tiles.entries()]) {
          if (tile.layer === layer) {
            state.world.tiles.delete(key)
          }
        }
        state.selectedTileKeys = state.selectedTileKeys.filter((key) => !key.endsWith(`,${layer}`))
        if (state.activeLayer === layer) {
          state.activeLayer = state.world.layers[0] ?? state.activeLayer
        }
        removed = true
      })
      if (removed) get().markDirty()
      return removed
    },

    applyMapGridClick: (x, y, layer, modifiers = { ctrlKey: false, shiftKey: false }) => {
      let dirty = false
      let syncCharacterId: string | null = null
      let syncLocation: MapCellReference | null = null
      let shouldSync = false

      set((state) => {
        if (layer !== state.activeLayer) return
        state.mapEditorNotice = null

        const key = cellKey(x, y, layer)

        if (state.mapToolKind === 'cell-status') {
          if (modifiers.shiftKey && state.tileSelectionAnchorKey) {
            const rectKeys = rectangleTileKeys(state.tileSelectionAnchorKey, key)
            if (modifiers.ctrlKey) {
              const merged = new Set([...state.selectedTileKeys, ...rectKeys])
              state.selectedTileKeys = [...merged]
            } else {
              state.selectedTileKeys = rectKeys
            }
          } else if (modifiers.ctrlKey) {
            if (state.selectedTileKeys.includes(key)) {
              state.selectedTileKeys = state.selectedTileKeys.filter((entry) => entry !== key)
            } else {
              state.selectedTileKeys = [...state.selectedTileKeys, key]
            }
            state.tileSelectionAnchorKey = key
          } else {
            state.selectedTileKeys = [key]
            state.tileSelectionAnchorKey = key
            state.selectedMapCellKey = null
          }
          return
        }

        const existing = state.world.cells.get(key)

        if (state.mapToolKind === 'select') {
          if (state.selectedMapCellKey && state.selectedMapCellKey !== key && !existing) {
            const selectedCell = state.world.cells.get(state.selectedMapCellKey)
            if (selectedCell) {
              const nextKey = moveCellInWorld(state.world, state.selectedMapCellKey, x, y, layer)
              if (nextKey) {
                state.selectedMapCellKey = null
                dirty = true
                if (getCellContentKind(selectedCell) === 'character') {
                  const characterId = getCellEntityId(selectedCell)
                  if (isUniqueNpcCharacter(getCharacterCategory(characterId))) {
                    syncCharacterId = characterId
                    syncLocation = toActiveLocationFromCell(state.mapId, { x, y, layer })
                    shouldSync = true
                  }
                }
              }
              return
            }
          }

          if (existing) {
            state.selectedMapCellKey = key
            state.selectedTileKeys = []
            state.tileSelectionAnchorKey = null
            return
          }

          state.selectedMapCellKey = null
          return
        }

        if (existing) {
          return
        }

        if (state.mapToolKind === 'entrance') {
          state.selectedMapCellKey = null
          state.world.cells.set(key, {
            x,
            y,
            layer,
            contentId: createEntranceContentId(),
            entranceTarget: { ...state.entranceDraft },
          })
          dirty = true
          return
        }

        if (state.mapToolKind === 'spawn-point') {
          const draft = state.spawnPointDraft
          if (!spawnPointDraftIsReady(draft)) {
            state.mapEditorNotice = 'Select an entity and optional spawn conditions before placing.'
            return
          }
          state.selectedMapCellKey = null
          const entityId =
            draft.entityKind === 'entrance'
              ? createEntranceContentId().split(':')[1] ?? crypto.randomUUID().slice(0, 8)
              : draft.entityId!
          state.world.cells.set(key, {
            x,
            y,
            layer,
            contentId: createSpawnPointContentId(),
            spawnPoint: {
              entityKind: draft.entityKind,
              entityId,
              ...(draft.entityKind === 'entrance'
                ? { entranceTarget: { ...draft.entranceTarget } }
                : {}),
              conditions:
                draft.conditions.children.length > 0 ? structuredClone(draft.conditions) : null,
            },
          })
          dirty = true
          return
        }

        if (state.mapToolKind === 'event') {
          state.selectedMapCellKey = null
          state.world.cells.set(key, {
            x,
            y,
            layer,
            contentId: createEventContentId(),
          })
          dirty = true
          return
        }

        const entityId = state.mapPlacementEntityId
        if (!entityId) {
          state.selectedMapCellKey = null
          return
        }

        if (state.mapToolKind === 'character') {
          const category = getCharacterCategory(entityId)
          if (
            !canAddUniqueCharacterFixedPlacement(
              state.world,
              entityId,
              category,
              state.selectedMapCellKey,
            )
          ) {
            state.mapEditorNotice =
              'Unique characters can only have one fixed placement on this map. Add conditional spawn locations for other appearances, or select the existing placement to move it.'
            return
          }
        }

        state.world.cells.set(key, {
          x,
          y,
          layer,
          contentId: buildContentId(state.mapToolKind, entityId),
        })
        dirty = true

        if (state.mapToolKind === 'character' && isUniqueNpcCharacter(getCharacterCategory(entityId))) {
          syncCharacterId = entityId
          syncLocation = toActiveLocationFromCell(state.mapId, { x, y, layer })
          shouldSync = true
        }
      })

      if (shouldSync && syncCharacterId) {
        syncUniqueCharacterActiveLocation(syncCharacterId, syncLocation)
      }
      if (dirty) get().markDirty()
    },

    setSelectedTilesPassable: (passable) => {
      set((state) => {
        if (state.selectedTileKeys.length === 0) return
        setTilePassable(state.world, state.selectedTileKeys, passable)
      })
      get().markDirty()
    },

    applyTileBackgroundColor: (color) => {
      set((state) => {
        if (state.selectedTileKeys.length === 0) return
        applyTileDecoration(state.world, state.selectedTileKeys, { backgroundColor: color })
      })
      get().markDirty()
    },

    applyTileBackgroundIcon: (iconId) => {
      set((state) => {
        if (state.selectedTileKeys.length === 0) return
        applyTileDecoration(state.world, state.selectedTileKeys, { backgroundIconId: iconId })
      })
      get().markDirty()
    },

    setMapRenderEngine: (engine) => {
      if (!isMapRenderEngine(engine)) return
      set((state) => {
        state.mapRenderEngine = engine
      })
      get().markDirty()
    },

    setEnabledMapRenderEngines: (engines) => {
      const normalized = engines.filter(isMapRenderEngine)
      if (normalized.length === 0) return
      set((state) => {
        state.enabledMapRenderEngines = normalized
        if (!normalized.includes(state.mapRenderEngine)) {
          state.mapRenderEngine = normalized[0]!
        }
      })
      get().markDirty()
    },

    buildDocument: () => snapshotToDocument(getSnapshot(get())),

    exportOtterfile: async () => {
      set((state) => {
        state.exportError = null
      })

      try {
        await get().persistCurrentProject()
        const packed = await packOtterfile(get().buildDocument())
        return packed.bytes
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Export failed'
        set((state) => {
          state.exportError = message
        })
        throw error
      }
    },

    importOtterfileIntoCurrent: async (bytes) => {
      set((state) => {
        state.importError = null
      })

      try {
        const content = await contentFromBytes(bytes)
        set((state) => {
          state.hydrating = true
          state.gameId = content.gameId
          state.title = content.title
          state.mapId = content.mapId
          state.activeLayer = content.activeLayer
          state.mapToolKind = content.mapToolKind
          state.mapPlacementEntityId = content.mapPlacementEntityId
          state.activeMode = content.activeMode
          state.mapBackdropMediaId = content.mapBackdropMediaId
          state.maps = content.maps.map((entry) => ({
            id: entry.id,
            title: entry.title,
            backdropMediaId: entry.backdropMediaId,
            world: cloneWorld(entry.world) as unknown as typeof state.maps[number]['world'],
          }))
          assignWorld(state, content.world)
          state.entranceDraft = createDefaultEntranceDraft(content.mapId, content.activeLayer)
          state.spawnPointDraft = createDefaultSpawnPointDraft(content.mapId, content.activeLayer)
          state.selectedMapCellKey = null
          state.selectedTileKeys = []
          state.tileSelectionAnchorKey = null
          state.hydrating = false
        })
        await get().persistCurrentProject()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Import failed'
        set((state) => {
          state.importError = message
        })
        throw error
      }
    },

    importOtterfileAsNew: async (bytes) => {
      set((state) => {
        state.importError = null
      })

      try {
        await get().persistCurrentProject()
        const { snapshot, content } = await importBytesAsNewProject(bytes)
        const summaries = await fetchProjectSummaries()
        applySnapshot(set, snapshot, content)
        set((state) => {
          state.projects = summaries
          state.lastSavedAt = summaries.find((p) => p.projectId === snapshot.projectId)?.updatedAt ?? null
          state.persistStatus = 'ready'
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Import failed'
        set((state) => {
          state.importError = message
        })
        throw error
      }
    },

    clearErrors: () => {
      set((state) => {
        state.exportError = null
        state.importError = null
        state.persistError = null
      })
    },

    markDirty: () => {
      set((state) => {
        if (state.hydrating || state.persistStatus === 'booting') return
        state.isDirty = true
      })
    },

    markSaved: () => {
      set((state) => {
        state.isDirty = false
      })
    },

    setAutosaveEnabled: async (enabled) => {
      set((state) => {
        state.autosaveEnabled = enabled
      })
      await writeAppSettings({ autosaveEnabled: enabled })
    },
  })),
)
