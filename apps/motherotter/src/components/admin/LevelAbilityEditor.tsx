import type { AdminListItem } from '../../admin/types'
import {
  addLevelAbilityGrant,
  removeLevelAbilityGrant,
  sortLevelAbilityGrants,
  toggleAbilityInLevelGrant,
  updateLevelAbilityGrantLevel,
  type LevelAbilityGrant,
} from '../../admin/levelGrantTypes'
import { MAX_CHARACTER_LEVEL, normalizeCharacterLevel } from '../../admin/characterLevelTypes'

interface LevelAbilityEditorProps {
  label?: string
  grants: LevelAbilityGrant[]
  abilities: AdminListItem[]
  onChange: (grants: LevelAbilityGrant[]) => void
  hint?: string
}

export function LevelAbilityEditor({
  label = 'Abilities by level',
  grants,
  abilities,
  onChange,
  hint,
}: LevelAbilityEditorProps) {
  const sortedGrants = sortLevelAbilityGrants(grants)

  function addLevel() {
    onChange(addLevelAbilityGrant(grants))
  }

  function removeLevel(level: number) {
    onChange(removeLevelAbilityGrant(grants, level))
  }

  function setLevel(fromLevel: number, rawLevel: string) {
    const next = Number(rawLevel)
    if (!Number.isFinite(next)) return
    onChange(updateLevelAbilityGrantLevel(grants, fromLevel, next))
  }

  function toggleAbility(level: number, abilityId: string) {
    onChange(toggleAbilityInLevelGrant(grants, level, abilityId))
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>{label}</legend>
      {hint ? <p className="field-hint admin-attribute-hint">{hint}</p> : null}

      {abilities.length === 0 ? (
        <p className="admin-empty admin-empty-inline">
          No abilities defined yet. Create abilities in the Abilities tab, then link them here.
        </p>
      ) : sortedGrants.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No level grants yet.</p>
      ) : (
        sortedGrants.map((grant) => (
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
                  onChange={(event) => setLevel(grant.level, event.target.value)}
                />
              </label>
              <button
                type="button"
                className="admin-text-button admin-level-grant-remove"
                onClick={() => removeLevel(grant.level)}
              >
                Remove level
              </button>
            </div>
            <ul className="admin-checkbox-list">
              {abilities.map((ability) => (
                <li key={ability.id}>
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      checked={grant.abilityIds.includes(ability.id)}
                      onChange={() => toggleAbility(grant.level, ability.id)}
                    />
                    <span>
                      <strong>{ability.title}</strong>
                      {ability.subtitle ? (
                        <span className="admin-checkbox-sublabel">{ability.subtitle}</span>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      <button type="button" className="admin-secondary-button" onClick={addLevel}>
        Add level grant
      </button>
    </fieldset>
  )
}

export function normalizeLevelInput(raw: string): number {
  return normalizeCharacterLevel(Number(raw))
}
