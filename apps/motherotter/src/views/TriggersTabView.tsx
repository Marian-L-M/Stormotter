import { isItemTriggerId } from '../admin/itemTypes'
import { TriggerDetailView } from './editors/TriggerDetailView'
import { TriggersListView } from './lists/TriggersListView'
import { useEditorStore } from '../store/editorStore'

export function TriggersTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)

  if (editorScreen === 'edit' && selectedEntityId && isItemTriggerId(selectedEntityId)) {
    return <TriggerDetailView />
  }

  return <TriggersListView />
}
