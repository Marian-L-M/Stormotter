import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addDialogGraphNode,
  choiceNodeLabel,
  collectDialogGraphEdges,
  collectNodeSockets,
  connectDialogWire,
  findNearestInputSocket,
  nodeDimensions,
  nodeTypeLabel,
  removeDialogGraphNode,
  speechNodeLabel,
  updateDialogGraphNode,
  type DialogNodeSocket,
  type DialogWireSource,
} from '../../admin/dialogGraphUtils'
import {
  createEmptyDialogReply,
  DIALOG_SPEAKER_LABELS,
  type DialogConversationGraph,
  type DialogConversationNode,
  type DialogEndNode,
  type DialogPlayerChoiceNode,
  type DialogPlayerReply,
  type DialogSpeechSpeaker,
} from '../../admin/dialogTypes'
import { DialogConversationListEditor } from './DialogConversationListEditor'
import { DialogReplyConditionsEditor } from './DialogReplyConditionsEditor'
import { DialogStateEffectsEditor } from './DialogStateEffectsEditor'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useStateVariablesStore } from '../../store/stateVariablesStore'

interface DialogBranchVisualEditorProps {
  graph: DialogConversationGraph
  linkedCharacterId: string | null
  onChange: (graph: DialogConversationGraph) => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function nodeTitle(node: DialogConversationNode): string {
  if (node.kind === 'speech') return speechNodeLabel(node)
  if (node.kind === 'player_choice') return choiceNodeLabel(node)
  return 'End conversation'
}

export function DialogBranchVisualEditor({
  graph,
  linkedCharacterId,
  onChange,
}: DialogBranchVisualEditorProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(graph.rootNodeId)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [wireDrag, setWireDrag] = useState<{
    source: DialogWireSource
    pointer: { x: number; y: number }
  } | null>(null)
  const [hoverInputNodeId, setHoverInputNodeId] = useState<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const didDrag = useRef(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef(graph)
  graphRef.current = graph
  const characters = useContentCatalogStore((state) => state.stubs.characters)
  const variables = useStateVariablesStore((state) => state.variables)

  const patchGraph = useCallback(
    (next: DialogConversationGraph) => {
      graphRef.current = next
      onChange(next)
    },
    [onChange],
  )

  function canvasPointerPosition(event: { clientX: number; clientY: number }): { x: number; y: number } {
    const wrap = canvasRef.current
    if (!wrap) return { x: 0, y: 0 }
    const rect = wrap.getBoundingClientRect()
    return {
      x: event.clientX - rect.left + wrap.scrollLeft,
      y: event.clientY - rect.top + wrap.scrollTop,
    }
  }

  const patchNode = useCallback(
    (nodeId: string, patch: Partial<DialogConversationNode>) => {
      patchGraph(updateDialogGraphNode(graphRef.current, nodeId, patch))
    },
    [patchGraph],
  )

  const patchNodePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      patchNode(nodeId, { x, y })
    },
    [patchNode],
  )

