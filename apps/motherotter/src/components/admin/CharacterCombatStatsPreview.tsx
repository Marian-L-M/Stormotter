import { useMemo } from 'react'
import {
  compileCharacterCombatStats,
  formatMechanicComposition,
  isActiveMechanic,
  formatCompiledCombatStats,
} from '../../admin/attributeTypes'
import { useAttributesStore } from '../../store/attributesStore'

interface CharacterCombatStatsPreviewProps {
  characterId: string
  characterLevel: number
  lineageTypeId: string | null
  classId: string | null
}

export function CharacterCombatStatsPreview({
  characterId,
  characterLevel,
  lineageTypeId,
  classId,
}: CharacterCombatStatsPreviewProps) {
  const definitions = useAttributesStore((state) => state.definitions)
  const entityValues = useAttributesStore((state) => state.entityValues)
  const customAssignments = useAttributesStore((state) => state.customAssignments)
  const levelAttributeGrants = useAttributesStore((state) => state.levelAttributeGrants)

  const compiledLines = useMemo(() => {
    const stats = compileCharacterCombatStats(
      definitions,
      entityValues,
      characterId,
      lineageTypeId,
      classId,
      customAssignments,
      characterLevel,
      levelAttributeGrants,
    )
    return formatCompiledCombatStats(stats)
  }, [
    definitions,
    entityValues,
    characterId,
    lineageTypeId,
    classId,
    customAssignments,
    characterLevel,
    levelAttributeGrants,
  ])

  const boundDefinitions = definitions.filter((definition) => isActiveMechanic(definition.mechanic))

  return (
    <fieldset className="admin-fieldset">
      <legend>Compiled combat stats (level {characterLevel})</legend>
      <p className="field-hint admin-attribute-hint">
        Engine-ready values resolved from stacked attributes with mechanic compositions.
      </p>
      {compiledLines.length === 0 ? (
        <p className="admin-empty admin-empty-inline">
          No bound attributes with values yet. Set mechanics on attribute definitions under Mechanics →
          Attributes.
        </p>
      ) : (
        <ul className="admin-compiled-stats-list">
          {compiledLines.map((line) => (
            <li key={line}>
              <code>{line}</code>
            </li>
          ))}
        </ul>
      )}
      {boundDefinitions.length > 0 ? (
        <p className="field-hint">
          Mechanics in project:{' '}
          {boundDefinitions
            .map((definition) => `${definition.key} → ${formatMechanicComposition(definition.mechanic)}`)
            .join('; ')}
        </p>
      ) : null}
    </fieldset>
  )
}
