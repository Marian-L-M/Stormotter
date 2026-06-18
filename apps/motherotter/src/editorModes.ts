export const EDITOR_MODES = [
  'storylines',
  'dialogs',
  'quests',
  'journal',
  'state',
  'maps',
  'de-otterer',
  'characters',
  'character-types',
  'character-classes',
  'media',
  'audio-profiles',
  'items',
  'containers',
  'abilities',
  'animations',
  'attributes',
  'triggers',
  'gameplay',
  'rules',
  'settings',
  'files',
] as const

export type EditorMode = (typeof EDITOR_MODES)[number]

export type CharacterSectionMode = 'characters' | 'character-types' | 'character-classes'

export type SidebarNavGroupId =
  | 'gameplay'
  | 'maps'
  | 'de-otterer'
  | 'characters'
  | 'assets'
  | 'items'
  | 'mechanics'
  | 'system'

export interface SidebarNavGroup {
  type: 'group'
  id: SidebarNavGroupId
  label: string
  children: { id: EditorMode; label: string }[]
}

export type SidebarNavEntry = SidebarNavGroup

export const SIDEBAR_NAV: SidebarNavEntry[] = [
  {
    type: 'group',
    id: 'gameplay',
    label: 'Gameplay',
    children: [
      { id: 'storylines', label: 'Storylines' },
      { id: 'dialogs', label: 'Dialogs' },
      { id: 'quests', label: 'Quests' },
      { id: 'journal', label: 'Journal' },
      { id: 'state', label: 'State' },
    ],
  },
  {
    type: 'group',
    id: 'maps',
    label: 'Maps',
    children: [{ id: 'maps', label: 'Maps' }],
  },
  {
    type: 'group',
    id: 'de-otterer',
    label: 'De-Otterer',
    children: [{ id: 'de-otterer', label: 'Icon library' }],
  },
  {
    type: 'group',
    id: 'characters',
    label: 'Characters',
    children: [
      { id: 'characters', label: 'Characters' },
      { id: 'character-types', label: 'Character Types' },
      { id: 'character-classes', label: 'Character Classes' },
    ],
  },
  {
    type: 'group',
    id: 'assets',
    label: 'Assets',
    children: [
      { id: 'media', label: 'Media Library' },
      { id: 'audio-profiles', label: 'Audio Profiles' },
    ],
  },
  {
    type: 'group',
    id: 'items',
    label: 'Items',
    children: [
      { id: 'items', label: 'Items' },
      { id: 'containers', label: 'Containers' },
    ],
  },
  {
    type: 'group',
    id: 'mechanics',
    label: 'Mechanics',
    children: [
      { id: 'abilities', label: 'Abilities' },
      { id: 'animations', label: 'Animations' },
      { id: 'attributes', label: 'Attributes' },
      { id: 'triggers', label: 'Triggers' },
      { id: 'gameplay', label: 'Gameplay' },
      { id: 'rules', label: 'Rules' },
    ],
  },
  {
    type: 'group',
    id: 'system',
    label: 'System',
    children: [
      { id: 'settings', label: 'Settings' },
      { id: 'files', label: 'Files' },
    ],
  },
]

const MODE_LABELS: Record<EditorMode, string> = {
  storylines: 'Storylines',
  dialogs: 'Dialogs',
  quests: 'Quests',
  journal: 'Journal',
  state: 'State',
  maps: 'Maps',
  'de-otterer': 'De-Otterer',
  characters: 'Characters',
  'character-types': 'Character Types',
  'character-classes': 'Character Classes',
  media: 'Media Library',
  'audio-profiles': 'Audio Profiles',
  items: 'Items',
  containers: 'Containers',
  abilities: 'Abilities',
  animations: 'Animations',
  attributes: 'Attributes',
  triggers: 'Triggers',
  gameplay: 'Gameplay',
  rules: 'Rules',
  settings: 'Settings',
  files: 'Files',
}

export function getEditorModeLabel(mode: EditorMode): string {
  return MODE_LABELS[mode] ?? mode
}

export function isEditorMode(value: string): value is EditorMode {
  return value in MODE_LABELS
}

export function isCharacterSectionMode(mode: EditorMode): mode is CharacterSectionMode {
  return mode === 'characters' || mode === 'character-types' || mode === 'character-classes'
}

export function normalizeEditorMode(mode: string): EditorMode {
  if (mode === 'races' || mode === 'classes') return 'character-types'
  if (mode === 'stories') return 'storylines'
  return isEditorMode(mode) ? mode : 'maps'
}
