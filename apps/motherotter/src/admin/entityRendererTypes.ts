import { DE_OTTERER_BUILTIN_ICON_IDS } from './deOttererBuiltinIconIds'
import type { MapRenderEngine } from './renderEngineTypes'

export interface DeOttererEntityRendererSettings {
  /** Single-character grid glyph when no icon is selected. */
  glyph: string | null
  /** De-Otterer icon library entry id. */
  iconId: string | null
  fill: string | null
  stroke: string | null
  strokeWidth: number | null
}

export type EntityRendererSettings = Partial<Record<MapRenderEngine, DeOttererEntityRendererSettings>>

export function createEmptyDeOttererEntityRenderer(
  defaultGlyph: string,
): DeOttererEntityRendererSettings {
  return {
    glyph: defaultGlyph,
    iconId: null,
    fill: null,
    stroke: null,
    strokeWidth: null,
  }
}

export function createDefaultCharacterDeOttererRenderer(): DeOttererEntityRendererSettings {
  return {
    glyph: null,
    iconId: DE_OTTERER_BUILTIN_ICON_IDS.stickman,
    fill: null,
    stroke: null,
    strokeWidth: null,
  }
}

export function createDefaultItemDeOttererRenderer(): DeOttererEntityRendererSettings {
  return {
    glyph: null,
    iconId: DE_OTTERER_BUILTIN_ICON_IDS.treasureChest,
    fill: null,
    stroke: null,
    strokeWidth: null,
  }
}

function hasDeOttererRendererConfig(raw: Partial<EntityRendererSettings> | undefined): boolean {
  const deOtterer = raw?.['de-otterer']
  if (!deOtterer) return false
  return (
    deOtterer.iconId != null ||
    deOtterer.glyph != null ||
    deOtterer.fill != null ||
    deOtterer.stroke != null ||
    deOtterer.strokeWidth != null
  )
}

export function normalizeDeOttererEntityRenderer(
  raw: Partial<DeOttererEntityRendererSettings> | undefined,
  defaultGlyph: string,
): DeOttererEntityRendererSettings {
  if (!raw) return createEmptyDeOttererEntityRenderer(defaultGlyph)
  return {
    glyph: raw.glyph != null ? raw.glyph.slice(0, 1) : defaultGlyph,
    iconId: raw.iconId ?? null,
    fill: raw.fill ?? null,
    stroke: raw.stroke ?? null,
    strokeWidth:
      raw.strokeWidth === null || raw.strokeWidth === undefined
        ? null
        : Number.isFinite(raw.strokeWidth)
          ? raw.strokeWidth
          : null,
  }
}

export function normalizeEntityRendererSettings(
  raw: Partial<EntityRendererSettings> | undefined,
  defaultGlyph: string,
): EntityRendererSettings {
  if (!raw) return {}
  const deOtterer = raw['de-otterer']
  if (!deOtterer) return {}
  return {
    'de-otterer': normalizeDeOttererEntityRenderer(deOtterer, defaultGlyph),
  }
}

export function normalizeCharacterEntityRenderer(
  raw: Partial<EntityRendererSettings> | undefined,
): EntityRendererSettings {
  if (!hasDeOttererRendererConfig(raw)) {
    return { 'de-otterer': createDefaultCharacterDeOttererRenderer() }
  }
  return {
    'de-otterer': normalizeDeOttererEntityRenderer(raw!['de-otterer'], '@'),
  }
}

export function normalizeItemEntityRenderer(
  raw: Partial<EntityRendererSettings> | undefined,
): EntityRendererSettings {
  if (!hasDeOttererRendererConfig(raw)) {
    return { 'de-otterer': createDefaultItemDeOttererRenderer() }
  }
  return {
    'de-otterer': normalizeDeOttererEntityRenderer(raw!['de-otterer'], '*'),
  }
}

export function patchEntityRendererEngine(
  settings: EntityRendererSettings,
  engine: MapRenderEngine,
  patch: Partial<DeOttererEntityRendererSettings>,
  defaultGlyph: string,
): EntityRendererSettings {
  const current = settings[engine] ?? createEmptyDeOttererEntityRenderer(defaultGlyph)
  return {
    ...settings,
    [engine]: normalizeDeOttererEntityRenderer({ ...current, ...patch }, defaultGlyph),
  }
}
