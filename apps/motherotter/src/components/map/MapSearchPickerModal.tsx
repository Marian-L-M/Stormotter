import { useEffect, useMemo, useRef, useState } from 'react'
import { AdminModal } from '../admin/AdminModal'

export interface MapSearchOption {
  id: string
  title: string
  subtitle?: string
}

interface MapSearchPickerModalProps {
  open: boolean
  title?: string
  maps: MapSearchOption[]
  selectedId: string
  onClose: () => void
  onSelect: (mapId: string) => void
}

export function MapSearchPickerModal({
  open,
  title = 'Select map',
  maps,
  selectedId,
  onClose,
  onSelect,
}: MapSearchPickerModalProps) {
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [open])

  const filteredMaps = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return maps.filter((map) => {
      if (!normalized) return true
      return (
        map.title.toLowerCase().includes(normalized) ||
        map.id.toLowerCase().includes(normalized) ||
        map.subtitle?.toLowerCase().includes(normalized)
      )
    })
  }, [maps, query])

  function handleSelect(mapId: string) {
    onSelect(mapId)
    onClose()
  }

  return (
    <AdminModal open={open} title={title} onClose={onClose} size="sm">
      <div className="map-search-picker-modal">
        <label className="field">
          <span>Search maps</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder="Search by title or id…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="map-search-picker-dropdown" role="listbox" aria-label="Maps">
          {filteredMaps.length > 0 ? (
            <ul className="map-search-picker-options">
              {filteredMaps.map((map) => (
                <li key={map.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={map.id === selectedId}
                    className={`map-search-picker-option${map.id === selectedId ? ' is-selected' : ''}`}
                    onClick={() => handleSelect(map.id)}
                  >
                    <strong>{map.title}</strong>
                    <span className="map-search-picker-option-meta">
                      {map.subtitle ?? map.id}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="field-hint map-search-picker-empty">No maps match your search.</p>
          )}
        </div>
      </div>
    </AdminModal>
  )
}
