import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { FORMAT_VERSION } from './constants.js'
import { packOtterfile, unpackOtterfile } from './pack.js'
import { OtterfileError } from './types.js'
import type { OtterfileDocument } from './types.js'

function sampleDocument(overrides: Partial<OtterfileDocument> = {}): OtterfileDocument {
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
          { x: 2, y: 3, layer: 'roof', contentId: 'container:chest' },
        ],
      },
    ],
    ...overrides,
  }
}

describe('packOtterfile / unpackOtterfile', () => {
  it('round-trips a document with sparse map cells', async () => {
    const source = sampleDocument()

    const packed = await packOtterfile(source)
    expect(packed.bytes.byteLength).toBeGreaterThan(0)

    const restored = await unpackOtterfile(packed.bytes)
    expect(restored).toEqual(source)
  })

  it('round-trips an empty map (zero occupied cells)', async () => {
    const source = sampleDocument({
      maps: [
        {
          id: 'main',
          width: 8,
          height: 8,
          layers: ['ground'],
          cells: [],
        },
      ],
    })

    const restored = await unpackOtterfile((await packOtterfile(source)).bytes)
    expect(restored).toEqual(source)
  })

  it('writes manifest.json and maps/*.json into the zip container', async () => {
    const packed = await packOtterfile(sampleDocument())
    const zip = await JSZip.loadAsync(packed.bytes)

    expect(zip.file('manifest.json')).not.toBeNull()
    expect(zip.file('maps/main.json')).not.toBeNull()
    expect(zip.folder('assets')).not.toBeNull()
  })

  it('stamps the runtime formatVersion on pack', async () => {
    const source = sampleDocument({
      manifest: {
        formatVersion: '9.9.9',
        gameId: 'demo-game',
        title: 'Demo Adventure',
        defaultMapId: 'main',
      },
    })

    const restored = await unpackOtterfile((await packOtterfile(source)).bytes)
    expect(restored.manifest.formatVersion).toBe(FORMAT_VERSION)
  })

  it('rejects duplicate cells at the same coordinate and layer', async () => {
    await expect(
      packOtterfile(
        sampleDocument({
          maps: [
            {
              id: 'main',
              width: 8,
              height: 8,
              layers: ['ground'],
              cells: [
                { x: 1, y: 1, layer: 'ground', contentId: 'item:a' },
                { x: 1, y: 1, layer: 'ground', contentId: 'item:b' },
              ],
            },
          ],
        }),
      ),
    ).rejects.toThrow(OtterfileError)
  })

  it('rejects cells outside map bounds', async () => {
    await expect(
      packOtterfile(
        sampleDocument({
          maps: [
            {
              id: 'main',
              width: 4,
              height: 4,
              layers: ['ground'],
              cells: [{ x: 4, y: 0, layer: 'ground', contentId: 'item:a' }],
            },
          ],
        }),
      ),
    ).rejects.toThrow(OtterfileError)
  })

  it('rejects when defaultMapId is missing from maps', async () => {
    await expect(
      packOtterfile(
        sampleDocument({
          manifest: {
            formatVersion: FORMAT_VERSION,
            gameId: 'demo-game',
            title: 'Demo Adventure',
            defaultMapId: 'missing',
          },
        }),
      ),
    ).rejects.toThrow(OtterfileError)
  })

  it('rejects archives without manifest.json', async () => {
    const zip = new JSZip()
    zip.file('maps/main.json', '{}')

    await expect(unpackOtterfile(await zip.generateAsync({ type: 'uint8array' }))).rejects.toThrow(
      /manifest\.json/,
    )
  })

  it('rejects unsupported formatVersion on unpack', async () => {
    const zip = new JSZip()
    zip.file(
      'manifest.json',
      JSON.stringify({
        formatVersion: '0.0.1',
        gameId: 'demo-game',
        title: 'Demo',
        defaultMapId: 'main',
      }),
    )
    zip.file(
      'maps/main.json',
      JSON.stringify({
        id: 'main',
        width: 4,
        height: 4,
        layers: ['ground'],
        cells: [],
      }),
    )

    await expect(unpackOtterfile(await zip.generateAsync({ type: 'uint8array' }))).rejects.toThrow(
      /Unsupported otterfile formatVersion/,
    )
  })
})
