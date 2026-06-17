import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { useEditorStore } from '../../store/editorStore'
import { useJournalStore } from '../../store/journalStore'

export function JournalCategoryEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const category = useJournalStore((state) =>
    selectedEntityId ? state.categories.find((item) => item.id === selectedEntityId) : undefined,
  )
  const entries = useJournalStore((state) => state.entries)
  const updateCategory = useJournalStore((state) => state.updateCategory)
  const removeCategory = useJournalStore((state) => state.removeCategory)

  if (!selectedEntityId || !category) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Journal category not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const entryCount = entries.filter((entry) => entry.categoryId === category.id).length

  return (
    <AdminEditorShell listLabel="Journal categories" itemTitle={category.name} onBack={closeEntityEditor}>
      <p className="admin-editor-lead">
        {entryCount} journal entr{entryCount === 1 ? 'y' : 'ies'} in this category.
      </p>
      <label className="field">
        <span>Name</span>
        <input
          value={category.name}
          onChange={(event) => updateCategory(category.id, { name: event.target.value })}
        />
      </label>
      <label className="field">
        <span>Description</span>
        <textarea
          rows={3}
          value={category.description}
          onChange={(event) => updateCategory(category.id, { description: event.target.value })}
        />
      </label>
      <div className="admin-editor-actions">
        <button
          type="button"
          className="admin-danger-button"
          onClick={() => {
            removeCategory(category.id)
            closeEntityEditor()
          }}
        >
          Delete category
        </button>
      </div>
    </AdminEditorShell>
  )
}
