import { useState } from 'react'
import type { MediaPickerFilter } from '../../admin/mediaTypes'
import { useMediaAssetObjectUrl } from '../../hooks/useMediaObjectUrl'
import { useMediaLibraryStore } from '../../store/mediaLibraryStore'
import { MediaLibraryModal } from './MediaLibraryModal'
import { MediaPreview } from './MediaPreview'

interface MediaPickerFieldProps {
  label: string
  value: string | null
  onChange: (mediaId: string | null) => void
  filter: MediaPickerFilter
  hint?: string
  modalTitle?: string
}

export function MediaPickerField({
  label,
  value,
  onChange,
  filter,
  hint,
  modalTitle,
}: MediaPickerFieldProps) {
  const [open, setOpen] = useState(false)
  const asset = useMediaLibraryStore((state) =>
    value ? state.assets.find((entry) => entry.id === value) : undefined,
  )
  const previewUrl = useMediaAssetObjectUrl(value)

  return (
    <div className="field media-picker-field">
      <span>{label}</span>

      {asset ? (
        <div className="media-picker-preview">
          {asset.kind === 'image' && previewUrl ? (
            <img src={previewUrl} alt={asset.altText || asset.title} className="media-picker-thumb" />
          ) : asset.kind === 'audio' && previewUrl ? (
            <audio controls src={previewUrl} className="media-picker-player" />
          ) : asset.kind === 'video' && previewUrl ? (
            <video controls src={previewUrl} className="media-picker-video" />
          ) : (
            <MediaPreview asset={asset} className="media-picker-fallback" />
          )}
          <div className="media-picker-meta">
            <strong>{asset.title || asset.fileName}</strong>
            <span className="muted">{asset.kind}</span>
          </div>
        </div>
      ) : (
        <p className="admin-empty admin-empty-inline">No media selected.</p>
      )}

      <div className="media-picker-actions">
        <button type="button" className="admin-secondary-button" onClick={() => setOpen(true)}>
          {value ? 'Replace media' : 'Select media'}
        </button>
        {value ? (
          <button type="button" className="admin-secondary-button" onClick={() => onChange(null)}>
            Remove
          </button>
        ) : null}
      </div>

      {hint ? <span className="field-hint">{hint}</span> : null}

      <MediaLibraryModal
        open={open}
        title={modalTitle ?? `Select ${label.toLowerCase()}`}
        filter={filter}
        selectedId={value}
        onClose={() => setOpen(false)}
        onSelect={(mediaId) => onChange(mediaId)}
      />
    </div>
  )
}
