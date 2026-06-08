import type { OtterfileDocument, OtterMap } from '@otter/otterfile-core'
import { unpackOtterfile } from '@otter/otterfile-core'
import type { LoadedGame } from './game.js'
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
    })
  }

  return world
}

/** Load all maps from a validated otterfile document into runtime world models. */
export function loadGameFromDocument(document: OtterfileDocument): LoadedGame {
  const maps = new Map<string, WorldModel>()
  for (const map of document.maps) {
    maps.set(map.id, worldFromMap(map))
  }

  return {
    gameId: document.manifest.gameId,
    title: document.manifest.title,
    formatVersion: document.manifest.formatVersion,
    defaultMapId: document.manifest.defaultMapId,
    maps,
  }
}

/** Unpack and load an otterfile zip container into runtime game state. */
export async function loadGameFromBytes(bytes: Uint8Array): Promise<LoadedGame> {
  const document = await unpackOtterfile(bytes)
  return loadGameFromDocument(document)
}
