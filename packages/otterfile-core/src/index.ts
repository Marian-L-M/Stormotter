/** Current otterfile format version. Bump with migrations on breaking changes. */
export { FORMAT_VERSION, MAX_LAYER_COUNT, MAX_MAP_DIMENSION } from './constants.js'

export { packOtterfile, unpackOtterfile } from './pack.js'
export {
  mapCellSchema,
  mapSchema,
  manifestSchema,
  otterfileDocumentSchema,
  parseMap,
  parseManifest,
  parseOtterfileDocument,
  withCurrentFormatVersion,
} from './schemas.js'
export { migrateManifest, OtterfileUnsupportedVersionError } from './migrate.js'

export type {
  MapCell,
  OtterMap,
  OtterfileDocument,
  OtterfileManifest,
  PackedOtterfile,
} from './types.js'
export { OtterfileError } from './types.js'
