import {
  ABILITY_INPUT_TYPE_LABELS,
  getNextLevelAbilityGrantLevel,
  groupAbilityDefinitionsByCategory,
  sortLevelAbilityBindingGrants,
  type AbilityDefinition,
  type AbilityValue,
  type LevelAbilityBindingGrant,
} from '../../admin/abilityTypes'
import { MAX_CHARACTER_LEVEL, normalizeCharacterLevel } from '../../admin/characterLevelTypes'
import { AbilityPickerField } from './AbilityPickerField'
import { AttributeValueInput } from './AttributeValueInput'
import { TriggerSelectField } from './TriggerSelectField'
import { useAbilitiesStore } from '../../store/abilitiesStore'

const EMPTY_LEVEL_GRANTS: LevelAbilityBindingGrant[] = []

interface EntityLevelAbilityFieldsProps {
  entityId: string
  entityLabel: string
  hint?: string
}

export function EntityLevelAbilityFields({
  entityId,
  entityLabel,
  hint,
}: EntityLevelAbilityFieldsProps) {
  const definitions = useAbilitiesStore((state) => state.definitions)
  const categories = useAbilitiesStore((state) => state.categories)
  const levelGrants = useAbilitiesStore(
    (state) => state.levelAbilityGrants[entityId] ?? EMPTY_LEVEL_GRANTS,
  )
  const addLevelAbilityGrant = useAbilitiesStore((state) => state.addLevelAbilityGrant)
  const removeLevelAbilityGrant = useAbilitiesStore((state) => state.removeLevelAbilityGrant)
  const updateLevelAbilityGrantLevel = useAbilitiesStore((state) => state.updateLevelAbilityGrantLevel)
  const setLevelAbilityBindingValue = useAbilitiesStore((state) => state.setLevelAbilityBindingValue)
  const setLevelAbilityBindingTrigger = useAbilitiesStore((state) => state.setLevelAbilityBindingTrigger)
  const assignLevelAbility = useAbilitiesStore((state) => state.assignLevelAbility)
  const unassignLevelAbility = useAbilitiesStore((state) => state.unassignLevelAbility)

  const sortedGrants = sortLevelAbilityBindingGrants(levelGrants)

  function updateValue(
    grant: LevelAbilityBindingGrant,
    definition: AbilityDefinition,
    value: AbilityValue,
  ) {
    setLevelAbilityBindingValue(entityId, grant.level, definition.id, value)
  }

  const defaultHint =
    hint ??
    `Add abilities at each level with a value and trigger. Base ${entityLabel} abilities belong at level 1.`

  return (
    <fieldset className="admin-fieldset">
      <legend>Abilities by level</legend>
      <p className="field-hint admin-attribute-hint">{defaultHint}</p>

      {sortedGrants.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No level ability grants yet.</p>
      ) : (
        sortedGrants.map((grant) => {
          const assignedDefinitions = grant.definitionIds
            .map((id) => definitions.find((entry) => entry.id === id))
            .filter((entry): entry is AbilityDefinition => Boolean(entry))
          const groups = groupAbilityDefinitionsByCategory(assignedDefinitions, categories)

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
                      updateLevelAbilityGrantLevel(
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
                  onClick={() => removeLevelAbilityGrant(entityId, grant.level)}
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
                        onClick={() => unassignLevelAbility(entityId, grant.level, definition.id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="admin-empty admin-empty-inline">No abilities at this level yet.</p>
              )}

              <AbilityPickerField
                definitions={definitions}
                assignedIds={grant.definitionIds}
                onAssign={(definitionId) => assignLevelAbility(entityId, grant.level, definitionId)}
              />

              {assignedDefinitions.length > 0
                ? groups.map((group) => (
                    <div
                      key={`${grant.level}-${group.categoryId ?? 'uncategorized'}`}
                      className="admin-attribute-category-group"
                    >
                      <h4 className="admin-attribute-category-heading">{group.categoryName}</h4>
                      <LevelAbilityBindingTable
                        definitions={group.definitions}
                        grant={grant}
                        onValueChange={updateValue}
                        onTriggerChange={(definition, triggerId) =>
                          setLevelAbilityBindingTrigger(
                            entityId,
                            grant.level,
                            definition.id,
                            triggerId,
                          )
                        }
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
        onClick={() => addLevelAbilityGrant(entityId, getNextLevelAbilityGrantLevel(levelGrants))}
      >
        Add level grant
      </button>
    </fieldset>
  )
}

function LevelAbilityBindingTable({
  definitions,
  grant,
  onValueChange,
  onTriggerChange,
}: {
  definitions: AbilityDefinition[]
  grant: LevelAbilityBindingGrant
  onValueChange: (
    grant: LevelAbilityBindingGrant,
    definition: AbilityDefinition,
    value: AbilityValue,
  ) => void
  onTriggerChange: (definition: AbilityDefinition, triggerId: import('../../admin/itemTypes').ItemTriggerId | null) => void
}) {
  return (
    <div className="admin-attribute-table-wrap">
      <table className="admin-attribute-table">
        <thead>
          <tr>
            <th scope="col">Ability</th>
            <th scope="col">Type</th>
            <th scope="col">Value</th>
            <th scope="col">Trigger</th>
          </tr>
        </thead>
        <tbody>
          {definitions.map((definition) => {
            const binding = grant.bindings[definition.id]

            return (
              <tr key={definition.id}>
                <td className="admin-attribute-label">
                  <strong>{definition.name}</strong>
                  {definition.description ? (
                    <span className="field-hint">{definition.description}</span>
                  ) : null}
                </td>
                <td className="admin-attribute-type">{ABILITY_INPUT_TYPE_LABELS[definition.inputType]}</td>
                <td>
                  <AttributeValueInput
                    inputType={definition.inputType}
                    value={binding?.value ?? null}
                    onChange={(value) => {
                      if (value === null) return
                      onValueChange(grant, definition, value)
                    }}
                  />
                </td>
                <td>
                  <TriggerSelectField
                    label="Trigger"
                    value={binding?.triggerId ?? null}
                    onChange={(triggerId) => onTriggerChange(definition, triggerId)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
