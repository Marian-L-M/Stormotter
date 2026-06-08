import { describe, expect, it } from 'vitest'
import { cellKey, createEmptyWorld, getCellsInRect } from './world.js'

describe('getCellsInRect', () => {
  it('returns only occupied cells inside the rect on the requested layer', () => {
    const world = createEmptyWorld(10, 10)
    world.cells.set(cellKey(1, 1, 'ground'), {
      x: 1,
      y: 1,
      layer: 'ground',
      contentId: 'item:a',
    })
    world.cells.set(cellKey(4, 4, 'ground'), {
      x: 4,
      y: 4,
      layer: 'ground',
      contentId: 'item:b',
    })
    world.cells.set(cellKey(2, 2, 'roof'), {
      x: 2,
      y: 2,
      layer: 'roof',
      contentId: 'item:c',
    })

    const hits = getCellsInRect(world, { x: 0, y: 0, width: 3, height: 3 }, 'ground')

    expect(hits).toHaveLength(1)
    expect(hits[0]?.contentId).toBe('item:a')
  })
})
