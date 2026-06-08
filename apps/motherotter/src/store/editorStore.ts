import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { cellKey, type WorldModel } from '@otter/game-state'
import { packOtterfile, type OtterfileDocument } from '@otter/otterfile-core'
import type { CharacterCategory } from '../admin/characterTypes'
import { DEFAULT_CHARACTER_CATEGORY } from '../admin/characterTypes'
import type { EditorMode } from '../editorModes'
import type { EditorScreen } from '../admin/types'
import { DEFAULT_EDITOR_TOOL, type EditorTool } from '../editorTools'
import type { ProjectSummary } from '../lib/projectRecord'
import { applyProjectContent, getProjectContent } from '../lib/projectContent'
import { readAppSettings, writeAppSettings } from '../lib/db'
import {
  cloneWorld,
  contentFromBytes,
  createDefaultWorld,
  createStoredProject,
  fetchProjectSummaries,
  importBytesAsNewProject,
  loadInitialSnapshot,
  loadSnapshot,
  removeStoredProject,
  saveSnapshot,
  snapshotToDocument,
  type EditorSnapshot,
} from '../lib/projectRepository'

export { PLACEMENT_TOOLS, type EditorTool } from '../editorTools'

export type PersistStatus = 'booting' | 'ready' | 'saving' | 'error'

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
  editorScreen: EditorScreen
  selectedEntityId: string | null
  gameId: string
  title: string
  mapId: string
  activeLayer: string
  selectedTool: EditorTool
  world: WorldModel
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
  openEntityEditor: (id: string) => void
  closeEntityEditor: () => void
  setGameId: (gameId: string) => void
  setTitle: (title: string) => void
  setActiveLayer: (layer: string) => void
  setSelectedTool: (tool: EditorTool) => void
  applyCellClick: (x: number, y: number, layer: string) => void
  buildDocument: () => OtterfileDocument
  exportOtterfile: () => Promise<Uint8Array>
  importOtterfileIntoCurrent: (bytes: Uint8Array) => Promise<void>
  importOtterfileAsNew: (bytes: Uint8Array) => Promise<void>
  setAutosaveEnabled: (enabled: boolean) => Promise<void>
  clearErrors: () => void
  markDirty: () => void
  markSaved: () => void
}

function getSnapshot(state: EditorState): EditorSnapshot {
  return {
    projectId: state.projectId,
    gameId: state.gameId,
    title: state.title,
    mapId: state.mapId,
    activeLayer: state.activeLayer,
    selectedTool: state.selectedTool,
    activeMode: state.activeMode,
    world: state.world,
  }
}

function assignWorld(state: EditorState, world: WorldModel) {
  state.world = cloneWorld(world)
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
    state.activeLayer = snapshot.activeLayer
    state.selectedTool = snapshot.selectedTool
    state.activeMode = snapshot.activeMode
    assignWorld(state, snapshot.world)
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
    editorScreen: 'list',
    selectedEntityId: null,
    gameId: '',
    title: '',
    mapId: 'main',
    activeLayer: 'ground',
    selectedTool: DEFAULT_EDITOR_TOOL,
    world: createDefaultWorld(),
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
        if (mode !== 'characters') {
          state.characterTypeTab = DEFAULT_CHARACTER_CATEGORY
        }
      })
    },

    setCharacterTypeTab: (tab) => {
      set((state) => {
        state.characterTypeTab = tab
      })
    },

    openEntityEditor: (id) => {
      set((state) => {
        state.editorScreen = 'edit'
        state.selectedEntityId = id
      })
    },

    closeEntityEditor: () => {
      set((state) => {
        state.editorScreen = 'list'
        state.selectedEntityId = null
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

    setActiveLayer: (layer) => {
      set((state) => {
        state.activeLayer = layer
      })
    },

    setSelectedTool: (tool) => {
      set((state) => {
        state.selectedTool = tool
      })
    },

    applyCellClick: (x, y, layer) => {
      set((state) => {
        if (layer !== state.activeLayer) return

        const key = cellKey(x, y, layer)
        if (state.selectedTool === 'erase') {
          state.world.cells.delete(key)
          return
        }

        state.world.cells.set(key, {
          x,
          y,
          layer,
          contentId: state.selectedTool,
        })
      })
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
          state.selectedTool = content.selectedTool
          state.activeMode = content.activeMode
          assignWorld(state, content.world)
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
