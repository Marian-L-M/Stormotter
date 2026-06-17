import type { DeOttererIconSnapshot, IconLibraryMap } from '@otter/renderer-api'
import { parseContentId } from '../editorTools'
import { DE_OTTERER_BUILTIN_ICON_IDS } from './deOttererBuiltinIconIds'
import type { DeOttererEntityRendererSettings } from './entityRendererTypes'

export interface CellEntityAppearance {
  glyph: string | null
  icon: DeOttererIconSnapshot | null
}

function snapshotFromLibrary(
  iconLibrary: IconLibraryMap,
  iconId: string,
  overrides: Pick<DeOttererEntityRendererSettings, 'fill' | 'stroke' | 'strokeWidth'>,
): DeOttererIconSnapshot | null {
  const base = iconLibrary[iconId]
  if (!base) return null
  return {
    viewBox: base.viewBox,
    paths: [...base.paths],
    fill: overrides.fill ?? base.fill,
    stroke: overrides.stroke ?? base.stroke,
    strokeWidth: overrides.strokeWidth ?? base.strokeWidth,
  }
}

export function resolveDeOttererEntityAppearance(
  settings: DeOttererEntityRendererSettings | undefined,
  iconLibrary: IconLibraryMap,
  fallbackGlyph: string,
  defaultIconId: string | null,
): CellEntityAppearance {
  const effective =
    settings ??
    (defaultIconId
      ? ({
          glyph: null,
          iconId: defaultIconId,
          fill: null,
          stroke: null,
          strokeWidth: null,
        } satisfies DeOttererEntityRendererSettings)
      : ({
          glyph: fallbackGlyph,
          iconId: null,
          fill: null,
          stroke: null,
          strokeWidth: null,
        } satisfies DeOttererEntityRendererSettings))

  if (effective.iconId) {
    const icon = snapshotFromLibrary(iconLibrary, effective.iconId, effective)
    if (icon) return { glyph: null, icon }
  }

  return {
    glyph: effective.glyph ?? fallbackGlyph,
    icon: null,
  }
}

export function resolveCharacterCellAppearance(
  settings: DeOttererEntityRendererSettings | undefined,
  iconLibrary: IconLibraryMap,
): CellEntityAppearance {
  return resolveDeOttererEntityAppearance(
    settings,
    iconLibrary,
    '@',
    DE_OTTERER_BUILTIN_ICON_IDS.stickman,
  )
}

export function resolveItemCellAppearance(
  settings: DeOttererEntityRendererSettings | undefined,
  iconLibrary: IconLibraryMap,
): CellEntityAppearance {
  return resolveDeOttererEntityAppearance(
    settings,
    iconLibrary,
    '*',
    DE_OTTERER_BUILTIN_ICON_IDS.treasureChest,
  )
}

export function resolveEventCellAppearance(iconLibrary: IconLibraryMap): CellEntityAppearance {
  return resolveDeOttererEntityAppearance(
    {
      glyph: null,
      iconId: DE_OTTERER_BUILTIN_ICON_IDS.eventStar,
      fill: null,
      stroke: null,
      strokeWidth: null,
    },
    iconLibrary,
    '★',
    DE_OTTERER_BUILTIN_ICON_IDS.eventStar,
  )
}

export function resolveEntranceCellAppearance(iconLibrary: IconLibraryMap): CellEntityAppearance {
  return resolveDeOttererEntityAppearance(
    {
      glyph: null,
      iconId: DE_OTTERER_BUILTIN_ICON_IDS.mapEntrance,
      fill: null,
      stroke: null,
      strokeWidth: null,
    },
    iconLibrary,
    '>',
    DE_OTTERER_BUILTIN_ICON_IDS.mapEntrance,
  )
}

const PLACED_CELL_GLYPHS: Record<string, string> = {
  character: '@',
  item: '*',
  container: '#',
  entrance: '>',
  spawn: 'S',
  event: '★',
}

export function resolvePlacedCellAppearance(
  contentId: string,
  resolved: Record<string, CellEntityAppearance>,
): CellEntityAppearance {
  const known = resolved[contentId]
  if (known) return known
  const kind = parseContentId(contentId).kind
  return { glyph: PLACED_CELL_GLYPHS[kind] ?? '?', icon: null }
}
