import {
  cellKey,
  createEmptyWorld,
  getActiveWorld,
  loadGameFromBytes,
  mapFromWorld,
  type WorldModel,
} from '@otter/game-state'
import { FORMAT_VERSION, type OtterfileDocument } from '@otter/otterfile-core'
import {
  DEFAULT_MEDIA_MAX_FILE_BYTES,
  DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES,
  normalizeMediaMaxFileBytes,
  normalizeMediaProjectSoftBudgetBytes,
} from '../admin/mediaTypes'
import { normalizeEditorMode, type EditorMode } from '../editorModes'
import type { EditorTool } from '../editorTools'
import {
  deleteProject as deleteStoredProject,
  getProject,
  listProjects,
  putProject,
  readAppSettings,
  writeLastProjectId,
} from './db'
import {
  createDefaultGameId,
  createProjectId,
  type ProjectContent,
  type ProjectSummary,
  type SerializedWorld,
  type StoredProject,
  toProjectSummary,
} from './projectRecord'
import { deleteMediaBlobsForProject } from './mediaBlobRepository'
import { createDefaultProjectContent, normalizeProjectContent } from './projectContent'

const DEFAULT_LAYERS = ['ground', 'roof'] as const

export function createDefaultWorld(): WorldModel {
  return createEmptyWorld(16, 12, [...DEFAULT_LAYERS])
}

export function serializeWorld(world: WorldModel): SerializedWorld {
  return {
    width: world.width,
    height: world.height,
    layers: [...world.layers],
    cells: [...world.cells.values()],
  }
}

export function deserializeWorld(data: SerializedWorld): WorldModel {
  const world = createEmptyWorld(data.width, data.height, data.layers)
  for (const cell of data.cells) {
    world.cells.set(cellKey(cell.x, cell.y, cell.layer), { ...cell })
  }
  return world
}

export interface EditorSnapshot {
  projectId: string
  gameId: string
  title: string
  mapId: string
  activeLayer: string
  selectedTool: EditorTool
  activeMode: EditorMode
  mapBackdropMediaId: string | null
  mediaMaxFileBytes: number
  mediaProjectSoftBudgetBytes: number
  world: WorldModel
}

export type EditorContent = Omit<EditorSnapshot, 'projectId'>

export function cloneWorld(world: WorldModel): WorldModel {
  return {
    width: world.width,
    height: world.height,
    layers: [...world.layers],
    cells: new Map([...world.cells.entries()].map(([key, cell]) => [key, { ...cell }])),
  }
}

