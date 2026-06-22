import { cellKey, type Cell, type EntranceTarget, type WorldModel } from '@otter/game-state'
import { buildContentId, parseContentId } from '../editorTools'
import type { AdminListItem } from './types'
import { characterHasGroupFlags, characterHasMainFlag, normalizeCharacterCategory } from './characterTypes'
import { findCharacterGridPlacement } from './mapCharacterPlacementUtils'
import { isTilePassable } from './mapTileUtils'
import { getActiveAbilityDefinitionIdsForCharacter, type LevelAbilityBindingGrant } from './abilityTypes'
import { totalCharacterLevel, type CharacterProgression } from './progressionTypes'
import { resolveProjectMapEntry } from '../lib/projectRepository'

/** Default movement speed in feet (matches derived stat default). */
export const DEFAULT_MOVEMENT_SPEED_FT = 30

/** Grid cells use 5 ft per tile for movement budgeting. */
export const PREVIEW_FEET_PER_CELL = 5

export function movementSpeedFtToCells(speedFt: number): number {
  if (!Number.isFinite(speedFt) || speedFt <= 0) return 1
  return Math.max(1, Math.floor(speedFt / PREVIEW_FEET_PER_CELL))
}

export interface PreviewCharacterMeta {
  isMain?: boolean
  isInGroup?: boolean
  portraitMediaId?: string | null
  lineageTypeId?: string | null
  classId?: string | null
  level?: number
  progression?: CharacterProgression
  activeLocation?: { mapId: string; x: number; y: number; layer: string } | null
}

export const PREVIEW_DUMMY_MAIN_ID = '__preview_dummy_main__'

export interface PreviewPosition {
  x: number
  y: number
  layer: string
  mapId: string
}

export interface PreviewCellInteraction {
  message: string
  entranceTarget?: EntranceTarget
}

export interface PreviewPartyMember {
  characterId: string
  title: string
  isMain: boolean
  isDummy: boolean
  portraitMediaId: string | null
  level: number
  abilityIds: string[]
}

export interface PreviewPartyState {
  members: PreviewPartyMember[]
  mainCharacterId: string | null
  needsDummyPlacement: boolean
}

export function resolvePreviewParty(
  characters: readonly AdminListItem[],
  metaByCharacterId: Record<string, PreviewCharacterMeta>,
  levelAbilityGrants: Record<string, LevelAbilityBindingGrant[]>,
): PreviewPartyState {
  const members: PreviewPartyMember[] = []
  let mainCharacterId: string | null = null

  for (const character of characters) {
    const meta = metaByCharacterId[character.id]
    const category = normalizeCharacterCategory(character.category)
    const isMain = Boolean(meta?.isMain && characterHasMainFlag(category))
    const inGroup = Boolean(meta?.isInGroup && characterHasGroupFlags(category))
    if (!isMain && !inGroup) continue

    if (isMain) mainCharacterId = character.id

    const progression = meta?.progression
    const totalLevel = progression ? totalCharacterLevel(progression) : (meta?.level ?? 1)
    const classTracks =
      progression?.classes ??
      (meta?.classId ? [{ classId: meta.classId, level: meta?.level ?? 1, experience: 0 }] : [])

    members.push({
      characterId: character.id,
      title: character.title,
      isMain,
      isDummy: false,
      portraitMediaId: meta?.portraitMediaId ?? null,
      level: totalLevel,
      abilityIds: getActiveAbilityDefinitionIdsForCharacter({
        characterId: character.id,
        lineageTypeId: meta?.lineageTypeId ?? null,
        classes: classTracks.map((track) => ({ classId: track.classId, level: track.level })),
        totalLevel,
        levelAbilityGrants,
      }),
    })
  }

  if (!mainCharacterId) {
    members.unshift({
      characterId: PREVIEW_DUMMY_MAIN_ID,
      title: 'Dummy main',
      isMain: true,
      isDummy: true,
      portraitMediaId: null,
      level: 1,
      abilityIds: [],
    })
    mainCharacterId = PREVIEW_DUMMY_MAIN_ID
  }

  return {
    members,
    mainCharacterId,
    needsDummyPlacement: mainCharacterId === PREVIEW_DUMMY_MAIN_ID,
  }
}

