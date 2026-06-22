import {
  createGameplayConditionGroup,
  normalizeGameplayConditionGroup,
  type GameplayConditionGroup,
} from '../../admin/gameplayConditionTypes'
import { GameplayConditionEditor } from './GameplayConditionEditor'

interface OptionalGameplayConditionFieldProps {
  value: GameplayConditionGroup | null
  onChange: (value: GameplayConditionGroup | null) => void
  legend?: string
  hint?: string
}

export function OptionalGameplayConditionField({
  value,
  onChange,
  legend = 'Unlock conditions',
  hint = 'Leave disabled to always unlock when level is reached.',
}: OptionalGameplayConditionFieldProps) {
  const enabled = value !== null
  const root = value ?? createGameplayConditionGroup()

  return (
    <fieldset className="admin-fieldset admin-fieldset-nested">
      <legend>{legend}</legend>
      <p className="field-hint">{hint}</p>
      <label className="admin-checkbox-field">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => {
            if (event.target.checked) {
              onChange(normalizeGameplayConditionGroup(root) ?? createGameplayConditionGroup())
            } else {
              onChange(null)
            }
          }}
        />
        <span>Require gameplay conditions</span>
      </label>
      {enabled ? (
        <GameplayConditionEditor root={root} onChange={(next) => onChange(next)} />
      ) : null}
    </fieldset>
  )
}
