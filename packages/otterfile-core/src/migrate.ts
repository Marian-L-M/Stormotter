import { FORMAT_VERSION } from './constants.js'
import type { OtterfileManifest } from './types.js'

/**
 * Apply version migrations until the manifest matches FORMAT_VERSION.
 * Only 0.1.0 exists today — unknown versions are rejected explicitly.
 */
export function migrateManifest(manifest: OtterfileManifest): OtterfileManifest {
  if (manifest.formatVersion === FORMAT_VERSION) {
    return manifest
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