  useEffect(() => {
    if (!draggingId) return
    const activeId = draggingId

    function onPointerMove(event: PointerEvent) {
      didDrag.current = true
      const pointer = canvasPointerPosition(event)
      const x = Math.max(0, pointer.x - dragOffset.current.x)
      const y = Math.max(0, pointer.y - dragOffset.current.y)
      patchNodePosition(activeId, x, y)
    }

    function onPointerUp() {
      setDraggingId(null)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [draggingId, patchNodePosition])

  useEffect(() => {
    if (!wireDrag) return
    const activeSource = wireDrag.source

    function onPointerMove(event: PointerEvent) {
      const pointer = canvasPointerPosition(event)
      setWireDrag((current) => (current ? { ...current, pointer } : null))
      const sockets = Object.values(graphRef.current.nodes).flatMap((node) => collectNodeSockets(node))
      const nearest = findNearestInputSocket(sockets, pointer)
      setHoverInputNodeId(nearest?.nodeId ?? null)
    }

    function onPointerUp(event: PointerEvent) {
      const pointer = canvasPointerPosition(event)
      const sockets = Object.values(graphRef.current.nodes).flatMap((node) => collectNodeSockets(node))
      const nearest = findNearestInputSocket(sockets, pointer)
      if (nearest) {
        patchGraph(connectDialogWire(graphRef.current, activeSource, nearest.nodeId))
      }
      setWireDrag(null)
      setHoverInputNodeId(null)
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [wireDrag, patchGraph])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      const id = selectedNodeId
      if (!id || id === graphRef.current.rootNodeId) return
      event.preventDefault()
      const next = removeDialogGraphNode(graphRef.current, id)
      patchGraph(next)
      setSelectedNodeId(next.rootNodeId)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedNodeId, patchGraph])

  const nodes = useMemo(() => Object.values(graph.nodes), [graph.nodes])
  const edges = useMemo(() => collectDialogGraphEdges(graph), [graph])
  const selectedNode = selectedNodeId ? graph.nodes[selectedNodeId] : null
  const previewWirePath = wireDrag ? wirePreviewPath() : null

  const canvasSize = useMemo(() => {
    let maxX = 800
    let maxY = 600
    for (const node of nodes) {
      const { width, height } = nodeDimensions(node.kind)
      maxX = Math.max(maxX, node.x + width + 80)
      maxY = Math.max(maxY, node.y + height + 80)
    }
    return { width: maxX, height: maxY }
  }, [nodes])

  const handlePointerDown = (nodeId: string, event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest('button, input, textarea, select, .dialog-branch-socket')) {
      return
    }
    const node = graphRef.current.nodes[nodeId]
    if (!node) return
    event.preventDefault()
    event.stopPropagation()
    didDrag.current = false
    setSelectedNodeId(nodeId)
    const pointer = canvasPointerPosition(event)
    dragOffset.current = { x: pointer.x - node.x, y: pointer.y - node.y }
    setDraggingId(nodeId)
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  }

  function handleNodeClick(nodeId: string) {
    if (didDrag.current) {
      didDrag.current = false
      return
    }
    setSelectedNodeId(nodeId)
  }

  function addNode(kind: 'speech' | 'player_choice' | 'end') {
    const { graph: next, nodeId } = addDialogGraphNode(graphRef.current, kind)
    patchGraph(next)
    setSelectedNodeId(nodeId)
  }

  function deleteSelected() {
    if (!selectedNodeId || selectedNodeId === graph.rootNodeId) return
    const next = removeDialogGraphNode(graphRef.current, selectedNodeId)
    patchGraph(next)
    setSelectedNodeId(next.rootNodeId)
  }

  function startWireDrag(source: DialogWireSource, event: React.PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    didDrag.current = true
    const pointer = canvasPointerPosition(event)
    setWireDrag({ source, pointer })
  }

  function renderSocket(socket: DialogNodeSocket, node: DialogConversationNode) {
    const isInput = socket.kind === 'input'
    const isHoverTarget = isInput && hoverInputNodeId === socket.nodeId
    const isConnected =
      !isInput &&
      ((socket.wireKind === 'continue' &&
        node.kind === 'speech' &&
        node.continueToNodeId !== null) ||
        (socket.wireKind === 'choices' &&
          node.kind === 'speech' &&
          node.playerChoiceNodeId !== null) ||
        (socket.wireKind === 'reply' &&
          node.kind === 'player_choice' &&
          node.replies.some(
            (reply) => reply.id === socket.replyId && reply.targetNodeId !== null,
          )))

    if (isInput) {
      return (
        <span
          key={socket.id}
          className={`dialog-branch-socket dialog-branch-socket-input${isHoverTarget ? ' is-drop-target' : ''}`}
          style={{
            left: `${((socket.x - node.x) / nodeDimensions(node.kind).width) * 100}%`,
            top: 0,
          }}
          title="Connect here"
        />
      )
    }

    let source: DialogWireSource
    if (socket.wireKind === 'continue') {
      source = { kind: 'continue', fromNodeId: node.id }
    } else if (socket.wireKind === 'choices') {
      source = { kind: 'choices', fromNodeId: node.id }
    } else {
      source = { kind: 'reply', fromNodeId: node.id, replyId: socket.replyId! }
    }

    return (
      <button
        key={socket.id}
        type="button"
        className={`dialog-branch-socket dialog-branch-socket-output dialog-branch-socket-${socket.wireKind}${isConnected ? ' is-connected' : ''}`}
        style={{
          left: `${((socket.x - node.x) / nodeDimensions(node.kind).width) * 100}%`,
          bottom: 0,
        }}
        title={socket.label}
        onPointerDown={(event) => startWireDrag(source, event)}
      />
    )
  }

  function wirePreviewPath(): string | null {
    if (!wireDrag) return null
    const source = wireDrag.source
    const fromNode = graph.nodes[source.fromNodeId]
    if (!fromNode) return null
    const sockets = collectNodeSockets(fromNode)
    let fromSocket: DialogNodeSocket | undefined
    if (source.kind === 'continue') {
      fromSocket = sockets.find((entry) => entry.wireKind === 'continue')
    } else if (source.kind === 'choices') {
      fromSocket = sockets.find((entry) => entry.wireKind === 'choices')
    } else if (source.kind === 'reply') {
      fromSocket = sockets.find(
        (entry) => entry.wireKind === 'reply' && entry.replyId === source.replyId,
      )
    }
    if (!fromSocket) return null
    const end = wireDrag.pointer
    const midY = (fromSocket.y + end.y) / 2
    return `M ${fromSocket.x} ${fromSocket.y} C ${fromSocket.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`
  }

  function renderInspector() {
    if (!selectedNode) {
      return <p className="field-hint">Select a node on the canvas to edit speech, replies, or links.</p>
    }

    if (selectedNode.kind === 'speech') {
      const node = selectedNode
      return (
        <div className="dialog-node-inspector">
          <h3 className="dialog-node-inspector-title">Speech node</h3>
          <label className="field">
            <span>Speaker</span>
            <select
              className="admin-select admin-select-block"
              value={node.speaker}
              onChange={(event) =>
                patchNode(node.id, { speaker: event.target.value as DialogSpeechSpeaker })
              }
            >
              {Object.entries(DIALOG_SPEAKER_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {node.speaker === 'character' || node.speaker === 'companion' ? (
            <label className="field">
              <span>Character</span>
              <select
                className="admin-select admin-select-block"
                value={node.speakerCharacterId ?? ''}
                onChange={(event) =>
                  patchNode(node.id, {
                    speakerCharacterId: event.target.value.length > 0 ? event.target.value : null,
                  })
                }
              >
                <option value="">Select character…</option>
                {characters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="field">
            <span>Dialog text</span>
            <textarea
              rows={4}
              value={node.text}
              onChange={(event) => patchNode(node.id, { text: event.target.value })}
            />
          </label>
          {node.speaker === 'companion' ? (
            <DialogReplyConditionsEditor
              value={node.showConditions}
              linkedCharacterId={node.speakerCharacterId ?? linkedCharacterId}
              legend="Companion interjection conditions"
              onChange={(showConditions) => patchNode(node.id, { showConditions })}
            />
          ) : null}
          <DialogStateEffectsEditor
            effects={node.stateEffects}
            variables={variables}
            characterId={linkedCharacterId}
            legend="State when spoken"
            onChange={(stateEffects) => patchNode(node.id, { stateEffects })}
          />
          <label className="field">
            <span>Auto-continue to node</span>
            <select
              className="admin-select admin-select-block"
              value={node.continueToNodeId ?? ''}
              onChange={(event) =>
                patchNode(node.id, {
                  continueToNodeId: event.target.value.length > 0 ? event.target.value : null,
                })
              }
            >
              <option value="">None — wait for player or choices</option>
              {nodes
                .filter((entry) => entry.id !== node.id)
                .map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {nodeTypeLabel(entry)} · {nodeTitle(entry)}
                  </option>
                ))}
            </select>
            <span className="field-hint">Cutscene-style — advances without player input.</span>
          </label>
          <label className="field">
            <span>Player choice node</span>
            <select
              className="admin-select admin-select-block"
              value={node.playerChoiceNodeId ?? ''}
              onChange={(event) =>
                patchNode(node.id, {
                  playerChoiceNodeId: event.target.value.length > 0 ? event.target.value : null,
                })
              }
            >
              <option value="">None</option>
              {nodes
                .filter((entry) => entry.kind === 'player_choice')
                .map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {choiceNodeLabel(entry as DialogPlayerChoiceNode)}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )
    }

    if (selectedNode.kind === 'player_choice') {
      const node = selectedNode
      function updateReplies(replies: DialogPlayerReply[]) {
        patchNode(node.id, { replies })
      }
      function updateReply(index: number, patch: Partial<DialogPlayerReply>) {
        updateReplies(
          node.replies.map((reply, replyIndex) =>
            replyIndex === index ? { ...reply, ...patch } : reply,
          ),
        )
      }
      return (
        <div className="dialog-node-inspector">
          <h3 className="dialog-node-inspector-title">Player reply options</h3>
          <p className="field-hint">
            Main-character responses (BG2-style). Each reply branches to the next speech or end node.
          </p>
          {node.replies.map((reply, index) => (
            <fieldset key={reply.id} className="admin-fieldset dialog-reply-card">
              <legend>Reply {index + 1}</legend>
              <label className="field">
                <span>Player option text</span>
                <input
                  value={reply.label}
                  onChange={(event) => updateReply(index, { label: event.target.value })}
                  placeholder="What the player chooses to say…"
                />
              </label>
              <label className="field">
                <span>Leads to node</span>
                <select
                  className="admin-select admin-select-block"
                  value={reply.targetNodeId ?? ''}
                  onChange={(event) =>
                    updateReply(index, {
                      targetNodeId: event.target.value.length > 0 ? event.target.value : null,
                    })
                  }
                >
                  <option value="">Select target…</option>
                  {nodes
                    .filter((entry) => entry.id !== node.id)
                    .map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {nodeTypeLabel(entry)} · {nodeTitle(entry)}
                      </option>
                    ))}
                </select>
              </label>
              <DialogReplyConditionsEditor
                value={reply.conditions}
                linkedCharacterId={linkedCharacterId}
                legend="Show this reply when"
                onChange={(conditions) => updateReply(index, { conditions })}
              />
              <DialogStateEffectsEditor
                effects={reply.stateEffects}
                variables={variables}
                characterId={linkedCharacterId}
                legend="State when chosen"
                onChange={(stateEffects) => updateReply(index, { stateEffects })}
              />
              <button
                type="button"
                className="admin-danger-button"
                disabled={node.replies.length <= 1}
                onClick={() => updateReplies(node.replies.filter((_, i) => i !== index))}
              >
                Remove reply
              </button>
            </fieldset>
          ))}
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => updateReplies([...node.replies, createEmptyDialogReply()])}
          >
            Add player reply
          </button>
        </div>
      )
    }

    const node = selectedNode as DialogEndNode
    return (
      <div className="dialog-node-inspector">
        <h3 className="dialog-node-inspector-title">End conversation</h3>
        <DialogStateEffectsEditor
          effects={node.stateEffects}
          variables={variables}
          characterId={linkedCharacterId}
          legend="State when conversation ends"
          onChange={(stateEffects) => patchNode(node.id, { stateEffects })}
        />
      </div>
    )
  }

  return (
    <div className="dialog-branch-editor">
      <div className="dialog-branch-toolbar">
        <button type="button" className="admin-secondary-button" onClick={() => addNode('speech')}>
          + NPC / speech
        </button>
        <button type="button" className="admin-secondary-button" onClick={() => addNode('player_choice')}>
          + Player choices
        </button>
        <button type="button" className="admin-secondary-button" onClick={() => addNode('end')}>
          + End
        </button>
        {selectedNodeId && selectedNodeId !== graph.rootNodeId ? (
          <button type="button" className="admin-danger-button" onClick={deleteSelected}>
            Delete selected
          </button>
        ) : null}
        {selectedNodeId === graph.rootNodeId ? (
          <span className="field-hint">Root node cannot be deleted. Delete/Backspace removes the selected node.</span>
        ) : (
          <span className="field-hint">Drag sockets to connect nodes. Delete/Backspace removes the selected node.</span>
        )}
      </div>

      <div className="dialog-branch-layout">
        <div ref={canvasRef} className="dialog-branch-canvas-wrap">
          <div
            className="dialog-branch-canvas"
            style={{ width: canvasSize.width, height: canvasSize.height }}
          >
            <svg className="dialog-branch-edges" width={canvasSize.width} height={canvasSize.height}>
              {previewWirePath ? (
                <path d={previewWirePath} className="dialog-branch-edge dialog-branch-edge-preview" />
              ) : null}
              {edges.map((edge) => {
                const from = graph.nodes[edge.fromNodeId]
                const to = graph.nodes[edge.toNodeId]
                if (!from || !to) return null
                const fromSockets = collectNodeSockets(from)
                const toSockets = collectNodeSockets(to)
                const inputSocket = toSockets.find((entry) => entry.kind === 'input')
                let outputSocket = fromSockets.find((entry) => {
                  if (edge.wireKind === 'continue') return entry.wireKind === 'continue'
                  if (edge.wireKind === 'choices') return entry.wireKind === 'choices'
                  if (edge.wireKind === 'reply') return entry.replyId === edge.replyId
                  return false
                })
                if (!outputSocket) outputSocket = fromSockets.find((entry) => entry.kind === 'output')
                if (!inputSocket || !outputSocket) return null
                const midY = (outputSocket.y + inputSocket.y) / 2
                const path = `M ${outputSocket.x} ${outputSocket.y} C ${outputSocket.x} ${midY}, ${inputSocket.x} ${midY}, ${inputSocket.x} ${inputSocket.y}`
                return (
                  <g key={edge.id}>
                    <path d={path} className="dialog-branch-edge" />
                    {edge.label && edge.label !== 'continue' && edge.label !== 'choices' ? (
                      <text
                        x={(outputSocket.x + inputSocket.x) / 2}
                        y={midY - 4}
                        className="dialog-branch-edge-label"
                      >
                        {edge.label.slice(0, 24)}
                      </text>
                    ) : null}
                  </g>
                )
              })}
            </svg>

            {nodes.map((node) => {
              const { width, height } = nodeDimensions(node.kind)
              const isRoot = node.id === graph.rootNodeId
              const isSelected = node.id === selectedNodeId
              return (
                <div
                  key={node.id}
                  className={`dialog-branch-node dialog-branch-node-${node.kind}${isSelected ? ' is-selected' : ''}${isRoot ? ' is-root' : ''}`}
                  style={{ left: node.x, top: node.y, width, minHeight: height }}
                  onPointerDown={(event) => handlePointerDown(node.id, event)}
                  onClick={() => handleNodeClick(node.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') setSelectedNodeId(node.id)
                  }}
                >
                  <div className="dialog-branch-node-header">
                    <span className="dialog-branch-node-type">{nodeTypeLabel(node)}</span>
                    {isRoot ? <span className="dialog-branch-node-badge">Start</span> : null}
                  </div>
                  <p className="dialog-branch-node-preview">{nodeTitle(node)}</p>
                  {collectNodeSockets(node).map((socket) => renderSocket(socket, node))}
                </div>
              )
            })}
          </div>
        </div>

        <aside className="dialog-branch-inspector panel">{renderInspector()}</aside>
      </div>

      <DialogConversationListEditor
        graph={graph}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
        onChange={patchGraph}
      />
    </div>
  )
}
