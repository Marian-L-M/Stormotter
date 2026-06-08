import { describe, expect, it } from 'vitest'
import { FORMAT_VERSION, packOtterfile } from '@otter/otterfile-core'
import { loadGameFromBytes } from './load.js'
import { mapFromWorld, serializeCellKey } from './export.js'
import { cellKey, createEmptyWorld } from './world.js'

describe('mapFromWorld', () => {
  it('serializes sparse cells for otterfile export', () => {
    const world = createEmptyWorld(8, 8, ['ground', 'roof'])
    world.cells.set(cellKey(2, 3, 'ground'), {
      x: 2,
      y: 3,
      layer: 'ground',
      contentId: 'character:hero',
    })
    world.cells.set(cellKey(5, 1, 'roof'), {
      x: 5,
      y: 1,
      layer: 'roof',
      contentId: 'container:chest',
    })

    const map = mapFromWorld('main', world)

    expect(map).toEqual({
      id: 'main',
      width: 8,
      height: 8,
      layers: ['ground', 'roof'],
      cells: [
        { x: 2, y: 3, layer: 'ground', contentId: 'character:hero' },
        { x: 5, y: 1, layer: 'roof', contentId: 'container:chest' },
      ],
    })
  })

  it('round-trips world → map → pack → load', async () => {
    const world = createEmptyWorld(10, 8, ['ground'])
    world.cells.set(cellKey(1, 2, 'ground'), {
      x: 1,
      y: 2,
      layer: 'ground',
      contentId: 'item:sword',
    })

    const map = mapFromWorld('main', world)
    const packed = await packOtterfile({
      manifest: {
        formatVersion: FORMAT_VERSION,
        gameId: 'test-game',
        title: 'Test',
        defaultMapId: 'main',
      },
      maps: [map],
    })

    const loaded = await loadGameFromBytes(packed.bytes)
    const restored = loaded.maps.get('main')!

    expect(restored.width).toBe(world.width)
    expect(restored.height).toBe(world.height)
    expect([...restored.cells.values()].map(serializeCellKey).sort()).toEqual(
      [...world.cells.values()].map(serializeCellKey).sort(),
    )
  })
})
