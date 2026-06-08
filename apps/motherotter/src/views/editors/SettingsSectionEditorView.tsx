import type { SettingsSectionId } from '../../admin/types'
import {
  bytesToGigabytes,
  bytesToMegabytes,
  DEFAULT_MEDIA_MAX_FILE_BYTES,
  DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES,
  gigabytesToBytes,
  megabytesToBytes,
  normalizeMediaMaxFileBytes,
  normalizeMediaProjectSoftBudgetBytes,
} from '../../admin/mediaTypes'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { useEditorStore } from '../../store/editorStore'

interface SettingsSectionEditorViewProps {
  sectionId: SettingsSectionId
}

export function SettingsSectionEditorView({ sectionId }: SettingsSectionEditorViewProps) {
  const gameId = useEditorStore((state) => state.gameId)
  const title = useEditorStore((state) => state.title)
  const autosaveEnabled = useEditorStore((state) => state.autosaveEnabled)
  const mediaMaxFileBytes = useEditorStore((state) => state.mediaMaxFileBytes)
  const mediaProjectSoftBudgetBytes = useEditorStore((state) => state.mediaProjectSoftBudgetBytes)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const setGameId = useEditorStore((state) => state.setGameId)
  const setTitle = useEditorStore((state) => state.setTitle)
  const setAutosaveEnabled = useEditorStore((state) => state.setAutosaveEnabled)
  const setMediaMaxFileBytes = useEditorStore((state) => state.setMediaMaxFileBytes)
  const setMediaProjectSoftBudgetBytes = useEditorStore(
    (state) => state.setMediaProjectSoftBudgetBytes,
  )
  const markDirty = useEditorStore((state) => state.markDirty)

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

  if (sectionId === 'media-library') {
    return (
      <AdminEditorShell listLabel="Settings" itemTitle="Media library" onBack={closeEntityEditor}>
        <p className="admin-editor-lead">
          Upload limits for this project&apos;s media library. Stored locally in your browser.
        </p>

        <label className="field">
          <span>Max file size (MB)</span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={Number(bytesToMegabytes(mediaMaxFileBytes).toFixed(2))}
            onChange={(event) => {
              const megabytes = Number(event.target.value)
              if (!Number.isFinite(megabytes)) return
              setMediaMaxFileBytes(normalizeMediaMaxFileBytes(megabytesToBytes(megabytes)))
              markDirty()
            }}
          />
          <span className="field-hint">
            Rejects uploads above this size. Default:{' '}
            {bytesToMegabytes(DEFAULT_MEDIA_MAX_FILE_BYTES)} MB.
          </span>
        </label>

        <label className="field">
          <span>Project storage warning (GB)</span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={Number(bytesToGigabytes(mediaProjectSoftBudgetBytes).toFixed(2))}
            onChange={(event) => {
              const gigabytes = Number(event.target.value)
              if (!Number.isFinite(gigabytes)) return
              setMediaProjectSoftBudgetBytes(
                normalizeMediaProjectSoftBudgetBytes(gigabytesToBytes(gigabytes)),
              )
              markDirty()
            }}
          />
          <span className="field-hint">
            Shows a warning in the media library when total blob storage exceeds this threshold.
            Default: {bytesToGigabytes(DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES)} GB.
          </span>
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
