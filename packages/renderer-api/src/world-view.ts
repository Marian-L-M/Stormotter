import type { WorldModel } from '@otter/game-state'
import type { CellEntityAppearance, IconLibraryMap, WorldView } from './renderer.js'

export interface ToWorldViewOptions {
  activeLayer: string
  selectedCell?: { x: number; y: number } | null
  selectedCells?: readonly { x: number; y: number }[]
  iconLibrary?: IconLibraryMap
  entityAppearances?: Record<string, CellEntityAppearance>
  hideEntityAt?: { x: number; y: number } | null
}

/** Build a renderer-facing snapshot from headless world state. */
export function toWorldView(world: WorldModel, options: ToWorldViewOptions): WorldView
/** @deprecated Pass an options object as the second argument. */
export function toWorldView(
  world: WorldModel,
  activeLayer: string,
  selectedCell?: { x: number; y: number } | null,
): WorldView
export function toWorldView(
  world: WorldModel,
  activeLayerOrOptions: string | ToWorldViewOptions,
  selectedCell?: { x: number; y: number } | null,
): WorldView {
  const options: ToWorldViewOptions =
    typeof activeLayerOrOptions === 'string'
      ? { activeLayer: activeLayerOrOptions, selectedCell }
      : activeLayerOrOptions

  const { activeLayer } = options
  if (!world.layers.includes(activeLayer)) {
    throw new Error(`Unknown layer "${activeLayer}"`)
  }

  return {
    width: world.width,
    height: world.height,
    layers: world.layers,
    cells: [...world.cells.values()],
    tiles: [...world.tiles.values()],
    activeLayer,
    selectedCell: options.selectedCell ?? null,
    selectedCells: options.selectedCells ?? [],
    iconLibrary: options.iconLibrary,
    entityAppearances: options.entityAppearances,
    hideEntityAt: options.hideEntityAt ?? null,
  }
}
