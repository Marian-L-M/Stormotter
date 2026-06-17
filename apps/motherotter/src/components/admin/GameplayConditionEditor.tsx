import type { StateVariable } from '../../admin/stateTypes'
import {
  GAMEPLAY_CONDITION_JOIN_LABELS,
  addGameplayConditionChild,
  createGameplayConditionGroup,
  createGameplayStateCheck,
  operatorLabelsForStateType,
  operatorNeedsCompareValue,
  operatorsForStateType,
  removeGameplayConditionNode,
  updateGameplayConditionTree,
  type GameplayConditionGroup,
  type GameplayConditionNode,
  type GameplayConditionOperator,
} from '../../admin/gameplayConditionTypes'
import { useStateVariablesStore } from '../../store/stateVariablesStore'

interface GameplayConditionEditorProps {
  root: GameplayConditionGroup
  onChange: (root: GameplayConditionGroup) => void
  characterId?: string
}

function filterVariables(variables: StateVariable[], characterId?: string): StateVariable[] {
  return variables.filter((variable) => {
    if (variable.scope === 'global') return true
    if (!characterId) return false
    return variable.characterId === characterId
  })
}

function GameplayConditionNodeEditor({
  node,
  root,
  onChange,
  characterId,
  depth = 0,
}: {
  node: GameplayConditionNode
  root: GameplayConditionGroup
  onChange: (root: GameplayConditionGroup) => void
  characterId?: string
  depth?: number
}) {
  const variables = useStateVariablesStore((state) => state.variables)
  const availableVariables = filterVariables(variables, characterId)

  if (node.type === 'check') {
    const selectedVariable = availableVariables.find((entry) => entry.id === node.stateVariableId)
    const varType = selectedVariable?.varType ?? 'boolean'
    const operators = operatorsForStateType(varType)
    const operatorLabels = operatorLabelsForStateType(varType)

    function patchCheck(patch: Partial<Extract<GameplayConditionNode, { type: 'check' }>>) {
      onChange(
        updateGameplayConditionTree(root, node.id, (current) =>
          current.type === 'check' ? { ...current, ...patch } : current,
        ),
      )
    }

    return (
      <div className="gameplay-condition-check">
        <label className="field">
          <span>Gameplay state</span>
          <select
            className="admin-select admin-select-block"
            value={node.stateVariableId}
            onChange={(event) => {
              const nextVariable = availableVariables.find((entry) => entry.id === event.target.value)
              const nextType = nextVariable?.varType ?? 'boolean'
              const nextOperators = operatorsForStateType(nextType)
              patchCheck({
                stateVariableId: event.target.value,
                operator: nextOperators[0] ?? 'equals',
                compareValue: nextVariable?.defaultValue ?? null,
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
          <span>Operator</span>
          <select
            className="admin-select admin-select-block"
            value={node.operator}
            onChange={(event) =>
              patchCheck({ operator: event.target.value as GameplayConditionOperator })
            }
          >
            {operators.map((operator) => (
              <option key={operator} value={operator}>
                {operatorLabels[operator]}
              </option>
            ))}
          </select>
        </label>

        {operatorNeedsCompareValue(varType) ? (
          <label className="field">
            <span>Value</span>
            {varType === 'number' ? (
              <input
                type="number"
                value={typeof node.compareValue === 'number' ? node.compareValue : ''}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  patchCheck({ compareValue: Number.isFinite(value) ? value : null })
                }}
              />
            ) : (
              <input
                value={typeof node.compareValue === 'string' ? node.compareValue : ''}
                onChange={(event) => patchCheck({ compareValue: event.target.value })}
              />
            )}
          </label>
        ) : null}

        {depth > 0 ? (
          <button
            type="button"
            className="admin-text-button admin-danger-text"
            onClick={() => onChange(removeGameplayConditionNode(root, node.id))}
          >
            Remove check
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`gameplay-condition-group${depth > 0 ? ' is-nested' : ''}`}>
      <div className="gameplay-condition-group-header">
        <label className="field">
          <span>Join with</span>
          <select
            className="admin-select admin-select-block"
            value={node.join}
            onChange={(event) =>
              onChange(
                updateGameplayConditionTree(root, node.id, (current) =>
                  current.type === 'group'
                    ? { ...current, join: event.target.value as 'and' | 'or' }
                    : current,
                ),
              )
            }
          >
            {Object.entries(GAMEPLAY_CONDITION_JOIN_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="gameplay-condition-group-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() =>
              onChange(addGameplayConditionChild(root, node.id, createGameplayStateCheck()))
            }
          >
            Add check
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() =>
              onChange(addGameplayConditionChild(root, node.id, createGameplayConditionGroup('and')))
            }
          >
            Add group
          </button>
          {depth > 0 ? (
            <button
              type="button"
              className="admin-text-button admin-danger-text"
              onClick={() => onChange(removeGameplayConditionNode(root, node.id))}
            >
              Remove group
            </button>
          ) : null}
        </div>
      </div>

      {node.children.length === 0 ? (
        <p className="field-hint admin-empty-inline">Add gameplay state checks or nested groups.</p>
      ) : (
        <ul className="gameplay-condition-children">
          {node.children.map((child) => (
            <li key={child.id}>
              <GameplayConditionNodeEditor
                node={child}
                root={root}
                onChange={onChange}
                characterId={characterId}
                depth={depth + 1}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function GameplayConditionEditor({ root, onChange, characterId }: GameplayConditionEditorProps) {
  const variables = useStateVariablesStore((state) => state.variables)
  const availableVariables = filterVariables(variables, characterId)

  if (availableVariables.length === 0) {
    return (
      <p className="field-hint">
        Create gameplay state variables under Gameplay → State before adding conditions.
      </p>
    )
  }

  return (
    <GameplayConditionNodeEditor node={root} root={root} onChange={onChange} characterId={characterId} />
  )
}
