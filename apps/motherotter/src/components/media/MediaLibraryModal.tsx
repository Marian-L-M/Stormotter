import { useEffect, useRef, useState } from 'react'
import type { MediaAsset, MediaPickerFilter } from '../../admin/mediaTypes'
import { MediaLibraryGrid } from './MediaLibraryGrid'

interface MediaLibraryModalProps {
  open: boolean
  title?: string
  filter: MediaPickerFilter
  selectedId?: string | null
  onClose: () => void
  onSelect: (mediaId: string) => void
}

export function MediaLibraryModal({
  open,
  title = 'Select media',
  filter,
  selectedId,
  onClose,
  onSelect,
}: MediaLibraryModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [search, setSearch] = useState('')
  const [pendingSelection, setPendingSelection] = useState<string | null>(selectedId ?? null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      setPendingSelection(selectedId ?? null)
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, selectedId])

  function handleAssetSelect(asset: MediaAsset) {
    setPendingSelection(asset.id)
  }

  function handleConfirm() {
    if (!pendingSelection) return
    onSelect(pendingSelection)
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="media-library-modal"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="media-library-modal-inner">
        <header className="media-library-modal-header">
          <h2>{title}</h2>
          <button type="button" className="media-library-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <MediaLibraryGrid
          filter={filter}
          search={search}
          onSearchChange={setSearch}
          selectedId={pendingSelection}
          onSelect={handleAssetSelect}
          showUpload
          compact
        />

        <footer className="media-library-modal-footer">
          <button type="button" className="admin-secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-primary-button"
            disabled={!pendingSelection}
            onClick={handleConfirm}
          >
            Use selected media
          </button>
        </footer>
      </div>
    </dialog>
  )
}
