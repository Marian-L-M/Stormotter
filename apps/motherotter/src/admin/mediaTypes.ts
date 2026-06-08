export type MediaKind = 'image' | 'audio' | 'video'

export interface MediaAsset {
  id: string
  fileName: string
  title: string
  altText: string
  caption: string
  description: string
  mimeType: string
  kind: MediaKind
  fileSize: number
  blobId: string
  width?: number
  height?: number
  durationSeconds?: number
  updatedAt: string
}

export type MediaAssetPatch = Partial<
  Pick<MediaAsset, 'title' | 'altText' | 'caption' | 'description'>
>

export type MediaPickerFilter = MediaKind | readonly MediaKind[]

/** Default per-file upload cap (5 MB). */
export const DEFAULT_MEDIA_MAX_FILE_BYTES = 5 * 1024 * 1024

/** Default soft project budget before showing a storage warning (1 GB). */
export const DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES = 1024 * 1024 * 1024

/** @deprecated Use project settings or DEFAULT_MEDIA_MAX_FILE_BYTES */
export const MEDIA_MAX_FILE_BYTES = DEFAULT_MEDIA_MAX_FILE_BYTES

/** @deprecated Use project settings or DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES */
export const MEDIA_PROJECT_SOFT_BUDGET_BYTES = DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES

export function normalizeMediaMaxFileBytes(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_MEDIA_MAX_FILE_BYTES
  }
  return Math.round(value)
}

export function normalizeMediaProjectSoftBudgetBytes(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES
  }
  return Math.round(value)
}

export function bytesToMegabytes(bytes: number): number {
  return bytes / (1024 * 1024)
}

export function megabytesToBytes(megabytes: number): number {
  return Math.round(megabytes * 1024 * 1024)
}

export function bytesToGigabytes(bytes: number): number {
  return bytes / (1024 * 1024 * 1024)
}

export function gigabytesToBytes(gigabytes: number): number {
  return Math.round(gigabytes * 1024 * 1024 * 1024)
}

export const MEDIA_ACCEPTED_MIME_TYPES: Record<MediaKind, readonly string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/mp4'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
}

export const MEDIA_FORMAT_GUIDANCE: Record<MediaKind, string> = {
  image: 'JPEG or PNG for photos; WebP for smaller game assets; GIF for simple animation.',
  audio: 'MP3 for broad support; OGG or WebM for smaller web-first projects; WAV for uncompressed source.',
  video: 'MP4 (H.264) for compatibility; WebM for smaller web-first cutscenes.',
}

const ALL_ACCEPTED = new Set(
  Object.values(MEDIA_ACCEPTED_MIME_TYPES).flatMap((types) => [...types]),
)

export function getMediaKindFromMime(mimeType: string): MediaKind | null {
  const normalized = mimeType.toLowerCase()
  for (const kind of ['image', 'audio', 'video'] as const) {
    if (MEDIA_ACCEPTED_MIME_TYPES[kind].includes(normalized)) return kind
  }
  return null
}

export function isAcceptedMediaMimeType(mimeType: string): boolean {
  return ALL_ACCEPTED.has(mimeType.toLowerCase())
}

export function normalizeMediaFilter(filter: MediaPickerFilter): MediaKind[] {
  if (typeof filter === 'string') return [filter]
  return [...filter]
}

export function mediaKindMatchesFilter(kind: MediaKind, filter: MediaPickerFilter): boolean {
  return normalizeMediaFilter(filter).includes(kind)
}

export function acceptAttributeForFilter(filter: MediaPickerFilter): string {
  const mimes = normalizeMediaFilter(filter).flatMap((kind) => [...MEDIA_ACCEPTED_MIME_TYPES[kind]])
  return mimes.join(',')
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function createMediaId(): string {
  return `media-${crypto.randomUUID().slice(0, 8)}`
}

export function createBlobId(): string {
  return `blob-${crypto.randomUUID().slice(0, 8)}`
}
