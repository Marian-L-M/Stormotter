import {
  DIALOG_SECTION_TABS,
  isDialogCategoryId,
  type DialogSectionTab,
} from '../admin/dialogTypes'
import { AdminSectionNav } from '../components/admin/AdminSectionNav'
import { DialogCategoryEditorView } from './editors/DialogCategoryEditorView'
import { DialogEditorView } from './editors/DialogEditorView'
import { DialogCategoriesListView, DialogsListView } from './lists/DialogsListView'
import { useDialogsStore } from '../store/dialogsStore'
import { useEditorStore } from '../store/editorStore'

export function DialogsTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const dialogSectionTab = useEditorStore((state) => state.dialogSectionTab)
  const setDialogSectionTab = useEditorStore((state) => state.setDialogSectionTab)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const categories = useDialogsStore((state) => state.categories)
  const dialogExists = useDialogsStore((state) =>
    selectedEntityId ? state.dialogs.some((entry) => entry.id === selectedEntityId) : false,
  )

  if (editorScreen === 'edit' && selectedEntityId) {
    if (dialogExists) {
      return <DialogEditorView />
    }
    if (isDialogCategoryId(selectedEntityId, categories)) {
      return <DialogCategoryEditorView />
    }
  }

  function handleSectionChange(section: DialogSectionTab) {
    if (section !== dialogSectionTab) {
      closeEntityEditor()
      setDialogSectionTab(section)
    }
  }

  return (
    <div className="dialogs-tab">
      <AdminSectionNav
        sections={DIALOG_SECTION_TABS}
        active={dialogSectionTab}
        onChange={handleSectionChange}
      />
      {dialogSectionTab === 'dialogs' ? <DialogsListView /> : null}
      {dialogSectionTab === 'dialog-categories' ? <DialogCategoriesListView /> : null}
    </div>
  )
}
