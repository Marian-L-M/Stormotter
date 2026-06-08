import { MapCanvas } from '../../components/MapCanvas'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { PLACEMENT_TOOLS, useEditorStore } from '../../store/editorStore'

export function MapEditorView() {
  const mapId = useEditorStore((state) => state.mapId)
  const title = useEditorStore((state) => state.title)
  const world = useEditorStore((state) => state.world)
  const activeLayer = useEditorStore((state) => state.activeLayer)
  const selectedTool = useEditorStore((state) => state.selectedTool)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const setActiveLayer = useEditorStore((state) => state.setActiveLayer)
  const setSelectedTool = useEditorStore((state) => state.setSelectedTool)

  return (
    <AdminEditorShell
      listLabel="Maps"
      itemTitle={`${title} (${mapId})`}
      onBack={closeEntityEditor}
    >
      <p className="admin-editor-lead">
        Place content on the grid for the active layer. Cells are stored sparsely.
      </p>

      <div className="admin-editor-section">
        <div className="panel-header">
          <h3>Tools</h3>
          <span className="muted">
            {world.width}×{world.height} · {world.cells.size} cells
          </span>
        </div>
        <div className="tool-grid">
          {PLACEMENT_TOOLS.map((tool) => (
            <button
              key={tool.contentId}
              type="button"
              className={selectedTool === tool.contentId ? 'active' : undefined}
              onClick={() => setSelectedTool(tool.contentId)}
            >
              <span className="tool-glyph">{tool.glyph}</span>
              {tool.label}
            </button>
          ))}
          <button
            type="button"
            className={selectedTool === 'erase' ? 'active' : undefined}
            onClick={() => setSelectedTool('erase')}
          >
            <span className="tool-glyph">·</span>
            Erase
          </button>
        </div>
      </div>

      <div className="admin-editor-section">
        <div className="panel-header">
          <h3>Layer</h3>
        </div>
        <div className="layer-tabs" role="tablist" aria-label="Map layers">
          {world.layers.map((layer) => (
            <button
              key={layer}
              type="button"
              role="tab"
              aria-selected={layer === activeLayer}
              className={layer === activeLayer ? 'active' : undefined}
              onClick={() => setActiveLayer(layer)}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>

      <MapCanvas />
    </AdminEditorShell>
  )
}
