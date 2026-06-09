import {
  ATTRIBUTE_INPUT_TYPE_LABELS,
  getNextLevelAttributeGrantLevel,
  groupDefinitionsByCategory,
  sortLevelAttributeGrants,
  type AttributeDefinition,
  type AttributeValue,
  type LevelAttributeGrant,
} from '../../admin/attributeTypes'
import { MAX_CHARACTER_LEVEL, normalizeCharacterLevel } from '../../admin/characterLevelTypes'
import { AttributePickerField } from './AttributePickerField'
import { AttributeValueInput } from './AttributeValueInput'
import { useAttributesStore } from '../../store/attributesStore'

const EMPTY_LEVEL_GRANTS: LevelAttributeGrant[] = []

interface EntityLevelAttributeFieldsProps {
  entityId: string
  entityLabel: string
  /** Hint shown under the legend — defaults to a generic level-grant message */
  hint?: string
}

export function EntityLevelAttributeFields({
  entityId,
  entityLabel,
  hint,
}: EntityLevelAttributeFieldsProps) {
  const definitions = useAttributesStore((state) => state.definitions)
  const categories = useAttributesStore((state) => state.categories)
  const levelGrants = useAttributesStore(
    (state) => state.levelAttributeGrants[entityId] ?? EMPTY_LEVEL_GRANTS,
  )
  const addLevelAttributeGrant = useAttributesStore((state) => state.addLevelAttributeGrant)
  const removeLevelAttributeGrant = useAttributesStore((state) => state.removeLevelAttributeGrant)
  const updateLevelAttributeGrantLevel = useAttributesStore(
    (state) => state.updateLevelAttributeGrantLevel,
  )
  const setLevelAttributeValue = useAttributesStore((state) => state.setLevelAttributeValue)
  const clearLevelAttributeValue = useAttributesStore((state) => state.clearLevelAttributeValue)
  const assignLevelAttribute = useAttributesStore((state) => state.assignLevelAttribute)
  const unassignLevelAttribute = useAttributesStore((state) => state.unassignLevelAttribute)

  const sortedGrants = sortLevelAttributeGrants(levelGrants)

  function updateValue(grant: LevelAttributeGrant, definition: AttributeDefinition, value: AttributeValue) {
    if (value === null) {
      clearLevelAttributeValue(entityId, grant.level, definition.id)
      return
    }
    setLevelAttributeValue(entityId, grant.level, definition.id, value)
  }

  const defaultHint =
    hint ??
    `Add attributes at each level. Base ${entityLabel} attributes belong at level 1, like abilities.`

  return (
    <fieldset className="admin-fieldset">
      <legend>Attributes by level</legend>
      <p className="field-hint admin-attribute-hint">{defaultHint}</p>

      {sortedGrants.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No level attribute grants yet.</p>
      ) : (
        sortedGrants.map((grant) => {
          const assignedDefinitions = grant.definitionIds
            .map((id) => definitions.find((entry) => entry.id === id))
            .filter((entry): entry is AttributeDefinition => Boolean(entry))
          const groups = groupDefinitionsByCategory(assignedDefinitions, categories)

          return (
            <div key={grant.level} className="admin-level-grant-block">
              <div className="admin-level-grant-header">
                <label className="admin-level-grant-level-field">
                  <span>Level</span>
                  <input
                    type="number"
                    className="admin-stat-range-input admin-level-grant-level-input"
                    min={1}
                    max={MAX_CHARACTER_LEVEL}
                    value={grant.level}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      if (!Number.isFinite(next)) return
                      updateLevelAttributeGrantLevel(
                        entityId,
                        grant.level,
                        normalizeCharacterLevel(next),
                      )
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="admin-text-button admin-level-grant-remove"
                  onClick={() => removeLevelAttributeGrant(entityId, grant.level)}
                >
                  Remove level
                </button>
              </div>

              {assignedDefinitions.length > 0 ? (
                <ul className="admin-tag-list admin-attribute-tag-list">
                  {assignedDefinitions.map((definition) => (
                    <li key={definition.id} className="admin-tag-chip">
                      <span>{definition.name}</span>
                      <button
                        type="button"
                        className="admin-icon-button"
                        aria-label={`Remove ${definition.name}`}
                        onClick={() => unassignLevelAttribute(entityId, grant.level, definition.id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-empty admin-empty-inline">No attributes at this level yet.</p>
              )}

              <AttributePickerField
                definitions={definitions}
                assignedIds={grant.definitionIds}
                onAssign={(definitionId) => assignLevelAttribute(entityId, grant.level, definitionId)}
              />

              {assignedDefinitions.length > 0
                ? groups.map((group) => (
                    <div
                      key={`${grant.level}-${group.categoryId ?? 'uncategorized'}`}
                      className="admin-attribute-category-group"
                    >
                      <h4 className="admin-attribute-category-heading">{group.categoryName}</h4>
                      <LevelAttributeValueTable
                        definitions={group.definitions}
                        grant={grant}
                        onChange={updateValue}
                      />
                    </div>
                  ))
                : null}
            </div>
          )
        })
      )}

      <button
        type="button"
        className="admin-secondary-button"
        onClick={() => addLevelAttributeGrant(entityId, getNextLevelAttributeGrantLevel(levelGrants))}
      >
        Add level grant
      </button>
    </fieldset>
  )
}

function LevelAttributeValueTable({
  definitions,
  grant,
  onChange,
}: {
  definitions: AttributeDefinition[]
  grant: LevelAttributeGrant
  onChange: (grant: LevelAttributeGrant, definition: AttributeDefinition, value: AttributeValue) => void
}) {
  return (
    <div className="admin-attribute-table-wrap">
      <table className="admin-attribute-table">
        <thead>
          <tr>
            <th scope="col">Attribute</th>
            <th scope="col">Type</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {definitions.map((definition) => (
            <tr key={definition.id}>
              <td className="admin-attribute-label">
                <strong>{definition.name}</strong>
                {definition.description ? (
                  <span className="field-hint">{definition.description}</span>
                ) : null}
              </td>
              <td className="admin-attribute-type">{ATTRIBUTE_INPUT_TYPE_LABELS[definition.inputType]}</td>
              <td>
                <AttributeValueInput
                  inputType={definition.inputType}
                  value={grant.values[definition.id] ?? null}
                  onChange={(value) => onChange(grant, definition, value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
