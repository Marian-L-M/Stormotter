import {
  isJournalCategoryId,
  JOURNAL_SECTION_TABS,
  type JournalSectionTab,
} from '../admin/journalTypes'
import { AdminSectionNav } from '../components/admin/AdminSectionNav'
import { JournalCategoryEditorView } from './editors/JournalCategoryEditorView'
import { JournalEntryEditorView } from './editors/JournalEntryEditorView'
import { JournalCategoriesListView, JournalEntriesListView } from './lists/JournalListView'
import { useEditorStore } from '../store/editorStore'
import { useJournalStore } from '../store/journalStore'

export function JournalTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const journalSectionTab = useEditorStore((state) => state.journalSectionTab)
  const setJournalSectionTab = useEditorStore((state) => state.setJournalSectionTab)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const categories = useJournalStore((state) => state.categories)
  const entryExists = useJournalStore((state) =>
    selectedEntityId ? state.entries.some((item) => item.id === selectedEntityId) : false,
  )

  if (editorScreen === 'edit' && selectedEntityId) {
    if (entryExists) return <JournalEntryEditorView />
    if (isJournalCategoryId(selectedEntityId, categories)) return <JournalCategoryEditorView />
  }

  function handleSectionChange(section: JournalSectionTab) {
    if (section !== journalSectionTab) {
      closeEntityEditor()
      setJournalSectionTab(section)
    }
  }

  return (
    <div className="journal-tab">
      <AdminSectionNav
        sections={JOURNAL_SECTION_TABS}
        active={journalSectionTab}
        onChange={handleSectionChange}
      />
      {journalSectionTab === 'entries' ? <JournalEntriesListView /> : <JournalCategoriesListView />}
    </div>
  )
}
