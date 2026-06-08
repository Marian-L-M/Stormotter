import { useEffect, useRef } from 'react'
import { toWorldView } from '@otter/renderer-api'
import { createDemoRenderer } from '@otter/renderer-demo'
import type { Renderer } from '@otter/renderer-api'
import { useMediaAssetObjectUrl } from '../hooks/useMediaObjectUrl'
import { useEditorStore } from '../store/editorStore'

export function MapCanvas() {
  const hostRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const world = useEditorStore((state) => state.world)
  const activeLayer = useEditorStore((state) => state.activeLayer)
  const mapBackdropMediaId = useEditorStore((state) => state.mapBackdropMediaId)
  const applyCellClick = useEditorStore((state) => state.applyCellClick)
  const backdropUrl = useMediaAssetObjectUrl(mapBackdropMediaId)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const renderer = createDemoRenderer()
    renderer.mount(host)
    rendererRef.current = renderer

    const unsubscribe = renderer.onIntent((intent) => {
      if (intent.type === 'cellClicked') {
        applyCellClick(intent.x, intent.y, intent.layer)
      }
    })

    return () => {
      unsubscribe()
      renderer.dispose()
      rendererRef.current = null
    }
  }, [applyCellClick])

  useEffect(() => {
    if (!rendererRef.current) return
    rendererRef.current.render(toWorldView(world, activeLayer))
  }, [world, activeLayer])

  return (
    <div className="map-canvas-shell">
      {backdropUrl ? (
        <img src={backdropUrl} alt="" className="map-canvas-backdrop" aria-hidden="true" />
      ) : null}
      <div ref={hostRef} className="renderer-host" />
    </div>
  )
}
