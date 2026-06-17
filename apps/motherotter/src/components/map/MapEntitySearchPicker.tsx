import { useMemo, useState } from 'react'

export interface MapEntitySearchOption {
  id: string
  name: string
  subtitle?: string
}

interface MapEntitySearchPickerProps {
  label: string
  options: MapEntitySearchOption[]
  value: string | null
  onChange: (id: string) => void
  placeholder?: string
  emptyMessage?: string
}

export function MapEntitySearchPicker({
  label,
  options,
  value,
  onChange,
  placeholder = 'Search…',
  emptyMessage = 'No matches found.',
}: MapEntitySearchPickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selected = options.find((option) => option.id === value) ?? null

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return options
      .filter((option) => {
        if (!normalized) return true
        return (
          option.name.toLowerCase().includes(normalized) ||
          option.subtitle?.toLowerCase().includes(normalized) ||
          option.id.toLowerCase().includes(normalized)
        )
      })
      .slice(0, 12)
  }, [options, query])

  function handleSelect(id: string) {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="map-entity-search-picker">
      <label className="field">
        <span>{label}</span>
        <input
          type="search"
          value={open ? query : (selected?.name ?? query)}
          placeholder={selected ? selected.name : placeholder}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setQuery('')
            setOpen(true)
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120)
          }}
        />
      </label>
      {selected ? (
        <p className="field-hint map-entity-search-selected">
          Selected: <strong>{selected.name}</strong>
          {selected.subtitle ? ` · ${selected.subtitle}` : null}
        </p>
      ) : (
        <p className="field-hint">Choose an entity to place on empty grid cells.</p>
      )}
      {open && suggestions.length > 0 ? (
        <ul className="admin-attribute-picker-suggestions map-entity-search-suggestions">
          {suggestions.map((option) => (
            <li key={option.id}>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => handleSelect(option.id)}>
                <strong>{option.name}</strong>
                {option.subtitle ? (
                  <span className="admin-attribute-picker-meta">{option.subtitle}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && query.trim() && suggestions.length === 0 ? (
        <p className="field-hint map-entity-search-empty">{emptyMessage}</p>
      ) : null}
    </div>
  )
}
