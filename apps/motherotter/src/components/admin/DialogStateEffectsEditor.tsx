import type { DialogStateEffect } from '../../admin/dialogTypes'
import { createEmptyDialogStateEffect } from '../../admin/dialogTypes'
import type { StateVariable } from '../../admin/stateTypes'
import { formatDefaultValue } from '../../admin/stateTypes'

interface DialogStateEffectsEditorProps {
  effects: DialogStateEffect[]
  variables: StateVariable[]
  characterId?: string | null
  onChange: (effects: DialogStateEffect[]) => void
  legend?: string
}

function filterVariables(variables: StateVariable[], characterId?: string | null): StateVariable[] {
  return variables.filter((variable) => {
    if (variable.scope === 'global') return true
    if (!characterId) return false
    return variable.characterId === characterId || variable.characterId === null
  })
}

export function DialogStateEffectsEditor({
  effects,
  variables,
  characterId,
  onChange,
  legend = 'State effects',
}: DialogStateEffectsEditorProps) {
  const availableVariables = filterVariables(variables, characterId)

  function updateEffect(index: number, patch: Partial<DialogStateEffect>) {
    onChange(
      effects.map((effect, effectIndex) =>
        effectIndex === index ? { ...effect, ...patch } : effect,
      ),
    )
  }

  function removeEffect(index: number) {
    onChange(effects.filter((_, effectIndex) => effectIndex !== index))
  }

  function addEffect() {
    onChange([...effects, createEmptyDialogStateEffect()])
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>{legend}</legend>
      <p className="field-hint">
        Write gameplay state when this fires. Global variables always appear; character-scoped
        variables match the linked character.
      </p>

      {effects.length === 0 ? (
        <p className="admin-empty">No state effects yet.</p>
      ) : (
        <ul className="dialog-state-effects-list">
          {effects.map((effect, index) => {
            const selectedVariable = availableVariables.find(
              (entry) => entry.id === effect.stateVariableId,
            )
            return (
              <li key={effect.id} className="dialog-state-effect-row">
                <label className="field">
                  <span>State variable</span>
                  <select
                    className="admin-select admin-select-block"
                    value={effect.stateVariableId}
                    onChange={(event) => {
                      const nextVariable = availableVariables.find(
                        (entry) => entry.id === event.target.value,
                      )
                      updateEffect(index, {
                        stateVariableId: event.target.value,
                        value: nextVariable?.defaultValue ?? null,
                      })
                    }}
                  >
                    <option value="">Select state…</option>
                    {availableVariables.map((variable) => (
                      <option key={variable.id} value={variable.id}>
                        {variable.title} ({variable.key})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Set value</span>
                  {!selectedVariable || selectedVariable.varType === 'boolean' ? (
                    <select
                      className="admin-select admin-select-block"
                      value={effect.value === true ? 'true' : 'false'}
                      onChange={(event) =>
                        updateEffect(index, { value: event.target.value === 'true' })
                      }
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : selectedVariable.varType === 'number' ? (
                    <input
                      type="number"
                      value={typeof effect.value === 'number' ? effect.value : 0}
                      onChange={(event) =>
                        updateEffect(index, { value: Number(event.target.value) })
                      }
                    />
                  ) : (
                    <input
                      value={typeof effect.value === 'string' ? effect.value : ''}
                      onChange={(event) => updateEffect(index, { value: event.target.value })}
                    />
                  )}
                  {selectedVariable ? (
                    <span className="field-hint">
                      Default: {formatDefaultValue(selectedVariable.defaultValue)}
                    </span>
                  ) : null}
                </label>

                <button
                  type="button"
                  className="admin-danger-button dialog-state-effect-remove"
                  onClick={() => removeEffect(index)}
                >
                  Remove
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <button type="button" className="admin-secondary-button" onClick={addEffect}>
        Add state effect
      </button>
    </fieldset>
  )
}
