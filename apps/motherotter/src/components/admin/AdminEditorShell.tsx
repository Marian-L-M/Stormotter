import type { ReactNode } from 'react'

interface AdminEditorShellProps {
  listLabel: string
  itemTitle: string
  onBack: () => void
  children: ReactNode
}

export function AdminEditorShell({ listLabel, itemTitle, onBack, children }: AdminEditorShellProps) {
  return (
    <section className="editor-view admin-editor-view">
      <nav className="admin-breadcrumb" aria-label="Breadcrumb">
        <button type="button" className="admin-breadcrumb-link" onClick={onBack}>
          {listLabel}
        </button>
        <span className="admin-breadcrumb-sep" aria-hidden="true">
          ›
        </span>
        <span className="admin-breadcrumb-current">Edit: {itemTitle}</span>
      </nav>
      <div className="admin-editor-panel panel">{children}</div>
    </section>
  )
}
