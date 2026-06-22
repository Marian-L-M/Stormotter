import {
  cellKey,
  createEmptyWorld,
  getActiveWorld,
  loadGameFromBytes,
  mapFromWorld,
  type RestZone,
  type WorldModel,
} from '@otter/game-state'
import { FORMAT_VERSION, type OtterfileDocument, type StateVariable } from '@otter/otterfile-core'
import {
  DEFAULT_MEDIA_MAX_FILE_BYTES,
  DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES,
  normalizeMediaMaxFileBytes,
  normalizeMediaProjectSoftBudgetBytes,
} from '../admin/mediaTypes'
import {
  DEFAULT_MAP_RENDER_ENGINE,
  isMapRenderEngine,
  type MapRenderEngine,
} from '../admin/renderEngineTypes'
import { normalizeEditorMode, type EditorMode } from '../editorModes'
import {
  DEFAULT_MAP_TOOL_KIND,
  migrateLegacySelectedTool,
  type MapToolKind,
} from '../editorTools'
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
  type StoredMapEntry,
  type StoredProject,
  toProjectSummary,
} from './projectRecord'
import { deleteMediaBlobsForProject } from './mediaBlobRepository'
import { createDefaultProjectContent, normalizeProjectContent } from './projectContent'

const DEFAULT_LAYERS = ['ground'] as const

export function createDefaultWorld(): WorldModel {
  return createEmptyWorld(16, 12, [...DEFAULT_LAYERS])
}

export function serializeWorld(world: WorldModel): SerializedWorld {
  const tiles = [...world.tiles.values()]
  return {
    width: world.width,
    height: world.height,
    layers: [...world.layers],
    cells: [...world.cells.values()],
    ...(tiles.length > 0 ? { tiles } : {}),
  }
}

export function deserializeWorld(data: SerializedWorld): WorldModel {
  const world = createEmptyWorld(data.width, data.height, data.layers)
  for (const cell of data.cells) {
    world.cells.set(cellKey(cell.x, cell.y, cell.layer), { ...cell })
  }
  for (const tile of data.tiles ?? []) {
    world.tiles.set(cellKey(tile.x, tile.y, tile.layer), { ...tile })
  }
  return world
}

export interface EditorMapEntry {
  id: string
  title: string
  backdropMediaId: string | null
  restZone: RestZone
  world: WorldModel
}

function normalizeMapReference(value: string): string {
  return value.trim().toLowerCase()
}

function slugifyMapTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Resolve a map by id, title, or slug-like title (for legacy entrance targets). */
export function resolveProjectMapEntry<T extends Pick<EditorMapEntry, 'id' | 'title'>>(
  maps: readonly T[],
  reference: string,
): T | null {
  const normalized = normalizeMapReference(reference)
  if (!normalized) return null

  const byExactId = maps.find((map) => map.id === reference.trim())
  if (byExactId) return byExactId

  const byId = maps.find((map) => normalizeMapReference(map.id) === normalized)
  if (byId) return byId

  const byTitle = maps.find((map) => normalizeMapReference(map.title) === normalized)
  if (byTitle) return byTitle

  const byTitleSlug = maps.find((map) => slugifyMapTitle(map.title) === normalized)
  if (byTitleSlug) return byTitleSlug

  const partialTitleMatches = maps.filter((map) =>
    normalizeMapReference(map.title).includes(normalized),
  )
  if (partialTitleMatches.length === 1) return partialTitleMatches[0]!

  return null
}

export function resolvePreviewMapContext(input: {
  editorMapId: string
  editorWorld: WorldModel
  editorActiveLayer: string
  maps: readonly EditorMapEntry[]
  previewMapId: string | null
  previewActiveLayer: string | null
}): {
  mapId: string
  world: WorldModel
  activeLayer: string
  entry: EditorMapEntry | null
} {
  const mapId = input.previewMapId ?? input.editorMapId
  const entry =
    resolveProjectMapEntry(input.maps, mapId) ??
    input.maps.find((map) => map.id === mapId) ??
    null
  const world = mapId === input.editorMapId ? input.editorWorld : (entry?.world ?? input.editorWorld)
  const activeLayer = input.previewActiveLayer ?? input.editorActiveLayer
  return { mapId, world, activeLayer, entry }
}

export interface EditorSnapshot {
  projectId: string
  gameId: string
  title: string
  mapId: string
  activeLayer: string
  mapToolKind: MapToolKind
  mapPlacementEntityId: string | null
  activeMode: EditorMode
  mapBackdropMediaId: string | null
  mapRenderEngine: MapRenderEngine
  enabledMapRenderEngines: MapRenderEngine[]
  mediaMaxFileBytes: number
  mediaProjectSoftBudgetBytes: number
  world: WorldModel
  maps: EditorMapEntry[]
}

export type EditorContent = Omit<EditorSnapshot, 'projectId'>

