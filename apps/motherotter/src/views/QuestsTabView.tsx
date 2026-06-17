import {
  isQuestCategoryId,
  QUEST_SECTION_TABS,
  type QuestSectionTab,
} from '../admin/questTypes'
import { AdminSectionNav } from '../components/admin/AdminSectionNav'
import { QuestCategoryEditorView } from './editors/QuestCategoryEditorView'
import { QuestEditorView } from './editors/QuestEditorView'
import { QuestCategoriesListView, QuestsListView } from './lists/QuestsListView'
import { useEditorStore } from '../store/editorStore'
import { useQuestsStore } from '../store/questsStore'

export function QuestsTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const questSectionTab = useEditorStore((state) => state.questSectionTab)
  const setQuestSectionTab = useEditorStore((state) => state.setQuestSectionTab)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const categories = useQuestsStore((state) => state.categories)
  const questExists = useQuestsStore((state) =>
    selectedEntityId ? state.quests.some((entry) => entry.id === selectedEntityId) : false,
  )

  if (editorScreen === 'edit' && selectedEntityId) {
    if (questExists) return <QuestEditorView />
    if (isQuestCategoryId(selectedEntityId, categories)) return <QuestCategoryEditorView />
  }

  function handleSectionChange(section: QuestSectionTab) {
    if (section !== questSectionTab) {
      closeEntityEditor()
      setQuestSectionTab(section)
    }
  }

  return (
    <div className="quests-tab">
      <AdminSectionNav
        sections={QUEST_SECTION_TABS}
        active={questSectionTab}
        onChange={handleSectionChange}
      />
      {questSectionTab === 'quests' ? <QuestsListView /> : <QuestCategoriesListView />}
    </div>
  )
}
