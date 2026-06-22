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

export const entranceTargetSchema = z.object({
  mapId: identifierSchema,
  x: z.number().int().min(0).max(MAX_MAP_DIMENSION - 1),
  y: z.number().int().min(0).max(MAX_MAP_DIMENSION - 1),
  layer: z.string().min(1).max(64),
})

export const spawnPointConfigSchema = z.object({
  entityKind: z.enum(['character', 'item', 'container', 'entrance']),
  entityId: z.string().min(1).max(256),
  entranceTarget: entranceTargetSchema.optional(),
  conditions: z.unknown().nullable().optional(),
})

export const mapCellSchema = z.object({
  x: z.number().int().min(0).max(MAX_MAP_DIMENSION - 1),
  y: z.number().int().min(0).max(MAX_MAP_DIMENSION - 1),
  layer: z.string().min(1).max(64),
  contentId: z.string().min(1).max(256),
  entranceTarget: entranceTargetSchema.optional(),
  spawnPoint: spawnPointConfigSchema.optional(),
})

export const mapTileSchema = z.object({
  x: z.number().int().min(0).max(MAX_MAP_DIMENSION - 1),
  y: z.number().int().min(0).max(MAX_MAP_DIMENSION - 1),
  layer: z.string().min(1).max(64),
  passable: z.boolean(),
  backgroundColor: z.string().max(32).nullable().optional(),
  backgroundIconId: z.string().max(64).nullable().optional(),
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
    tiles: z.array(mapTileSchema).optional(),
    restZone: z.enum(['inn', 'inside', 'outside', 'none']).optional(),
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

    const seenTileKeys = new Set<string>()
    for (const [index, tile] of (map.tiles ?? []).entries()) {
      if (!layerSet.has(tile.layer)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown layer "${tile.layer}"`,
          path: ['tiles', index, 'layer'],
        })
      }

      if (tile.x >= map.width) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `x=${tile.x} is outside map width ${map.width}`,
          path: ['tiles', index, 'x'],
        })
      }

      if (tile.y >= map.height) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `y=${tile.y} is outside map height ${map.height}`,
          path: ['tiles', index, 'y'],
        })
      }

      const tileKey = `${tile.x},${tile.y},${tile.layer}`
      if (seenTileKeys.has(tileKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate tile at ${tileKey}`,
          path: ['tiles', index],
        })
      }
      seenTileKeys.add(tileKey)
    }
  })

export const manifestSchema = z.object({
  formatVersion: semverSchema,
  gameId: identifierSchema,
  title: z.string().min(1).max(256),
  defaultMapId: identifierSchema,
})

/** Authored story/narrative state — not battle/combat runtime. */
export const stateVariableSchema = z.object({
  id: z.string().min(1).max(128),
  /** Stable engine key (slug); engine logic binds to this, never the title. */
  key: z.string().min(1).max(128),
  title: z.string().max(256),
  scope: z.enum(['global', 'character']),
  varType: z.enum(['boolean', 'number', 'string']),
  defaultValue: z.union([z.boolean(), z.number(), z.string()]),
  /** Set when scope is 'character'; references a character id. */
  characterId: z.string().min(1).max(128).nullable(),
  description: z.string().max(2048),
  updatedAt: z.string(),
})

/** Authored content carried in `content/*.json`. Each domain is added one slice at a time. */
export const contentSchema = z.object({
  stateVariables: z.array(stateVariableSchema).default([]),
})

export const otterfileDocumentSchema = z
  .object({
    manifest: manifestSchema,
    maps: z.array(mapSchema).min(1),
    content: contentSchema.default({ stateVariables: [] }),
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

export function parseStateVariables(raw: unknown) {
  return z.array(stateVariableSchema).parse(raw)
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
