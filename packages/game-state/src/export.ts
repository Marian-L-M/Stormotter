import type { OtterMap } from '@otter/otterfile-core'
import type { WorldModel } from './world.js'

/** Serialize a runtime world back into otterfile map JSON shape. */
export function mapFromWorld(mapId: string, world: WorldModel): OtterMap {
  const cells = [...world.cells.values()]
    .map((cell) => ({
      x: cell.x,
      y: cell.y,
      layer: cell.layer,
      contentId: cell.contentId,
    }))
    .sort((a, b) => {
      if (a.layer !== b.layer) return a.layer.localeCompare(b.layer)
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })

  return {
    id: mapId,
    width: world.width,
    height: world.height,
    layers: [...world.layers],
    cells,
  }
}

/** Stable round-trip key for comparing sparse cells. */
export function serializeCellKey(cell: {
  x: number
  y: number
  layer: string
  contentId: string
}): string {
  return `${cell.layer}:${cell.x},${cell.y}=${cell.contentId}`
}
