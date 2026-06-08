import { z } from 'zod'
import { FORMAT_VERSION, MAX_LAYER_COUNT, MAX_MAP_DIMENSION } from './constants.js'

const identifierSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/, 'Must be a slug (letters, numbers, _ or -)')

const semverSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, 'Must be semver (e.g. 0.1.0)')

export const mapCellSchema = z.object({
  x: z.number().int().min(0).max(MAX_MAP_DIMENSION - 1),
  y: z.number().int().min(0).max(MAX_MAP_DIMENSION - 1),
  layer: z.string().min(1).max(64),
  contentId: z.string().min(1).max(256),
})

export const mapSchema = z
  .object({
    id: identifierSchema,
    width: z.number().int().min(1).max(MAX_MAP_DIMENSION),
    height: z.number().int().min(1).max(MAX_MAP_DIMENSION),
    layers: z
      .array(z.string().min(1).max(64))
      .min(1)
      .max(MAX_LAYER_COUNT),
    cells: z.array(mapCellSchema),
  })
  .superRefine((map, ctx) => {
    const uniqueLayers = new Set(map.layers)
    if (uniqueLayers.size !== map.layers.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Layer names must be unique',
        path: ['layers'],
      })
    }

    const layerSet = new Set(map.layers)
    const seenKeys = new Set<string>()

    for (const [index, cell] of map.cells.entries()) {
      if (!layerSet.has(cell.layer)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown layer "${cell.layer}"`,
          path: ['cells', index, 'layer'],
        })
      }

      if (cell.x >= map.width) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `x=${cell.x} is outside map width ${map.width}`,
          path: ['cells', index, 'x'],
        })
      }

      if (cell.y >= map.height) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `y=${cell.y} is outside map height ${map.height}`,
          path: ['cells', index, 'y'],
        })
      }

      const key = `${cell.x},${cell.y},${cell.layer}`
      if (seenKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate cell at ${key}`,
          path: ['cells', index],
        })
      }
      seenKeys.add(key)
    }
  })

export const manifestSchema = z.object({
  formatVersion: semverSchema,
  gameId: identifierSchema,
  title: z.string().min(1).max(256),
  defaultMapId: identifierSchema,
})

export const otterfileDocumentSchema = z
  .object({
    manifest: manifestSchema,
    maps: z.array(mapSchema).min(1),
  })
  .superRefine((doc, ctx) => {
    const mapIds = new Set<string>()
    for (const [index, map] of doc.maps.entries()) {
      if (mapIds.has(map.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate map id "${map.id}"`,
          path: ['maps', index, 'id'],
        })
      }
      mapIds.add(map.id)
    }

    if (!mapIds.has(doc.manifest.defaultMapId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `defaultMapId "${doc.manifest.defaultMapId}" not found in maps`,
        path: ['manifest', 'defaultMapId'],
      })
    }
  })

export function parseMap(raw: unknown) {
  return mapSchema.parse(raw)
}

export function parseManifest(raw: unknown) {
  return manifestSchema.parse(raw)
}

export function parseOtterfileDocument(raw: unknown) {
  return otterfileDocumentSchema.parse(raw)
}

/** Ensure manifest uses the runtime format version before writing. */
export function withCurrentFormatVersion(
  manifest: z.infer<typeof manifestSchema>,
): z.infer<typeof manifestSchema> {
  return {
    ...manifest,
    formatVersion: FORMAT_VERSION,
  }
}
