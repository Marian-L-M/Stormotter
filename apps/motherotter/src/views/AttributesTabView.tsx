import { AttributeDefinitionEditorView } from './editors/AttributeDefinitionEditorView'
import { AttributesListView } from './lists/AttributesListView'
import { useEditorStore } from '../store/editorStore'

export function AttributesTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)

  if (editorScreen === 'edit' && selectedEntityId) {
    return <AttributeDefinitionEditorView />
  }

  return <AttributesListView />
}
