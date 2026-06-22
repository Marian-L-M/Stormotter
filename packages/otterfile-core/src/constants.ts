/** Maximum map width/height in cells. */
export const MAX_MAP_DIMENSION = 1000

/** Maximum named layers per map. */
export const MAX_LAYER_COUNT = 16

/** Current otterfile format version. Bump with migrations on breaking changes. */
export const FORMAT_VERSION = '0.2.0'

export const MANIFEST_PATH = 'manifest.json'
export const MAPS_DIR = 'maps'
export const ASSETS_DIR = 'assets'
export const RUNTIME_DIR = 'runtime'
export const CARTRIDGE_PATH = `${RUNTIME_DIR}/cartridge.json`

/** Authored content domains travel under this directory, one file per domain. */
export const CONTENT_DIR = 'content'
export const STATE_VARIABLES_PATH = `${CONTENT_DIR}/state-variables.json`
