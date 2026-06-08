import type { Cell } from '@otter/game-state'

/** Read-only snapshot consumed by renderers. Never mutate game state from here. */
export interface WorldView {
  width: number
  height: number
  layers: readonly string[]
  cells: readonly Cell[]
  activeLayer: string
}

export type InputIntent = {
  type: 'cellClicked'
  x: number
  y: number
  layer: string
}

export type Unsubscribe = () => void

/** Swappable renderer contract — demo and R3F implement the same interface. */
export interface Renderer {
  mount(container: HTMLElement): void
  render(worldView: WorldView): void
  dispose(): void
  onIntent(callback: (intent: InputIntent) => void): Unsubscribe
}
