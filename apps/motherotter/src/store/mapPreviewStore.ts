import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { PreviewPan } from '../admin/mapPreviewViewportUtils'
import type { PreviewPosition } from '../admin/mapPreviewUtils'

export type PreviewTerminalKind = 'system' | 'dialog' | 'action' | 'combat'

export interface PreviewTerminalLine {
  id: string
  kind: PreviewTerminalKind
  text: string
  timestamp: string
}

interface MapPreviewState {
  initializedForMapId: string | null
  currentMapId: string | null
  currentActiveLayer: string | null
  positions: Record<string, PreviewPosition>
  selectedCharacterId: string | null
  placingDummy: boolean
  paused: boolean
  movementBudgetByCharacterId: Record<string, number>
  walkPath: PreviewPosition[]
  walkingCharacterId: string | null
  viewportPan: PreviewPan
  viewportFollowCharacter: boolean
  viewportSize: { width: number; height: number }
  /** Minutes elapsed since the current preview run started. */
  elapsedGameMinutes: number
  roundNumber: number
  roundElapsedMs: number
  terminalExpanded: boolean
  terminalLines: PreviewTerminalLine[]
  lastInteraction: string | null
  resetForMap: (mapId: string) => void
  setPreviewMap: (mapId: string, activeLayer: string) => void
  setPositions: (positions: Record<string, PreviewPosition>) => void
  setPosition: (characterId: string, position: PreviewPosition) => void
  setSelectedCharacterId: (characterId: string | null) => void
  setPlacingDummy: (placingDummy: boolean) => void
  togglePaused: () => void
  setMovementBudgets: (budgets: Record<string, number>) => void
  consumeMovement: (characterId: string, amount?: number) => boolean
  setWalkPath: (characterId: string, path: PreviewPosition[]) => void
  clearWalkPath: () => void
  advanceWalkStep: () => boolean
  setViewportPan: (pan: PreviewPan) => void
  panViewportBy: (dx: number, dy: number) => void
  setViewportFollowCharacter: (enabled: boolean) => void
  setViewportSize: (size: { width: number; height: number }) => void
  appendTerminalLine: (kind: PreviewTerminalKind, text: string) => void
  setTerminalExpanded: (expanded: boolean) => void
  tickRound: (gameMinutesPerRound: number) => void
  advanceElapsedGameMinutes: (minutes: number) => void
  setElapsedGameMinutes: (minutes: number) => void
  setRoundElapsedMs: (ms: number) => void
  setLastInteraction: (text: string | null) => void
}

function createTerminalLine(kind: PreviewTerminalKind, text: string): PreviewTerminalLine {
  return {
    id: `term-${crypto.randomUUID().slice(0, 8)}`,
    kind,
    text,
    timestamp: new Date().toISOString(),
  }
}

