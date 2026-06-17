import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { GameplayConditionEditor } from '../../components/admin/GameplayConditionEditor'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { createGameplayConditionGroup } from '../../admin/gameplayConditionTypes'
import { getJournalCategory } from '../../admin/journalTypes'
import { useEditorStore } from '../../store/editorStore'
import { useJournalStore } from '../../store/journalStore'
import { useQuestsStore } from '../../store/questsStore'

export function JournalEntryEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const entry = useJournalStore((state) =>
    selectedEntityId ? state.entries.find((item) => item.id === selectedEntityId) : undefined,
  )
  const categories = useJournalStore((state) => state.categories)
  const quests = useQuestsStore((state) => state.quests)
  const updateEntry = useJournalStore((state) => state.updateEntry)
  const removeEntry = useJournalStore((state) => state.removeEntry)

  if (!selectedEntityId || !entry) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Journal entry not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const categoryName = getJournalCategory(entry.categoryId, categories)?.name ?? 'Uncategorized'

  return (
    <AdminEditorShell
      listLabel="Journal"
      itemTitle={`${entry.title} · ${categoryName}`}
      onBack={closeEntityEditor}
    >
      <label className="field">
        <span>Title</span>
        <input
          value={entry.title}
          onChange={(event) => updateEntry(entry.id, { title: event.target.value })}
        />
      </label>
      <label className="field">
        <span>Body</span>
        <textarea
          rows={8}
          value={entry.body}
          onChange={(event) => updateEntry(entry.id, { body: event.target.value })}
          placeholder="Journal text shown to the player…"
        />
      </label>
      <label className="field">
        <span>Category</span>
        <select
          className="admin-select admin-select-block"
          value={entry.categoryId ?? ''}
          onChange={(event) =>
            updateEntry(entry.id, {
              categoryId: event.target.value.length > 0 ? event.target.value : null,
            })
          }
        >
          <option value="">Uncategorized</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="admin-fieldset">
        <legend>Links &amp; visibility</legend>
        <p className="field-hint">
          Link a quest for organization, and/or gate when this entry appears in the player journal
          using gameplay state.
        </p>
        <label className="field">
          <span>Linked quest</span>
          <select
            className="admin-select admin-select-block"
            value={entry.linkedQuestId ?? ''}
            onChange={(event) =>
              updateEntry(entry.id, {
                linkedQuestId: event.target.value.length > 0 ? event.target.value : null,
              })
            }
          >
            <option value="">None</option>
            {quests.map((quest) => (
              <option key={quest.id} value={quest.id}>
                {quest.name}
              </option>
            ))}
          </select>
          <span className="field-hint">Optional association with a quest line.</span>
        </label>
        <GameplayConditionEditor
          root={entry.displayConditions ?? createGameplayConditionGroup('and')}
          onChange={(displayConditions) =>
            updateEntry(entry.id, {
              displayConditions:
                displayConditions.children.length > 0 ? displayConditions : null,
            })
          }
        />
        <span className="field-hint">
          When state checks are set, the entry is hidden until they pass. With no checks, the entry
          is always eligible to show (e.g. when unlocked by a storyline or quest completion).
        </span>
      </fieldset>
      <TaxonomyEditorFields entityId={entry.id} domain="journal" />
      <div className="admin-editor-actions">
        <button
          type="button"
          className="admin-danger-button"
          onClick={() => {
            removeEntry(entry.id)
            closeEntityEditor()
          }}
        >
          Delete entry
        </button>
      </div>
    </AdminEditorShell>
  )
}
