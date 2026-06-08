const objectUrlCache = new Map<string, string>()

export function getCachedObjectUrl(blobId: string): string | undefined {
  return objectUrlCache.get(blobId)
}

export function cacheObjectUrl(blobId: string, url: string): string {
  const existing = objectUrlCache.get(blobId)
  if (existing) return existing
  objectUrlCache.set(blobId, url)
  return url
}

export function revokeObjectUrl(blobId: string): void {
  const url = objectUrlCache.get(blobId)
  if (!url) return
  URL.revokeObjectURL(url)
  objectUrlCache.delete(blobId)
}

export function revokeAllObjectUrls(): void {
  for (const url of objectUrlCache.values()) {
    URL.revokeObjectURL(url)
  }
  objectUrlCache.clear()
}

export function revokeObjectUrlsExcept(validBlobIds: Set<string>): void {
  for (const blobId of [...objectUrlCache.keys()]) {
    if (!validBlobIds.has(blobId)) revokeObjectUrl(blobId)
  }
}
