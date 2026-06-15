import { AbilityDefinitionEditorView } from './editors/AbilityDefinitionEditorView'
import { AbilitiesListView } from './lists/AbilitiesListView'
import { useEditorStore } from '../store/editorStore'

export function AbilitiesTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)

  if (editorScreen === 'edit' && selectedEntityId) {
    return <AbilityDefinitionEditorView />
  }

  return <AbilitiesListView />
}
