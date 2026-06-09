import { useMemo } from 'react'
import type { AdminListItem } from '../../admin/types'
import {
  getActiveAbilityIds,
  type LevelAbilityGrant,
} from '../../admin/levelGrantTypes'
import { normalizeCharacterLevel } from '../../admin/characterLevelTypes'
import { LevelAbilityEditor } from './LevelAbilityEditor'

interface CharacterLevelAbilityFieldsProps {
  characterLevel: number
  typeGrants: LevelAbilityGrant[] | undefined
  classGrants: LevelAbilityGrant[] | undefined
  characterGrants: LevelAbilityGrant[]
  typeName?: string
  className?: string
  abilities: AdminListItem[]
  onChange: (grants: LevelAbilityGrant[]) => void
}

export function CharacterLevelAbilityFields({
  characterLevel,
  typeGrants,
  classGrants,
  characterGrants,
  typeName,
  className: linkedClassName,
  abilities,
  onChange,
}: CharacterLevelAbilityFieldsProps) {
  const level = normalizeCharacterLevel(characterLevel)
  const activeTypeIds = useMemo(
    () => getActiveAbilityIds(typeGrants ?? [], level),
    [typeGrants, level],
  )
  const activeClassIds = useMemo(
    () => getActiveAbilityIds(classGrants ?? [], level),
    [classGrants, level],
  )
  const activeCharacterIds = useMemo(
    () => getActiveAbilityIds(characterGrants, level),
    [characterGrants, level],
  )
  const activeAllIds = useMemo(
    () => [...new Set([...activeTypeIds, ...activeClassIds, ...activeCharacterIds])],
    [activeTypeIds, activeClassIds, activeCharacterIds],
  )

  const abilityTitleById = useMemo(
    () => new Map(abilities.map((ability) => [ability.id, ability.title])),
    [abilities],
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
              {formatAbilityList(activeTypeIds, abilityTitleById)}
            </span>
          </div>
          <div className="admin-hit-point-derived-row">
            <span className="admin-hit-point-derived-label">{linkedClassName ?? 'Class'}</span>
            <span className="admin-hit-point-derived-value">
              {formatAbilityList(activeClassIds, abilityTitleById)}
            </span>
          </div>
          <div className="admin-hit-point-derived-row">
            <span className="admin-hit-point-derived-label">Character</span>
            <span className="admin-hit-point-derived-value">
              {formatAbilityList(activeCharacterIds, abilityTitleById)}
            </span>
          </div>
          <div className="admin-hit-point-derived-total">
            <span>Combined</span>
            <strong>{formatAbilityList(activeAllIds, abilityTitleById)}</strong>
          </div>
        </div>
      </fieldset>

      <LevelAbilityEditor
        label="Character abilities by level"
        grants={characterGrants}
        abilities={abilities}
        onChange={onChange}
        hint="Character-specific abilities unlock when this character reaches each level."
      />
    </>
  )
}

function formatAbilityList(ids: string[], titleById: Map<string, string>): string {
  if (ids.length === 0) return '—'
  return ids.map((id) => titleById.get(id) ?? id).join(', ')
}
