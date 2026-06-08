import { useMemo, useRef, useState, type DragEvent } from 'react'
import {
  acceptAttributeForFilter,
  formatFileSize,
  MEDIA_FORMAT_GUIDANCE,
  normalizeMediaFilter,
  type MediaAsset,
  type MediaPickerFilter,
} from '../../admin/mediaTypes'
import { getProjectMediaStorageBytes } from '../../lib/mediaBlobRepository'
import { useMediaLibraryStore } from '../../store/mediaLibraryStore'
import { useEditorStore } from '../../store/editorStore'
import { MediaThumbnail } from './MediaPreview'

interface MediaLibraryGridProps {
  filter?: MediaPickerFilter
  search: string
  onSearchChange: (value: string) => void
  selectedId?: string | null
  onSelect?: (asset: MediaAsset) => void
  onOpen?: (asset: MediaAsset) => void
  showUpload?: boolean
  compact?: boolean
}

export function MediaLibraryGrid({
  filter,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  onOpen,
  showUpload = true,
  compact = false,
}: MediaLibraryGridProps) {
  const projectId = useEditorStore((state) => state.projectId)
  const assets = useMediaLibraryStore((state) => state.assets)
  const uploadFiles = useMediaLibraryStore((state) => state.uploadFiles)
  const uploadError = useMediaLibraryStore((state) => state.uploadError)
  const clearUploadError = useMediaLibraryStore((state) => state.clearUploadError)
  const markDirty = useEditorStore((state) => state.markDirty)
  const mediaProjectSoftBudgetBytes = useEditorStore((state) => state.mediaProjectSoftBudgetBytes)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [storageBytes, setStorageBytes] = useState<number | null>(null)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase()
    return assets.filter((asset) => {
      if (filter && !normalizeMediaFilter(filter).includes(asset.kind)) return false
      if (!query) return true
      return (
        asset.fileName.toLowerCase().includes(query) ||
        asset.title.toLowerCase().includes(query)
      )
    })
  }, [assets, filter, search])

  const accept = filter ? acceptAttributeForFilter(filter) : acceptAttributeForFilter(['image', 'audio', 'video'])

  async function refreshStorageHint() {
    if (!projectId) return
    const bytes = await getProjectMediaStorageBytes(projectId)
    setStorageBytes(bytes)
  }

  async function handleFiles(files: FileList | File[] | null | undefined) {
    if (!files || files.length === 0 || !projectId) return
    clearUploadError()
    setUploadMessage(null)

    const result = await uploadFiles(projectId, files)
    markDirty()
    await refreshStorageHint()

    if (result.uploaded.length > 0) {
      setUploadMessage(`Uploaded ${result.uploaded.length} file${result.uploaded.length === 1 ? '' : 's'}.`)
    }
    if (result.rejected.length > 0 && result.uploaded.length === 0) {
      setUploadMessage(result.rejected[0]?.reason ?? 'Upload failed.')
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragOver(false)
    void handleFiles(event.dataTransfer.files)
  }

  const storageWarning =
    storageBytes !== null && storageBytes > mediaProjectSoftBudgetBytes
      ? `This project uses ${formatFileSize(storageBytes)} of media storage. Browsers typically allow several GB in IndexedDB, but very large libraries may affect performance.`
      : null

  const formatHints = filter
    ? normalizeMediaFilter(filter).map((kind) => MEDIA_FORMAT_GUIDANCE[kind]).join(' ')
    : Object.values(MEDIA_FORMAT_GUIDANCE).join(' ')

  return (
    <div className={`media-library-grid-shell${compact ? ' is-compact' : ''}`}>
      <div className="media-library-toolbar">
        <label className="media-library-search">
          <span className="sr-only">Search media</span>
          <input
            type="search"
            placeholder="Search by file name…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
        {showUpload ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              multiple
              accept={accept}
              onChange={(event) => {
                void handleFiles(event.target.files)
                event.target.value = ''
              }}
            />
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload files
            </button>
          </>
        ) : null}
      </div>

      {!compact ? <p className="field-hint media-library-format-hint">{formatHints}</p> : null}
      {uploadError ? <p className="error-banner">{uploadError}</p> : null}
      {uploadMessage ? <p className="admin-status-banner">{uploadMessage}</p> : null}
      {storageWarning ? <p className="admin-status-banner">{storageWarning}</p> : null}

      <div
        className={`media-library-dropzone${dragOver ? ' is-drag-over' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault()
          if (showUpload) setDragOver(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (showUpload) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={showUpload ? handleDrop : undefined}
        onMouseEnter={() => {
          void refreshStorageHint()
        }}
      >
        {filteredAssets.length === 0 ? (
          <p className="admin-empty">
            {search.trim()
              ? 'No media matches your search.'
              : showUpload
                ? 'Drop files here or use Upload files.'
                : 'No media available for this filter.'}
          </p>
        ) : (
          <ul className="media-grid">
            {filteredAssets.map((asset) => (
              <li key={asset.id}>
                <button
                  type="button"
                  className={`media-grid-item${selectedId === asset.id ? ' is-selected' : ''}`}
                  onClick={() => {
                    if (onSelect) {
                      onSelect(asset)
                      return
                    }
                    onOpen?.(asset)
                  }}
                  onDoubleClick={() => onOpen?.(asset)}
                >
                  <MediaThumbnail asset={asset} />
                  <span className="media-grid-title">{asset.title || asset.fileName}</span>
                  <span className="media-grid-meta">
                    {asset.kind} · {formatFileSize(asset.fileSize)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
