import { FORMAT_VERSION } from './constants.js'
import type { OtterfileManifest } from './types.js'

/**
 * Apply version migrations until the manifest matches FORMAT_VERSION.
 * Unknown versions are rejected explicitly.
 *
 * 0.1.0 → 0.2.0: introduces optional `content/*` files. A 0.1.0 cartridge has
 * no content files, so its content reads back as empty — only the version stamp
 * changes here; the empty-fill happens at parse time via schema defaults.
 */
export function migrateManifest(manifest: OtterfileManifest): OtterfileManifest {
  if (manifest.formatVersion === FORMAT_VERSION) {
    return manifest
  }

  if (manifest.formatVersion === '0.1.0') {
    return { ...manifest, formatVersion: '0.2.0' }
  }

  throw new OtterfileUnsupportedVersionError(manifest.formatVersion)
}

export class OtterfileUnsupportedVersionError extends Error {
  readonly formatVersion: string

  constructor(formatVersion: string) {
    super(
      `Unsupported otterfile formatVersion "${formatVersion}" (runtime supports ${FORMAT_VERSION})`,
    )
    this.name = 'OtterfileUnsupportedVersionError'
    this.formatVersion = formatVersion
  }
}
