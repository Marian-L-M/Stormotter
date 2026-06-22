import type { z } from 'zod'
import type {
  contentSchema,
  manifestSchema,
  mapCellSchema,
  mapSchema,
  otterfileDocumentSchema,
  stateVariableSchema,
} from './schemas.js'

export type MapCell = z.infer<typeof mapCellSchema>
export type OtterMap = z.infer<typeof mapSchema>
export type OtterfileManifest = z.infer<typeof manifestSchema>
export type StateVariable = z.infer<typeof stateVariableSchema>
export type OtterfileContent = z.infer<typeof contentSchema>
export type OtterfileDocument = z.infer<typeof otterfileDocumentSchema>

export interface PackedOtterfile {
  /** Raw zip bytes of the `.otterfile` container. */
  bytes: Uint8Array
}

export interface UnpackedOtterfile {
  document: OtterfileDocument
  cartridge: unknown | null
}

export class OtterfileError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'OtterfileError'
  }
}
