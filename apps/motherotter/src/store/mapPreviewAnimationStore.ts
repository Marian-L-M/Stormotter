import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  MapPreviewAnimationPlaybackRequest,
  MapPreviewAnimationSprite,
} from '../admin/mapPreviewAnimationTypes'

interface MapPreviewAnimationState {
  sprites: MapPreviewAnimationSprite[]
  isPlaying: boolean
  activeRequestId: string | null
  setSprites: (sprites: MapPreviewAnimationSprite[]) => void
  setPlaying: (playing: boolean, requestId?: string | null) => void
  clearSprites: () => void
}

export const useMapPreviewAnimationStore = create<MapPreviewAnimationState>()(
  immer((set) => ({
    sprites: [],
    isPlaying: false,
    activeRequestId: null,

    setSprites: (sprites) => {
      set((state) => {
        state.sprites = sprites
      })
    },

    setPlaying: (playing, requestId = null) => {
      set((state) => {
        state.isPlaying = playing
        state.activeRequestId = requestId
        if (!playing) {
          state.sprites = []
        }
      })
    },

    clearSprites: () => {
      set((state) => {
        state.sprites = []
      })
    },
  })),
)

export type { MapPreviewAnimationPlaybackRequest, MapPreviewAnimationSprite }
