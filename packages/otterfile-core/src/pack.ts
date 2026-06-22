import JSZip from 'jszip'
import { z } from 'zod'
import {
  ASSETS_DIR,
  CARTRIDGE_PATH,
  FORMAT_VERSION,
  MANIFEST_PATH,
  MAPS_DIR,
  STATE_VARIABLES_PATH,
} from './constants.js'
import { migrateManifest, OtterfileUnsupportedVersionError } from './migrate.js'
import {
  otterfileDocumentSchema,
  parseManifest,
  parseMap,
  withCurrentFormatVersion,
} from './schemas.js'
import type { OtterfileDocument, PackedOtterfile, UnpackedOtterfile } from './types.js'
import { OtterfileError } from './types.js'

function mapPath(mapId: string): string {
  return `${MAPS_DIR}/${mapId}.json`
}

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)'
      return `${path}: ${issue.message}`
    })
    .join('; ')
}

/** Validate and pack an otterfile document into a zip container. */
export async function packOtterfile(
  document: OtterfileDocument,
  options?: { cartridge?: unknown },
): Promise<PackedOtterfile> {
  let validated: OtterfileDocument
  try {
    validated = otterfileDocumentSchema.parse({
      ...document,
      manifest: withCurrentFormatVersion(document.manifest),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new OtterfileError(`Invalid otterfile document: ${formatZodError(error)}`, {
        cause: error,
      })
    }
    throw error
  }

  if (validated.manifest.formatVersion !== FORMAT_VERSION) {
    throw new OtterfileError(
      `Refusing to pack unsupported formatVersion "${validated.manifest.formatVersion}"`,
    )
  }

  const zip = new JSZip()
  zip.file(MANIFEST_PATH, `${JSON.stringify(validated.manifest, null, 2)}\n`)

  for (const map of validated.maps) {
    zip.file(mapPath(map.id), `${JSON.stringify(map, null, 2)}\n`)
  }

  zip.file(
    STATE_VARIABLES_PATH,
    `${JSON.stringify(validated.content.stateVariables, null, 2)}\n`,
  )

  zip.folder(ASSETS_DIR)

  if (options?.cartridge !== undefined) {
    zip.file(CARTRIDGE_PATH, `${JSON.stringify(options.cartridge, null, 2)}\n`)
  }

  const bytes = await zip.generateAsync({ type: 'uint8array' })
  return { bytes }
}

/** Unpack and Zod-validate an otterfile zip container. */
export async function unpackOtterfile(bytes: Uint8Array): Promise<UnpackedOtterfile> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(bytes)
  } catch (error) {
    throw new OtterfileError('Failed to read otterfile container (invalid zip)', {
      cause: error,
    })
  }

  const manifestEntry = zip.file(MANIFEST_PATH)
  if (!manifestEntry) {
    throw new OtterfileError(`Missing required file "${MANIFEST_PATH}"`)
  }

  let manifestRaw: unknown
  try {
    manifestRaw = JSON.parse(await manifestEntry.async('string'))
  } catch (error) {
    throw new OtterfileError(`Invalid JSON in "${MANIFEST_PATH}"`, { cause: error })
  }

  let manifest: ReturnType<typeof parseManifest>
  try {
    manifest = parseManifest(manifestRaw)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new OtterfileError(`Invalid manifest: ${formatZodError(error)}`, { cause: error })
    }
    throw error
  }

  try {
    manifest = migrateManifest(manifest)
  } catch (error) {
    if (error instanceof OtterfileUnsupportedVersionError) {
      throw new OtterfileError(error.message, { cause: error })
    }
    throw error
  }

  const mapEntries = zip.file(new RegExp(`^${MAPS_DIR}/[^/]+\\.json$`))
  if (mapEntries.length === 0) {
    throw new OtterfileError(`No map files found in "${MAPS_DIR}/"`)
  }

  const maps = []
  for (const entry of mapEntries) {
    let mapRaw: unknown
    try {
      mapRaw = JSON.parse(await entry.async('string'))
    } catch (error) {
      throw new OtterfileError(`Invalid JSON in "${entry.name}"`, { cause: error })
    }

    try {
      maps.push(parseMap(mapRaw))
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new OtterfileError(`Invalid map "${entry.name}": ${formatZodError(error)}`, {
          cause: error,
        })
      }
      throw error
    }
  }

  let stateVariablesRaw: unknown = []
  const stateVariablesEntry = zip.file(STATE_VARIABLES_PATH)
  if (stateVariablesEntry) {
    try {
      stateVariablesRaw = JSON.parse(await stateVariablesEntry.async('string'))
    } catch (error) {
      throw new OtterfileError(`Invalid JSON in "${STATE_VARIABLES_PATH}"`, { cause: error })
    }
  }

  try {
    const document = otterfileDocumentSchema.parse({
      manifest,
      maps,
      content: { stateVariables: stateVariablesRaw },
    })
    const cartridgeEntry = zip.file(CARTRIDGE_PATH)
    let cartridge: unknown | null = null
    if (cartridgeEntry) {
      try {
        cartridge = JSON.parse(await cartridgeEntry.async('string'))
      } catch (error) {
        throw new OtterfileError(`Invalid JSON in "${CARTRIDGE_PATH}"`, { cause: error })
      }
    }
    return { document, cartridge }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new OtterfileError(`Invalid otterfile document: ${formatZodError(error)}`, {
        cause: error,
      })
    }
    throw error
  }
}
