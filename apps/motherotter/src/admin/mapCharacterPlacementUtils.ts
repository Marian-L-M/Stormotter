import { cellKey, type Cell, type WorldModel } from '@otter/game-state'
import { buildContentId } from '../editorTools'
import { isUniqueNpcCharacter, type CharacterCategory } from './characterTypes'
import type { MapCellReference } from './characterLocationTypes'

export function findCharacterGridPlacement(
  world: WorldModel,
  characterId: string,
): { key: string; cell: Cell } | null {
  const contentId = buildContentId('character', characterId)
  for (const [key, cell] of world.cells.entries()) {
    if (cell.contentId === contentId) return { key, cell }
  }
  return null
}

export function uniqueCharacterHasFixedPlacement(world: WorldModel, characterId: string): boolean {
  return findCharacterGridPlacement(world, characterId) !== null
}

export function canAddUniqueCharacterFixedPlacement(
  world: WorldModel,
  characterId: string,
  category: CharacterCategory,
  exceptCellKey?: string | null,
): boolean {
  if (!isUniqueNpcCharacter(category)) return true
  const existing = findCharacterGridPlacement(world, characterId)
  if (!existing) return true
  if (exceptCellKey && existing.key === exceptCellKey) return true
  return false
}

export function toActiveLocationFromCell(
  mapId: string,
  cell: Pick<Cell, 'x' | 'y' | 'layer'>,
): MapCellReference {
  return { mapId, x: cell.x, y: cell.y, layer: cell.layer }
}

export function moveCellInWorld(
  world: WorldModel,
  fromKey: string,
  toX: number,
  toY: number,
  toLayer: string,
): string | null {
  const cell = world.cells.get(fromKey)
  if (!cell) return null
  const toKey = cellKey(toX, toY, toLayer)
  if (world.cells.has(toKey)) return null

  world.cells.delete(fromKey)
  world.cells.set(toKey, { ...cell, x: toX, y: toY, layer: toLayer })
  return toKey
}

export function removeCharacterGridPlacements(world: WorldModel, characterId: string): boolean {
  const contentId = buildContentId('character', characterId)
  let removed = false
  for (const [key, cell] of [...world.cells.entries()]) {
    if (cell.contentId === contentId) {
      world.cells.delete(key)
      removed = true
    }
  }
  return removed
}
