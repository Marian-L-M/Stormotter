import type { StateVariable } from '@otter/otterfile-core'
import type { WorldModel } from './world.js'
import type { GameCartridge } from './cartridge.js'
import type { RestZone } from './castSlotTypes.js'

/** Runtime game loaded from a validated otterfile document. */
export interface LoadedGame {
  gameId: string
  title: string
  formatVersion: string
  defaultMapId: string
  maps: ReadonlyMap<string, WorldModel>
  mapRestZones: ReadonlyMap<string, RestZone>
  stateVariables: readonly StateVariable[]
  cartridge: GameCartridge | null
}

export function getActiveWorld(game: LoadedGame): WorldModel {
  const world = game.maps.get(game.defaultMapId)
  if (!world) {
    throw new Error(`Active map "${game.defaultMapId}" is not loaded`)
  }
  return world
}
