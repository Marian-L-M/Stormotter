import { AiProfileEditorView } from './editors/AiProfileEditorView'
import { AiProfilesListView } from './lists/AiProfilesListView'
import { useEditorStore } from '../store/editorStore'

export function AiTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)

  if (editorScreen === 'edit' && selectedEntityId) {
    return <AiProfileEditorView />
  }

  return <AiProfilesListView />
}
