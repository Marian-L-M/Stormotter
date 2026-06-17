import { MapPreviewPanel } from '../../components/map/preview/MapPreviewPanel'
import { useEditorStore } from '../../store/editorStore'

export function MapPreviewView() {
  const title = useEditorStore((state) => state.title)
  const mapId = useEditorStore((state) => state.mapId)
  const previewSessionKey = useEditorStore((state) => state.mapPreviewSessionKey)
  const closeMapPreview = useEditorStore((state) => state.closeMapPreview)

  return (
    <div className="map-preview-fullpage">
      <header className="map-preview-header">
        <button type="button" className="map-preview-back-button" onClick={closeMapPreview}>
          ← Back to editor
        </button>
        <div className="map-preview-header-title">
          <h1>{title || 'Untitled map'}</h1>
          <p className="field-hint">Preview · {mapId}</p>
        </div>
      </header>
      <MapPreviewPanel sessionKey={previewSessionKey} />
    </div>
  )
}
