import { useMemo, useState } from 'react'
import {
  ABILITY_INPUT_TYPE_LABELS,
  getAbilityCategoryName,
  type AbilityDefinition,
} from '../../admin/abilityTypes'
import { useAbilitiesStore } from '../../store/abilitiesStore'

interface AbilityPickerFieldProps {
  definitions: AbilityDefinition[]
  assignedIds: string[]
  onAssign: (definitionId: string) => void
  placeholder?: string
}

export function AbilityPickerField({
  definitions,
  assignedIds,
  onAssign,
  placeholder = 'Search abilities…',
}: AbilityPickerFieldProps) {
  const categories = useAbilitiesStore((state) => state.categories)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const assignedSet = useMemo(() => new Set(assignedIds), [assignedIds])

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return definitions
      .filter((definition) => !assignedSet.has(definition.id))
      .filter((definition) => {
        if (!normalized) return true
        const categoryName = getAbilityCategoryName(definition.categoryId, categories).toLowerCase()
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
    <div className="admin-attribute-picker">
      <label className="field">
        <span>Add ability</span>
        <input
          type="search"
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
      </label>
      {open && suggestions.length > 0 ? (
        <ul className="admin-attribute-picker-suggestions">
          {suggestions.map((definition) => (
            <li key={definition.id}>
              <button type="button" onClick={() => handleSelect(definition.id)}>
                <strong>{definition.name}</strong>
                <span className="admin-attribute-picker-meta">
                  {getAbilityCategoryName(definition.categoryId, categories)} ·{' '}
                  {ABILITY_INPUT_TYPE_LABELS[definition.inputType]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