export function cloneWorld(world: WorldModel): WorldModel {
  return {
    width: world.width,
    height: world.height,
    layers: [...world.layers],
    cells: new Map([...world.cells.entries()].map(([key, cell]) => [key, { ...cell }])),
    tiles: new Map([...world.tiles.entries()].map(([key, tile]) => [key, { ...tile }])),
  }
}

function normalizeRestZone(value: unknown): RestZone {
  if (value === 'inn' || value === 'inside' || value === 'outside') return value
  return 'none'
}

export function createDefaultMapEntry(
  id = 'main',
  title = 'Main Map',
): EditorMapEntry {
  return {
    id,
    title,
    backdropMediaId: null,
    restZone: 'none',
    world: createDefaultWorld(),
  }
}

function serializeMapEntry(entry: EditorMapEntry): StoredMapEntry {
  return {
    id: entry.id,
    title: entry.title,
    backdropMediaId: entry.backdropMediaId,
    restZone: entry.restZone,
    world: serializeWorld(entry.world),
  }
}

function deserializeMapEntry(entry: StoredMapEntry): EditorMapEntry {
  return {
    id: entry.id,
    title: entry.title,
    backdropMediaId: entry.backdropMediaId,
    restZone: normalizeRestZone(entry.restZone),
    world: deserializeWorld(entry.world),
  }
}

function normalizeStoredMaps(project: StoredProject): StoredMapEntry[] {
  if (project.maps && project.maps.length > 0) {
    return project.maps
  }
  return [
    {
      id: project.mapId,
      title: project.mapId === 'main' ? 'Main Map' : project.mapId,
      backdropMediaId: project.mapBackdropMediaId ?? null,
      restZone: 'none',
      world: project.world,
    },
  ]
}

function flushActiveMapIntoEntries(
  snapshot: Pick<EditorSnapshot, 'mapId' | 'mapBackdropMediaId' | 'world' | 'maps'>,
): EditorMapEntry[] {
  return snapshot.maps.map((entry) =>
    entry.id === snapshot.mapId
      ? {
          ...entry,
          backdropMediaId: snapshot.mapBackdropMediaId,
          world: cloneWorld(snapshot.world),
        }
      : { ...entry, world: cloneWorld(entry.world) },
  )
}

export function snapshotMapsForPersistence(
  snapshot: Pick<EditorSnapshot, 'mapId' | 'mapBackdropMediaId' | 'world' | 'maps'>,
): EditorMapEntry[] {
  return flushActiveMapIntoEntries(snapshot)
}

export function snapshotToStoredProject(
  snapshot: EditorSnapshot,
  content: ProjectContent,
  timestamps: { createdAt: string; updatedAt: string },
): StoredProject {
  const maps = snapshotMapsForPersistence(snapshot).map(serializeMapEntry)
  const activeWorld = maps.find((map) => map.id === snapshot.mapId)?.world ?? serializeWorld(snapshot.world)

  return {
    projectId: snapshot.projectId,
    gameId: snapshot.gameId,
    title: snapshot.title,
    mapId: snapshot.mapId,
    activeLayer: snapshot.activeLayer,
    mapToolKind: snapshot.mapToolKind,
    mapPlacementEntityId: snapshot.mapPlacementEntityId,
    activeMode: snapshot.activeMode,
    mapBackdropMediaId: snapshot.mapBackdropMediaId,
    mapRenderEngine: snapshot.mapRenderEngine,
    enabledMapRenderEngines: snapshot.enabledMapRenderEngines,
    mediaMaxFileBytes: snapshot.mediaMaxFileBytes,
    mediaProjectSoftBudgetBytes: snapshot.mediaProjectSoftBudgetBytes,
    world: activeWorld,
    maps,
    content: normalizeProjectContent(content),
    formatVersion: FORMAT_VERSION,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  }
}

export function storedProjectToSnapshot(project: StoredProject): EditorSnapshot {
  const migrated =
    project.mapToolKind !== undefined
      ? {
          mapToolKind: project.mapToolKind,
          mapPlacementEntityId: project.mapPlacementEntityId ?? null,
        }
      : (() => {
          const legacy = migrateLegacySelectedTool(project.selectedTool ?? 'character:hero')
          return {
            mapToolKind: legacy.kind,
            mapPlacementEntityId: legacy.placementEntityId,
          }
        })()

  const storedMaps = normalizeStoredMaps(project)
  const maps = storedMaps.map(deserializeMapEntry)
  const activeMap = maps.find((map) => map.id === project.mapId) ?? maps[0]!

  return {
    projectId: project.projectId,
    gameId: project.gameId,
    title: project.title,
    mapId: activeMap.id,
    activeLayer: project.activeLayer,
    mapToolKind: migrated.mapToolKind,
    mapPlacementEntityId: migrated.mapPlacementEntityId,
    activeMode: normalizeEditorMode(project.activeMode),
    mapBackdropMediaId: activeMap.backdropMediaId,
    mapRenderEngine: isMapRenderEngine(project.mapRenderEngine ?? '')
      ? project.mapRenderEngine!
      : DEFAULT_MAP_RENDER_ENGINE,
    enabledMapRenderEngines: (project.enabledMapRenderEngines ?? [DEFAULT_MAP_RENDER_ENGINE]).filter(
      isMapRenderEngine,
    ),
    mediaMaxFileBytes: normalizeMediaMaxFileBytes(project.mediaMaxFileBytes),
    mediaProjectSoftBudgetBytes: normalizeMediaProjectSoftBudgetBytes(
      project.mediaProjectSoftBudgetBytes,
    ),
    world: cloneWorld(activeMap.world),
    maps,
  }
}

