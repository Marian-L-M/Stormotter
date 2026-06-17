import { MAX_LAYER_COUNT } from '@otter/otterfile-core'
import type { WorldModel } from '@otter/game-state'

export { MAX_LAYER_COUNT }

export function formatCellCoordinate(x: number, y: number): string {
  return `x${x + 1}, y${y + 1}`
}

export function normalizeLayerName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, 64)
}

export function isValidLayerName(name: string): boolean {
  const normalized = normalizeLayerName(name)
  return normalized.length > 0 && normalized.length <= 64
}

export function suggestLayerName(existingLayers: readonly string[]): string {
  const used = new Set(existingLayers.map((layer) => layer.toLowerCase()))
  for (let index = existingLayers.length + 1; index <= MAX_LAYER_COUNT + 1; index++) {
    const candidate = `Layer ${index}`
    if (!used.has(candidate.toLowerCase())) return candidate
  }
  return `Layer ${Date.now()}`
}

export function countCellsOnLayer(world: WorldModel, layer: string): number {
  let count = 0
  for (const cell of world.cells.values()) {
    if (cell.layer === layer) count++
  }
  return count
}

export function layerNameTaken(layers: readonly string[], name: string, except?: string): boolean {
  const normalized = normalizeLayerName(name).toLowerCase()
  const exceptNormalized = except ? normalizeLayerName(except).toLowerCase() : null
  return layers.some((layer) => {
    if (exceptNormalized && layer.toLowerCase() === exceptNormalized) return false
    return layer.toLowerCase() === normalized
  })
}
