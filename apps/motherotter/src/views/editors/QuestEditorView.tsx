import { useState } from 'react'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { AdminSectionNav } from '../../components/admin/AdminSectionNav'
import { QuestCompletionActionsEditor } from '../../components/admin/QuestCompletionActionsEditor'
import { QuestObjectivesEditor } from '../../components/admin/QuestObjectivesEditor'
import { QuestRewardsEditor } from '../../components/admin/QuestRewardsEditor'
import { QuestTriggerEditor } from '../../components/admin/QuestTriggerEditor'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { getQuestCategory, summarizeQuestObjectives, summarizeQuestTrigger } from '../../admin/questTypes'
import { useEditorStore } from '../../store/editorStore'
import { useQuestsStore } from '../../store/questsStore'

const QUEST_EDITOR_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'trigger', label: 'Trigger' },
  { id: 'objectives', label: 'Objectives' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'completion', label: 'On complete' },
] as const

type QuestEditorTab = (typeof QUEST_EDITOR_TABS)[number]['id']

export function QuestEditorView() {
  const [activeTab, setActiveTab] = useState<QuestEditorTab>('objectives')
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const quest = useQuestsStore((state) =>
    selectedEntityId ? state.quests.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const categories = useQuestsStore((state) => state.categories)
  const updateQuest = useQuestsStore((state) => state.updateQuest)
  const removeQuest = useQuestsStore((state) => state.removeQuest)

  if (!selectedEntityId || !quest) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Quest not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const currentQuest = quest
  const categoryName = getQuestCategory(currentQuest.categoryId, categories)?.name ?? 'Uncategorized'

  function handleRemove() {
    removeQuest(currentQuest.id)
    closeEntityEditor()
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'details':
        return (
          <>
            <label className="field">
              <span>Name</span>
              <input
                value={currentQuest.name}
                onChange={(event) => updateQuest(currentQuest.id, { name: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Summary</span>
              <textarea
                rows={3}
                value={currentQuest.summary}
                onChange={(event) => updateQuest(currentQuest.id, { summary: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Journal preview</span>
              <textarea
                rows={2}
                value={currentQuest.journalPreview}
                onChange={(event) =>
                  updateQuest(currentQuest.id, { journalPreview: event.target.value })
                }
                placeholder="Short text added to the journal when quest starts…"
              />
            </label>
            <label className="field">
              <span>Category</span>
              <select
                className="admin-select admin-select-block"
                value={currentQuest.categoryId ?? ''}
                onChange={(event) =>
                  updateQuest(currentQuest.id, {
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
            <p className="field-hint">
              Trigger: {summarizeQuestTrigger(currentQuest.trigger)} ·{' '}
              {summarizeQuestObjectives(currentQuest)}
            </p>
            <TaxonomyEditorFields entityId={currentQuest.id} domain="quests" />
            <div className="admin-editor-actions">
              <button type="button" className="admin-danger-button" onClick={handleRemove}>
                Delete quest
              </button>
            </div>
          </>
        )
      case 'trigger':
        return (
          <QuestTriggerEditor
            value={currentQuest.trigger}
            onChange={(patch) =>
              updateQuest(currentQuest.id, { trigger: { ...currentQuest.trigger, ...patch } })
            }
          />
        )
      case 'objectives':
        return (
          <QuestObjectivesEditor
            objectives={currentQuest.objectives}
            objectiveJoin={currentQuest.objectiveJoin}
            onChangeObjectives={(objectives) => updateQuest(currentQuest.id, { objectives })}
            onChangeJoin={(objectiveJoin) => updateQuest(currentQuest.id, { objectiveJoin })}
          />
        )
      case 'rewards':
        return (
          <QuestRewardsEditor
            rewards={currentQuest.rewards}
            onChange={(rewards) => updateQuest(currentQuest.id, { rewards })}
          />
        )
      case 'completion':
        return (
          <QuestCompletionActionsEditor
            actions={currentQuest.completionActions}
            currentQuestId={currentQuest.id}
            onChange={(completionActions) => updateQuest(currentQuest.id, { completionActions })}
          />
        )
    }
  }

  return (
    <AdminEditorShell
      listLabel="Quests"
      itemTitle={`${currentQuest.name} · ${categoryName}`}
      onBack={closeEntityEditor}
    >
      <AdminSectionNav sections={[...QUEST_EDITOR_TABS]} active={activeTab} onChange={setActiveTab} />
      {renderTabContent()}
    </AdminEditorShell>
  )
}
