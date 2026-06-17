import { useState } from 'react'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { AdminSectionNav } from '../../components/admin/AdminSectionNav'
import { StorylineFlowVisualEditor } from '../../components/admin/StorylineFlowVisualEditor'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { summarizeStorylineFlow } from '../../admin/storylineTypes'
import { useEditorStore } from '../../store/editorStore'
import { useStorylinesStore } from '../../store/storylinesStore'

const STORYLINE_EDITOR_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'flow', label: 'Flow' },
] as const

type StorylineEditorTab = (typeof STORYLINE_EDITOR_TABS)[number]['id']

export function StorylineEditorView() {
  const [activeTab, setActiveTab] = useState<StorylineEditorTab>('flow')
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const storyline = useStorylinesStore((state) =>
    selectedEntityId ? state.storylines.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const updateStoryline = useStorylinesStore((state) => state.updateStoryline)
  const removeStoryline = useStorylinesStore((state) => state.removeStoryline)

  if (!selectedEntityId || !storyline) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Storyline not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const current = storyline

  function renderTabContent() {
    switch (activeTab) {
      case 'details':
        return (
          <>
            <p className="admin-editor-lead">
              Orchestrate dialogs, quests, and journal entries in narrative order. Use the Flow tab
              to wire nodes visually.
            </p>
            <label className="field">
              <span>Name</span>
              <input
                value={current.name}
                onChange={(event) => updateStoryline(current.id, { name: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Summary</span>
              <textarea
                rows={3}
                value={current.summary}
                onChange={(event) => updateStoryline(current.id, { summary: event.target.value })}
              />
            </label>
            <p className="field-hint">{summarizeStorylineFlow(current.flow)}</p>
            <TaxonomyEditorFields entityId={current.id} domain="storylines" />
            <div className="admin-editor-actions">
              <button
                type="button"
                className="admin-danger-button"
                onClick={() => {
                  removeStoryline(current.id)
                  closeEntityEditor()
                }}
              >
                Delete storyline
              </button>
            </div>
          </>
        )
      case 'flow':
        return (
          <>
            <p className="admin-editor-lead">
              Connect storyline nodes like the dialog builder — drag output sockets to the next
              node&apos;s input. Dialog nodes start conversations; quest nodes activate quests;
              journal nodes unlock log entries.
            </p>
            <StorylineFlowVisualEditor
              graph={current.flow}
              onChange={(flow) => updateStoryline(current.id, { flow })}
            />
          </>
        )
    }
  }

  return (
    <AdminEditorShell listLabel="Storylines" itemTitle={current.name} onBack={closeEntityEditor}>
      <AdminSectionNav sections={[...STORYLINE_EDITOR_TABS]} active={activeTab} onChange={setActiveTab} />
      {renderTabContent()}
    </AdminEditorShell>
  )
}
