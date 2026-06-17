import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CellEntityAppearance } from '@otter/renderer-api'
import { DeOttererIconSvg } from '../de-otterer/DeOttererIconSvg'

interface MapSelectionCursorGhostProps {
  active: boolean
  appearance: CellEntityAppearance | null
}

export function MapSelectionCursorGhost({ active, appearance }: MapSelectionCursorGhostProps) {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!active) {
      setCursor(null)
      return
    }

    function onMouseMove(event: MouseEvent) {
      setCursor({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [active])

  if (!active || !cursor || !appearance) return null

  return createPortal(
    <div
      className="map-selection-cursor-ghost"
      style={{ left: cursor.x, top: cursor.y }}
      aria-hidden="true"
    >
      {appearance.icon ? (
        <DeOttererIconSvg icon={appearance.icon} size={24} />
      ) : appearance.glyph ? (
        <span className="map-selection-cursor-glyph">{appearance.glyph}</span>
      ) : null}
    </div>,
    document.body,
  )
}
