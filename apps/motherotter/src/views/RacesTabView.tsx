import { RaceEditorView } from './editors/RaceEditorView'
import { RacesListView } from './lists/RacesListView'
import { useEditorStore } from '../store/editorStore'

export function RacesTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)

  if (editorScreen === 'edit' && selectedEntityId) {
    return <RaceEditorView />
  }

  return <RacesListView />
}
