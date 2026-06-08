import { LineageTypeEditorView } from './editors/LineageTypeEditorView'
import { LineageTypesListView } from './lists/LineageTypesListView'
import { useEditorStore } from '../store/editorStore'

export function CharacterTypesTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)

  if (editorScreen === 'edit' && selectedEntityId) {
    return <LineageTypeEditorView />
  }

  return <LineageTypesListView />
}
