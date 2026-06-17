import { useState } from 'react'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { AdminSectionNav } from '../../components/admin/AdminSectionNav'
import { DialogBranchVisualEditor } from '../../components/admin/DialogBranchVisualEditor'
import { DialogTriggerEditor } from '../../components/admin/DialogTriggerEditor'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { getDialogCategory, summarizeDialogTrigger } from '../../admin/dialogTypes'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useDialogsStore } from '../../store/dialogsStore'
import { useEditorStore } from '../../store/editorStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'

const DIALOG_EDITOR_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'trigger', label: 'Trigger' },
  { id: 'conversation', label: 'Conversation' },
] as const

type DialogEditorTab = (typeof DIALOG_EDITOR_TABS)[number]['id']

export function DialogEditorView() {
  const [activeTab, setActiveTab] = useState<DialogEditorTab>('conversation')
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const dialog = useDialogsStore((state) =>
    selectedEntityId ? state.dialogs.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const categories = useDialogsStore((state) => state.categories)
  const updateDialog = useDialogsStore((state) => state.updateDialog)
  const removeDialog = useDialogsStore((state) => state.removeDialog)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)
  const characters = useContentCatalogStore((state) => state.stubs.characters)

  if (!selectedEntityId || !dialog) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Dialog not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const currentDialog = dialog
  const categoryName = getDialogCategory(currentDialog.categoryId, categories)?.name ?? 'Uncategorized'

  function handleRemove() {
    removeDialog(currentDialog.id)
    removeTaxonomyEntity(currentDialog.id)
    closeEntityEditor()
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'details':
        return (
          <>
            <p className="admin-editor-lead">
              Baldur&apos;s Gate-style branching conversation linked to a primary NPC. Script speech,
              player replies, and companion interjections on the Conversation tab.
            </p>

            <label className="field">
              <span>Name</span>
              <input
                value={currentDialog.name}
                onChange={(event) => updateDialog(currentDialog.id, { name: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Summary</span>
              <textarea
                rows={3}
                value={currentDialog.summary}
                onChange={(event) => updateDialog(currentDialog.id, { summary: event.target.value })}
                placeholder="When and why this conversation happens…"
              />
            </label>

            <label className="field">
              <span>Category</span>
              <select
                className="admin-select admin-select-block"
                value={currentDialog.categoryId ?? ''}
                onChange={(event) =>
                  updateDialog(currentDialog.id, {
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

            <label className="field">
              <span>Linked NPC</span>
              <select
                className="admin-select admin-select-block"
                value={currentDialog.characterId ?? ''}
                onChange={(event) =>
                  updateDialog(currentDialog.id, {
                    characterId: event.target.value.length > 0 ? event.target.value : null,
                  })
                }
              >
                <option value="">No NPC linked</option>
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.title}
                  </option>
                ))}
              </select>
              <span className="field-hint">
                Default speaker for &quot;Linked NPC&quot; speech nodes and character-scoped state.
              </span>
            </label>

            <p className="field-hint">
              Trigger: {summarizeDialogTrigger(currentDialog.trigger)}
            </p>

            <TaxonomyEditorFields entityId={currentDialog.id} domain="dialogs" />

            <div className="admin-editor-actions">
              <button type="button" className="admin-danger-button" onClick={handleRemove}>
                Delete dialog
              </button>
            </div>
          </>
        )

      case 'trigger':
        return (
          <>
            <p className="admin-editor-lead">
              Choose how this conversation starts — storyline hook, automatic state/environment
              timing, or manual click-to-talk.
            </p>
            <DialogTriggerEditor
              value={currentDialog.trigger}
              linkedCharacterId={currentDialog.characterId}
              onChange={(patch) =>
                updateDialog(currentDialog.id, {
                  trigger: { ...currentDialog.trigger, ...patch },
                })
              }
            />
          </>
        )

      case 'conversation':
        return (
          <>
            <p className="admin-editor-lead">
              Visual conversation tree with node sockets — drag from an output socket to another
              node&apos;s input to wire speech, choices, and replies. Reorder blocks in the script
              list below. Delete/Backspace removes the selected node (not the start node).
            </p>
            <DialogBranchVisualEditor
              graph={currentDialog.conversation}
              linkedCharacterId={currentDialog.characterId}
              onChange={(conversation) => updateDialog(currentDialog.id, { conversation })}
            />
          </>
        )
    }
  }

  return (
    <AdminEditorShell
      listLabel="Dialogs"
      itemTitle={`${currentDialog.name} · ${categoryName}`}
      onBack={closeEntityEditor}
    >
      <AdminSectionNav sections={[...DIALOG_EDITOR_TABS]} active={activeTab} onChange={setActiveTab} />
      {renderTabContent()}
    </AdminEditorShell>
  )
}
