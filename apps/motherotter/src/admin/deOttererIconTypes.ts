import type { MapRenderEngine } from './renderEngineTypes'

/** Serializable icon passed to renderers for tile decoration. */
export interface DeOttererIconSnapshot {
  viewBox: string
  paths: string[]
  fill: string
  stroke: string
  strokeWidth: number
}

export interface DeOttererIcon extends DeOttererIconSnapshot {
  id: string
  label: string
  renderEngine: MapRenderEngine
}

/** @deprecated Legacy glyph-only icon shape from earlier builds. */
export interface LegacyDeOttererIcon {
  id: string
  label: string
  glyph?: string
  renderEngine?: MapRenderEngine
}

export const DEFAULT_DE_OTTERER_ICON_STYLE = {
  viewBox: '0 0 24 24',
  fill: '#8aa4c8',
  stroke: '#4a6fa5',
  strokeWidth: 1.5,
} as const

export const BUILTIN_DE_OTTERER_ICONS: DeOttererIcon[] = [
  {
    id: 'dot',
    label: 'Dot',
    renderEngine: 'de-otterer',
    viewBox: '0 0 24 24',
    paths: ['M12 12 m-3.5 0 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0'],
    fill: '#9aa3ad',
    stroke: '#6b7280',
    strokeWidth: 1.25,
  },
  {
    id: 'grass',
    label: 'Grass',
    renderEngine: 'de-otterer',
    viewBox: '0 0 24 24',
    paths: [
      'M7 20 V11 Q7 7 9 5',
      'M12 20 V9 Q12 5 12 3',
      'M17 20 V12 Q17 8 15 6',
    ],
    fill: 'none',
    stroke: '#5a9e5a',
    strokeWidth: 1.75,
  },
  {
    id: 'water',
    label: 'Water',
    renderEngine: 'de-otterer',
    viewBox: '0 0 24 24',
    paths: ['M3 14 Q7 10 12 14 T21 14', 'M3 18 Q7 14 12 18 T21 18'],
    fill: 'none',
    stroke: '#5b9bd5',
    strokeWidth: 1.75,
  },
  {
    id: 'stone',
    label: 'Stone',
    renderEngine: 'de-otterer',
    viewBox: '0 0 24 24',
    paths: ['M8 9 h8 q3 0 3 3 v5 q0 3 -3 3 H8 q-3 0 -3 -3 v-5 q0 -3 3 -3'],
    fill: '#8a8f98',
    stroke: '#5c6370',
    strokeWidth: 1.25,
  },
  {
    id: 'tree',
    label: 'Tree',
    renderEngine: 'de-otterer',
    viewBox: '0 0 24 24',
    paths: ['M11 20 v-5 h2 v5', 'M12 4 L18 15 H6 Z'],
    fill: '#5a9e5a',
    stroke: '#3d7a3d',
    strokeWidth: 1.25,
  },
  {
    id: 'fire',
    label: 'Fire',
    renderEngine: 'de-otterer',
    viewBox: '0 0 24 24',
    paths: ['M12 21 Q8 15 10 11 Q12 7 12 4 Q14 7 14 11 Q16 15 12 21'],
    fill: '#e07a3a',
    stroke: '#c45c1a',
    strokeWidth: 1.25,
  },
  {
    id: 'star',
    label: 'Star',
    renderEngine: 'de-otterer',
    viewBox: '0 0 24 24',
    paths: [
      'M12 4 L14.2 9.8 L20.5 10.3 L15.8 14.2 L17.2 20.5 L12 17.5 L6.8 20.5 L8.2 14.2 L3.5 10.3 L9.8 9.8 Z',
    ],
    fill: '#d4b44a',
    stroke: '#a88a24',
    strokeWidth: 1.25,
  },
  {
    id: 'heart',
    label: 'Heart',
    renderEngine: 'de-otterer',
    viewBox: '0 0 24 24',
    paths: [
      'M12 20 C8 15.5 5 13 5 10 C5 7.5 6.8 6 8.6 6 C10.1 6 11.2 7 12 8.4 C12.8 7 13.9 6 15.4 6 C17.2 6 19 7.5 19 10 C19 13 16 15.5 12 20',
    ],
    fill: '#d96b7a',
    stroke: '#b84a59',
    strokeWidth: 1.25,
  },
  {
    id: 'stickman',
    label: 'Stick figure',
    renderEngine: 'de-otterer',
    viewBox: '0 0 24 24',
    paths: [
      'M12 5 m-2.25 0 a 2.25 2.25 0 1 0 4.5 0 a 2.25 2.25 0 1 0 -4.5 0',
      'M12 7.5 V14',
      'M8 10.5 H16',
      'M12 14 L9.5 19.5',
      'M12 14 L14.5 19.5',
    ],
    fill: 'none',
    stroke: '#c8d4e8',
    strokeWidth: 1.75,
  },
  {
    id: 'treasure-chest',
    label: 'Treasure chest',
    renderEngine: 'de-otterer',
    viewBox: '0 0 24 24',
    paths: ['M5 11 H19 V18 H5 Z', 'M5 11 Q12 7 19 11', 'M11 14 H13 V16 H11 Z'],
    fill: '#c49a3a',
    stroke: '#8a6a22',
    strokeWidth: 1.25,
  },
  {
    id: 'event-star',
    label: 'Event star',
    renderEngine: 'de-otterer',
    viewBox: '0 0 24 24',
    paths: [
      'M12 4 L14.2 9.8 L20.5 10.3 L15.8 14.2 L17.2 20.5 L12 17.5 L6.8 20.5 L8.2 14.2 L3.5 10.3 L9.8 9.8 Z',
    ],
    fill: '#f5d547',
    stroke: '#e0b820',
    strokeWidth: 1.25,
  },
  {
    id: 'map-entrance',
    label: 'Map entrance',
    renderEngine: 'de-otterer',
    viewBox: '0 0 24 24',
    paths: [
      'M5 20 V10 Q12 4 19 10 V20',
      'M5 20 H19',
      'M11 13 H16',
      'M14 10.5 L16.5 13 L14 15.5',
    ],
    fill: '#5a7a9a',
    stroke: '#3d5870',
    strokeWidth: 1.25,
  },
]

