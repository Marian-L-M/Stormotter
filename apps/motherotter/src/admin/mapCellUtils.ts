import type { Cell, EntranceTarget } from '@otter/game-state'
import { parseContentId } from '../editorTools'
import { formatCellCoordinate } from './mapLayerUtils'

export type MapCellContentKind =
  | 'character'
  | 'item'
  | 'container'
  | 'entrance'
  | 'spawn'
  | 'event'
  | 'unknown'

export function getCellContentKind(cell: Cell): MapCellContentKind {
  const { kind } = parseContentId(cell.contentId)
  if (
    kind === 'character' ||
    kind === 'item' ||
    kind === 'container' ||
    kind === 'entrance' ||
    kind === 'spawn' ||
    kind === 'event'
  ) {
    return kind === 'spawn' ? 'spawn' : kind
  }
  return 'unknown'
}

export function getCellEntityId(cell: Cell): string {
  return parseContentId(cell.contentId).entityId
}

export function formatEntranceTarget(target: EntranceTarget): string {
  return `${target.mapId} · ${formatCellCoordinate(target.x, target.y)} · ${target.layer}`
}

export function createEntranceContentId(): string {
  return `entrance:${crypto.randomUUID().slice(0, 8)}`
}

export function createSpawnPointContentId(): string {
  return `spawn:${crypto.randomUUID().slice(0, 8)}`
}

export function createEventContentId(): string {
  return `event:${crypto.randomUUID().slice(0, 8)}`
}
