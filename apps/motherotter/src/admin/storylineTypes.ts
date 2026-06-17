import type { AdminListItem } from './types'

export type StorylineNodeKind = 'start' | 'dialog' | 'quest' | 'journal' | 'end'

export interface StorylineStartNode {
  id: string
  kind: 'start'
  x: number
  y: number
  hookId: string
  continueToNodeId: string | null
}

export interface StorylineDialogNode {
  id: string
  kind: 'dialog'
  x: number
  y: number
  dialogId: string | null
  continueToNodeId: string | null
}

export interface StorylineQuestNode {
  id: string
  kind: 'quest'
  x: number
  y: number
  questId: string | null
  continueToNodeId: string | null
}

export interface StorylineJournalNode {
  id: string
  kind: 'journal'
  x: number
  y: number
  journalEntryId: string | null
  continueToNodeId: string | null
}

export interface StorylineEndNode {
  id: string
  kind: 'end'
  x: number
  y: number
}

export type StorylineFlowNode =
  | StorylineStartNode
  | StorylineDialogNode
  | StorylineQuestNode
  | StorylineJournalNode
  | StorylineEndNode

export interface StorylineFlowGraph {
  rootNodeId: string
  nodes: Record<string, StorylineFlowNode>
  listOrder: string[]
}

export interface Storyline {
  id: string
  name: string
  summary: string
  flow: StorylineFlowGraph
  updatedAt: string
}

export type StorylinePatch = Partial<Pick<Storyline, 'name' | 'summary' | 'flow'>>

export interface StorylineListItem extends AdminListItem {
  storyline: Storyline
}

export function createStorylineId(): string {
  return `storyline-${crypto.randomUUID().slice(0, 8)}`
}

export function createStorylineNodeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function createStorylineStartNode(x = 120, y = 100): StorylineStartNode {
  return {
    id: createStorylineNodeId('story-start'),
    kind: 'start',
    x,
    y,
    hookId: '',
    continueToNodeId: null,
  }
}

export function createStorylineDialogNode(x = 120, y = 240): StorylineDialogNode {
  return {
    id: createStorylineNodeId('story-dialog'),
    kind: 'dialog',
    x,
    y,
    dialogId: null,
    continueToNodeId: null,
  }
}

export function createStorylineQuestNode(x = 120, y = 380): StorylineQuestNode {
  return {
    id: createStorylineNodeId('story-quest'),
    kind: 'quest',
    x,
    y,
    questId: null,
    continueToNodeId: null,
  }
}

export function createStorylineJournalNode(x = 120, y = 520): StorylineJournalNode {
  return {
    id: createStorylineNodeId('story-journal'),
    kind: 'journal',
    x,
    y,
    journalEntryId: null,
    continueToNodeId: null,
  }
}

export function createStorylineEndNode(x = 120, y = 660): StorylineEndNode {
  return {
    id: createStorylineNodeId('story-end'),
    kind: 'end',
    x,
    y,
  }
}

export function createDefaultStorylineFlow(): StorylineFlowGraph {
  const start = createStorylineStartNode(120, 100)
  const dialog = createStorylineDialogNode(120, 260)
  const end = createStorylineEndNode(120, 420)
  start.continueToNodeId = dialog.id
  dialog.continueToNodeId = end.id
  return {
    rootNodeId: start.id,
    nodes: {
      [start.id]: start,
      [dialog.id]: dialog,
      [end.id]: end,
    },
    listOrder: [start.id, dialog.id, end.id],
  }
}

export function createEmptyStoryline(name = 'Untitled storyline'): Storyline {
  const timestamp = new Date().toISOString()
  return {
    id: createStorylineId(),
    name,
    summary: '',
    flow: createDefaultStorylineFlow(),
    updatedAt: timestamp,
  }
}

export function defaultGraphListOrder(graph: {
  rootNodeId: string
  nodes: Record<string, StorylineFlowNode>
}): string[] {
  const visited = new Set<string>()
  const order: string[] = []
  const queue = [graph.rootNodeId]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    order.push(id)
    const node = graph.nodes[id]
    if (!node || node.kind === 'end') continue
    if (node.continueToNodeId) queue.push(node.continueToNodeId)
  }
  for (const id of Object.keys(graph.nodes)) {
    if (!visited.has(id)) order.push(id)
  }
  return order
}

function normalizeGraphListOrder(
  graph: { rootNodeId: string; nodes: Record<string, StorylineFlowNode> },
  rawOrder: unknown,
): string[] {
  const nodeIds = new Set(Object.keys(graph.nodes))
  const order: string[] = []
  if (Array.isArray(rawOrder)) {
    for (const id of rawOrder) {
      if (typeof id === 'string' && nodeIds.has(id) && !order.includes(id)) {
        order.push(id)
      }
    }
  }
  if (order.length === 0) {
    order.push(...defaultGraphListOrder(graph))
  }
  for (const id of Object.keys(graph.nodes)) {
    if (!order.includes(id)) order.push(id)
  }
  return order
}

function normalizeStartNode(raw: Partial<StorylineStartNode>): StorylineStartNode {
  return {
    id: raw.id ?? createStorylineNodeId('story-start'),
    kind: 'start',
    x: typeof raw.x === 'number' ? raw.x : 120,
    y: typeof raw.y === 'number' ? raw.y : 100,
    hookId: raw.hookId ?? '',
    continueToNodeId:
      typeof raw.continueToNodeId === 'string' && raw.continueToNodeId.length > 0
        ? raw.continueToNodeId
        : null,
  }
}

