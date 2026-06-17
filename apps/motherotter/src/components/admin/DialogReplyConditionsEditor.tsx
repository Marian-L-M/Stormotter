import {
  createEmptyDialogRequirementCheck,
  createEmptyDialogReplyConditions,
  type DialogReplyConditions,
  type DialogRequirementCheck,
  type DialogRequirementOperator,
  type DialogRequirementSubject,
} from '../../admin/dialogTypes'
import { createGameplayConditionGroup } from '../../admin/gameplayConditionTypes'
import { GameplayConditionEditor } from './GameplayConditionEditor'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useAttributesStore } from '../../store/attributesStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useStateVariablesStore } from '../../store/stateVariablesStore'

const SUBJECT_LABELS: Record<DialogRequirementSubject, string> = {
  state: 'Gameplay state',
  attribute: 'Attribute',
  ability: 'Ability',
  group_member: 'Party member present',
  main_in_group: 'Main character in party',
}

interface DialogReplyConditionsEditorProps {
  value: DialogReplyConditions | null
  onChange: (value: DialogReplyConditions | null) => void
  linkedCharacterId?: string | null
  legend?: string
}

export function DialogReplyConditionsEditor({
  value,
  onChange,
  linkedCharacterId,
  legend = 'Show when',
}: DialogReplyConditionsEditorProps) {
  const conditions = value ?? createEmptyDialogReplyConditions()
  const characters = useContentCatalogStore((state) => state.stubs.characters)
  const variables = useStateVariablesStore((state) => state.variables)
  const attributes = useAttributesStore((state) => state.definitions)
  const abilities = useAbilitiesStore((state) => state.definitions)

  function patchConditions(patch: Partial<DialogReplyConditions>) {
    const next = { ...conditions, ...patch }
    if (!next.gameplayState && next.checks.length === 0) {
      onChange(null)
    } else {
      onChange(next)
    }
  }

  function updateCheck(index: number, patch: Partial<DialogRequirementCheck>) {
    patchConditions({
      checks: conditions.checks.map((check, checkIndex) =>
        checkIndex === index ? { ...check, ...patch } : check,
      ),
    })
  }

  function removeCheck(index: number) {
    patchConditions({ checks: conditions.checks.filter((_, checkIndex) => checkIndex !== index) })
  }

  function addCheck(subject: DialogRequirementSubject) {
    patchConditions({ checks: [...conditions.checks, createEmptyDialogRequirementCheck(subject)] })
  }

  return (
    <fieldset className="admin-fieldset dialog-reply-conditions">
      <legend>{legend}</legend>
      <p className="field-hint">
        All sections must pass. Use party-member checks for companion interjections; use player reply
        checks for conditional main-character options.
      </p>

      <GameplayConditionEditor
        root={conditions.gameplayState ?? createGameplayConditionGroup('and')}
        characterId={linkedCharacterId ?? undefined}
        onChange={(gameplayState) =>
          patchConditions({
            gameplayState: gameplayState.children.length > 0 ? gameplayState : null,
          })
        }
      />

      {conditions.checks.length > 0 ? (
        <ul className="dialog-requirement-checks-list">
          {conditions.checks.map((check, index) => (
            <li key={check.id} className="dialog-requirement-check-row">
              <label className="field">
                <span>Check type</span>
                <select
                  className="admin-select admin-select-block"
                  value={check.subject}
                  onChange={(event) =>
                    updateCheck(index, {
                      subject: event.target.value as DialogRequirementSubject,
                      referenceId: null,
                      operator:
                        event.target.value === 'main_in_group'
                          ? 'has'
                          : event.target.value === 'group_member' || event.target.value === 'ability'
                            ? 'has'
                            : 'greater_or_equal',
                    })
                  }
                >
                  {Object.entries(SUBJECT_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {check.subject === 'group_member' ? (
                <label className="field">
                  <span>Character</span>
                  <select
                    className="admin-select admin-select-block"
                    value={check.referenceId ?? ''}
                    onChange={(event) =>
                      updateCheck(index, {
                        referenceId: event.target.value.length > 0 ? event.target.value : null,
                      })
                    }
                  >
                    <option value="">Select character…</option>
                    {characters.map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {check.subject === 'attribute' ? (
                <>
                  <label className="field">
                    <span>Attribute</span>
                    <select
                      className="admin-select admin-select-block"
                      value={check.referenceId ?? ''}
                      onChange={(event) =>
                        updateCheck(index, {
                          referenceId: event.target.value.length > 0 ? event.target.value : null,
                        })
                      }
                    >
                      <option value="">Select attribute…</option>
                      {attributes.map((attribute) => (
                        <option key={attribute.id} value={attribute.id}>
                          {attribute.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Minimum value</span>
                    <input
                      type="number"
                      value={check.numericValue ?? 0}
                      onChange={(event) =>
                        updateCheck(index, { numericValue: Number(event.target.value) })
                      }
                    />
                  </label>
                </>
              ) : null}

              {check.subject === 'ability' ? (
                <label className="field">
                  <span>Ability</span>
                  <select
                    className="admin-select admin-select-block"
                    value={check.referenceId ?? ''}
                    onChange={(event) =>
                      updateCheck(index, {
                        referenceId: event.target.value.length > 0 ? event.target.value : null,
                      })
                    }
                  >
                    <option value="">Select ability…</option>
                    {abilities.map((ability) => (
                      <option key={ability.id} value={ability.id}>
                        {ability.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {check.subject === 'state' ? (
                <label className="field">
                  <span>State variable</span>
                  <select
                    className="admin-select admin-select-block"
                    value={check.referenceId ?? ''}
                    onChange={(event) =>
                      updateCheck(index, {
                        referenceId: event.target.value.length > 0 ? event.target.value : null,
                      })
                    }
                  >
                    <option value="">Select state…</option>
                    {variables.map((variable) => (
                      <option key={variable.id} value={variable.id}>
                        {variable.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {check.subject === 'group_member' || check.subject === 'ability' ? (
                <label className="field">
                  <span>Operator</span>
                  <select
                    className="admin-select admin-select-block"
                    value={check.operator}
                    onChange={(event) =>
                      updateCheck(index, { operator: event.target.value as DialogRequirementOperator })
                    }
                  >
                    <option value="has">Has / is present</option>
                    <option value="not_has">Does not have / absent</option>
                  </select>
                </label>
              ) : null}

              <button
                type="button"
                className="admin-danger-button"
                onClick={() => removeCheck(index)}
              >
                Remove check
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="dialog-requirement-check-add">
        <button type="button" className="admin-secondary-button" onClick={() => addCheck('group_member')}>
          + Party member
        </button>
        <button type="button" className="admin-secondary-button" onClick={() => addCheck('attribute')}>
          + Attribute
        </button>
        <button type="button" className="admin-secondary-button" onClick={() => addCheck('ability')}>
          + Ability
        </button>
        <button type="button" className="admin-secondary-button" onClick={() => addCheck('main_in_group')}>
          + Main in party
        </button>
      </div>
    </fieldset>
  )
}
