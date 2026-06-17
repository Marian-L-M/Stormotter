import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { useDialogsStore } from '../../store/dialogsStore'
import { useEditorStore } from '../../store/editorStore'

export function DialogCategoryEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const category = useDialogsStore((state) =>
    selectedEntityId ? state.categories.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const dialogs = useDialogsStore((state) => state.dialogs)
  const updateCategory = useDialogsStore((state) => state.updateCategory)
  const removeCategory = useDialogsStore((state) => state.removeCategory)

  if (!selectedEntityId || !category) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Dialog category not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const currentCategory = category
  const dialogCount = dialogs.filter((entry) => entry.categoryId === currentCategory.id).length

  function handleRemove() {
    removeCategory(currentCategory.id)
    closeEntityEditor()
  }

  return (
    <AdminEditorShell listLabel="Dialog categories" itemTitle={currentCategory.name} onBack={closeEntityEditor}>
      <p className="admin-editor-lead">
        Group related conversations. {dialogCount} dialog{dialogCount === 1 ? '' : 's'} use this
        category.
      </p>

      <label className="field">
        <span>Name</span>
        <input
          value={currentCategory.name}
          onChange={(event) => updateCategory(currentCategory.id, { name: event.target.value })}
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          rows={3}
          value={currentCategory.description}
          onChange={(event) =>
            updateCategory(currentCategory.id, { description: event.target.value })
          }
          placeholder="What kinds of dialogs belong here…"
        />
      </label>

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete category
        </button>
      </div>
    </AdminEditorShell>
  )
}