function normalizeDialogNode(raw: Partial<StorylineDialogNode>): StorylineDialogNode {
  return {
    id: raw.id ?? createStorylineNodeId('story-dialog'),
    kind: 'dialog',
    x: typeof raw.x === 'number' ? raw.x : 120,
    y: typeof raw.y === 'number' ? raw.y : 240,
    dialogId: typeof raw.dialogId === 'string' && raw.dialogId.length > 0 ? raw.dialogId : null,
    continueToNodeId:
      typeof raw.continueToNodeId === 'string' && raw.continueToNodeId.length > 0
        ? raw.continueToNodeId
        : null,
  }
}

function normalizeQuestNode(raw: Partial<StorylineQuestNode>): StorylineQuestNode {
  return {
    id: raw.id ?? createStorylineNodeId('story-quest'),
    kind: 'quest',
    x: typeof raw.x === 'number' ? raw.x : 120,
    y: typeof raw.y === 'number' ? raw.y : 380,
    questId: typeof raw.questId === 'string' && raw.questId.length > 0 ? raw.questId : null,
    continueToNodeId:
      typeof raw.continueToNodeId === 'string' && raw.continueToNodeId.length > 0
        ? raw.continueToNodeId
        : null,
  }
}

function normalizeJournalNode(raw: Partial<StorylineJournalNode>): StorylineJournalNode {
  return {
    id: raw.id ?? createStorylineNodeId('story-journal'),
    kind: 'journal',
    x: typeof raw.x === 'number' ? raw.x : 120,
    y: typeof raw.y === 'number' ? raw.y : 520,
    journalEntryId:
      typeof raw.journalEntryId === 'string' && raw.journalEntryId.length > 0
        ? raw.journalEntryId
        : null,
    continueToNodeId:
      typeof raw.continueToNodeId === 'string' && raw.continueToNodeId.length > 0
        ? raw.continueToNodeId
        : null,
  }
}

function normalizeEndNode(raw: Partial<StorylineEndNode>): StorylineEndNode {
  return {
    id: raw.id ?? createStorylineNodeId('story-end'),
    kind: 'end',
    x: typeof raw.x === 'number' ? raw.x : 120,
    y: typeof raw.y === 'number' ? raw.y : 660,
  }
}

export function normalizeStorylineNode(raw: unknown): StorylineFlowNode {
  if (!raw || typeof raw !== 'object') return createStorylineStartNode()
  const node = raw as Partial<StorylineFlowNode>
  if (node.kind === 'dialog') return normalizeDialogNode(node)
  if (node.kind === 'quest') return normalizeQuestNode(node)
  if (node.kind === 'journal') return normalizeJournalNode(node)
  if (node.kind === 'end') return normalizeEndNode(node)
  return normalizeStartNode(node as Partial<StorylineStartNode>)
}

export function normalizeStorylineFlowGraph(raw: unknown): StorylineFlowGraph {
  if (!raw || typeof raw !== 'object') return createDefaultStorylineFlow()
  const graph = raw as Partial<StorylineFlowGraph>
  const nodesInput = graph.nodes
  if (!nodesInput || typeof nodesInput !== 'object') return createDefaultStorylineFlow()

  const nodes: Record<string, StorylineFlowNode> = {}
  for (const [id, entry] of Object.entries(nodesInput)) {
    const normalized = normalizeStorylineNode(entry)
    normalized.id = id
    nodes[id] = normalized
  }

  const rootNodeId =
    typeof graph.rootNodeId === 'string' && nodes[graph.rootNodeId]
      ? graph.rootNodeId
      : Object.keys(nodes)[0] ?? createStorylineStartNode().id

  if (!nodes[rootNodeId]) return createDefaultStorylineFlow()

  const listOrder = normalizeGraphListOrder({ rootNodeId, nodes }, graph.listOrder)
  return { rootNodeId, nodes, listOrder }
}

export function normalizeStoryline(raw: Partial<Storyline> & { id: string }): Storyline {
  return {
    id: raw.id,
    name: raw.name?.trim() || 'Untitled storyline',
    summary: raw.summary ?? '',
    flow: normalizeStorylineFlowGraph(raw.flow),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function migrateStubStoryToStoryline(stub: AdminListItem): Storyline {
  const storyline = createEmptyStoryline(stub.title)
  storyline.id = stub.id
  const start = storyline.flow.nodes[storyline.flow.rootNodeId]
  if (start?.kind === 'start') {
    start.hookId = stub.id
  }
  return storyline
}

export function summarizeStorylineFlow(graph: StorylineFlowGraph): string {
  const nodes = Object.values(graph.nodes)
  const dialogs = nodes.filter((node) => node.kind === 'dialog').length
  const quests = nodes.filter((node) => node.kind === 'quest').length
  const journals = nodes.filter((node) => node.kind === 'journal').length
  return `${nodes.length} nodes · ${dialogs} dialog · ${quests} quest · ${journals} journal`
}

export function nodeTypeLabel(node: StorylineFlowNode): string {
  if (node.kind === 'start') return 'Start hook'
  if (node.kind === 'dialog') return 'Dialog'
  if (node.kind === 'quest') return 'Quest'
  if (node.kind === 'journal') return 'Journal'
  return 'End'
}

export const STORYLINE_NODE_KIND_LABELS: Record<StorylineNodeKind, string> = {
  start: 'Start hook',
  dialog: 'Dialog',
  quest: 'Quest',
  journal: 'Journal entry',
  end: 'End',
}
