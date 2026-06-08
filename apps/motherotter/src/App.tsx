import { EditorActionBar } from './components/EditorActionBar'
import { Sidebar } from './components/Sidebar'
import { useProjectPersistence } from './hooks/useProjectPersistence'
import { EditorModePanel } from './views/EditorModePanel'
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
  const persistStatus = useEditorStore((state) => state.persistStatus)
  const persistError = useEditorStore((state) => state.persistError)

  const projectId = useEditorStore((state) => state.projectId)

  if (persistStatus === 'booting') {
    return <BootScreen message="Loading local projects…" />
  }

  if (persistStatus === 'error' && !projectId) {
    return <BootScreen message={persistError ?? 'Failed to load local projects.'} />
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
