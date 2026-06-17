import type {
  DialogConversationGraph,
  DialogConversationNode,
  DialogPlayerChoiceNode,
  DialogSpeechNode,
} from './dialogTypes'
import {
  createEndNode,
  createPlayerChoiceNode,
  createSpeechNode,
  defaultGraphListOrder,
} from './dialogTypes'

export interface DialogGraphEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  label?: string
  wireKind?: 'continue' | 'choices' | 'reply'
  replyId?: string
}

export type DialogWireSource =
  | { kind: 'continue'; fromNodeId: string }
  | { kind: 'choices'; fromNodeId: string }
  | { kind: 'reply'; fromNodeId: string; replyId: string }

export interface DialogNodeSocket {
  id: string
  nodeId: string
  kind: 'input' | 'output'
  wireKind: 'input' | 'continue' | 'choices' | 'reply'
  replyId?: string
  label?: string
  x: number
  y: number
}

export function collectDialogGraphEdges(graph: DialogConversationGraph): DialogGraphEdge[] {
  const edges: DialogGraphEdge[] = []
  for (const node of Object.values(graph.nodes)) {
    if (node.kind === 'speech') {
      if (node.continueToNodeId) {
        edges.push({
          id: `${node.id}-continue-${node.continueToNodeId}`,
          fromNodeId: node.id,
          toNodeId: node.continueToNodeId,
          label: 'continue',
          wireKind: 'continue',
        })
      }
      if (node.playerChoiceNodeId) {
        edges.push({
          id: `${node.id}-choice-${node.playerChoiceNodeId}`,
          fromNodeId: node.id,
          toNodeId: node.playerChoiceNodeId,
          label: 'choices',
          wireKind: 'choices',
        })
      }
    }
    if (node.kind === 'player_choice') {
      for (const reply of node.replies) {
        if (reply.targetNodeId) {
          edges.push({
            id: `${node.id}-reply-${reply.id}-${reply.targetNodeId}`,
            fromNodeId: node.id,
            toNodeId: reply.targetNodeId,
            label: reply.label || 'Reply',
            wireKind: 'reply',
            replyId: reply.id,
          })
        }
      }
    }
  }
  return edges
}

export function updateDialogGraphNode(
  graph: DialogConversationGraph,
  nodeId: string,
  patch: Partial<DialogConversationNode>,
): DialogConversationGraph {
  const current = graph.nodes[nodeId]
  if (!current) return graph
  return {
    ...graph,
    nodes: {
      ...graph.nodes,
      [nodeId]: { ...current, ...patch, id: nodeId, kind: current.kind } as DialogConversationNode,
    },
  }
}

