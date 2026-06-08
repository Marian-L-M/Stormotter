import { describe, expect, it } from 'vitest'
import { FORMAT_VERSION, packOtterfile } from '@otter/otterfile-core'
import type { OtterfileDocument } from '@otter/otterfile-core'
import { cellKey } from './world.js'
import { getActiveWorld } from './game.js'
import { loadGameFromBytes, loadGameFromDocument, worldFromMap } from './load.js'

function sampleDocument(): OtterfileDocument {
  return {
    manifest: {
      formatVersion: FORMAT_VERSION,
      gameId: 'demo-game',
      title: 'Demo Adventure',
      defaultMapId: 'main',
    },
    maps: [
      {
        id: 'main',
        width: 16,
        height: 12,
        layers: ['ground', 'roof'],
        cells: [
          { x: 2, y: 3, layer: 'ground', contentId: 'character:hero' },
          { x: 5, y: 1, layer: 'ground', contentId: 'item:sword' },
        ],
      },
    ],
  }
}

describe('worldFromMap', () => {
  it('copies sparse cells into a Map keyed by x,y,layer', () => {
    const world = worldFromMap(sampleDocument().maps[0]!)

    expect(world.width).toBe(16)
    expect(world.height).toBe(12)
    expect(world.layers).toEqual(['ground', 'roof'])
    expect(world.cells.size).toBe(2)
    expect(world.cells.get(cellKey(2, 3, 'ground'))?.contentId).toBe('character:hero')
  })
})

describe('loadGameFromDocument', () => {
  it('loads manifest metadata and all maps', () => {
    const game = loadGameFromDocument(sampleDocument())

    expect(game.gameId).toBe('demo-game')
    expect(game.title).toBe('Demo Adventure')
    expect(game.defaultMapId).toBe('main')
    expect(game.maps.size).toBe(1)

    const world = getActiveWorld(game)
    expect(world.cells.size).toBe(2)
  })
})

describe('loadGameFromBytes', () => {
  it('round-trips through pack → unpack → runtime world', async () => {
    const packed = await packOtterfile(sampleDocument())
    const game = await loadGameFromBytes(packed.bytes)

    expect(game.formatVersion).toBe(FORMAT_VERSION)
    expect(getActiveWorld(game).cells.get(cellKey(5, 1, 'ground'))?.contentId).toBe(
      'item:sword',
    )
  })
})
