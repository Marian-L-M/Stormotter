import { AudioProfileEditorView } from './editors/AudioProfileEditorView'
import { AudioProfilesListView } from './lists/AudioProfilesListView'
import { useEditorStore } from '../store/editorStore'

export function AudioProfilesTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)

  if (editorScreen === 'edit' && selectedEntityId) {
    return <AudioProfileEditorView />
  }

  return <AudioProfilesListView />
}
