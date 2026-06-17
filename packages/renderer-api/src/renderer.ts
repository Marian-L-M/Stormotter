import type { Cell, MapTile } from '@otter/game-state'

/** Minimal SVG icon definition for tile background decoration. */
export interface DeOttererIconSnapshot {
  viewBox: string
  paths: string[]
  fill: string
  stroke: string
  strokeWidth: number
}

export type IconLibraryMap = Record<string, DeOttererIconSnapshot>

/** Resolved grid appearance for a placed entity cell. */
export interface CellEntityAppearance {
  glyph: string | null
  icon: DeOttererIconSnapshot | null
}

/** Read-only snapshot consumed by renderers. Never mutate game state from here. */
export interface WorldView {
  width: number
  height: number
  layers: readonly string[]
  cells: readonly Cell[]
  tiles: readonly MapTile[]
  activeLayer: string
  selectedCell?: { x: number; y: number } | null
  selectedCells?: readonly { x: number; y: number }[]
  iconLibrary?: IconLibraryMap
  entityAppearances?: Record<string, CellEntityAppearance>
  /** Hide the entity drawn at this cell (used while moving selection). */
  hideEntityAt?: { x: number; y: number } | null
}

export type InputIntent = {
  type: 'cellClicked'
  x: number
  y: number
  layer: string
  ctrlKey: boolean
  shiftKey: boolean
}

export type Unsubscribe = () => void

/** Swappable renderer contract — demo and R3F implement the same interface. */
export interface Renderer {
  mount(container: HTMLElement): void
  render(worldView: WorldView): void
  dispose(): void
  onIntent(callback: (intent: InputIntent) => void): Unsubscribe
}