export function storedProjectToContent(project: StoredProject): ProjectContent {
  return normalizeProjectContent(project.content)
}

export function createDefaultSnapshot(projectId = createProjectId()): EditorSnapshot {
  const gameId = createDefaultGameId()
  const defaultMap = createDefaultMapEntry('main', 'Main Map')
  return {
    projectId,
    gameId,
    title: 'Untitled Adventure',
    mapId: defaultMap.id,
    activeLayer: DEFAULT_LAYERS[0],
    mapToolKind: DEFAULT_MAP_TOOL_KIND,
    mapPlacementEntityId: null,
    activeMode: 'maps',
    mapBackdropMediaId: null,
    mapRenderEngine: DEFAULT_MAP_RENDER_ENGINE,
    enabledMapRenderEngines: [DEFAULT_MAP_RENDER_ENGINE],
    mediaMaxFileBytes: DEFAULT_MEDIA_MAX_FILE_BYTES,
    mediaProjectSoftBudgetBytes: DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES,
    world: cloneWorld(defaultMap.world),
    maps: [defaultMap],
  }
}

export function snapshotToDocument(
  snapshot: EditorSnapshot,
  stateVariables: readonly StateVariable[] = [],
): OtterfileDocument {
  const maps = snapshotMapsForPersistence(snapshot)
  return {
    manifest: {
      formatVersion: FORMAT_VERSION,
      gameId: snapshot.gameId,
      title: snapshot.title,
      defaultMapId: snapshot.mapId,
    },
    maps: maps.map((entry) => ({
      ...mapFromWorld(entry.id, entry.world),
      ...(entry.restZone !== 'none' ? { restZone: entry.restZone } : {}),
    })),
    content: { stateVariables: [...stateVariables] },
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

/** Authored content carried by an otterfile, separated from editor UI state. */
export interface ImportedOtterfile {
  editor: EditorContent
  stateVariables: StateVariable[]
}

export async function contentFromBytes(bytes: Uint8Array): Promise<ImportedOtterfile> {
  const loaded = await loadGameFromBytes(bytes)
  const world = getActiveWorld(loaded)
  const maps: EditorMapEntry[] = [...loaded.maps.entries()].map(([id, mapWorld]) => ({
    id,
    title: id === 'main' ? 'Main Map' : id,
    backdropMediaId: null,
    restZone: loaded.mapRestZones.get(id) ?? 'none',
    world: cloneWorld(mapWorld),
  }))

  return {
    editor: {
      gameId: loaded.gameId,
      title: loaded.title,
      mapId: loaded.defaultMapId,
      activeLayer: world.layers[0] ?? 'ground',
      mapToolKind: DEFAULT_MAP_TOOL_KIND,
      mapPlacementEntityId: null,
      activeMode: 'maps',
      mapBackdropMediaId: null,
      mapRenderEngine: DEFAULT_MAP_RENDER_ENGINE,
      enabledMapRenderEngines: [DEFAULT_MAP_RENDER_ENGINE],
      mediaMaxFileBytes: DEFAULT_MEDIA_MAX_FILE_BYTES,
      mediaProjectSoftBudgetBytes: DEFAULT_MEDIA_PROJECT_SOFT_BUDGET_BYTES,
      world: cloneWorld(world),
      maps: maps.length > 0 ? maps : [createDefaultMapEntry(loaded.defaultMapId, 'Main Map')],
    },
    stateVariables: [...loaded.stateVariables],
  }
}

export async function importBytesAsNewProject(bytes: Uint8Array): Promise<{
  snapshot: EditorSnapshot
  content: ProjectContent
}> {
  const { editor, stateVariables } = await contentFromBytes(bytes)
  const snapshot: EditorSnapshot = {
    projectId: createProjectId(),
    ...editor,
  }
  const content = createDefaultProjectContent()
  content.stateVariables = stateVariables

  const timestamp = nowIso()
  await putProject(
    snapshotToStoredProject(snapshot, content, { createdAt: timestamp, updatedAt: timestamp }),
  )
  await writeLastProjectId(snapshot.projectId)
  return { snapshot, content }
}