export function createDeOttererIconId(): string {
  return `icon-${crypto.randomUUID().slice(0, 8)}`
}

export function createDeOttererIcon(label: string): DeOttererIcon {
  return {
    id: createDeOttererIconId(),
    label: label.trim() || 'Icon',
    renderEngine: 'de-otterer',
    viewBox: DEFAULT_DE_OTTERER_ICON_STYLE.viewBox,
    paths: ['M12 12 m-4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0'],
    fill: DEFAULT_DE_OTTERER_ICON_STYLE.fill,
    stroke: DEFAULT_DE_OTTERER_ICON_STYLE.stroke,
    strokeWidth: DEFAULT_DE_OTTERER_ICON_STYLE.strokeWidth,
  }
}

export function toDeOttererIconSnapshot(icon: DeOttererIconSnapshot): DeOttererIconSnapshot {
  return {
    viewBox: icon.viewBox,
    paths: [...icon.paths],
    fill: icon.fill,
    stroke: icon.stroke,
    strokeWidth: icon.strokeWidth,
  }
}

export function normalizeDeOttererIcon(raw: LegacyDeOttererIcon | DeOttererIcon): DeOttererIcon {
  if ('paths' in raw && Array.isArray(raw.paths) && raw.paths.length > 0) {
    return {
      id: raw.id,
      label: raw.label,
      renderEngine: raw.renderEngine ?? 'de-otterer',
      viewBox: raw.viewBox ?? DEFAULT_DE_OTTERER_ICON_STYLE.viewBox,
      paths: [...raw.paths],
      fill: raw.fill ?? DEFAULT_DE_OTTERER_ICON_STYLE.fill,
      stroke: raw.stroke ?? DEFAULT_DE_OTTERER_ICON_STYLE.stroke,
      strokeWidth: raw.strokeWidth ?? DEFAULT_DE_OTTERER_ICON_STYLE.strokeWidth,
    }
  }

  const migrated = createDeOttererIcon(raw.label || 'Icon')
  migrated.id = raw.id
  return migrated
}

export function mergeDeOttererIcons(custom: DeOttererIcon[]): DeOttererIcon[] {
  const byId = new Map<string, DeOttererIcon>()
  for (const icon of BUILTIN_DE_OTTERER_ICONS) {
    byId.set(icon.id, icon)
  }
  for (const icon of custom) {
    if (icon.renderEngine !== 'de-otterer') continue
    byId.set(icon.id, icon)
  }
  return [...byId.values()]
}

export function buildDeOttererIconLibrary(icons: DeOttererIcon[]): Record<string, DeOttererIconSnapshot> {
  const library: Record<string, DeOttererIconSnapshot> = {}
  for (const icon of icons) {
    library[icon.id] = toDeOttererIconSnapshot(icon)
  }
  return library
}
