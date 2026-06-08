import { useEffect, useState } from 'react'
import { getMediaBlob } from '../lib/mediaBlobRepository'
import { cacheObjectUrl, getCachedObjectUrl } from '../lib/mediaObjectUrlCache'
import { useMediaLibraryStore } from '../store/mediaLibraryStore'

export function useMediaObjectUrl(blobId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    blobId ? getCachedObjectUrl(blobId) ?? null : null,
  )

  useEffect(() => {
    if (!blobId) {
      setUrl(null)
      return
    }

    const cached = getCachedObjectUrl(blobId)
    if (cached) {
      setUrl(cached)
      return
    }

    let cancelled = false
    void getMediaBlob(blobId).then((record) => {
      if (cancelled || !record) return
      const nextUrl = cacheObjectUrl(blobId, URL.createObjectURL(record.data))
      setUrl(nextUrl)
    })

    return () => {
      cancelled = true
    }
  }, [blobId])

  return url
}

export function useMediaAssetObjectUrl(mediaId: string | null | undefined): string | null {
  const asset = useMediaLibraryStore((state) =>
    mediaId ? state.assets.find((entry) => entry.id === mediaId) : undefined,
  )
  return useMediaObjectUrl(asset?.blobId)
}
