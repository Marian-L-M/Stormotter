import { useState } from 'react'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { MediaLibraryGrid } from '../../components/media/MediaLibraryGrid'
import { useMediaLibraryStore } from '../../store/mediaLibraryStore'
import { useEditorStore } from '../../store/editorStore'
import type { MediaAsset } from '../../admin/mediaTypes'

export function MediaLibraryGridView() {
  const [search, setSearch] = useState('')
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const assets = useMediaLibraryStore((state) => state.assets)

  function handleOpen(asset: MediaAsset) {
    openEntityEditor(asset.id)
  }

  return (
    <AdminListShell
      title="Media Library"
      description="Upload and manage images, audio, and video for this project. Media is stored locally in your browser."
    >
      <MediaLibraryGrid
        search={search}
        onSearchChange={setSearch}
        onOpen={handleOpen}
        showUpload
      />
      <p className="field-hint media-library-count-hint">
        {assets.length} item{assets.length === 1 ? '' : 's'} in this project.
      </p>
    </AdminListShell>
  )
}