export function removeDialogGraphNode(
  graph: DialogConversationGraph,
  nodeId: string,
): DialogConversationGraph {
  if (!graph.nodes[nodeId]) return graph

  const nodes = { ...graph.nodes }
  delete nodes[nodeId]

  for (const node of Object.values(nodes)) {
    if (node.kind === 'speech') {
      if (node.continueToNodeId === nodeId) node.continueToNodeId = null
      if (node.playerChoiceNodeId === nodeId) node.playerChoiceNodeId = null
    }
    if (node.kind === 'player_choice') {
      for (const reply of node.replies) {
        if (reply.targetNodeId === nodeId) reply.targetNodeId = null
      }
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

export function addDialogGraphNode(
  graph: DialogConversationGraph,
  kind: 'speech' | 'player_choice' | 'end',
  position?: { x: number; y: number },
): { graph: DialogConversationGraph; nodeId: string } {
  const x = position?.x ?? 120 + Object.keys(graph.nodes).length * 24
  const y = position?.y ?? 100 + Object.keys(graph.nodes).length * 40
  const node =
    kind === 'speech'
      ? createSpeechNode(x, y)
      : kind === 'player_choice'
        ? createPlayerChoiceNode(x, y)
        : createEndNode(x, y)

  const nodes = { ...graph.nodes, [node.id]: node }
  const rootNodeId = graph.rootNodeId || node.id
  const listOrder = [...(graph.listOrder ?? defaultGraphListOrder(graph)), node.id]
  return { graph: { rootNodeId, nodes, listOrder }, nodeId: node.id }
}

export function nodeDimensions(kind: DialogConversationNode['kind']): { width: number; height: number } {
  if (kind === 'player_choice') return { width: 220, height: 120 }
  if (kind === 'end') return { width: 160, height: 72 }
  return { width: 220, height: 110 }
}

export function nodeAnchorPoint(node: DialogConversationNode, side: 'bottom' | 'top'): { x: number; y: number } {
  const { width, height } = nodeDimensions(node.kind)
  return {
    x: node.x + width / 2,
    y: side === 'bottom' ? node.y + height : node.y,
  }
}

export function speechNodeLabel(node: DialogSpeechNode): string {
  const preview = node.text.trim().slice(0, 48)
  return preview || '(empty speech)'
}

export function nodeTypeLabel(node: DialogConversationNode): string {
  if (node.kind === 'speech') return 'Speech'
  if (node.kind === 'player_choice') return 'Player choices'
  return 'End'
}

export function choiceNodeLabel(node: DialogPlayerChoiceNode): string {
  return `${node.replies.length} player repl${node.replies.length === 1 ? 'y' : 'ies'}`
}

export function conversationNodeListPreview(node: DialogConversationNode, maxLen = 72): string {
  if (node.kind === 'speech') {
    const text = node.text.trim()
    return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text || '(empty speech)'
  }
  if (node.kind === 'player_choice') {
    const labels = node.replies.map((reply) => reply.label.trim()).filter(Boolean)
    const joined = labels.join(' · ')
    if (!joined) return choiceNodeLabel(node)
    return joined.length > maxLen ? `${joined.slice(0, maxLen)}…` : joined
  }
  return 'End conversation'
}

export function reorderGraphList(
  graph: DialogConversationGraph,
  fromIndex: number,
  toIndex: number,
): DialogConversationGraph {
  const order = [...(graph.listOrder ?? defaultGraphListOrder(graph))]
  if (fromIndex < 0 || fromIndex >= order.length || toIndex < 0 || toIndex >= order.length) {
    return graph
  }
  const [moved] = order.splice(fromIndex, 1)
  if (!moved) return graph
  order.splice(toIndex, 0, moved)
  return { ...graph, listOrder: order }
}

export function collectNodeSockets(node: DialogConversationNode): DialogNodeSocket[] {
  const { width, height } = nodeDimensions(node.kind)
  const sockets: DialogNodeSocket[] = [
    {
      id: `${node.id}-input`,
      nodeId: node.id,
      kind: 'input',
      wireKind: 'input',
      x: node.x + width / 2,
      y: node.y,
    },
  ]

  if (node.kind === 'speech') {
    sockets.push({
      id: `${node.id}-continue-out`,
      nodeId: node.id,
      kind: 'output',
      wireKind: 'continue',
      label: 'Continue',
      x: node.x + width * 0.3,
      y: node.y + height,
    })
    sockets.push({
      id: `${node.id}-choices-out`,
      nodeId: node.id,
      kind: 'output',
      wireKind: 'choices',
      label: 'Choices',
      x: node.x + width * 0.7,
      y: node.y + height,
    })
  }

  if (node.kind === 'player_choice') {
    const count = Math.max(node.replies.length, 1)
    node.replies.forEach((reply, index) => {
      const slot = (index + 1) / (count + 1)
      sockets.push({
        id: `${node.id}-reply-out-${reply.id}`,
        nodeId: node.id,
        kind: 'output',
        wireKind: 'reply',
        replyId: reply.id,
        label: reply.label.trim() || `Reply ${index + 1}`,
        x: node.x + width * slot,
        y: node.y + height,
      })
    })
  }

  return sockets
}

export function findNearestInputSocket(
  sockets: DialogNodeSocket[],
  point: { x: number; y: number },
  maxDistance = 28,
): DialogNodeSocket | null {
  let nearest: DialogNodeSocket | null = null
  let nearestDist = maxDistance
  for (const socket of sockets) {
    if (socket.kind !== 'input') continue
    const dx = socket.x - point.x
    const dy = socket.y - point.y
    const dist = Math.hypot(dx, dy)
    if (dist <= nearestDist) {
      nearestDist = dist
      nearest = socket
    }
  }
  return nearest
}

export function connectDialogWire(
  graph: DialogConversationGraph,
  source: DialogWireSource,
  toNodeId: string,
): DialogConversationGraph {
  if (!graph.nodes[toNodeId] || source.fromNodeId === toNodeId) return graph

  const fromNode = graph.nodes[source.fromNodeId]
  if (!fromNode) return graph

  if (source.kind === 'continue') {
    if (fromNode.kind !== 'speech') return graph
    return updateDialogGraphNode(graph, source.fromNodeId, { continueToNodeId: toNodeId })
  }

  if (source.kind === 'choices') {
    if (fromNode.kind !== 'speech') return graph
    const target = graph.nodes[toNodeId]
    if (target?.kind !== 'player_choice') return graph
    return updateDialogGraphNode(graph, source.fromNodeId, { playerChoiceNodeId: toNodeId })
  }

  if (fromNode.kind !== 'player_choice') return graph
  const replies = fromNode.replies.map((reply) =>
    reply.id === source.replyId ? { ...reply, targetNodeId: toNodeId } : reply,
  )
  return updateDialogGraphNode(graph, source.fromNodeId, { replies })
}

export function ensureGraphListOrder(graph: DialogConversationGraph): DialogConversationGraph {
  if (graph.listOrder?.length) return graph
  return { ...graph, listOrder: defaultGraphListOrder(graph) }
}
