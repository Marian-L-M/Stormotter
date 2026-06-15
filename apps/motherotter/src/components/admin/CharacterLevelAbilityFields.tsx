import { useMemo } from 'react'
import {
  formatAbilityValue,
  getActiveAbilityDefinitionIds,
  sortLevelAbilityBindingGrants,
  type LevelAbilityBindingGrant,
} from '../../admin/abilityTypes'
import { getItemTrigger } from '../../admin/itemTypes'
import { normalizeCharacterLevel } from '../../admin/characterLevelTypes'
import { EntityLevelAbilityFields } from './EntityLevelAbilityFields'
import { useAbilitiesStore } from '../../store/abilitiesStore'

interface CharacterLevelAbilityFieldsProps {
  characterId: string
  characterLevel: number
  typeId: string | null
  classId: string | null
  typeName?: string
  className?: string
}

export function CharacterLevelAbilityFields({
  characterId,
  characterLevel,
  typeId,
  classId,
  typeName,
  className: linkedClassName,
}: CharacterLevelAbilityFieldsProps) {
  const definitions = useAbilitiesStore((state) => state.definitions)
  const levelAbilityGrants = useAbilitiesStore((state) => state.levelAbilityGrants)

  const level = normalizeCharacterLevel(characterLevel)
  const typeGrants = typeId ? levelAbilityGrants[typeId] : undefined
  const classGrants = classId ? levelAbilityGrants[classId] : undefined
  const characterGrants = levelAbilityGrants[characterId] ?? []

  const activeTypeIds = useMemo(
    () => getActiveAbilityDefinitionIds(typeGrants, level),
    [typeGrants, level],
  )
  const activeClassIds = useMemo(
    () => getActiveAbilityDefinitionIds(classGrants, level),
    [classGrants, level],
  )
  const activeCharacterIds = useMemo(
    () => getActiveAbilityDefinitionIds(characterGrants, level),
    [characterGrants, level],
  )
  const activeAllIds = useMemo(
    () => [...new Set([...activeTypeIds, ...activeClassIds, ...activeCharacterIds])],
    [activeTypeIds, activeClassIds, activeCharacterIds],
  )

  const definitionById = useMemo(
    () => new Map(definitions.map((definition) => [definition.id, definition])),
    [definitions],
  )

  return (
    <>
      <fieldset className="admin-fieldset">
        <legend>Active abilities at level {level}</legend>
        <p className="field-hint admin-attribute-hint">
          Abilities unlocked from character type, class, and this character at or below level {level}.
        </p>
        <div className="admin-hit-point-derived">
          <div className="admin-hit-point-derived-row">
            <span className="admin-hit-point-derived-label">{typeName ?? 'Type'}</span>
            <span className="admin-hit-point-derived-value">
              {formatAbilityIdList(activeTypeIds, definitionById, typeGrants, level)}
            </span>
          </div>
          <div className="admin-hit-point-derived-row">
            <span className="admin-hit-point-derived-label">{linkedClassName ?? 'Class'}</span>
            <span className="admin-hit-point-derived-value">
              {formatAbilityIdList(activeClassIds, definitionById, classGrants, level)}
            </span>
          </div>
          <div className="admin-hit-point-derived-row">
            <span className="admin-hit-point-derived-label">Character</span>
            <span className="admin-hit-point-derived-value">
              {formatAbilityIdList(activeCharacterIds, definitionById, characterGrants, level)}
            </span>
          </div>
          <div className="admin-hit-point-derived-total">
            <span>Combined</span>
            <strong>
              {formatAbilityIdList(activeAllIds, definitionById, undefined, level, [
                ...(typeGrants ?? []),
                ...(classGrants ?? []),
                ...characterGrants,
              ])}
            </strong>
          </div>
        </div>
      </fieldset>

      <EntityLevelAbilityFields
        entityId={characterId}
        entityLabel="character"
        hint="Character-specific abilities unlock when this character reaches each level."
      />
    </>
  )
}

function formatAbilityIdList(
  ids: string[],
  definitionById: Map<string, import('../../admin/abilityTypes').AbilityDefinition>,
  grants: LevelAbilityBindingGrant[] | undefined,
  level: number,
  allGrants?: LevelAbilityBindingGrant[],
): string {
  if (ids.length === 0) return '—'

  const grantSources = allGrants ?? grants ?? []
  const sorted = sortLevelAbilityBindingGrants(grantSources)

  return ids
    .map((id) => {
      const definition = definitionById.get(id)
      const name = definition?.name ?? id
      let binding: import('../../admin/abilityTypes').AbilityBinding | undefined
      for (const grant of sorted) {
        if (grant.level <= level && grant.definitionIds.includes(id)) {
          binding = grant.bindings[id]
        }
      }
      if (!binding || !definition) return name
      const valueLabel = formatAbilityValue(definition.inputType, binding.value)
      const triggerLabel = binding.triggerId
        ? getItemTrigger(binding.triggerId)?.label ?? binding.triggerId
        : null
      return triggerLabel ? `${name} (${valueLabel} @ ${triggerLabel})` : `${name} (${valueLabel})`
    })
    .join(', ')
}
