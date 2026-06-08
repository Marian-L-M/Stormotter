import type { SettingsSectionId } from '../../admin/types'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { useEditorStore } from '../../store/editorStore'

interface SettingsSectionEditorViewProps {
  sectionId: SettingsSectionId
}

export function SettingsSectionEditorView({ sectionId }: SettingsSectionEditorViewProps) {
  const gameId = useEditorStore((state) => state.gameId)
  const title = useEditorStore((state) => state.title)
  const autosaveEnabled = useEditorStore((state) => state.autosaveEnabled)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const setGameId = useEditorStore((state) => state.setGameId)
  const setTitle = useEditorStore((state) => state.setTitle)
  const setAutosaveEnabled = useEditorStore((state) => state.setAutosaveEnabled)

  if (sectionId === 'project-metadata') {
    return (
      <AdminEditorShell
        listLabel="Settings"
        itemTitle="Project metadata"
        onBack={closeEntityEditor}
      >
        <p className="admin-editor-lead">Written into the otterfile manifest on export.</p>
        <label className="field">
          <span>Game ID</span>
          <input
            value={gameId}
            onChange={(event) => setGameId(event.target.value)}
            placeholder="my-game"
            spellCheck={false}
          />
          <span className="field-hint">Slug format: letters, numbers, underscores, hyphens.</span>
        </label>
        <label className="field">
          <span>Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Untitled Adventure"
          />
        </label>
      </AdminEditorShell>
    )
  }

  return (
    <AdminEditorShell
      listLabel="Settings"
      itemTitle="Editor preferences"
      onBack={closeEntityEditor}
    >
      <p className="admin-editor-lead">Applies to this browser installation of Motherotter.</p>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={autosaveEnabled}
          onChange={(event) => void setAutosaveEnabled(event.target.checked)}
        />
        <span>Autosave project changes</span>
      </label>
      <p className="field-hint">
        When off, use Save in the toolbar. Switching tabs, layers, or tools does not count as
        unsaved — only map cells and project metadata do.
      </p>
    </AdminEditorShell>
  )
}
