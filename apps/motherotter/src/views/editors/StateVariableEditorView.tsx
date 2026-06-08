import {
  formatDefaultValue,
  isValidStateKey,
  STATE_SCOPE_LABELS,
  STATE_TYPE_LABELS,
  type StateVariableType,
} from '../../admin/stateTypes'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useStateVariablesStore } from '../../store/stateVariablesStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

export function StateVariableEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const variable = useStateVariablesStore((state) =>
    selectedEntityId ? state.variables.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const updateVariable = useStateVariablesStore((state) => state.updateVariable)
  const removeVariable = useStateVariablesStore((state) => state.removeVariable)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)
  const characters = useContentCatalogStore((state) => state.stubs.characters)

  if (!selectedEntityId || !variable) {
    return (
      <section className="editor-view">
        <p className="admin-empty">State variable not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const keyInvalid = variable.key.length > 0 && !isValidStateKey(variable.key)

  function setDefaultFromInput(raw: string) {
    switch (variable!.varType) {
      case 'boolean':
        updateVariable(variable!.id, { defaultValue: raw === 'true' })
        break
      case 'number': {
        const parsed = Number(raw)
        updateVariable(variable!.id, {
          defaultValue: Number.isFinite(parsed) ? parsed : 0,
        })
        break
      }
      default:
        updateVariable(variable!.id, { defaultValue: raw })
    }
  }

  function handleTypeChange(nextType: StateVariableType) {
    if (!variable) return
    updateVariable(variable.id, { varType: nextType })
  }

  return (
    <AdminEditorShell
      listLabel="State"
      itemTitle={`${variable.title} (${STATE_SCOPE_LABELS[variable.scope]})`}
      onBack={closeEntityEditor}
    >
      <p className="admin-editor-lead">
        {variable.scope === 'global'
          ? 'Global variables persist across the whole game for story logic and dialog conditions.'
          : 'Character variables track per-character story state — reputation, flags, and dialog memory.'}
      </p>

      <div className="admin-editor-note" role="note">
        Story/narrative state only. Battle HP, turn order, and combat counters belong in Rules, not
        here.
      </div>

      <label className="field">
        <span>Display name</span>
        <input
          value={variable.title}
          onChange={(event) => updateVariable(variable.id, { title: event.target.value })}
        />
      </label>

      <label className="field">
        <span>Variable key</span>
        <input
          value={variable.key}
          onChange={(event) => updateVariable(variable.id, { key: event.target.value })}
          spellCheck={false}
        />
        <span className={`field-hint${keyInvalid ? ' field-hint-error' : ''}`}>
          Lowercase slug for scripts: letters, numbers, underscores (e.g. quest_stage).
        </span>
      </label>

      <label className="field">
        <span>Type</span>
        <select
          className="admin-select admin-select-block"
          value={variable.varType}
          onChange={(event) => handleTypeChange(event.target.value as StateVariableType)}
        >
          {(Object.keys(STATE_TYPE_LABELS) as StateVariableType[]).map((type) => (
            <option key={type} value={type}>
              {STATE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Default value</span>
        {variable.varType === 'boolean' ? (
          <select
            className="admin-select admin-select-block"
            value={variable.defaultValue ? 'true' : 'false'}
            onChange={(event) => setDefaultFromInput(event.target.value)}
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        ) : (
          <input
            type={variable.varType === 'number' ? 'number' : 'text'}
            value={formatDefaultValue(variable.defaultValue)}
            onChange={(event) => setDefaultFromInput(event.target.value)}
          />
        )}
      </label>

      {variable.scope === 'character' ? (
        <label className="field">
          <span>Character</span>
          <select
            className="admin-select admin-select-block"
            value={variable.characterId ?? ''}
            onChange={(event) =>
              updateVariable(variable.id, {
                characterId: event.target.value || null,
              })
            }
          >
            <option value="">Any character (unassigned)</option>
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.title}
              </option>
            ))}
          </select>
          <span className="field-hint">
            Optional link to a character definition from the Characters tab.
          </span>
        </label>
      ) : null}

      <label className="field">
        <span>Description</span>
        <textarea
          className="admin-textarea"
          rows={3}
          value={variable.description}
          placeholder="What this variable tracks and when story scripts read or write it…"
          onChange={(event) => updateVariable(variable.id, { description: event.target.value })}
        />
      </label>

      <TaxonomyEditorFields domain="state" entityId={variable.id} />

      <div className="admin-editor-actions">
        <button
          type="button"
          className="admin-danger-button"
          onClick={() => {
            removeVariable(variable.id)
            removeTaxonomyEntity(variable.id)
            closeEntityEditor()
          }}
        >
          Delete variable
        </button>
      </div>
    </AdminEditorShell>
  )
}