export function snapshotToStoredProject(
  snapshot: EditorSnapshot,
  content: ProjectContent,
  timestamps: { createdAt: string; updatedAt: string },
): StoredProject {
  return {
    projectId: snapshot.projectId,
    gameId: snapshot.gameId,
    title: snapshot.title,
    mapId: snapshot.mapId,
    activeLayer: snapshot.activeLayer,
    selectedTool: snapshot.selectedTool,
    activeMode: snapshot.activeMode,
    mapBackdropMediaId: snapshot.mapBackdropMediaId,
    mediaMaxFileBytes: snapshot.mediaMaxFileBytes,
    mediaProjectSoftBudgetBytes: snapshot.mediaProjectSoftBudgetBytes,
    world: serializeWorld(snapshot.world),
    content: normalizeProjectContent(content),
    formatVersion: FORMAT_VERSION,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}

export function storedProjectToSnapshot(project: StoredProject): EditorSnapshot {
  return {
    projectId: project.projectId,
    gameId: project.gameId,
    title: project.title,
    mapId: project.mapId,
    activeLayer: project.activeLayer,
    selectedTool: project.selectedTool,
    activeMode: normalizeEditorMode(project.activeMode),
    mapBackdropMediaId: project.mapBackdropMediaId ?? null,
    mediaMaxFileBytes: normalizeMediaMaxFileBytes(project.mediaMaxFileBytes),
    mediaProjectSoftBudgetBytes: normalizeMediaProjectSoftBudgetBytes(
      project.mediaProjectSoftBudgetBytes,
    ),
    world: deserializeWorld(project.world),
  }
}

export function storedProjectToContent(project: StoredProject): ProjectContent {
  return normalizeProjectContent(project.content)
}

export function createDefaultSnapshot(projectId = createProjectId()): EditorSnapshot {
  const gameId = createDefaultGameId()
  return {
    projectId,
    gameId,
    title: 'Untitled Adventure',
    mapId: 'main',
    activeLayer: DEFAULT_LAYERS[0],
    selectedTool: 'character:hero',
    activeMode: 'maps',
    mapBackdropMediaId: null,
    mediaMaxFileBytes: DEFAULT_MEDIA_MAX_FILE_BYTES,
    mediaProjectSoftBudgetBytes: DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES,
    world: createDefaultWorld(),
  }
}

export function snapshotToDocument(snapshot: EditorSnapshot): OtterfileDocument {
  return {
    manifest: {
      formatVersion: FORMAT_VERSION,
      gameId: snapshot.gameId,
      title: snapshot.title,
      defaultMapId: snapshot.mapId,
    },
    maps: [mapFromWorld(snapshot.mapId, snapshot.world)],
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

export async function fetchProjectSummaries(): Promise<ProjectSummary[]> {
  const projects = await listProjects()
  return projects.map(toProjectSummary)
}

export async function loadInitialSnapshot(): Promise<{
  snapshot: EditorSnapshot
  content: ProjectContent
  summaries: ProjectSummary[]
}> {
  const settings = await readAppSettings()
  const summaries = await fetchProjectSummaries()

  if (summaries.length === 0) {
    const snapshot = createDefaultSnapshot()
    const content = createDefaultProjectContent()
    const timestamp = nowIso()
    await putProject(
      snapshotToStoredProject(snapshot, content, { createdAt: timestamp, updatedAt: timestamp }),
    )
    await writeLastProjectId(snapshot.projectId)
    return { snapshot, content, summaries: await fetchProjectSummaries() }
  }

  const targetId = settings.lastProjectId ?? summaries[0]?.projectId
  const stored = targetId ? await getProject(targetId) : undefined
  const fallback = stored ?? (await getProject(summaries[0]!.projectId))

  if (!fallback) {
    const snapshot = createDefaultSnapshot()
    const content = createDefaultProjectContent()
    const timestamp = nowIso()
    await putProject(
      snapshotToStoredProject(snapshot, content, { createdAt: timestamp, updatedAt: timestamp }),
    )
    await writeLastProjectId(snapshot.projectId)
    return { snapshot, content, summaries: await fetchProjectSummaries() }
  }

  await writeLastProjectId(fallback.projectId)
  return {
    snapshot: storedProjectToSnapshot(fallback),
    content: storedProjectToContent(fallback),
    summaries,
  }
}

export async function saveSnapshot(
  snapshot: EditorSnapshot,
  content: ProjectContent,
): Promise<ProjectSummary> {
  const existing = await getProject(snapshot.projectId)
  const timestamp = nowIso()
  const stored = snapshotToStoredProject(snapshot, content, {
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  })
  await putProject(stored)
  return toProjectSummary(stored)
}

export async function loadSnapshot(projectId: string): Promise<{
  snapshot: EditorSnapshot
  content: ProjectContent
}> {
  const stored = await getProject(projectId)
  if (!stored) {
    throw new Error(`Project "${projectId}" not found`)
  }
  await writeLastProjectId(projectId)
  return {
    snapshot: storedProjectToSnapshot(stored),
    content: storedProjectToContent(stored),
  }
}

export async function createStoredProject(
  seed?: Partial<Pick<EditorSnapshot, 'gameId' | 'title'>>,
): Promise<{ snapshot: EditorSnapshot; content: ProjectContent }> {
  const snapshot = createDefaultSnapshot()
  if (seed?.gameId) snapshot.gameId = seed.gameId
  if (seed?.title) snapshot.title = seed.title
  const content = createDefaultProjectContent()

  const timestamp = nowIso()
  await putProject(
    snapshotToStoredProject(snapshot, content, { createdAt: timestamp, updatedAt: timestamp }),
  )
  await writeLastProjectId(snapshot.projectId)
  return { snapshot, content }
}

export async function removeStoredProject(projectId: string): Promise<void> {
  await deleteMediaBlobsForProject(projectId)
  await deleteStoredProject(projectId)
}

export async function contentFromBytes(bytes: Uint8Array): Promise<EditorContent> {
  const loaded = await loadGameFromBytes(bytes)
  const world = getActiveWorld(loaded)

  return {
    gameId: loaded.gameId,
    title: loaded.title,
    mapId: loaded.defaultMapId,
    activeLayer: world.layers[0] ?? 'ground',
    selectedTool: 'character:hero',
    activeMode: 'maps',
    mapBackdropMediaId: null,
    mediaMaxFileBytes: DEFAULT_MEDIA_MAX_FILE_BYTES,
    mediaProjectSoftBudgetBytes: DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES,
    world: cloneWorld(world),
  }
}

export async function importBytesAsNewProject(bytes: Uint8Array): Promise<{
  snapshot: EditorSnapshot
  content: ProjectContent
}> {
  const contentFromFile = await contentFromBytes(bytes)
  const snapshot: EditorSnapshot = {
    projectId: createProjectId(),
    ...contentFromFile,
  }
  const content = createDefaultProjectContent()

  const timestamp = nowIso()
  await putProject(
    snapshotToStoredProject(snapshot, content, { createdAt: timestamp, updatedAt: timestamp }),
  )
  await writeLastProjectId(snapshot.projectId)
  return { snapshot, content }
}
