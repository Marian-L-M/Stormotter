import type { EntranceTarget } from '@otter/game-state'
import { formatCellCoordinate } from '../../admin/mapLayerUtils'
import { useEditorStore } from '../../store/editorStore'
import { MapPickerField } from './MapPickerField'

interface MapLocationPickerProps {
  label?: string
  value: EntranceTarget
  onChange: (value: EntranceTarget) => void
}

export function MapLocationPicker({ label = 'Location', value, onChange }: MapLocationPickerProps) {
  const mapId = useEditorStore((state) => state.mapId)
  const maps = useEditorStore((state) => state.maps)
  const currentWorld = useEditorStore((state) => state.world)

  const destinationMap = maps.find((map) => map.id === value.mapId)
  const destinationWorld =
    destinationMap?.world ?? (value.mapId === mapId ? currentWorld : null)

  function update(patch: Partial<EntranceTarget>) {
    onChange({ ...value, ...patch })
  }

  function handleMapChange(nextMapId: string) {
    const nextMap = maps.find((map) => map.id === nextMapId)
    const nextLayers = nextMap?.world.layers ?? currentWorld.layers
    const layer = nextLayers.includes(value.layer) ? value.layer : (nextLayers[0] ?? value.layer)
    update({ mapId: nextMapId, layer })
  }

  function handleCoordinateChange(field: 'x' | 'y', raw: string) {
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return
    const maxW = destinationWorld?.width ?? 256
    const maxH = destinationWorld?.height ?? 256
    const displayX = field === 'x' ? parsed : value.x + 1
    const displayY = field === 'y' ? parsed : value.y + 1
    update({
      x: Math.min(Math.max(1, Math.round(displayX)), maxW) - 1,
      y: Math.min(Math.max(1, Math.round(displayY)), maxH) - 1,
    })
  }

  const layerOptions = destinationWorld?.layers ?? currentWorld.layers

  return (
    <div className="map-location-picker">
      {label ? <span className="map-location-picker-label">{label}</span> : null}
      <MapPickerField label="Map" value={value.mapId} onChange={handleMapChange} />
      <label className="field">
        <span>Layer</span>
        {destinationWorld ? (
          <select
            className="admin-select admin-select-block"
            value={value.layer}
            onChange={(event) => update({ layer: event.target.value })}
          >
            {layerOptions.map((layer) => (
              <option key={layer} value={layer}>
                {layer}
              </option>
            ))}
          </select>
        ) : (
          <input value={value.layer} onChange={(event) => update({ layer: event.target.value })} />
        )}
      </label>
      <div className="map-editor-dimension-grid">
        <label className="field">
          <span>X</span>
          <input
            type="number"
            min={1}
            max={destinationWorld?.width ?? 256}
            value={value.x + 1}
            onChange={(event) => handleCoordinateChange('x', event.target.value)}
          />
        </label>
        <label className="field">
          <span>Y</span>
          <input
            type="number"
            min={1}
            max={destinationWorld?.height ?? 256}
            value={value.y + 1}
            onChange={(event) => handleCoordinateChange('y', event.target.value)}
          />
        </label>
      </div>
      <p className="field-hint">{formatCellCoordinate(value.x, value.y)} on {value.layer}</p>
    </div>
  )
}
