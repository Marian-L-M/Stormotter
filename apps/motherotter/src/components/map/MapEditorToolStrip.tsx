import { useEditorStore } from '../../store/editorStore'
import { MAP_TOOL_KINDS } from '../../editorTools'
import { MapToolGlyph } from './MapToolGlyph'

export function MapEditorToolStrip() {
  const mapToolKind = useEditorStore((state) => state.mapToolKind)
  const setMapToolKind = useEditorStore((state) => state.setMapToolKind)

  return (
    <div className="map-editor-tool-strip" role="toolbar" aria-label="Map editing tools">
      <ul className="map-editor-tool-strip-list">
        {MAP_TOOL_KINDS.map((tool) => (
          <li key={tool.kind}>
            <button
              type="button"
              className={`map-editor-tool-strip-button${mapToolKind === tool.kind ? ' is-active' : ''}`}
              onClick={() => setMapToolKind(tool.kind)}
              title={tool.contentType}
            >
              <MapToolGlyph kind={tool.kind} />
              <span className="map-editor-tool-label">{tool.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