export const useMapPreviewStore = create<MapPreviewState>()(
  immer((set, get) => ({
    initializedForMapId: null,
    currentMapId: null,
    currentActiveLayer: null,
    positions: {},
    selectedCharacterId: null,
    placingDummy: false,
    paused: false,
    movementBudgetByCharacterId: {},
    walkPath: [],
    walkingCharacterId: null,
    viewportPan: { x: 0, y: 0 },
    viewportFollowCharacter: true,
    viewportSize: { width: 0, height: 0 },
    elapsedGameMinutes: 0,
    roundNumber: 1,
    roundElapsedMs: 0,
    terminalExpanded: true,
    terminalLines: [],
    lastInteraction: null,

    resetForMap: (mapId) => {
      set((state) => {
        state.initializedForMapId = mapId
        state.currentMapId = mapId
        state.currentActiveLayer = null
        state.positions = {}
        state.selectedCharacterId = null
        state.placingDummy = false
        state.paused = false
        state.movementBudgetByCharacterId = {}
        state.walkPath = []
        state.walkingCharacterId = null
        state.viewportPan = { x: 0, y: 0 }
        state.viewportFollowCharacter = true
        state.elapsedGameMinutes = 0
        state.roundNumber = 1
        state.roundElapsedMs = 0
        state.terminalExpanded = true
        state.terminalLines = [
          createTerminalLine(
            'system',
            'Preview mode — click cells to walk, use WASD/arrows to move, Space to pause.',
          ),
        ]
        state.lastInteraction = null
      })
    },

    setPreviewMap: (mapId, activeLayer) => {
      set((state) => {
        state.currentMapId = mapId
        state.currentActiveLayer = activeLayer
        state.walkPath = []
        state.walkingCharacterId = null
      })
    },

    setPositions: (positions) => {
      set((state) => {
        state.positions = positions
      })
    },

    setPosition: (characterId, position) => {
      set((state) => {
        state.positions[characterId] = position
      })
    },

    setSelectedCharacterId: (characterId) => {
      set((state) => {
        state.selectedCharacterId = characterId
      })
    },

    setPlacingDummy: (placingDummy) => {
      set((state) => {
        state.placingDummy = placingDummy
      })
    },

    togglePaused: () => {
      set((state) => {
        state.paused = !state.paused
      })
    },

    setMovementBudgets: (budgets) => {
      set((state) => {
        state.movementBudgetByCharacterId = budgets
      })
    },

    consumeMovement: (characterId, amount = 1) => {
      const budget = get().movementBudgetByCharacterId[characterId] ?? 0
      if (budget < amount) return false
      set((state) => {
        state.movementBudgetByCharacterId[characterId] = budget - amount
      })
      return true
    },

    setWalkPath: (characterId, path) => {
      set((state) => {
        state.walkingCharacterId = characterId
        state.walkPath = path
      })
    },

    clearWalkPath: () => {
      set((state) => {
        state.walkPath = []
        state.walkingCharacterId = null
      })
    },

    advanceWalkStep: () => {
      const state = get()
      if (state.walkPath.length === 0 || !state.walkingCharacterId) return false

      const characterId = state.walkingCharacterId
      if (!get().consumeMovement(characterId, 1)) {
        set((draft) => {
          draft.walkPath = []
          draft.walkingCharacterId = null
        })
        return false
      }

      const next = state.walkPath[0]
      set((draft) => {
        draft.positions[characterId] = next
        draft.walkPath = draft.walkPath.slice(1)
        if (draft.walkPath.length === 0) {
          draft.walkingCharacterId = null
        }
      })
      return true
    },

    setViewportPan: (pan) => {
      set((state) => {
        state.viewportPan = pan
      })
    },

    panViewportBy: (dx, dy) => {
      set((state) => {
        state.viewportPan = {
          x: state.viewportPan.x + dx,
          y: state.viewportPan.y + dy,
        }
      })
    },

    setViewportFollowCharacter: (enabled) => {
      set((state) => {
        state.viewportFollowCharacter = enabled
      })
    },

    setViewportSize: (size) => {
      set((state) => {
        state.viewportSize = size
      })
    },

    appendTerminalLine: (kind, text) => {
      set((state) => {
        state.terminalLines.push(createTerminalLine(kind, text))
        if (state.terminalLines.length > 120) {
          state.terminalLines = state.terminalLines.slice(-120)
        }
      })
    },

    setTerminalExpanded: (expanded) => {
      set((state) => {
        state.terminalExpanded = expanded
      })
    },

    tickRound: (gameMinutesPerRound) => {
      set((state) => {
        state.roundNumber += 1
        state.roundElapsedMs = 0
        state.elapsedGameMinutes += gameMinutesPerRound
        state.terminalLines.push(
          createTerminalLine('system', `Round ${state.roundNumber} · +${gameMinutesPerRound} game minutes`),
        )
      })
    },

    advanceElapsedGameMinutes: (minutes) => {
      if (minutes <= 0) return
      set((state) => {
        state.elapsedGameMinutes += Math.floor(minutes)
      })
    },

    setElapsedGameMinutes: (minutes) => {
      set((state) => {
        state.elapsedGameMinutes = Math.max(0, Math.floor(minutes))
      })
    },

    setRoundElapsedMs: (ms) => {
      set((state) => {
        state.roundElapsedMs = ms
      })
    },

    setLastInteraction: (text) => {
      set((state) => {
        state.lastInteraction = text
      })
    },
  })),
)
