import { CharacterClassEditorView } from './editors/CharacterClassEditorView'
import { CharacterClassesListView } from './lists/CharacterClassesListView'
import { useEditorStore } from '../store/editorStore'

export function CharacterClassesTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)

  if (editorScreen === 'edit' && selectedEntityId) {
    return <CharacterClassEditorView />
  }

  return <CharacterClassesListView />
}
