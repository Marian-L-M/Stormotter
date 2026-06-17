import { useMemo, useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { MapSearchPickerModal, type MapSearchOption } from './MapSearchPickerModal'

interface MapPickerFieldProps {
  label?: string
  value: string
  onChange: (mapId: string) => void
  hint?: string
  modalTitle?: string
}

export function MapPickerField({
  label = 'Map',
  value,
  onChange,
  hint,
  modalTitle,
}: MapPickerFieldProps) {
  const [open, setOpen] = useState(false)
  const maps = useEditorStore((state) => state.maps)

  const options = useMemo<MapSearchOption[]>(
    () =>
      maps.map((map) => ({
        id: map.id,
        title: map.title,
        subtitle: `${map.world.width}×${map.world.height} · ${map.id}`,
      })),
    [maps],
  )

  const selected = options.find((map) => map.id === value) ?? null

  return (
    <div className="map-picker-field">
      <span>{label}</span>

      {selected ? (
        <div className="map-picker-selected">
          <strong>{selected.title}</strong>
          <span className="field-hint">{selected.id}</span>
        </div>
      ) : (
        <p className="admin-empty admin-empty-inline">Map not found in project.</p>
      )}

      <div className="map-picker-actions">
        <button type="button" className="admin-secondary-button" onClick={() => setOpen(true)}>
          {selected ? 'Change map' : 'Choose map'}
        </button>
      </div>

      {hint ? <span className="field-hint">{hint}</span> : null}

      <MapSearchPickerModal
        open={open}
        title={modalTitle ?? `Select ${label.toLowerCase()}`}
        maps={options}
        selectedId={value}
        onClose={() => setOpen(false)}
        onSelect={onChange}
      />
    </div>
  )
}
