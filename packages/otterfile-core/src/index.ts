/** Current otterfile format version. Bump with migrations on breaking changes. */
export {
  CARTRIDGE_PATH,
  CONTENT_DIR,
  FORMAT_VERSION,
  MAX_LAYER_COUNT,
  MAX_MAP_DIMENSION,
  RUNTIME_DIR,
  STATE_VARIABLES_PATH,
} from './constants.js'

export { packOtterfile, unpackOtterfile } from './pack.js'
export {
  contentSchema,
  mapCellSchema,
  mapSchema,
  manifestSchema,
  otterfileDocumentSchema,
  parseMap,
  parseManifest,
  parseOtterfileDocument,
  parseStateVariables,
  stateVariableSchema,
  withCurrentFormatVersion,
} from './schemas.js'
export { migrateManifest, OtterfileUnsupportedVersionError } from './migrate.js'

export type {
  MapCell,
  OtterMap,
  OtterfileContent,
  OtterfileDocument,
  OtterfileManifest,
  PackedOtterfile,
  StateVariable,
  UnpackedOtterfile,
} from './types.js'
export { OtterfileError } from './types.js'
