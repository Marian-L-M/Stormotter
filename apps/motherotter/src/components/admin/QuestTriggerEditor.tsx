import {
  QUEST_TRIGGER_MODE_LABELS,
  type QuestTriggerConfig,
  type QuestTriggerMode,
} from '../../admin/questTypes'
import { createGameplayConditionGroup } from '../../admin/gameplayConditionTypes'
import { GameplayConditionEditor } from './GameplayConditionEditor'
import { useDialogsStore } from '../../store/dialogsStore'
import { useStorylinesStore } from '../../store/storylinesStore'

interface QuestTriggerEditorProps {
  value: QuestTriggerConfig
  onChange: (patch: Partial<QuestTriggerConfig>) => void
}

export function QuestTriggerEditor({ value, onChange }: QuestTriggerEditorProps) {
  const dialogs = useDialogsStore((state) => state.dialogs)
  const storylines = useStorylinesStore((state) => state.storylines)

  return (
    <div className="quest-trigger-editor">
      <fieldset className="admin-fieldset">
        <legend>How this quest starts</legend>
        <div className="dialog-trigger-mode-grid">
          {(Object.keys(QUEST_TRIGGER_MODE_LABELS) as QuestTriggerMode[]).map((mode) => (
            <label key={mode} className="field admin-checkbox-field dialog-trigger-mode-option">
              <input
                type="radio"
                name="quest-trigger-mode"
                checked={value.mode === mode}
                onChange={() => onChange({ mode })}
              />
              <span>{QUEST_TRIGGER_MODE_LABELS[mode]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {value.mode === 'storyline' ? (
        <label className="field">
          <span>Storyline hook</span>
          <select
            className="admin-select admin-select-block"
            value={value.storylineTriggerId ?? ''}
            onChange={(event) =>
              onChange({ storylineTriggerId: event.target.value.length > 0 ? event.target.value : null })
            }
          >
            <option value="">Select storyline…</option>
            {storylines.map((storyline) => (
              <option key={storyline.id} value={storyline.id}>
                {storyline.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {value.mode === 'automatic_state' ? (
        <>
          <GameplayConditionEditor
            root={value.autoStateConditions ?? createGameplayConditionGroup('and')}
            onChange={(autoStateConditions) =>
              onChange({
                autoStateConditions:
                  autoStateConditions.children.length > 0 ? autoStateConditions : null,
              })
            }
          />
          <fieldset className="admin-fieldset">
            <legend>Environment</legend>
            <label className="field admin-checkbox-field">
              <input
                type="checkbox"
                checked={value.environment.requireNotInBattle}
                onChange={(event) =>
                  onChange({
                    environment: {
                      ...value.environment,
                      requireNotInBattle: event.target.checked,
                    },
                  })
                }
              />
              <span>Only while not in battle</span>
            </label>
          </fieldset>
        </>
      ) : null}

      {value.mode === 'manual_dialog' ? (
        <label className="field">
          <span>Offered via conversation</span>
          <select
            className="admin-select admin-select-block"
            value={value.manualDialogId ?? ''}
            onChange={(event) =>
              onChange({ manualDialogId: event.target.value.length > 0 ? event.target.value : null })
            }
          >
            <option value="">Select dialog…</option>
            {dialogs.map((dialog) => (
              <option key={dialog.id} value={dialog.id}>
                {dialog.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {value.mode === 'manual_map_event' ? (
        <label className="field">
          <span>Map event id</span>
          <input
            value={value.manualMapEventId ?? ''}
            onChange={(event) =>
              onChange({ manualMapEventId: event.target.value.trim() || null })
            }
            placeholder="e.g. spawn-point-id or event-star content id"
          />
        </label>
      ) : null}
    </div>
  )
}
