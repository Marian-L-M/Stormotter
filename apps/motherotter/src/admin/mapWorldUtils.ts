import type { WorldModel } from '@otter/game-state'

const MIN_WORLD_DIMENSION = 1
const MAX_WORLD_DIMENSION = 256

export function clampWorldDimensions(
  width: number,
  height: number,
): { width: number; height: number } {
  return {
    width: Math.max(MIN_WORLD_DIMENSION, Math.min(MAX_WORLD_DIMENSION, Math.round(width))),
    height: Math.max(MIN_WORLD_DIMENSION, Math.min(MAX_WORLD_DIMENSION, Math.round(height))),
  }
}

export function countCellsOutsideBounds(
  world: WorldModel,
  width: number,
  height: number,
): number {
  let count = 0
  for (const cell of world.cells.values()) {
    if (cell.x >= width || cell.y >= height) count++
  }
  return count
}

export function cellsOutsideBounds(
  world: WorldModel,
  width: number,
  height: number,
): Array<{ x: number; y: number; layer: string; contentId: string }> {
  const result: Array<{ x: number; y: number; layer: string; contentId: string }> = []
  for (const cell of world.cells.values()) {
    if (cell.x >= width || cell.y >= height) {
      result.push(cell)
    }
  }
  return result.sort((a, b) => a.y - b.y || a.x - b.x || a.layer.localeCompare(b.layer))
}

export { formatCellCoordinate } from './mapLayerUtils'
