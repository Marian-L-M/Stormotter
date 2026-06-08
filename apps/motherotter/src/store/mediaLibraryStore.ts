import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createBlobId,
  createMediaId,
  getMediaKindFromMime,
  isAcceptedMediaMimeType,
  type MediaAsset,
  type MediaAssetPatch,
} from '../admin/mediaTypes'
import { useEditorStore } from '../store/editorStore'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'
import { deleteMediaBlob, putMediaBlob } from '../lib/mediaBlobRepository'
import { revokeObjectUrl } from '../lib/mediaObjectUrlCache'

function fileNameToTitle(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^.]+$/, '')
  return withoutExt.replace(/[-_]+/g, ' ').trim() || fileName
}

async function readImageDimensions(
  blob: Blob,
): Promise<{ width: number; height: number } | undefined> {
  if (!blob.type.startsWith('image/')) return undefined

  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(undefined)
    }
    image.src = url
  })
}

async function readMediaDuration(blob: Blob): Promise<number | undefined> {
  if (!blob.type.startsWith('audio/') && !blob.type.startsWith('video/')) return undefined

  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const element = document.createElement(blob.type.startsWith('audio/') ? 'audio' : 'video')
    element.preload = 'metadata'
    element.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(element.duration) ? element.duration : undefined)
    }
    element.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(undefined)
    }
    element.src = url
  })
}

export interface MediaUploadResult {
  uploaded: MediaAsset[]
  rejected: { fileName: string; reason: string }[]
}

interface MediaLibraryState {
  assets: MediaAsset[]
  uploadError: string | null
  uploadFiles: (projectId: string, files: FileList | File[]) => Promise<MediaUploadResult>
  updateAsset: (id: string, patch: MediaAssetPatch) => void
  removeAsset: (id: string) => Promise<void>
  getAsset: (id: string) => MediaAsset | undefined
  replaceAll: (assets: MediaAsset[]) => void
  clearUploadError: () => void
}

export const useMediaLibraryStore = create<MediaLibraryState>()(
  immer((set, get) => ({
    assets: createDefaultProjectContent().mediaAssets,
    uploadError: null,

    uploadFiles: async (projectId, files) => {
      const fileArray = [...files]
      const uploaded: MediaAsset[] = []
      const rejected: { fileName: string; reason: string }[] = []

      for (const file of fileArray) {
        if (!isAcceptedMediaMimeType(file.type)) {
          rejected.push({
            fileName: file.name,
            reason: 'Unsupported file type. Use JPEG, PNG, WebP, GIF, MP3, OGG, WAV, MP4, or WebM.',
          })
          continue
        }

        const maxFileBytes = useEditorStore.getState().mediaMaxFileBytes
        if (file.size > maxFileBytes) {
          rejected.push({
            fileName: file.name,
            reason: `File exceeds the ${Math.round(maxFileBytes / (1024 * 1024))} MB limit.`,
          })
          continue
        }

        const kind = getMediaKindFromMime(file.type)
        if (!kind) {
          rejected.push({ fileName: file.name, reason: 'Could not determine media type.' })
          continue
        }

        const blobId = createBlobId()
        await putMediaBlob(projectId, file, file.type, blobId)

        const [dimensions, durationSeconds] = await Promise.all([
          readImageDimensions(file),
          readMediaDuration(file),
        ])

        const timestamp = new Date().toISOString()
        const asset: MediaAsset = {
          id: createMediaId(),
          fileName: file.name,
          title: fileNameToTitle(file.name),
          altText: '',
          caption: '',
          description: '',
          mimeType: file.type,
          kind,
          fileSize: file.size,
          blobId,
          width: dimensions?.width,
          height: dimensions?.height,
          durationSeconds,
          updatedAt: timestamp,
        }

        uploaded.push(asset)
      }

      if (uploaded.length > 0) {
        set((state) => {
          state.assets.unshift(...uploaded)
          state.uploadError = rejected.length > 0 ? rejected.map((entry) => entry.reason).join(' ') : null
        })
      } else if (rejected.length > 0) {
        set((state) => {
          state.uploadError = rejected[0]?.reason ?? 'Upload failed.'
        })
      }

      return { uploaded, rejected }
    },

    updateAsset: (id, patch) => {
      set((state) => {
        const asset = state.assets.find((entry) => entry.id === id)
        if (!asset) return

        if (patch.title !== undefined) asset.title = patch.title
        if (patch.altText !== undefined) asset.altText = patch.altText
        if (patch.caption !== undefined) asset.caption = patch.caption
        if (patch.description !== undefined) asset.description = patch.description
        asset.updatedAt = new Date().toISOString()
      })
    },

    removeAsset: async (id) => {
      const asset = get().assets.find((entry) => entry.id === id)
      if (!asset) return

      revokeObjectUrl(asset.blobId)
      await deleteMediaBlob(asset.blobId)

      set((state) => {
        state.assets = state.assets.filter((entry) => entry.id !== id)
      })
    },

    getAsset: (id) => get().assets.find((entry) => entry.id === id),

    replaceAll: (assets) => {
      set((state) => {
        state.assets = structuredClone(assets)
      })
    },

    clearUploadError: () => {
      set((state) => {
        state.uploadError = null
      })
    },
  })),
)
