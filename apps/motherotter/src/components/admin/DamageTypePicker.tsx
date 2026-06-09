import { useState } from 'react'
import {
  DAMAGE_TYPE_GROUPS,
  resolveDamageTypeTab,
  type DamageTypeGroup,
} from '../../admin/attributeTypes'

interface DamageTypePickerProps {
  selectedId: string | null
  onSelect: (damageTypeId: string) => void
}

export function DamageTypePicker({ selectedId, onSelect }: DamageTypePickerProps) {
  const [viewTab, setViewTab] = useState(() => resolveDamageTypeTab(selectedId))

  function isGroupSelected(group: DamageTypeGroup): boolean {
    return selectedId === group.id
  }

  function isTypeSelected(typeId: string): boolean {
    return selectedId === typeId
  }

  return (
    <div className="damage-type-picker">
      <div className="damage-type-picker-tabs" role="tablist" aria-label="Damage type groups">
        {DAMAGE_TYPE_GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            role="tab"
            aria-selected={viewTab === group.id}
            className={`damage-type-picker-tab${viewTab === group.id ? ' is-active' : ''}${isGroupSelected(group) ? ' is-selected' : ''}`}
            onClick={() => setViewTab(group.id)}
          >
            {group.name}
            {isGroupSelected(group) ? <span className="damage-type-picker-tab-badge">All</span> : null}
          </button>
        ))}
      </div>

      {DAMAGE_TYPE_GROUPS.map((group) =>
        viewTab === group.id ? (
          <div
            key={group.id}
            className="damage-type-picker-panel"
            role="tabpanel"
            aria-label={`${group.name} damage types`}
          >
            <p className="field-hint admin-attribute-hint">
              Select <strong>{group.name}</strong> for all types in this group, or pick a specific subtype.
            </p>
            <div className="mechanic-builder-options" role="listbox">
              <button
                type="button"
                role="option"
                aria-selected={isGroupSelected(group)}
                className={`mechanic-builder-option damage-type-picker-group-option${isGroupSelected(group) ? ' is-selected' : ''}`}
                onClick={() => onSelect(group.id)}
              >
                All {group.name}
              </button>
              {group.types.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  role="option"
                  aria-selected={isTypeSelected(type.id)}
                  className={`mechanic-builder-option${isTypeSelected(type.id) ? ' is-selected' : ''}`}
                  onClick={() => onSelect(type.id)}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>
        ) : null,
      )}
    </div>
  )
}
