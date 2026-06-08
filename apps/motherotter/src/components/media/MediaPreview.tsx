import type { MediaAsset, MediaKind } from '../../admin/mediaTypes'
import { formatFileSize } from '../../admin/mediaTypes'
import { useMediaObjectUrl } from '../../hooks/useMediaObjectUrl'

interface MediaPreviewProps {
  asset: MediaAsset
  className?: string
}

function kindLabel(kind: MediaKind): string {
  if (kind === 'image') return 'Image'
  if (kind === 'audio') return 'Audio'
  return 'Video'
}

export function MediaPreview({ asset, className }: MediaPreviewProps) {
  const url = useMediaObjectUrl(asset.blobId)

  return (
    <div className={`media-preview${className ? ` ${className}` : ''}`}>
      {asset.kind === 'image' && url ? (
        <img src={url} alt={asset.altText || asset.title} className="media-preview-image" />
      ) : asset.kind === 'audio' && url ? (
        <div className="media-preview-audio">
          <span className="media-preview-kind">{kindLabel(asset.kind)}</span>
          <audio controls src={url} className="media-preview-player" />
        </div>
      ) : asset.kind === 'video' && url ? (
        <video controls src={url} className="media-preview-video" />
      ) : (
        <div className="media-preview-placeholder">
          <span className="media-preview-kind">{kindLabel(asset.kind)}</span>
          <span className="media-preview-meta">{formatFileSize(asset.fileSize)}</span>
        </div>
      )}
    </div>
  )
}

export function MediaThumbnail({ asset }: { asset: MediaAsset }) {
  const url = useMediaObjectUrl(asset.blobId)

  if (asset.kind === 'image' && url) {
    return <img src={url} alt="" className="media-grid-thumb-image" />
  }

  return (
    <div className="media-grid-thumb-placeholder">
      <span>{asset.kind === 'audio' ? '♪' : asset.kind === 'video' ? '▶' : '◻'}</span>
    </div>
  )
}
