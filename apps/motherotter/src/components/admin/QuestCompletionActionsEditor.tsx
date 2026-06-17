import {
  createEmptyQuestCompletionAction,
  QUEST_COMPLETION_ACTION_LABELS,
  type QuestCompletionAction,
  type QuestCompletionActionKind,
} from '../../admin/questTypes'
import { useDialogsStore } from '../../store/dialogsStore'
import { useJournalStore } from '../../store/journalStore'
import { useQuestsStore } from '../../store/questsStore'
import { useStorylinesStore } from '../../store/storylinesStore'

interface QuestCompletionActionsEditorProps {
  actions: QuestCompletionAction[]
  currentQuestId: string
  onChange: (actions: QuestCompletionAction[]) => void
}

export function QuestCompletionActionsEditor({
  actions,
  currentQuestId,
  onChange,
}: QuestCompletionActionsEditorProps) {
  const dialogs = useDialogsStore((state) => state.dialogs)
  const quests = useQuestsStore((state) => state.quests)
  const journalEntries = useJournalStore((state) => state.entries)
  const storylines = useStorylinesStore((state) => state.storylines)

  function updateAction(index: number, patch: Partial<QuestCompletionAction>) {
    onChange(
      actions.map((action, actionIndex) =>
        actionIndex === index ? { ...action, ...patch } : action,
      ),
    )
  }

  return (
    <div className="quest-completion-actions-editor">
      <p className="field-hint">
        Chain follow-up conversations, quests, journal entries, or storyline hooks when this quest
        completes.
      </p>

      {actions.map((action, index) => (
        <fieldset key={action.id} className="admin-fieldset dialog-reply-card">
          <legend>Action {index + 1}</legend>
          <label className="field">
            <span>Action type</span>
            <select
              className="admin-select admin-select-block"
              value={action.kind}
              onChange={(event) =>
                updateAction(index, { kind: event.target.value as QuestCompletionActionKind })
              }
            >
              {(Object.keys(QUEST_COMPLETION_ACTION_LABELS) as QuestCompletionActionKind[]).map(
                (kind) => (
                  <option key={kind} value={kind}>
                    {QUEST_COMPLETION_ACTION_LABELS[kind]}
                  </option>
                ),
              )}
            </select>
          </label>

          {action.kind === 'start_dialog' ? (
            <label className="field">
              <span>Dialog</span>
              <select
                className="admin-select admin-select-block"
                value={action.dialogId ?? ''}
                onChange={(event) =>
                  updateAction(index, {
                    dialogId: event.target.value.length > 0 ? event.target.value : null,
                  })
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

          {action.kind === 'start_quest' ? (
            <label className="field">
              <span>Quest</span>
              <select
                className="admin-select admin-select-block"
                value={action.questId ?? ''}
                onChange={(event) =>
                  updateAction(index, {
                    questId: event.target.value.length > 0 ? event.target.value : null,
                  })
                }
              >
                <option value="">Select quest…</option>
                {quests
                  .filter((quest) => quest.id !== currentQuestId)
                  .map((quest) => (
                    <option key={quest.id} value={quest.id}>
                      {quest.name}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}

          {action.kind === 'add_journal' ? (
            <label className="field">
              <span>Journal entry</span>
              <select
                className="admin-select admin-select-block"
                value={action.journalEntryId ?? ''}
                onChange={(event) =>
                  updateAction(index, {
                    journalEntryId: event.target.value.length > 0 ? event.target.value : null,
                  })
                }
              >
                <option value="">Select entry…</option>
                {journalEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {action.kind === 'fire_storyline' ? (
            <label className="field">
              <span>Storyline</span>
              <select
                className="admin-select admin-select-block"
                value={action.storylineTriggerId ?? ''}
                onChange={(event) =>
                  updateAction(index, {
                    storylineTriggerId: event.target.value.length > 0 ? event.target.value : null,
                  })
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

          <button
            type="button"
            className="admin-danger-button"
            onClick={() => onChange(actions.filter((_, i) => i !== index))}
          >
            Remove action
          </button>
        </fieldset>
      ))}

      <button
        type="button"
        className="admin-secondary-button"
        onClick={() => onChange([...actions, createEmptyQuestCompletionAction()])}
      >
        Add completion action
      </button>
    </div>
  )
}
