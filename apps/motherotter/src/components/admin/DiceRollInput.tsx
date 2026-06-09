import {
  formatDiceRange,
  formatDiceRoll,
  HIT_DIE_SIDES,
  normalizeDiceRoll,
  type DiceRoll,
} from '../../admin/diceTypes'

interface DiceRollInputProps {
  label?: string
  value: DiceRoll
  onChange: (value: DiceRoll) => void
  hint?: string
  /** Suffix after the numeric range in the summary (default " HP"). Pass empty string to omit. */
  rangeSuffix?: string
  /** When true, count may be 0 (for optional racial bonus dice). Default false → min count 1 */
  allowEmpty?: boolean
  /** Restrict sides to BG2 hit die sizes */
  hitDiePreset?: boolean
}

export function DiceRollInput({
  label,
  value,
  onChange,
  hint,
  rangeSuffix = ' HP',
  allowEmpty = false,
  hitDiePreset = false,
}: DiceRollInputProps) {
  const dice = normalizeDiceRoll(value)
  const minCount = allowEmpty ? 0 : 1

  function updateCount(raw: string) {
    const trimmed = raw.trim()
    if (trimmed === '' && allowEmpty) {
      onChange({ ...dice, count: 0 })
      return
    }
    const next = Number(trimmed)
    if (!Number.isFinite(next)) return
    onChange(normalizeDiceRoll({ ...dice, count: next }))
  }

  function updateSides(nextSides: number) {
    onChange(normalizeDiceRoll({ ...dice, sides: nextSides }))
  }

  return (
    <div className="dice-roll-input">
      {label ? <span className="dice-roll-label">{label}</span> : null}
      <div className="dice-roll-row">
        <label className="dice-roll-field">
          <span className="dice-roll-field-label">Dice</span>
          <input
            type="number"
            className="admin-stat-range-input dice-roll-count"
            min={minCount}
            max={99}
            value={dice.count}
            onChange={(event) => updateCount(event.target.value)}
          />
        </label>
        <span className="dice-roll-separator" aria-hidden="true">
          ×
        </span>
        <label className="dice-roll-field">
          <span className="dice-roll-field-label">Sides</span>
          {hitDiePreset ? (
            <select
              className="admin-select dice-roll-sides"
              value={dice.sides}
              onChange={(event) => updateSides(Number(event.target.value))}
            >
              {HIT_DIE_SIDES.map((sides) => (
                <option key={sides} value={sides}>
                  d{sides}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              className="admin-stat-range-input dice-roll-sides"
              min={2}
              max={100}
              value={dice.sides}
              onChange={(event) => {
                const next = Number(event.target.value)
                if (!Number.isFinite(next)) return
                updateSides(next)
              }}
            />
          )}
        </label>
        <div className="dice-roll-summary" aria-live="polite">
          <strong>{formatDiceRoll(dice)}</strong>
          {!isEmptyDisplay(dice) && rangeSuffix !== '' ? (
            <span className="field-hint">
              {formatDiceRange(dice)}
              {rangeSuffix}
            </span>
          ) : !isEmptyDisplay(dice) ? (
            <span className="field-hint">{formatDiceRange(dice)}</span>
          ) : null}
        </div>
      </div>
      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  )
}

function isEmptyDisplay(dice: DiceRoll): boolean {
  return dice.count <= 0
}
