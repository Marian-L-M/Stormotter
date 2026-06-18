import type { DeOttererIconSnapshot } from '@otter/renderer-api'
import type { IconStyle } from './animationTypes'

export interface MapPreviewAnimationSprite {
  id: string
  x: number
  y: number
  icon: IconStyle
  iconSnapshot: DeOttererIconSnapshot
}

export interface MapPreviewAnimationPlaybackRequest {
  requestId: string
  definitionId: string
  startedAtMs: number
}
