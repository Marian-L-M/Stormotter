import type { DeOttererIcon } from '../../admin/deOttererIconTypes'
import { DeOttererIconSvg } from '../de-otterer/DeOttererIconSvg'
import { useEditorStore } from '../../store/editorStore'

interface MapCellStatusToolPanelProps {
  iconOptions: DeOttererIcon[]
}

export function MapCellStatusToolPanel({ iconOptions }: MapCellStatusToolPanelProps) {
  const selectedTileKeys = useEditorStore((state) => state.selectedTileKeys)
  const setSelectedTilesPassable = useEditorStore((state) => state.setSelectedTilesPassable)
  const applyTileBackgroundColor = useEditorStore((state) => state.applyTileBackgroundColor)
  const applyTileBackgroundIcon = useEditorStore((state) => state.applyTileBackgroundIcon)

  const disabled = selectedTileKeys.length === 0

  return (
    <div className="map-cell-status-panel">
      <fieldset className="map-cell-status-fieldset" disabled={disabled}>
        <legend className="map-editor-toolbar-heading">Passability</legend>
        <div className="map-cell-status-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => setSelectedTilesPassable(true)}
          >
            Passable
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => setSelectedTilesPassable(false)}
          >
            Unpassable
          </button>
        </div>
      </fieldset>

      <fieldset className="map-cell-status-fieldset" disabled={disabled}>
        <legend className="map-editor-toolbar-heading">Background color</legend>
        <label className="field map-cell-status-color-field">
          <span>Color (additive)</span>
          <input
            type="color"
            defaultValue="#243047"
            onChange={(event) => applyTileBackgroundColor(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="admin-secondary-button map-cell-status-clear"
          onClick={() => applyTileBackgroundColor(null)}
        >
          Clear color
        </button>
      </fieldset>

      <fieldset className="map-cell-status-fieldset" disabled={disabled}>
        <legend className="map-editor-toolbar-heading">Background icon</legend>
        <p className="field-hint">SVG icons from the De-Otterer library (additive with color).</p>
        <div className="map-cell-status-icon-grid">
          {iconOptions.map((icon) => (
            <button
              key={icon.id}
              type="button"
              className="map-cell-status-icon-button"
              title={icon.label}
              onClick={() => applyTileBackgroundIcon(icon.id)}
            >
              <DeOttererIconSvg icon={icon} size={28} className="map-cell-status-icon-svg" />
              <span className="map-cell-status-icon-label">{icon.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="admin-secondary-button map-cell-status-clear"
          onClick={() => applyTileBackgroundIcon(null)}
        >
          Clear icon
        </button>
      </fieldset>

      {disabled ? (
        <p className="field-hint map-editor-tool-panel-hint">
          Select one or more cells on the grid to edit status.
        </p>
      ) : null}
    </div>
  )
}
