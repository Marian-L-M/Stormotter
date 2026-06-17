import {
  createEmptyQuestObjective,
  QUEST_OBJECTIVE_KIND_LABELS,
  type QuestObjective,
  type QuestObjectiveKind,
} from '../../admin/questTypes'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useItemsStore } from '../../store/itemsStore'
import { useStateVariablesStore } from '../../store/stateVariablesStore'

interface QuestObjectivesEditorProps {
  objectives: QuestObjective[]
  objectiveJoin: 'and' | 'or'
  onChangeObjectives: (objectives: QuestObjective[]) => void
  onChangeJoin: (join: 'and' | 'or') => void
}

export function QuestObjectivesEditor({
  objectives,
  objectiveJoin,
  onChangeObjectives,
  onChangeJoin,
}: QuestObjectivesEditorProps) {
  const items = useItemsStore((state) => state.items)
  const characters = useContentCatalogStore((state) => state.stubs.characters)
  const variables = useStateVariablesStore((state) => state.variables)

  function updateObjective(index: number, patch: Partial<QuestObjective>) {
    onChangeObjectives(
      objectives.map((objective, objectiveIndex) =>
        objectiveIndex === index ? { ...objective, ...patch } : objective,
      ),
    )
  }

  return (
    <div className="quest-objectives-editor">
      <fieldset className="admin-fieldset">
        <legend>Objective logic</legend>
        <label className="field">
          <span>Complete when</span>
          <select
            className="admin-select admin-select-block"
            value={objectiveJoin}
            onChange={(event) => onChangeJoin(event.target.value as 'and' | 'or')}
          >
            <option value="and">All objectives complete (AND)</option>
            <option value="or">Any objective complete (OR)</option>
          </select>
        </label>
      </fieldset>

      {objectives.map((objective, index) => (
        <fieldset key={objective.id} className="admin-fieldset dialog-reply-card">
          <legend>Objective {index + 1}</legend>
          <label className="field">
            <span>Type</span>
            <select
              className="admin-select admin-select-block"
              value={objective.kind}
              onChange={(event) =>
                updateObjective(index, { kind: event.target.value as QuestObjectiveKind })
              }
            >
              {(Object.keys(QUEST_OBJECTIVE_KIND_LABELS) as QuestObjectiveKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {QUEST_OBJECTIVE_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Journal label</span>
            <input
              value={objective.label}
              onChange={(event) => updateObjective(index, { label: event.target.value })}
              placeholder="Shown in quest log…"
            />
          </label>

          {objective.kind === 'collect_item' ? (
            <label className="field">
              <span>Item</span>
              <select
                className="admin-select admin-select-block"
                value={objective.itemId ?? ''}
                onChange={(event) =>
                  updateObjective(index, {
                    itemId: event.target.value.length > 0 ? event.target.value : null,
                  })
                }
              >
                <option value="">Select item…</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {objective.kind === 'kill_character' || objective.kind === 'talk_to_character' ? (
            <label className="field">
              <span>Character</span>
              <select
                className="admin-select admin-select-block"
                value={objective.characterId ?? ''}
                onChange={(event) =>
                  updateObjective(index, {
                    characterId: event.target.value.length > 0 ? event.target.value : null,
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

          {objective.kind === 'trigger_state' ? (
            <>
              <label className="field">
                <span>State variable</span>
                <select
                  className="admin-select admin-select-block"
                  value={objective.stateVariableId ?? ''}
                  onChange={(event) =>
                    updateObjective(index, {
                      stateVariableId: event.target.value.length > 0 ? event.target.value : null,
                    })
                  }
                >
                  <option value="">Select state…</option>
                  {variables.map((variable) => (
                    <option key={variable.id} value={variable.id}>
                      {variable.title} ({variable.key})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Target value</span>
                <input
                  value={
                    objective.stateCompareValue === null || objective.stateCompareValue === undefined
                      ? ''
                      : String(objective.stateCompareValue)
                  }
                  onChange={(event) =>
                    updateObjective(index, { stateCompareValue: event.target.value })
                  }
                />
              </label>
            </>
          ) : null}

          {objective.kind === 'reach_map_event' ? (
            <label className="field">
              <span>Map event id</span>
              <input
                value={objective.mapEventId ?? ''}
                onChange={(event) =>
                  updateObjective(index, { mapEventId: event.target.value.trim() || null })
                }
              />
            </label>
          ) : null}

          {objective.kind === 'collect_item' || objective.kind === 'kill_character' ? (
            <label className="field">
              <span>Required count</span>
              <input
                type="number"
                min={1}
                value={objective.requiredCount}
                onChange={(event) =>
                  updateObjective(index, {
                    requiredCount: Math.max(1, Number(event.target.value) || 1),
                  })
                }
              />
            </label>
          ) : null}

          <button
            type="button"
            className="admin-danger-button"
            disabled={objectives.length <= 1}
            onClick={() => onChangeObjectives(objectives.filter((_, i) => i !== index))}
          >
            Remove objective
          </button>
        </fieldset>
      ))}

      <button
        type="button"
        className="admin-secondary-button"
        onClick={() => onChangeObjectives([...objectives, createEmptyQuestObjective()])}
      >
        Add objective
      </button>
    </div>
  )
}
