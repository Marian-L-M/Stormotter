import { MediaAssetEditorView } from './editors/MediaAssetEditorView'
import { MediaLibraryGridView } from './lists/MediaLibraryGridView'
import { useEditorStore } from '../store/editorStore'

export function MediaLibraryTabView() {
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)

  if (editorScreen === 'edit' && selectedEntityId) {
    return <MediaAssetEditorView />
  }

  return <MediaLibraryGridView />
}
