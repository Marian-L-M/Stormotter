import { StorylineEditorView } from './editors/StorylineEditorView'
import { StorylinesListView } from './lists/StorylinesListView'
import { useEditorStore } from '../store/editorStore'

export function StorylinesTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)

  if (editorScreen === 'edit' && selectedEntityId) {
    return <StorylineEditorView />
  }

  return <StorylinesListView />
}
