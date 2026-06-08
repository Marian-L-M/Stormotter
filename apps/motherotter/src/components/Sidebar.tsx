import { FORMAT_VERSION } from '@otter/otterfile-core'
import {
  SIDEBAR_NAV,
  type EditorMode,
  type SidebarNavGroup,
} from '../editorModes'
import { formatTimestamp } from '../lib/format'
import { useEditorStore } from '../store/editorStore'

function isNavActive(activeMode: EditorMode, group: SidebarNavGroup): boolean {
  return group.children.some((child) => child.id === activeMode)
}

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
          {SIDEBAR_NAV.map((group) => (
            <li key={group.id} className="sidebar-nav-group">
              <span
                className={`sidebar-nav-group-label${isNavActive(activeMode, group) ? ' is-active-group' : ''}`}
              >
                {group.label}
              </span>
              <ul className="sidebar-nav-sublist">
                {group.children.map((child) => (
                  <li key={child.id}>
                    <button
                      type="button"
                      className={activeMode === child.id ? 'active' : undefined}
                      aria-current={activeMode === child.id ? 'page' : undefined}
                      onClick={() => setActiveMode(child.id)}
                    >
                      {child.label}
                    </button>
                  </li>
                ))}
              </ul>
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
