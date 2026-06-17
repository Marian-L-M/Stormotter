export const MAP_TOOL_KINDS = [
  { kind: 'select', label: 'Select', glyph: '↖', contentType: 'Select and move objects' },
  { kind: 'character', label: 'Character', glyph: '@', contentType: 'Character spawn' },
  { kind: 'item', label: 'Item', glyph: '*', contentType: 'Item pickup' },
  { kind: 'container', label: 'Container', glyph: '#', contentType: 'Container' },
  { kind: 'entrance', label: 'Entrance', glyph: '>', contentType: 'Map entrance', deOttererIconId: 'map-entrance' },
  { kind: 'spawn-point', label: 'Spawn point', glyph: 'S', contentType: 'Conditional spawn' },
  {
    kind: 'event',
    label: 'Event',
    glyph: '★',
    contentType: 'Event marker',
    deOttererIconId: 'event-star',
  },
  { kind: 'cell-status', label: 'Cell status', glyph: '▦', contentType: 'Tile passability' },
] as const

export type MapToolKind = (typeof MAP_TOOL_KINDS)[number]['kind']

export const DEFAULT_MAP_TOOL_KIND: MapToolKind = MAP_TOOL_KINDS[0].kind

const LEGACY_PLACEHOLDER_ENTITY_IDS = new Set(['hero', 'loot', 'chest', 'door'])

/** @deprecated Legacy persisted tool id — use mapToolKind + mapPlacementEntityId. */
export type EditorTool = `${MapToolKind}:${string}` | 'erase'

export const DEFAULT_EDITOR_TOOL: EditorTool = 'character:hero'

export function buildContentId(kind: MapToolKind, entityId: string): string {
  return `${kind}:${entityId}`
}

export function parseContentId(contentId: string): { kind: string; entityId: string } {
  const colon = contentId.indexOf(':')
  if (colon < 0) return { kind: 'unknown', entityId: contentId }
  return {
    kind: contentId.slice(0, colon),
    entityId: contentId.slice(colon + 1),
  }
}

export function isMapToolKind(value: string): value is MapToolKind {
  return MAP_TOOL_KINDS.some((entry) => entry.kind === value)
}

export function migrateLegacySelectedTool(tool: string): {
  kind: MapToolKind
  placementEntityId: string | null
} {
  if (tool === 'erase') {
    return { kind: DEFAULT_MAP_TOOL_KIND, placementEntityId: null }
  }

  const parsed = parseContentId(tool)
  if (!isMapToolKind(parsed.kind)) {
    return { kind: DEFAULT_MAP_TOOL_KIND, placementEntityId: null }
  }

  if (LEGACY_PLACEHOLDER_ENTITY_IDS.has(parsed.entityId)) {
    return { kind: parsed.kind, placementEntityId: null }
  }

  return { kind: parsed.kind, placementEntityId: parsed.entityId }
}

export function getMapToolMeta(kind: MapToolKind) {
  return MAP_TOOL_KINDS.find((entry) => entry.kind === kind) ?? MAP_TOOL_KINDS[0]
}
