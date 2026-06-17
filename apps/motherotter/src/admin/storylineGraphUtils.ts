import type {
  StorylineFlowGraph,
  StorylineFlowNode,
  StorylineNodeKind,
} from './storylineTypes'
import {
  createStorylineDialogNode,
  createStorylineEndNode,
  createStorylineJournalNode,
  createStorylineQuestNode,
  createStorylineStartNode,
  defaultGraphListOrder,
} from './storylineTypes'

export interface StorylineGraphEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  label?: string
}

export type StorylineWireSource = { kind: 'continue'; fromNodeId: string }

export interface StorylineNodeSocket {
  id: string
  nodeId: string
  kind: 'input' | 'output'
  wireKind: 'input' | 'continue'
  x: number
  y: number
}

export function collectStorylineGraphEdges(graph: StorylineFlowGraph): StorylineGraphEdge[] {
  const edges: StorylineGraphEdge[] = []
  for (const node of Object.values(graph.nodes)) {
    if (node.kind === 'end') continue
    if (node.continueToNodeId) {
      edges.push({
        id: `${node.id}-continue-${node.continueToNodeId}`,
        fromNodeId: node.id,
        toNodeId: node.continueToNodeId,
        label: 'next',
      })
    }
  }
  return edges
}

export function updateStorylineGraphNode(
  graph: StorylineFlowGraph,
  nodeId: string,
  patch: Partial<StorylineFlowNode>,
): StorylineFlowGraph {
  const current = graph.nodes[nodeId]
  if (!current) return graph
  return {
    ...graph,
    nodes: {
      ...graph.nodes,
      [nodeId]: { ...current, ...patch, id: nodeId, kind: current.kind } as StorylineFlowNode,
    },
  }
}

export function removeStorylineGraphNode(
  graph: StorylineFlowGraph,
  nodeId: string,
): StorylineFlowGraph {
  if (!graph.nodes[nodeId]) return graph
  const nodes = { ...graph.nodes }
  delete nodes[nodeId]
  for (const node of Object.values(nodes)) {
    if (node.kind !== 'end' && node.continueToNodeId === nodeId) {
      node.continueToNodeId = null
    }
  }
  let rootNodeId = graph.rootNodeId
  if (rootNodeId === nodeId) {
    rootNodeId = Object.keys(nodes)[0] ?? rootNodeId
  }
  return {
    rootNodeId,
    nodes,
    listOrder: (graph.listOrder ?? defaultGraphListOrder(graph)).filter((id) => id !== nodeId),
  }
}

export function addStorylineGraphNode(
  graph: StorylineFlowGraph,
  kind: StorylineNodeKind,
  position?: { x: number; y: number },
): { graph: StorylineFlowGraph; nodeId: string } {
  const x = position?.x ?? 120 + Object.keys(graph.nodes).length * 24
  const y = position?.y ?? 100 + Object.keys(graph.nodes).length * 40
  const node =
    kind === 'start'
      ? createStorylineStartNode(x, y)
      : kind === 'dialog'
        ? createStorylineDialogNode(x, y)
        : kind === 'quest'
          ? createStorylineQuestNode(x, y)
          : kind === 'journal'
            ? createStorylineJournalNode(x, y)
            : createStorylineEndNode(x, y)

  const nodes = { ...graph.nodes, [node.id]: node }
  const rootNodeId = graph.rootNodeId || node.id
  const listOrder = [...(graph.listOrder ?? defaultGraphListOrder(graph)), node.id]
  return { graph: { rootNodeId, nodes, listOrder }, nodeId: node.id }
}

export function nodeDimensions(kind: StorylineFlowNode['kind']): { width: number; height: number } {
  if (kind === 'end') return { width: 160, height: 72 }
  if (kind === 'start') return { width: 200, height: 96 }
  return { width: 220, height: 110 }
}

export function collectNodeSockets(node: StorylineFlowNode): StorylineNodeSocket[] {
  const { width, height } = nodeDimensions(node.kind)
  const sockets: StorylineNodeSocket[] = [
    {
      id: `${node.id}-input`,
      nodeId: node.id,
      kind: 'input',
      wireKind: 'input',
      x: node.x + width / 2,
      y: node.y,
    },
  ]
  if (node.kind !== 'end') {
    sockets.push({
      id: `${node.id}-continue-out`,
      nodeId: node.id,
      kind: 'output',
      wireKind: 'continue',
      x: node.x + width / 2,
      y: node.y + height,
    })
  }
  return sockets
}

export function findNearestInputSocket(
  sockets: StorylineNodeSocket[],
  point: { x: number; y: number },
  maxDistance = 28,
): StorylineNodeSocket | null {
  let nearest: StorylineNodeSocket | null = null
  let nearestDist = maxDistance
  for (const socket of sockets) {
    if (socket.kind !== 'input') continue
    const dist = Math.hypot(socket.x - point.x, socket.y - point.y)
    if (dist <= nearestDist) {
      nearestDist = dist
      nearest = socket
    }
  }
  return nearest
}

export function connectStorylineWire(
  graph: StorylineFlowGraph,
  source: StorylineWireSource,
  toNodeId: string,
): StorylineFlowGraph {
  if (!graph.nodes[toNodeId] || source.fromNodeId === toNodeId) return graph
  const fromNode = graph.nodes[source.fromNodeId]
  if (!fromNode || fromNode.kind === 'end') return graph
  return updateStorylineGraphNode(graph, source.fromNodeId, { continueToNodeId: toNodeId })
}

export function reorderGraphList(
  graph: StorylineFlowGraph,
  fromIndex: number,
  toIndex: number,
): StorylineFlowGraph {
  const order = [...(graph.listOrder ?? defaultGraphListOrder(graph))]
  if (fromIndex < 0 || fromIndex >= order.length || toIndex < 0 || toIndex >= order.length) {
    return graph
  }
  const [moved] = order.splice(fromIndex, 1)
  if (!moved) return graph
  order.splice(toIndex, 0, moved)
  return { ...graph, listOrder: order }
}

export function nodeListPreview(
  node: StorylineFlowNode,
  labels: {
    dialogName?: string
    questName?: string
    journalTitle?: string
  },
  maxLen = 72,
): string {
  if (node.kind === 'start') {
    const hook = node.hookId.trim() || '(no hook id)'
    return hook.length > maxLen ? `${hook.slice(0, maxLen)}…` : hook
  }
  if (node.kind === 'dialog') {
    const label = labels.dialogName ?? node.dialogId ?? '(no dialog)'
    return label.length > maxLen ? `${label.slice(0, maxLen)}…` : label
  }
  if (node.kind === 'quest') {
    const label = labels.questName ?? node.questId ?? '(no quest)'
    return label.length > maxLen ? `${label.slice(0, maxLen)}…` : label
  }
  if (node.kind === 'journal') {
    const label = labels.journalTitle ?? node.journalEntryId ?? '(no entry)'
    return label.length > maxLen ? `${label.slice(0, maxLen)}…` : label
  }
  return 'Storyline end'
}