export function resolveMemberSpawnPosition(
  world: WorldModel,
  mapId: string,
  characterId: string,
  metaByCharacterId: Record<string, PreviewCharacterMeta>,
): PreviewPosition | null {
  if (characterId === PREVIEW_DUMMY_MAIN_ID) return null

  const placement = findCharacterGridPlacement(world, characterId)
  if (placement) {
    return {
      x: placement.cell.x,
      y: placement.cell.y,
      layer: placement.cell.layer,
      mapId,
    }
  }

  const active = metaByCharacterId[characterId]?.activeLocation
  if (active && active.mapId === mapId) {
    return { x: active.x, y: active.y, layer: active.layer, mapId: active.mapId }
  }

  return null
}

export function isWithinWorldBounds(world: WorldModel, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < world.width && y < world.height
}

export function isAdjacent(from: PreviewPosition, to: PreviewPosition): boolean {
  if (from.mapId !== to.mapId || from.layer !== to.layer) return false
  const dx = Math.abs(from.x - to.x)
  const dy = Math.abs(from.y - to.y)
  return dx + dy === 1
}

function positionKey(position: PreviewPosition): string {
  return `${position.x},${position.y},${position.layer}`
}

function isCellBlockedByParty(
  mapId: string,
  positions: Record<string, PreviewPosition>,
  characterId: string,
  x: number,
  y: number,
  layer: string,
): boolean {
  for (const [otherId, pos] of Object.entries(positions)) {
    if (otherId === characterId) continue
    if (pos.mapId !== mapId) continue
    if (pos.x === x && pos.y === y && pos.layer === layer) return true
  }
  return false
}

export function isWalkableCell(
  world: WorldModel,
  mapId: string,
  positions: Record<string, PreviewPosition>,
  characterId: string,
  x: number,
  y: number,
  layer: string,
): boolean {
  if (!isWithinWorldBounds(world, x, y)) return false
  if (!isTilePassable(world, x, y, layer)) return false
  return !isCellBlockedByParty(mapId, positions, characterId, x, y, layer)
}

const WALK_DIRECTIONS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
] as const

export function findWalkPath(
  world: WorldModel,
  mapId: string,
  positions: Record<string, PreviewPosition>,
  characterId: string,
  target: PreviewPosition,
): PreviewPosition[] | null {
  const start = positions[characterId]
  if (!start) return null
  if (start.mapId !== mapId || target.mapId !== mapId) return null
  if (start.layer !== target.layer) return null
  if (start.x === target.x && start.y === target.y) return []

  const startKey = positionKey(start)
  const targetKey = `${target.x},${target.y},${target.layer}`
  const queue: PreviewPosition[] = [start]
  const visited = new Set<string>([startKey])
  const parent = new Map<string, string>()

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentKey = positionKey(current)
    if (currentKey === targetKey) break

    for (const { dx, dy } of WALK_DIRECTIONS) {
      const next = { x: current.x + dx, y: current.y + dy, layer: target.layer, mapId }
      const nextKey = positionKey(next)
      if (visited.has(nextKey)) continue
      if (!isWalkableCell(world, mapId, positions, characterId, next.x, next.y, next.layer)) continue
      visited.add(nextKey)
      parent.set(nextKey, currentKey)
      queue.push(next)
    }
  }

  if (!visited.has(targetKey)) return null

  const path: PreviewPosition[] = []
  let key = targetKey
  while (key !== startKey) {
    const [x, y, layer] = key.split(',')
    path.unshift({ x: Number(x), y: Number(y), layer, mapId })
    const prev = parent.get(key)
    if (!prev) break
    key = prev
  }

  return path
}

export function canMoveTo(
  world: WorldModel,
  mapId: string,
  positions: Record<string, PreviewPosition>,
  characterId: string,
  target: PreviewPosition,
): boolean {
  const current = positions[characterId]
  if (!current) return false
  if (!isAdjacent(current, target)) return false
  return isWalkableCell(world, mapId, positions, characterId, target.x, target.y, target.layer)
}

