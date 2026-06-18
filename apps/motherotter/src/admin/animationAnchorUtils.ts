import {
  PREVIEW_DUMMY_POSITIONS,
  PREVIEW_GRID_SIZE,
  type PositionAnchor,
  type PositionAnchorKind,
} from './animationTypes'
import type { PreviewPosition } from './mapPreviewUtils'
import { PREVIEW_DUMMY_MAIN_ID } from './mapPreviewUtils'

export interface PreviewStagingContext {
  actingAsMain: boolean
}

export interface RuntimeAnimationContext extends PreviewStagingContext {
  positions: {
    main: { x: number; y: number } | null
    acting: { x: number; y: number } | null
    target: { x: number; y: number } | null
    ally: { x: number; y: number } | null
    enemy1: { x: number; y: number } | null
    enemy2: { x: number; y: number } | null
  }
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function buildRuntimeAnimationContext(options: {
  positions: Record<string, PreviewPosition>
  partyCharacterIds: readonly string[]
  mainCharacterIds: readonly string[]
  selectedCharacterId: string | null
  targetPosition: PreviewPosition | null
  mapId: string
  layer: string
}): RuntimeAnimationContext {
  const onMap = (characterId: string): { x: number; y: number } | null => {
    const pos = options.positions[characterId]
    if (!pos || pos.mapId !== options.mapId || pos.layer !== options.layer) return null
    return { x: pos.x, y: pos.y }
  }

  const mainId =
    options.mainCharacterIds.find((id) => onMap(id)) ??
    options.partyCharacterIds.find((id) => onMap(id)) ??
    options.selectedCharacterId
  const actingId = options.selectedCharacterId ?? mainId
  const main = mainId ? onMap(mainId) : null
  const acting = actingId ? onMap(actingId) : null
  const target = options.targetPosition
    ? { x: options.targetPosition.x, y: options.targetPosition.y }
    : null

  const partyAllies = options.partyCharacterIds
    .filter((id) => id !== actingId && id !== PREVIEW_DUMMY_MAIN_ID)
    .map((id) => ({ id, pos: onMap(id) }))
    .filter((entry): entry is { id: string; pos: { x: number; y: number } } => Boolean(entry.pos))

  const nonParty = Object.keys(options.positions)
    .filter((id) => !options.partyCharacterIds.includes(id) && id !== PREVIEW_DUMMY_MAIN_ID)
    .map((id) => ({ id, pos: onMap(id) }))
    .filter((entry): entry is { id: string; pos: { x: number; y: number } } => Boolean(entry.pos))

  const ally =
    main && partyAllies.length > 0
      ? partyAllies.reduce((best, entry) =>
          distance(entry.pos, main) < distance(best.pos, main) ? entry : best,
        ).pos
      : partyAllies[0]?.pos ?? null

  const enemies = nonParty.map((entry) => entry.pos)
  const enemy1 =
    main && enemies.length > 0
      ? enemies.reduce((best, pos) => (distance(pos, main) < distance(best, main) ? pos : best))
      : enemies[0] ?? null
  const enemy2 =
    enemies.find((pos) => pos.x !== enemy1?.x || pos.y !== enemy1?.y) ?? enemies[1] ?? enemy1

  const actingAsMain = Boolean(mainId && actingId && mainId === actingId)

  return {
    actingAsMain,
    positions: {
      main,
      acting,
      target,
      ally,
      enemy1,
      enemy2,
    },
  }
}

function mapAnchorPosition(kind: Exclude<PositionAnchorKind, 'fixed' | 'main_character' | 'acting_character' | 'target' | 'nearest_ally' | 'nearest_enemy'>): { x: number; y: number } {
  const last = PREVIEW_GRID_SIZE - 1
  const center = Math.floor(PREVIEW_GRID_SIZE / 2)
  switch (kind) {
    case 'map_center':
      return { x: center, y: center }
    case 'map_nw':
      return { x: 0, y: 0 }
    case 'map_n':
      return { x: center, y: 0 }
    case 'map_ne':
      return { x: last, y: 0 }
    case 'map_w':
      return { x: 0, y: center }
    case 'map_e':
      return { x: last, y: center }
    case 'map_sw':
      return { x: 0, y: last }
    case 'map_s':
      return { x: center, y: last }
    case 'map_se':
      return { x: last, y: last }
    default:
      return { x: center, y: center }
  }
}

export function resolvePositionAnchor(
  anchor: PositionAnchor,
  context: PreviewStagingContext | RuntimeAnimationContext,
): { x: number; y: number } {
  if (anchor.kind === 'fixed') {
    return {
      x: anchor.fixedX ?? 0,
      y: anchor.fixedY ?? 0,
    }
  }

  let base: { x: number; y: number }
  if ('positions' in context) {
    switch (anchor.kind) {
      case 'main_character':
        base = context.positions.main ?? PREVIEW_DUMMY_POSITIONS.main
        break
      case 'acting_character':
        base = context.actingAsMain
          ? (context.positions.main ?? PREVIEW_DUMMY_POSITIONS.main)
          : (context.positions.acting ?? PREVIEW_DUMMY_POSITIONS.acting)
        break
      case 'target':
        base = context.positions.target ?? PREVIEW_DUMMY_POSITIONS.target
        break
      case 'nearest_ally':
        base = context.positions.ally ?? PREVIEW_DUMMY_POSITIONS.ally
        break
      case 'nearest_enemy':
        base = context.positions.enemy1 ?? PREVIEW_DUMMY_POSITIONS.enemy1
        break
      default:
        base = mapAnchorPosition(anchor.kind)
    }
  } else {
    switch (anchor.kind) {
      case 'main_character':
        base = PREVIEW_DUMMY_POSITIONS.main
        break
      case 'acting_character':
        base = context.actingAsMain ? PREVIEW_DUMMY_POSITIONS.main : PREVIEW_DUMMY_POSITIONS.acting
        break
      case 'target':
        base = PREVIEW_DUMMY_POSITIONS.target
        break
      case 'nearest_ally':
        base = PREVIEW_DUMMY_POSITIONS.ally
        break
      case 'nearest_enemy':
        base = PREVIEW_DUMMY_POSITIONS.enemy1
        break
      default:
        base = mapAnchorPosition(anchor.kind)
    }
  }

  return {
    x: base.x + anchor.offsetX,
    y: base.y + anchor.offsetY,
  }
}
