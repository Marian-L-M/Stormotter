import type { EntranceTarget } from '@otter/game-state'
import { formatCellCoordinate } from '../../admin/mapLayerUtils'
import { useEditorStore } from '../../store/editorStore'
import { MapPickerField } from './MapPickerField'

interface MapEntranceToolPanelProps {
  draft: EntranceTarget
  onChange: (draft: EntranceTarget) => void
}

export function MapEntranceToolPanel({ draft, onChange }: MapEntranceToolPanelProps) {
  const mapId = useEditorStore((state) => state.mapId)
  const maps = useEditorStore((state) => state.maps)
  const currentWorld = useEditorStore((state) => state.world)

  const destinationMap = maps.find((map) => map.id === draft.mapId)
  const destinationWorld =
    destinationMap?.world ?? (draft.mapId === mapId ? currentWorld : null)

  function updateTarget(patch: Partial<EntranceTarget>) {
    onChange({ ...draft, ...patch })
  }

  function handleMapChange(nextMapId: string) {
    const nextMap = maps.find((map) => map.id === nextMapId)
    const nextLayers = nextMap?.world.layers ?? currentWorld.layers
    const layer = nextLayers.includes(draft.layer) ? draft.layer : (nextLayers[0] ?? draft.layer)
    updateTarget({ mapId: nextMapId, layer })
  }

  function handleCoordinateChange(field: 'x' | 'y', raw: string) {
    const value = Number(raw)
    if (!Number.isFinite(value)) return
    const displayX = field === 'x' ? value : draft.x + 1
    const displayY = field === 'y' ? value : draft.y + 1
    const maxW = destinationWorld?.width ?? 256
    const maxH = destinationWorld?.height ?? 256
    updateTarget({
      x: Math.min(Math.max(1, Math.round(displayX)), maxW) - 1,
      y: Math.min(Math.max(1, Math.round(displayY)), maxH) - 1,
    })
  }

  const layerOptions = destinationWorld?.layers ?? currentWorld.layers

  return (
    <div className="map-entrance-tool-panel">
      <p className="field-hint">
        Set where this entrance leads, then click an empty cell to place it.
      </p>

      <MapPickerField
        label="Destination map"
        value={draft.mapId}
        onChange={handleMapChange}
        modalTitle="Select destination map"
        hint="Choose which map this entrance connects to."
      />

      <label className="field">
        <span>Destination layer</span>
        {destinationWorld ? (
          <select
            className="admin-select admin-select-block"
            value={draft.layer}
            onChange={(event) => updateTarget({ layer: event.target.value })}
          >
            {layerOptions.map((layer) => (
              <option key={layer} value={layer}>
                {layer}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={draft.layer}
            onChange={(event) => updateTarget({ layer: event.target.value })}
            placeholder="ground"
          />
        )}
      </label>

      <div className="map-editor-dimension-grid">
        <label className="field">
          <span>Destination X</span>
          <input
            type="number"
            min={1}
            max={destinationWorld?.width ?? 256}
            value={draft.x + 1}
            onChange={(event) => handleCoordinateChange('x', event.target.value)}
          />
        </label>
        <label className="field">
          <span>Destination Y</span>
          <input
            type="number"
            min={1}
            max={destinationWorld?.height ?? 256}
            value={draft.y + 1}
            onChange={(event) => handleCoordinateChange('y', event.target.value)}
          />
        </label>
      </div>

      <p className="field-hint">
        Target cell: {formatCellCoordinate(draft.x, draft.y)} on {draft.layer}
        {draft.mapId === mapId ? '' : ` (${destinationMap?.title ?? draft.mapId})`}
      </p>
    </div>
  )
}

interface MapEntranceInspectorProps {
  target: EntranceTarget
  onChange: (target: EntranceTarget) => void
}

export function MapEntranceInspector({ target, onChange }: MapEntranceInspectorProps) {
  return (
    <div className="map-entrance-inspector">
      <h3 className="map-cell-inspector-subheading">Entrance destination</h3>
      <MapEntranceToolPanel draft={target} onChange={onChange} />
    </div>
  )
}
