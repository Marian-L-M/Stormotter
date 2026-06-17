export const MAP_RENDER_ENGINES = [{ id: 'de-otterer', label: 'De-Otterer' }] as const

export type MapRenderEngine = (typeof MAP_RENDER_ENGINES)[number]['id']

export const DEFAULT_MAP_RENDER_ENGINE: MapRenderEngine = 'de-otterer'

export function isMapRenderEngine(value: string): value is MapRenderEngine {
  return MAP_RENDER_ENGINES.some((entry) => entry.id === value)
}

export function getMapRenderEngineLabel(engine: MapRenderEngine): string {
  return MAP_RENDER_ENGINES.find((entry) => entry.id === engine)?.label ?? engine
}
