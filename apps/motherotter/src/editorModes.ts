export const EDITOR_MODES = [
  { id: 'stories', label: 'Stories' },
  { id: 'state', label: 'State' },
  { id: 'maps', label: 'Maps' },
  { id: 'characters', label: 'Characters' },
  { id: 'races', label: 'Races' },
  { id: 'items', label: 'Items' },
  { id: 'containers', label: 'Containers' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'rules', label: 'Rules' },
  { id: 'settings', label: 'Settings' },
  { id: 'files', label: 'Files' },
] as const

export type EditorMode = (typeof EDITOR_MODES)[number]['id']

export function getEditorModeLabel(mode: EditorMode): string {
  return EDITOR_MODES.find((entry) => entry.id === mode)?.label ?? mode
}

export function isEditorMode(value: string): value is EditorMode {
  return EDITOR_MODES.some((mode) => mode.id === value)
}
