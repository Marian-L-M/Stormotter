import { getEditorModeLabel } from '../editorModes'
import { formatTimestamp } from '../lib/format'
import { useEditorStore, type PersistStatus } from '../store/editorStore'

function canPersist(status: PersistStatus): boolean {
  return status === 'ready' || status === 'error'
}

export function EditorActionBar() {
  const activeMode = useEditorStore((state) => state.activeMode)
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const isDirty = useEditorStore((state) => state.isDirty)
  const autosaveEnabled = useEditorStore((state) => state.autosaveEnabled)
  const persistStatus = useEditorStore((state) => state.persistStatus)
  const lastSavedAt = useEditorStore((state) => state.lastSavedAt)
  const persistError = useEditorStore((state) => state.persistError)
  const persistCurrentProject = useEditorStore((state) => state.persistCurrentProject)

  const saving = persistStatus === 'saving'
  const saveFailed = persistStatus === 'error'
  const canSave = canPersist(persistStatus) && (isDirty || saveFailed)

  const modeLabel = getEditorModeLabel(activeMode)
  const screenLabel = editorScreen === 'edit' ? `${modeLabel} · editing` : modeLabel

  let statusText = 'All changes saved'
  if (saving) {
    statusText = 'Saving…'
  } else if (saveFailed) {
    statusText = persistError ?? 'Save failed'
  } else if (isDirty) {
    statusText = autosaveEnabled ? 'Unsaved changes' : 'Unsaved changes · autosave off'
  } else if (!autosaveEnabled) {
    statusText = 'Autosave off'
  } else if (lastSavedAt) {
    statusText = `Saved ${formatTimestamp(lastSavedAt)}`
  }

  return (
    <header className="editor-action-bar">
      <div className="editor-action-bar-title">
        <h2>{screenLabel}</h2>
      </div>

      <div className="editor-action-bar-status" aria-live="polite">
        {isDirty && !saving ? <span className="unsaved-marker" aria-hidden="true" /> : null}
        <span className={isDirty || saveFailed ? 'status-emphasis' : 'muted'}>{statusText}</span>
      </div>

      <div className="editor-action-bar-actions">
        <button
          type="button"
          className="save-button"
          disabled={!canSave || saving}
          onClick={() => void persistCurrentProject()}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </header>
  )
}
