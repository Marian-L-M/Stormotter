import type { OtterfileDocument, OtterMap } from '@otter/otterfile-core'
import { unpackOtterfile } from '@otter/otterfile-core'
import type { LoadedGame } from './game.js'
import { normalizeGameCartridge } from './cartridge.js'
import type { RestZone } from './castSlotTypes.js'
import { cellKey, createEmptyWorld, type WorldModel } from './world.js'

/** Build a sparse runtime world from a validated otterfile map. */
export function worldFromMap(map: OtterMap): WorldModel {
  const world = createEmptyWorld(map.width, map.height, map.layers)

  for (const cell of map.cells) {
    world.cells.set(cellKey(cell.x, cell.y, cell.layer), {
      x: cell.x,
      y: cell.y,
      layer: cell.layer,
      contentId: cell.contentId,
      ...(cell.entranceTarget ? { entranceTarget: { ...cell.entranceTarget } } : {}),
      ...(cell.spawnPoint
        ? {
            spawnPoint: {
              ...cell.spawnPoint,
              conditions: cell.spawnPoint.conditions ?? null,
            },
          }
        : {}),
    })
  }

  for (const tile of map.tiles ?? []) {
    world.tiles.set(cellKey(tile.x, tile.y, tile.layer), {
      x: tile.x,
      y: tile.y,
      layer: tile.layer,
      passable: tile.passable ?? true,
      backgroundColor: tile.backgroundColor ?? null,
      backgroundIconId: tile.backgroundIconId ?? null,
    })
  }

  return world
}

function restZoneFromMap(map: OtterMap): RestZone {
  const zone = (map as OtterMap & { restZone?: RestZone }).restZone
  if (zone === 'inn' || zone === 'inside' || zone === 'outside') return zone
  return 'none'
}

/** Load all maps from a validated otterfile document into runtime world models. */
export function loadGameFromDocument(
  document: OtterfileDocument,
  cartridge?: unknown,
): LoadedGame {
  const maps = new Map<string, WorldModel>()
  const mapRestZones = new Map<string, RestZone>()
  for (const map of document.maps) {
    maps.set(map.id, worldFromMap(map))
    mapRestZones.set(map.id, restZoneFromMap(map))
  }

  return {
    gameId: document.manifest.gameId,
    title: document.manifest.title,
    formatVersion: document.manifest.formatVersion,
    defaultMapId: document.manifest.defaultMapId,
    maps,
    mapRestZones,
    stateVariables: document.content.stateVariables,
    cartridge: normalizeGameCartridge(cartridge),
  }
}

/** Unpack and load an otterfile zip container into runtime game state. */
export async function loadGameFromBytes(bytes: Uint8Array): Promise<LoadedGame> {
  const unpacked = await unpackOtterfile(bytes)
  return loadGameFromDocument(unpacked.document, unpacked.cartridge)
}
