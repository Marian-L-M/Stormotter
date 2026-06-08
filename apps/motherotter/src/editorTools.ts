export const PLACEMENT_TOOLS = [
  { contentId: 'character:hero', label: 'Character', glyph: '@' },
  { contentId: 'item:loot', label: 'Item', glyph: '*' },
  { contentId: 'container:chest', label: 'Container', glyph: '#' },
  { contentId: 'entrance:door', label: 'Entrance', glyph: '>' },
] as const

export type EditorTool = (typeof PLACEMENT_TOOLS)[number]['contentId'] | 'erase'

export const DEFAULT_EDITOR_TOOL: EditorTool = PLACEMENT_TOOLS[0].contentId
