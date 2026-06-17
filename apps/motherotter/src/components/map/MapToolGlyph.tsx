import { useMemo } from 'react'
import type { IconLibraryMap } from '@otter/renderer-api'
import { buildDeOttererIconLibrary, mergeDeOttererIcons } from '../../admin/deOttererIconTypes'
import { getMapToolMeta, type MapToolKind } from '../../editorTools'
import { DeOttererIconSvg } from '../de-otterer/DeOttererIconSvg'
import { useDeOttererIconsStore } from '../../store/deOttererIconsStore'

interface MapToolGlyphProps {
  kind: MapToolKind
  className?: string
  iconLibrary?: IconLibraryMap
  size?: number
}

export function MapToolGlyph({
  kind,
  className = 'map-editor-tool-glyph',
  iconLibrary: iconLibraryOverride,
  size = 16,
}: MapToolGlyphProps) {
  const customIcons = useDeOttererIconsStore((state) => state.customIcons)
  const iconLibrary = useMemo(() => {
    if (iconLibraryOverride) return iconLibraryOverride
    return buildDeOttererIconLibrary(mergeDeOttererIcons(customIcons))
  }, [customIcons, iconLibraryOverride])

  const tool = getMapToolMeta(kind)
  const iconId = 'deOttererIconId' in tool ? tool.deOttererIconId : null
  const snapshot = iconId ? iconLibrary[iconId] : null

  if (snapshot) {
    return (
      <span className={`${className} map-editor-tool-icon`} aria-hidden="true">
        <DeOttererIconSvg icon={snapshot} size={size} />
      </span>
    )
  }

  return (
    <span className={className} aria-hidden="true">
      {tool.glyph}
    </span>
  )
}