export function buildPreviewRenderCells(
  world: WorldModel,
  mapId: string,
  positions: Record<string, PreviewPosition>,
  partyCharacterIds: Set<string>,
): Cell[] {
  const cells = new Map<string, Cell>()

  for (const cell of world.cells.values()) {
    const { entityId } = parseContentId(cell.contentId)
    if (partyCharacterIds.has(entityId)) continue
    cells.set(cellKey(cell.x, cell.y, cell.layer), cell)
  }

  for (const [characterId, position] of Object.entries(positions)) {
    if (position.mapId !== mapId) continue
    cells.set(cellKey(position.x, position.y, position.layer), {
      x: position.x,
      y: position.y,
      layer: position.layer,
      contentId: buildContentId('character', characterId),
    })
  }

  return [...cells.values()]
}

export function clampPreviewPosition(
  world: WorldModel,
  mapId: string,
  position: Pick<PreviewPosition, 'x' | 'y' | 'layer'>,
): PreviewPosition {
  const layer = world.layers.includes(position.layer)
    ? position.layer
    : (world.layers[0] ?? position.layer)
  return {
    mapId,
    layer,
    x: Math.min(Math.max(0, position.x), Math.max(0, world.width - 1)),
    y: Math.min(Math.max(0, position.y), Math.max(0, world.height - 1)),
  }
}

export function getEntranceAtPosition(
  world: WorldModel,
  position: PreviewPosition,
): EntranceTarget | null {
  const cell = world.cells.get(cellKey(position.x, position.y, position.layer))
  if (!cell) return null
  if (parseContentId(cell.contentId).kind !== 'entrance') return null
  return cell.entranceTarget ?? null
}

export function resolvePreviewCellInteraction(
  world: WorldModel,
  position: PreviewPosition,
  characters: readonly AdminListItem[],
  items: readonly { id: string; name: string }[],
  containers: readonly { id: string; name: string }[],
  maps: readonly { id: string; title: string }[],
): PreviewCellInteraction {
  const key = cellKey(position.x, position.y, position.layer)
  const cell = world.cells.get(key)
  if (!cell) return { message: 'Nothing to interact with here.' }

  const { kind, entityId } = parseContentId(cell.contentId)
  if (kind === 'character') {
    if (entityId === PREVIEW_DUMMY_MAIN_ID) return { message: 'You examine yourself.' }
    const character = characters.find((entry) => entry.id === entityId)
    return {
      message: character
        ? `You talk to ${character.title}.`
        : `Character "${entityId}" has no dialog yet.`,
    }
  }
  if (kind === 'item') {
    const item = items.find((entry) => entry.id === entityId)
    return {
      message: item ? `You pick up ${item.name}.` : `You find an item (${entityId}).`,
    }
  }
  if (kind === 'container') {
    const container = containers.find((entry) => entry.id === entityId)
    return {
      message: container ? `You open ${container.name}.` : `You open a container (${entityId}).`,
    }
  }
  if (kind === 'entrance') {
    const target = cell.entranceTarget
    if (target) {
      const destTitle =
        resolveProjectMapEntry(maps, target.mapId)?.title ?? target.mapId
      return {
        message: `You step through the entrance to ${destTitle}.`,
        entranceTarget: target,
      }
    }
    return { message: 'You step through the entrance.' }
  }
  if (kind === 'event') return { message: 'An event triggers here.' }
  if (kind === 'spawn') return { message: 'A conditional spawn point is configured here.' }
  return { message: `You interact with ${cell.contentId}.` }
}

export function describeCellInteraction(
  world: WorldModel,
  position: PreviewPosition,
  characters: readonly AdminListItem[],
  items: readonly { id: string; name: string }[],
  containers: readonly { id: string; name: string }[],
  maps: readonly { id: string; title: string }[] = [],
): string {
  return resolvePreviewCellInteraction(world, position, characters, items, containers, maps).message
}
