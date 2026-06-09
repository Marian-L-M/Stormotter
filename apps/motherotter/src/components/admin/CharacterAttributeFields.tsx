import { useMemo } from 'react'
import {
  ATTRIBUTE_INPUT_TYPE_LABELS,
  buildCharacterAttributeRows,
  formatAttributeValue,
  groupStackedRowsByCategory,
  type StackedAttributeRow,
} from '../../admin/attributeTypes'
import { AttributePickerField } from './AttributePickerField'
import { AttributeValueInput } from './AttributeValueInput'
import { CharacterCombatStatsPreview } from './CharacterCombatStatsPreview'
import { EntityLevelAttributeFields } from './EntityLevelAttributeFields'
import { useAttributesStore } from '../../store/attributesStore'

const EMPTY_CUSTOM_IDS: string[] = []

interface CharacterAttributeFieldsProps {
  characterId: string
  characterLevel: number
  lineageTypeId: string | null
  classId: string | null
  lineageTypeName?: string
  className?: string
}

export function CharacterAttributeFields({
  characterId,
  characterLevel,
  lineageTypeId,
  classId,
  lineageTypeName,
  className: linkedClassName,
}: CharacterAttributeFieldsProps) {
  const definitions = useAttributesStore((state) => state.definitions)
  const categories = useAttributesStore((state) => state.categories)
  const entityValues = useAttributesStore((state) => state.entityValues)
  const customAssignments = useAttributesStore((state) => state.customAssignments)
  const levelAttributeGrants = useAttributesStore((state) => state.levelAttributeGrants)
  const setEntityValue = useAttributesStore((state) => state.setEntityValue)
  const clearEntityValue = useAttributesStore((state) => state.clearEntityValue)
  const assignCustomAttribute = useAttributesStore((state) => state.assignCustomAttribute)
  const unassignCustomAttribute = useAttributesStore((state) => state.unassignCustomAttribute)

  const { standardRows, customRows } = useMemo(
    () =>
      buildCharacterAttributeRows(
        definitions,
        entityValues,
        characterId,
        lineageTypeId,
        classId,
        customAssignments,
        characterLevel,
        levelAttributeGrants,
      ),
    [
      definitions,
      entityValues,
      characterId,
      lineageTypeId,
      classId,
      customAssignments,
      characterLevel,
      levelAttributeGrants,
    ],
  )

  const standardGroups = useMemo(
    () => groupStackedRowsByCategory(standardRows, categories),
    [standardRows, categories],
  )
  const customGroups = useMemo(
    () => groupStackedRowsByCategory(customRows, categories),
    [customRows, categories],
  )

  const customDefinitions = definitions.filter((entry) => entry.source === 'custom')
  const characterCustomIds = customAssignments[characterId] ?? EMPTY_CUSTOM_IDS
  const assignedCustomOnCharacter = characterCustomIds
    .map((id) => customDefinitions.find((entry) => entry.id === id))
    .filter(Boolean)

  function updateCharacterValue(definitionId: string, value: StackedAttributeRow['characterValue']) {
    if (value === null) {
      clearEntityValue(characterId, definitionId)
      return
    }
    setEntityValue(characterId, definitionId, value)
  }

  return (
    <>
      <CharacterCombatStatsPreview
        characterId={characterId}
        characterLevel={characterLevel}
        lineageTypeId={lineageTypeId}
        classId={classId}
      />

      <fieldset className="admin-fieldset">
        <legend>Attributes</legend>
        <p className="field-hint admin-attribute-hint">
          Stacked values from type, class, and character level grants active at level {characterLevel}.
          Assign attributes on the type, class, or character editors.
        </p>
        {standardRows.length === 0 ? (
          <p className="admin-empty admin-empty-inline">
            No attributes assigned yet. Add them via level grants on this character, its type, or its
            class.
          </p>
        ) : (
          standardGroups.map((group) => (
            <div key={group.categoryId ?? 'uncategorized'} className="admin-attribute-category-group">
              <h4 className="admin-attribute-category-heading">{group.categoryName}</h4>
              <StackedAttributeTable
                rows={group.rows}
                typeHeader={lineageTypeName ?? 'Type'}
                classHeader={linkedClassName ?? 'Class'}
                onCharacterChange={(row, value) =>
                  updateCharacterValue(row.definition.id, value)
                }
              />
            </div>
          ))
        )}
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Custom attributes</legend>
        <p className="field-hint admin-attribute-hint">
          Custom attributes must be assigned via level grants on the character, type, or class.
        </p>

        {assignedCustomOnCharacter.length > 0 ? (
          <ul className="admin-tag-list admin-attribute-tag-list">
            {assignedCustomOnCharacter.map((definition) =>
              definition ? (
                <li key={definition.id} className="admin-tag-chip">
                  <span>{definition.name}</span>
                  <button
                    type="button"
                    className="admin-icon-button"
                    aria-label={`Remove ${definition.name}`}
                    onClick={() => unassignCustomAttribute(characterId, definition.id)}
                  >
                    ×
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        ) : (
          <p className="admin-empty admin-empty-inline">No custom attributes on this character.</p>
        )}

        <AttributePickerField
          definitions={customDefinitions}
          assignedIds={characterCustomIds}
          onAssign={(definitionId) => assignCustomAttribute(characterId, definitionId)}
        />

        {customRows.length === 0 ? (
          <p className="field-hint admin-empty-inline">
            Assign custom attributes on this character, its type, or its class to see stacked values.
          </p>
        ) : (
          customGroups.map((group) => (
            <div key={group.categoryId ?? 'uncategorized'} className="admin-attribute-category-group">
              <h4 className="admin-attribute-category-heading">{group.categoryName}</h4>
              <StackedAttributeTable
                rows={group.rows}
                typeHeader={lineageTypeName ?? 'Type'}
                classHeader={linkedClassName ?? 'Class'}
                onCharacterChange={(row, value) =>
                  updateCharacterValue(row.definition.id, value)
                }
              />
            </div>
          ))
        )}
      </fieldset>

      <EntityLevelAttributeFields entityId={characterId} entityLabel="character" />
    </>
  )
}

function StackedAttributeTable({
  rows,
  typeHeader,
  classHeader,
  onCharacterChange,
}: {
  rows: StackedAttributeRow[]
  typeHeader: string
  classHeader: string
  onCharacterChange: (row: StackedAttributeRow, value: StackedAttributeRow['characterValue']) => void
}) {
  return (
    <div className="admin-attribute-table-wrap">
      <table className="admin-attribute-table admin-attribute-stacked-table">
        <thead>
          <tr>
            <th scope="col">Attribute</th>
            <th scope="col">Input</th>
            <th scope="col">{typeHeader}</th>
            <th scope="col">{classHeader}</th>
            <th scope="col">Character</th>
            <th scope="col">Stacked</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.definition.id}>
              <td className="admin-attribute-label">
                <strong>{row.definition.name}</strong>
                {row.definition.description ? (
                  <span className="field-hint">{row.definition.description}</span>
                ) : null}
              </td>
              <td className="admin-attribute-type">
                {ATTRIBUTE_INPUT_TYPE_LABELS[row.definition.inputType]}
              </td>
              <td className="admin-attribute-inherited">
                {formatAttributeValue(row.definition.inputType, row.typeValue)}
              </td>
              <td className="admin-attribute-inherited">
                {formatAttributeValue(row.definition.inputType, row.classValue)}
              </td>
              <td>
                <AttributeValueInput
                  inputType={row.definition.inputType}
                  value={row.characterValue}
                  onChange={(value) => onCharacterChange(row, value)}
                />
              </td>
              <td className="admin-attribute-stacked">
                <strong>{formatAttributeValue(row.definition.inputType, row.stackedValue)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
