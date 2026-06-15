import {
  ITEM_REQUIREMENT_OPERATOR_LABELS,
  ITEM_REQUIREMENT_SUBJECT_LABELS,
  createItemRequirementId,
  isNumericRequirementSubject,
  isReferenceRequirementSubject,
  type ItemRequirement,
  type ItemRequirementOperator,
  type ItemRequirementSubject,
} from '../../admin/itemTypes'
import { useAttributesStore } from '../../store/attributesStore'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useLineageTypesStore } from '../../store/lineageTypesStore'
import { useCharacterClassesStore } from '../../store/characterClassesStore'

interface ItemRequirementsEditorProps {
  requirements: ItemRequirement[]
  onChange: (requirements: ItemRequirement[]) => void
}

function operatorsForSubject(subject: ItemRequirementSubject): ItemRequirementOperator[] {
  if (isNumericRequirementSubject(subject)) {
    return ['equals', 'not_equals', 'less_than', 'greater_than', 'less_or_equal', 'greater_or_equal']
  }
  return ['equals', 'not_equals']
}

export function ItemRequirementsEditor({ requirements, onChange }: ItemRequirementsEditorProps) {
  const attributeDefinitions = useAttributesStore((state) => state.definitions)
  const abilities = useAbilitiesStore((state) => state.definitions)
  const characters = useContentCatalogStore((state) => state.stubs.characters)
  const lineageTypes = useLineageTypesStore((state) => state.lineageTypes)
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)

  function updateRequirement(id: string, patch: Partial<ItemRequirement>) {
    onChange(
      requirements.map((entry) => {
        if (entry.id !== id) return entry
        const next = { ...entry, ...patch }
        if (patch.subject !== undefined && patch.subject !== entry.subject) {
          next.referenceId = null
          next.numericValue = patch.subject === 'level' ? 1 : null
          next.textValue = null
          if (!operatorsForSubject(next.subject).includes(next.operator)) {
            next.operator = 'equals'
          }
        }
        return next
      }),
    )
  }

  function addRequirement() {
    onChange([
      ...requirements,
      {
        id: createItemRequirementId(),
        subject: 'level',
        operator: 'greater_or_equal',
        referenceId: null,
        numericValue: 1,
        textValue: null,
      },
    ])
  }

  function removeRequirement(id: string) {
    onChange(requirements.filter((entry) => entry.id !== id))
  }

  function referenceOptions(subject: ItemRequirementSubject): { id: string; label: string }[] {
    switch (subject) {
      case 'attribute':
        return attributeDefinitions.map((entry) => ({ id: entry.id, label: entry.name }))
      case 'ability':
        return abilities.map((entry) => ({ id: entry.id, label: entry.name }))
      case 'character':
        return characters.map((entry) => ({ id: entry.id, label: entry.title }))
      case 'character_type':
        return lineageTypes.map((entry) => ({ id: entry.id, label: entry.name }))
      case 'character_class':
        return characterClasses.map((entry) => ({ id: entry.id, label: entry.name }))
      default:
        return []
    }
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>Requirements</legend>
      <p className="field-hint admin-attribute-hint">
        All requirements must be met to equip or use this item. Requirements are additive (AND logic).
      </p>

      {requirements.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No requirements configured.</p>
      ) : (
        <div className="item-requirements-list">
          {requirements.map((requirement) => (
            <div key={requirement.id} className="item-requirement-row">
              <label className="field">
                <span>Check</span>
                <select
                  className="admin-select admin-select-block"
                  value={requirement.subject}
                  onChange={(event) =>
                    updateRequirement(requirement.id, {
                      subject: event.target.value as ItemRequirementSubject,
                    })
                  }
                >
                  {Object.entries(ITEM_REQUIREMENT_SUBJECT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Operator</span>
                <select
                  className="admin-select admin-select-block"
                  value={requirement.operator}
                  onChange={(event) =>
                    updateRequirement(requirement.id, {
                      operator: event.target.value as ItemRequirementOperator,
                    })
                  }
                >
                  {operatorsForSubject(requirement.subject).map((operator) => (
                    <option key={operator} value={operator}>
                      {ITEM_REQUIREMENT_OPERATOR_LABELS[operator]}
                    </option>
                  ))}
                </select>
              </label>

              {isReferenceRequirementSubject(requirement.subject) ? (
                <label className="field">
                  <span>Target</span>
                  <select
                    className="admin-select admin-select-block"
                    value={requirement.referenceId ?? ''}
                    onChange={(event) =>
                      updateRequirement(requirement.id, {
                        referenceId: event.target.value || null,
                      })
                    }
                  >
                    <option value="">Select…</option>
                    {referenceOptions(requirement.subject).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {requirement.subject === 'level' || requirement.subject === 'attribute' ? (
                <label className="field">
                  <span>Value</span>
                  <input
                    type="number"
                    value={requirement.numericValue ?? ''}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      updateRequirement(requirement.id, {
                        numericValue: Number.isFinite(value) ? value : null,
                      })
                    }}
                  />
                </label>
              ) : null}

              <button
                type="button"
                className="admin-text-button admin-danger-text item-requirement-remove"
                onClick={() => removeRequirement(requirement.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="admin-secondary-button" onClick={addRequirement}>
        Add requirement
      </button>
    </fieldset>
  )
}
