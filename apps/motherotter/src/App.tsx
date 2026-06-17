import { EditorActionBar } from './components/EditorActionBar'
import { Sidebar } from './components/Sidebar'
import { useProjectPersistence } from './hooks/useProjectPersistence'
import { EditorModePanel } from './views/EditorModePanel'
import { MapEditorView } from './views/editors/MapEditorView'
import { MapPreviewView } from './views/editors/MapPreviewView'
import { useEditorStore } from './store/editorStore'

function BootScreen({ message }: { message: string }) {
  return (
    <div className="boot-screen">
      <p>{message}</p>
    </div>
  )
}

export function App() {
  useProjectPersistence()

  const activeMode = useEditorStore((state) => state.activeMode)
  const editorScreen = useEditorStore((state) => state.editorScreen)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const mapId = useEditorStore((state) => state.mapId)
  const persistStatus = useEditorStore((state) => state.persistStatus)
  const persistError = useEditorStore((state) => state.persistError)

  const projectId = useEditorStore((state) => state.projectId)

  const mapPreviewOpen = useEditorStore((state) => state.mapPreviewOpen)

  const isMapEditorOpen =
    activeMode === 'maps' && editorScreen === 'edit' && selectedEntityId === mapId

  if (persistStatus === 'booting') {
    return <BootScreen message="Loading local projects…" />
  }

  if (persistStatus === 'error' && !projectId) {
    return <BootScreen message={persistError ?? 'Failed to load local projects.'} />
  }

  if (mapPreviewOpen && isMapEditorOpen) {
    return <MapPreviewView />
  }

  if (isMapEditorOpen) {
    return <MapEditorView />
  }

  return (
    <div className="editor-shell">
      <Sidebar />
      <main className="editor-main">
        <EditorActionBar />
        <EditorModePanel mode={activeMode} />
      </main>
    </div>
  )
}

export default App
