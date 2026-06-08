import type { WorldModel } from '@otter/game-state'
import type { WorldView } from './renderer.js'

/** Build a renderer-facing snapshot from headless world state. */
export function toWorldView(world: WorldModel, activeLayer: string): WorldView {
  if (!world.layers.includes(activeLayer)) {
    throw new Error(`Unknown layer "${activeLayer}"`)
  }

  return {
    width: world.width,
    height: world.height,
    layers: world.layers,
    cells: [...world.cells.values()],
    activeLayer,
  }
}
