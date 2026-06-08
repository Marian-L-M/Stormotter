import { createBlobId } from '../admin/mediaTypes'
import { db, type StoredMediaBlob } from './db'

export async function putMediaBlob(
  projectId: string,
  blob: Blob,
  mimeType: string,
  blobId = createBlobId(),
): Promise<StoredMediaBlob> {
  const timestamp = new Date().toISOString()
  const record: StoredMediaBlob = {
    id: blobId,
    projectId,
    mimeType,
    size: blob.size,
    data: blob,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.mediaBlobs.put(record)
  return record
}

export async function getMediaBlob(blobId: string): Promise<StoredMediaBlob | undefined> {
  return db.mediaBlobs.get(blobId)
}

export async function deleteMediaBlob(blobId: string): Promise<void> {
  await db.mediaBlobs.delete(blobId)
}

export async function deleteMediaBlobsForProject(projectId: string): Promise<void> {
  await db.mediaBlobs.where('projectId').equals(projectId).delete()
}

export async function getProjectMediaStorageBytes(projectId: string): Promise<number> {
  const rows = await db.mediaBlobs.where('projectId').equals(projectId).toArray()
  return rows.reduce((total, row) => total + row.size, 0)
}
