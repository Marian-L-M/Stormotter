import type { WorldModel } from './world.js'

/** Runtime game loaded from a validated otterfile document. */
export interface LoadedGame {
  gameId: string
  title: string
  formatVersion: string
  defaultMapId: string
  maps: ReadonlyMap<string, WorldModel>
}

export function getActiveWorld(game: LoadedGame): WorldModel {
  const world = game.maps.get(game.defaultMapId)
  if (!world) {
    throw new Error(`Active map "${game.defaultMapId}" is not loaded`)
  }
  return world
}
