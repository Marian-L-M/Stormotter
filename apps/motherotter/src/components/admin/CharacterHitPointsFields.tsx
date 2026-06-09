import {
  combineDiceRolls,
  combineLevelHitPoints,
  formatCombinedDiceRange,
  formatDiceRange,
  formatDiceRoll,
  isEmptyDiceRoll,
  normalizeHitPointOverride,
  normalizeHitPointSource,
  type HitPointSource,
} from '../../admin/diceTypes'
import { MAX_CHARACTER_LEVEL, normalizeCharacterLevel } from '../../admin/characterLevelTypes'
import type { CharacterClass } from '../../admin/characterClassTypes'
import type { CharacterLineageType } from '../../admin/lineageTypes'
import type { CharacterMeta } from '../../store/characterMetaStore'

interface CharacterHitPointsFieldsProps {
  meta: CharacterMeta
  linkedClass: CharacterClass | undefined
  linkedLineageType: CharacterLineageType | undefined
  onChange: (patch: Partial<CharacterMeta>) => void
}

export function CharacterHitPointsFields({
  meta,
  linkedClass,
  linkedLineageType,
  onChange,
}: CharacterHitPointsFieldsProps) {
  const level = normalizeCharacterLevel(meta.level)
  const source = normalizeHitPointSource(meta.hitPointSource)
  const classDice = linkedClass?.hitDice
  const raceDice = linkedLineageType?.hitPointBonusDice
  const perLevel = combineDiceRolls(classDice, raceDice)
  const atLevel = combineLevelHitPoints(level, classDice, raceDice)

  function setLevel(raw: string) {
    const trimmed = raw.trim()
    if (trimmed === '') return
    const next = Number(trimmed)
    if (!Number.isFinite(next)) return
    onChange({ level: normalizeCharacterLevel(next) })
  }

  function setSource(next: HitPointSource) {
    onChange({ hitPointSource: next })
  }

  function setOverride(raw: string) {
    const trimmed = raw.trim()
    if (trimmed === '') {
      onChange({ hitPointOverride: null })
      return
    }
    const next = Number(trimmed)
    if (!Number.isFinite(next)) return
    onChange({ hitPointOverride: normalizeHitPointOverride(next) })
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>Level &amp; hit points</legend>
      <p className="field-hint admin-attribute-hint">
        Character level scales per-level hit dice. Override bypasses derived HP entirely.
      </p>

      <label className="field">
        <span>Level</span>
        <input
          type="number"
          className="admin-stat-range-input"
          min={1}
          max={MAX_CHARACTER_LEVEL}
          value={level}
          onChange={(event) => setLevel(event.target.value)}
        />
        <span className="field-hint">Levels 1–{MAX_CHARACTER_LEVEL}. Each level rolls class hit dice plus racial bonus.</span>
      </label>

      <div className="admin-hit-point-source">
        <label className="admin-checkbox-label">
          <input
            type="radio"
            name="hit-point-source"
            checked={source === 'derived'}
            onChange={() => setSource('derived')}
          />
          <span>Derived from class + character type</span>
        </label>
        <label className="admin-checkbox-label">
          <input
            type="radio"
            name="hit-point-source"
            checked={source === 'override'}
            onChange={() => setSource('override')}
          />
          <span>Fixed override</span>
        </label>
      </div>

      {source === 'derived' ? (
        <div className="admin-hit-point-derived">
          <div className="admin-hit-point-derived-row">
            <span className="admin-hit-point-derived-label">Class hit dice</span>
            <span className="admin-hit-point-derived-value">
              {linkedClass && classDice
                ? `${linkedClass.name}: ${formatDiceRoll(classDice)}/level (${formatDiceRange(classDice)} HP)`
                : 'Assign a class'}
            </span>
          </div>
          <div className="admin-hit-point-derived-row">
            <span className="admin-hit-point-derived-label">Racial bonus</span>
            <span className="admin-hit-point-derived-value">
              {!linkedLineageType
                ? 'Assign a character type'
                : raceDice && !isEmptyDiceRoll(raceDice)
                  ? `${formatDiceRoll(raceDice)}/level (${formatDiceRange(raceDice)} HP)`
                  : 'None'}
            </span>
          </div>
          <div className="admin-hit-point-derived-row">
            <span className="admin-hit-point-derived-label">Per level</span>
            <span className="admin-hit-point-derived-value">
              {perLevel.parts.length > 0
                ? `${perLevel.expression} (${formatCombinedDiceRange(perLevel)} HP)`
                : '—'}
            </span>
          </div>
          <div className="admin-hit-point-derived-total">
            <span>At level {level}</span>
            <strong>
              {atLevel.parts.length > 0
                ? `${atLevel.expression} (${formatCombinedDiceRange(atLevel)} HP)`
                : '—'}
            </strong>
          </div>
        </div>
      ) : (
        <label className="field">
          <span>Hit point override</span>
          <input
            type="number"
            className="admin-stat-range-input"
            min={0}
            value={meta.hitPointOverride ?? ''}
            placeholder="Enter fixed HP"
            onChange={(event) => setOverride(event.target.value)}
          />
          <span className="field-hint">Bypasses class, racial hit dice, and level for this character.</span>
        </label>
      )}
    </fieldset>
  )
}
