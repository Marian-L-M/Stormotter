import Dexie, { type EntityTable } from 'dexie'
import type { AppSettings, StoredProject } from './projectRecord'

export class MotherotterDb extends Dexie {
  projects!: EntityTable<StoredProject, 'projectId'>
  settings!: EntityTable<AppSettings, 'id'>

  constructor() {
    super('motherotter')
    this.version(1).stores({
      projects: 'projectId, gameId, updatedAt',
      settings: 'id',
    })
  }
}

export const db = new MotherotterDb()

const SETTINGS_ID = 'settings' as const

export function normalizeAppSettings(raw: Partial<AppSettings> | undefined): AppSettings {
  return {
    id: SETTINGS_ID,
    lastProjectId: raw?.lastProjectId ?? null,
    autosaveEnabled: raw?.autosaveEnabled ?? true,
  }
}

export async function readAppSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(SETTINGS_ID)
  return normalizeAppSettings(existing)
}

export async function writeAppSettings(
  partial: Partial<Omit<AppSettings, 'id'>>,
): Promise<AppSettings> {
  const current = await readAppSettings()
  const next: AppSettings = { ...current, ...partial, id: SETTINGS_ID }
  await db.settings.put(next)
  return next
}

export async function writeLastProjectId(projectId: string): Promise<void> {
  await writeAppSettings({ lastProjectId: projectId })
}

export async function listProjects(): Promise<StoredProject[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray()
}

export async function getProject(projectId: string): Promise<StoredProject | undefined> {
  return db.projects.get(projectId)
}

export async function putProject(project: StoredProject): Promise<void> {
  await db.projects.put(project)
}

export async function deleteProject(projectId: string): Promise<void> {
  await db.projects.delete(projectId)
}

export async function countProjects(): Promise<number> {
  return db.projects.count()
}
