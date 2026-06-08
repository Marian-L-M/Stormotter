import type { z } from 'zod'
import type { manifestSchema, mapCellSchema, mapSchema, otterfileDocumentSchema } from './schemas.js'

export type MapCell = z.infer<typeof mapCellSchema>
export type OtterMap = z.infer<typeof mapSchema>
export type OtterfileManifest = z.infer<typeof manifestSchema>
export type OtterfileDocument = z.infer<typeof otterfileDocumentSchema>

export interface PackedOtterfile {
  /** Raw zip bytes of the `.otterfile` container. */
  bytes: Uint8Array
}

export class OtterfileError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'OtterfileError'
  }
}
