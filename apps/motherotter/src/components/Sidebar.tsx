import { FORMAT_VERSION } from '@otter/otterfile-core'
import { EDITOR_MODES } from '../editorModes'
import { formatTimestamp } from '../lib/format'
import { useEditorStore } from '../store/editorStore'

export function Sidebar() {
  const title = useEditorStore((state) => state.title)
  const activeMode = useEditorStore((state) => state.activeMode)
  const persistStatus = useEditorStore((state) => state.persistStatus)
  const lastSavedAt = useEditorStore((state) => state.lastSavedAt)
  const setActiveMode = useEditorStore((state) => state.setActiveMode)

  const saveHint =
    persistStatus === 'booting'
      ? 'Loading…'
      : persistStatus === 'saving'
        ? 'Saving…'
        : persistStatus === 'error'
          ? 'Save error'
          : `Saved ${formatTimestamp(lastSavedAt)}`

  return (
    <aside className="sidebar" aria-label="Project editor">
      <div className="sidebar-header">
        <p className="sidebar-kicker">Motherotter</p>
        <h1 className="sidebar-title">{title || 'Untitled Project'}</h1>
        <p className="sidebar-save-hint">{saveHint}</p>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {EDITOR_MODES.map((mode) => (
            <li key={mode.id}>
              <button
                type="button"
                className={activeMode === mode.id ? 'active' : undefined}
                aria-current={activeMode === mode.id ? 'page' : undefined}
                onClick={() => setActiveMode(mode.id)}
              >
                {mode.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <footer className="sidebar-footer">
        <span className="muted">otterfile {FORMAT_VERSION}</span>
      </footer>
    </aside>
  )
}
