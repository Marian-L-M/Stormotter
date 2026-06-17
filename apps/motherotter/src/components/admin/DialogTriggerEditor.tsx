import {
  DIALOG_TRIGGER_MODE_LABELS,
  type DialogTriggerConfig,
  type DialogTriggerMode,
} from '../../admin/dialogTypes'
import { createGameplayConditionGroup } from '../../admin/gameplayConditionTypes'
import { GameplayConditionEditor } from './GameplayConditionEditor'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useStorylinesStore } from '../../store/storylinesStore'

interface DialogTriggerEditorProps {
  value: DialogTriggerConfig
  linkedCharacterId: string | null
  onChange: (patch: Partial<DialogTriggerConfig>) => void
}

export function DialogTriggerEditor({ value, linkedCharacterId, onChange }: DialogTriggerEditorProps) {
  const characters = useContentCatalogStore((state) => state.stubs.characters)
  const storylines = useStorylinesStore((state) => state.storylines)

  function setMode(mode: DialogTriggerMode) {
    onChange({ mode })
  }

  return (
    <div className="dialog-trigger-editor">
      <fieldset className="admin-fieldset">
        <legend>How this dialog starts</legend>
        <div className="dialog-trigger-mode-grid">
          {(Object.keys(DIALOG_TRIGGER_MODE_LABELS) as DialogTriggerMode[]).map((mode) => (
            <label key={mode} className="field admin-checkbox-field dialog-trigger-mode-option">
              <input
                type="radio"
                name="dialog-trigger-mode"
                checked={value.mode === mode}
                onChange={() => setMode(mode)}
              />
              <span>{DIALOG_TRIGGER_MODE_LABELS[mode]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {value.mode === 'storyline' ? (
        <fieldset className="admin-fieldset">
          <legend>Storyline hook</legend>
          <p className="field-hint">
            Story scripts fire this id externally — the dialog does not poll state on its own.
          </p>
          <label className="field">
            <span>Storyline</span>
            <select
              className="admin-select admin-select-block"
              value={value.storylineTriggerId ?? ''}
              onChange={(event) =>
                onChange({
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
        </fieldset>
      ) : null}

      {value.mode === 'automatic' ? (
        <>
          <p className="admin-editor-lead">
            Fires when gameplay state matches, environment allows, and optional game-time delay elapses.
          </p>
          <GameplayConditionEditor
            root={value.autoStateConditions ?? createGameplayConditionGroup('and')}
            characterId={linkedCharacterId ?? undefined}
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
            <label className="field admin-checkbox-field">
              <input
                type="checkbox"
                checked={value.environment.onlyAfterReset}
                onChange={(event) =>
                  onChange({
                    environment: { ...value.environment, onlyAfterReset: event.target.checked },
                  })
                }
              />
              <span>Only after game reset / new session</span>
            </label>
          </fieldset>
          <label className="field">
            <span>Game-time delay (minutes)</span>
            <input
              type="number"
              min={0}
              value={value.gameTimeDelayMinutes ?? ''}
              onChange={(event) => {
                const raw = event.target.value
                onChange({
                  gameTimeDelayMinutes: raw.length > 0 ? Math.max(0, Number(raw)) : null,
                })
              }}
              placeholder="Immediate when conditions match"
            />
            <span className="field-hint">Wait this many in-game minutes after conditions become true.</span>
          </label>
        </>
      ) : null}

      {value.mode === 'manual' ? (
        <fieldset className="admin-fieldset">
          <legend>Talk target</legend>
          <p className="field-hint">
            Player selects this character in the world to start the conversation (BG-style click-to-talk).
          </p>
          <label className="field">
            <span>Character to talk to</span>
            <select
              className="admin-select admin-select-block"
              value={value.manualTargetCharacterId ?? linkedCharacterId ?? ''}
              onChange={(event) =>
                onChange({
                  manualTargetCharacterId: event.target.value.length > 0 ? event.target.value : null,
                })
              }
            >
              <option value="">Use linked NPC from Details</option>
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.title}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      ) : null}
    </div>
  )
}
