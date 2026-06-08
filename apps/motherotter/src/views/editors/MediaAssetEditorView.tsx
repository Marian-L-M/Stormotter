import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { formatFileSize } from '../../admin/mediaTypes'
import { MediaPreview } from '../../components/media/MediaPreview'
import { useMediaLibraryStore } from '../../store/mediaLibraryStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

export function MediaAssetEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const markDirty = useEditorStore((state) => state.markDirty)
  const asset = useMediaLibraryStore((state) =>
    selectedEntityId ? state.assets.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const updateAsset = useMediaLibraryStore((state) => state.updateAsset)
  const removeAsset = useMediaLibraryStore((state) => state.removeAsset)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)

  if (!selectedEntityId || !asset) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Media item not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to library
        </button>
      </section>
    )
  }

  async function handleRemove() {
    await removeAsset(asset!.id)
    removeTaxonomyEntity(asset!.id)
    markDirty()
    closeEntityEditor()
  }

  return (
    <AdminEditorShell
      listLabel="Media Library"
      itemTitle={asset.title || asset.fileName}
      onBack={closeEntityEditor}
    >
      <p className="admin-editor-lead">
        Attachment details for this media file. Blobs are stored locally in this browser per project.
      </p>

      <MediaPreview asset={asset} className="media-editor-preview" />

      <dl className="media-editor-meta">
        <div>
          <dt>File name</dt>
          <dd>{asset.fileName}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{asset.mimeType}</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>{formatFileSize(asset.fileSize)}</dd>
        </div>
        {asset.width && asset.height ? (
          <div>
            <dt>Dimensions</dt>
            <dd>
              {asset.width}×{asset.height}
            </dd>
          </div>
        ) : null}
        {asset.durationSeconds ? (
          <div>
            <dt>Duration</dt>
            <dd>{asset.durationSeconds.toFixed(1)}s</dd>
          </div>
        ) : null}
      </dl>

      <label className="field">
        <span>Title</span>
        <input
          value={asset.title}
          onChange={(event) => {
            updateAsset(asset.id, { title: event.target.value })
            markDirty()
          }}
        />
      </label>

      <label className="field">
        <span>Alt text</span>
        <input
          value={asset.altText}
          placeholder="Describe the image for accessibility…"
          onChange={(event) => {
            updateAsset(asset.id, { altText: event.target.value })
            markDirty()
          }}
        />
      </label>

      <label className="field">
        <span>Caption</span>
        <input
          value={asset.caption}
          onChange={(event) => {
            updateAsset(asset.id, { caption: event.target.value })
            markDirty()
          }}
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          className="admin-textarea"
          rows={4}
          value={asset.description}
          placeholder="Optional notes about this attachment…"
          onChange={(event) => {
            updateAsset(asset.id, { description: event.target.value })
            markDirty()
          }}
        />
      </label>

      <TaxonomyEditorFields domain="media" entityId={asset.id} />

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={() => void handleRemove()}>
          Delete permanently
        </button>
      </div>
    </AdminEditorShell>
  )
}
