import { useMemo, useState } from 'react'
import {
  ATTRIBUTE_INPUT_TYPE_LABELS,
  getAttributeCategoryName,
  type AttributeDefinition,
} from '../../admin/attributeTypes'
import { useAttributesStore } from '../../store/attributesStore'

interface AttributePickerFieldProps {
  definitions: AttributeDefinition[]
  assignedIds: string[]
  onAssign: (definitionId: string) => void
  placeholder?: string
}

export function AttributePickerField({
  definitions,
  assignedIds,
  onAssign,
  placeholder = 'Search attributes…',
}: AttributePickerFieldProps) {
  const categories = useAttributesStore((state) => state.categories)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const assignedSet = useMemo(() => new Set(assignedIds), [assignedIds])

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return definitions
      .filter((definition) => !assignedSet.has(definition.id))
      .filter((definition) => {
        if (!normalized) return true
        const categoryName = getAttributeCategoryName(definition.categoryId, categories).toLowerCase()
        return (
          definition.name.toLowerCase().includes(normalized) ||
          definition.description.toLowerCase().includes(normalized) ||
          categoryName.includes(normalized)
        )
      })
      .slice(0, 8)
  }, [definitions, assignedSet, query, categories])

  function handleSelect(definitionId: string) {
    onAssign(definitionId)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="attribute-picker">
      <input
        type="search"
        className="attribute-picker-input"
        value={query}
        placeholder={placeholder}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            const first = suggestions[0]
            if (first) handleSelect(first.id)
          }
          if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
      />
      {open && suggestions.length > 0 ? (
        <ul className="attribute-picker-suggestions" role="listbox">
          {suggestions.map((definition) => (
            <li key={definition.id}>
              <button
                type="button"
                className="attribute-picker-option"
                role="option"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(definition.id)}
              >
                <strong>{definition.name}</strong>
                <span className="attribute-picker-option-meta">
                  {getAttributeCategoryName(definition.categoryId, categories)}
                  {' · '}
                  {ATTRIBUTE_INPUT_TYPE_LABELS[definition.inputType]}
                  {definition.description ? ` · ${definition.description}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && query.trim() && suggestions.length === 0 ? (
        <p className="attribute-picker-empty">No matching attributes.</p>
      ) : null}
    </div>
  )
}
