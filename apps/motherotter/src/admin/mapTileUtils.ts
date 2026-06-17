import { cellKey, type MapTile, type WorldModel } from '@otter/game-state'

export function getMapTile(world: WorldModel, x: number, y: number, layer: string): MapTile | null {
  return world.tiles.get(cellKey(x, y, layer)) ?? null
}

export function isTilePassable(world: WorldModel, x: number, y: number, layer: string): boolean {
  const tile = getMapTile(world, x, y, layer)
  return tile?.passable ?? true
}

export function ensureMapTile(
  world: WorldModel,
  x: number,
  y: number,
  layer: string,
): MapTile {
  const key = cellKey(x, y, layer)
  const existing = world.tiles.get(key)
  if (existing) return existing

  const tile: MapTile = {
    x,
    y,
    layer,
    passable: true,
    backgroundColor: null,
    backgroundIconId: null,
  }
  world.tiles.set(key, tile)
  return tile
}

export function setTilePassable(
  world: WorldModel,
  keys: string[],
  passable: boolean,
): void {
  for (const key of keys) {
    const tile = world.tiles.get(key)
    if (tile) {
      tile.passable = passable
      if (passable && !tile.backgroundColor && !tile.backgroundIconId) {
        world.tiles.delete(key)
      }
      continue
    }
    if (!passable) {
      const [x, y, layer] = parseTileKey(key)
      world.tiles.set(key, {
        x,
        y,
        layer,
        passable: false,
        backgroundColor: null,
        backgroundIconId: null,
      })
    }
  }
}

export function applyTileDecoration(
  world: WorldModel,
  keys: string[],
  patch: { backgroundColor?: string | null; backgroundIconId?: string | null },
): void {
  for (const key of keys) {
    const [x, y, layer] = parseTileKey(key)
    const tile = ensureMapTile(world, x, y, layer)
    if ('backgroundColor' in patch) {
      tile.backgroundColor = patch.backgroundColor ?? null
    }
    if ('backgroundIconId' in patch) {
      tile.backgroundIconId = patch.backgroundIconId ?? null
    }
    if (tile.passable && !tile.backgroundColor && !tile.backgroundIconId) {
      world.tiles.delete(key)
    }
  }
}

export function parseTileKey(key: string): [number, number, string] {
  const lastComma = key.lastIndexOf(',')
  if (lastComma < 0) return [0, 0, 'ground']
  const layer = key.slice(lastComma + 1)
  const rest = key.slice(0, lastComma)
  const comma = rest.indexOf(',')
  if (comma < 0) return [0, 0, layer]
  return [Number(rest.slice(0, comma)), Number(rest.slice(comma + 1)), layer]
}

export function rectangleTileKeys(
  anchorKey: string,
  targetKey: string,
): string[] {
  const [ax, ay, layer] = parseTileKey(anchorKey)
  const [bx, by] = parseTileKey(targetKey)
  const xMin = Math.min(ax, bx)
  const xMax = Math.max(ax, bx)
  const yMin = Math.min(ay, by)
  const yMax = Math.max(ay, by)
  const keys: string[] = []
  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      keys.push(cellKey(x, y, layer))
    }
  }
  return keys
}

export function parseCoordKey(key: string): { x: number; y: number; layer: string } {
  const [x, y, layer] = parseTileKey(key)
  return { x, y, layer }
}
