import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { useEditorStore } from '../../store/editorStore'
import { useQuestsStore } from '../../store/questsStore'

export function QuestCategoryEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const category = useQuestsStore((state) =>
    selectedEntityId ? state.categories.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const quests = useQuestsStore((state) => state.quests)
  const updateCategory = useQuestsStore((state) => state.updateCategory)
  const removeCategory = useQuestsStore((state) => state.removeCategory)

  if (!selectedEntityId || !category) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Quest category not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const questCount = quests.filter((entry) => entry.categoryId === category.id).length

  return (
    <AdminEditorShell listLabel="Quest categories" itemTitle={category.name} onBack={closeEntityEditor}>
      <p className="admin-editor-lead">
        Group related quests. {questCount} quest{questCount === 1 ? '' : 's'} use this category.
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
        <button type="button" className="admin-danger-button" onClick={() => {
          removeCategory(category.id)
          closeEntityEditor()
        }}>
          Delete category
        </button>
      </div>
    </AdminEditorShell>
  )
}
