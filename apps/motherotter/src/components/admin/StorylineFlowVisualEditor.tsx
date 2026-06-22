import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addStorylineGraphNode,
  collectNodeSockets,
  collectStorylineGraphEdges,
  connectStorylineWire,
  findNearestInputSocket,
  nodeDimensions,
  nodeListPreview,
  removeStorylineGraphNode,
  updateStorylineGraphNode,
  type StorylineNodeSocket,
  type StorylineWireSource,
} from '../../admin/storylineGraphUtils'
import {
  nodeTypeLabel,
  type StorylineFlowGraph,
  type StorylineFlowNode,
  type StorylineNodeKind,
} from '../../admin/storylineTypes'
import { useDialogsStore } from '../../store/dialogsStore'
import { useJournalStore } from '../../store/journalStore'
import { useQuestsStore } from '../../store/questsStore'
import { useAnimationsStore } from '../../store/animationsStore'
import { AnimationBindingsEditor } from './AnimationBindingsEditor'
import { StorylineFlowListEditor } from './StorylineFlowListEditor'
import { EMPTY_ANIMATION_BINDINGS } from '../../admin/animationTypes'

interface StorylineFlowVisualEditorProps {
  graph: StorylineFlowGraph
  onChange: (graph: StorylineFlowGraph) => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

export function StorylineFlowVisualEditor({ graph, onChange }: StorylineFlowVisualEditorProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(graph.rootNodeId)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [wireDrag, setWireDrag] = useState<{
    source: StorylineWireSource
    pointer: { x: number; y: number }
  } | null>(null)
  const [hoverInputNodeId, setHoverInputNodeId] = useState<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const didDrag = useRef(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef(graph)
  graphRef.current = graph

  const dialogs = useDialogsStore((state) => state.dialogs)
  const quests = useQuestsStore((state) => state.quests)
  const journalEntries = useJournalStore((state) => state.entries)

  const labelLookup = useMemo(
    () => ({
      dialogNameById: new Map(dialogs.map((entry) => [entry.id, entry.name])),
      questNameById: new Map(quests.map((entry) => [entry.id, entry.name])),
      journalTitleById: new Map(journalEntries.map((entry) => [entry.id, entry.title])),
    }),
    [dialogs, journalEntries, quests],
  )

  const patchGraph = useCallback(
    (next: StorylineFlowGraph) => {
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
    (nodeId: string, patch: Partial<StorylineFlowNode>) => {
      patchGraph(updateStorylineGraphNode(graphRef.current, nodeId, patch))
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
        patchGraph(connectStorylineWire(graphRef.current, activeSource, nearest.nodeId))
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
      const next = removeStorylineGraphNode(graphRef.current, id)
      patchGraph(next)
      setSelectedNodeId(next.rootNodeId)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedNodeId, patchGraph])

  const nodes = useMemo(() => Object.values(graph.nodes), [graph.nodes])
  const edges = useMemo(() => collectStorylineGraphEdges(graph), [graph])
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

  function nodePreview(node: StorylineFlowNode): string {
    return nodeListPreview(node, {
      dialogName:
        node.kind === 'dialog' && node.dialogId
          ? labelLookup.dialogNameById.get(node.dialogId)
          : undefined,
      questName:
        node.kind === 'quest' && node.questId
          ? labelLookup.questNameById.get(node.questId)
          : undefined,
      journalTitle:
        node.kind === 'journal' && node.journalEntryId
          ? labelLookup.journalTitleById.get(node.journalEntryId)
          : undefined,
    })
  }

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

  function addNode(kind: Exclude<StorylineNodeKind, 'start'>) {
    const { graph: next, nodeId } = addStorylineGraphNode(graphRef.current, kind)
    patchGraph(next)
    setSelectedNodeId(nodeId)
  }

  function deleteSelected() {
    if (!selectedNodeId || selectedNodeId === graph.rootNodeId) return
    const next = removeStorylineGraphNode(graphRef.current, selectedNodeId)
    patchGraph(next)
    setSelectedNodeId(next.rootNodeId)
  }

  function startWireDrag(source: StorylineWireSource, event: React.PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    didDrag.current = true
    const pointer = canvasPointerPosition(event)
    setWireDrag({ source, pointer })
  }

  function renderSocket(socket: StorylineNodeSocket, node: StorylineFlowNode) {
    const isInput = socket.kind === 'input'
    const isHoverTarget = isInput && hoverInputNodeId === socket.nodeId
    const isConnected =
      !isInput &&
      node.kind !== 'end' &&
      socket.wireKind === 'continue' &&
      node.continueToNodeId !== null

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

    const source: StorylineWireSource = { kind: 'continue', fromNodeId: node.id }

    return (
      <button
        key={socket.id}
        type="button"
        className={`dialog-branch-socket dialog-branch-socket-output dialog-branch-socket-continue${isConnected ? ' is-connected' : ''}`}
        style={{
          left: `${((socket.x - node.x) / nodeDimensions(node.kind).width) * 100}%`,
          bottom: 0,
        }}
        title="Continue to next step"
        onPointerDown={(event) => startWireDrag(source, event)}
      />
    )
  }

  function wirePreviewPath(): string | null {
    if (!wireDrag) return null
    const source = wireDrag.source
    const fromNode = graph.nodes[source.fromNodeId]
    if (!fromNode) return null
    const fromSocket = collectNodeSockets(fromNode).find((entry) => entry.wireKind === 'continue')
    if (!fromSocket) return null
    const end = wireDrag.pointer
    const midY = (fromSocket.y + end.y) / 2
    return `M ${fromSocket.x} ${fromSocket.y} C ${fromSocket.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`
  }

  function renderContinueSelect(node: StorylineFlowNode & { continueToNodeId: string | null }) {
    return (
      <label className="field">
        <span>Continue to node</span>
        <select
          className="admin-select admin-select-block"
          value={node.continueToNodeId ?? ''}
          onChange={(event) =>
            patchNode(node.id, {
              continueToNodeId: event.target.value.length > 0 ? event.target.value : null,
            })
          }
        >
          <option value="">None</option>
          {nodes
            .filter((entry) => entry.id !== node.id)
            .map((entry) => (
              <option key={entry.id} value={entry.id}>
                {nodeTypeLabel(entry)} · {nodePreview(entry)}
              </option>
            ))}
        </select>
      </label>
    )
  }

  function renderInspector() {
    if (!selectedNode) {
      return <p className="field-hint">Select a node on the canvas to edit hook, dialog, quest, or journal links.</p>
    }

    if (selectedNode.kind === 'start') {
      const node = selectedNode
      return (
        <div className="dialog-node-inspector">
          <h3 className="dialog-node-inspector-title">Start hook</h3>
          <p className="field-hint">The storyline entry point. Only one start node is allowed per flow.</p>
          <label className="field">
            <span>Hook id</span>
            <input
              value={node.hookId}
              onChange={(event) => patchNode(node.id, { hookId: event.target.value })}
              placeholder="storyline-hook-id"
            />
          </label>
          <HookAnimationBindingsPanel hookId={node.hookId.trim()} />
          {renderContinueSelect(node)}
        </div>
      )
    }

    if (selectedNode.kind === 'dialog') {
      const node = selectedNode
      return (
        <div className="dialog-node-inspector">
          <h3 className="dialog-node-inspector-title">Dialog step</h3>
          <label className="field">
            <span>Dialog</span>
            <select
              className="admin-select admin-select-block"
              value={node.dialogId ?? ''}
              onChange={(event) =>
                patchNode(node.id, {
                  dialogId: event.target.value.length > 0 ? event.target.value : null,
                })
              }
            >
              <option value="">Select dialog…</option>
              {dialogs.map((dialog) => (
                <option key={dialog.id} value={dialog.id}>
                  {dialog.name}
                </option>
              ))}
            </select>
          </label>
          {renderContinueSelect(node)}
        </div>
      )
    }

    if (selectedNode.kind === 'quest') {
      const node = selectedNode
      return (
        <div className="dialog-node-inspector">
          <h3 className="dialog-node-inspector-title">Quest step</h3>
          <label className="field">
            <span>Quest</span>
            <select
              className="admin-select admin-select-block"
              value={node.questId ?? ''}
              onChange={(event) =>
                patchNode(node.id, {
                  questId: event.target.value.length > 0 ? event.target.value : null,
                })
              }
            >
              <option value="">Select quest…</option>
              {quests.map((quest) => (
                <option key={quest.id} value={quest.id}>
                  {quest.name}
                </option>
              ))}
            </select>
          </label>
          {renderContinueSelect(node)}
        </div>
      )
    }

    if (selectedNode.kind === 'journal') {
      const node = selectedNode
      return (
        <div className="dialog-node-inspector">
          <h3 className="dialog-node-inspector-title">Journal entry step</h3>
          <label className="field">
            <span>Journal entry</span>
            <select
              className="admin-select admin-select-block"
              value={node.journalEntryId ?? ''}
              onChange={(event) =>
                patchNode(node.id, {
                  journalEntryId: event.target.value.length > 0 ? event.target.value : null,
                })
              }
            >
              <option value="">Select journal entry…</option>
              {journalEntries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title}
                </option>
              ))}
            </select>
          </label>
          {renderContinueSelect(node)}
        </div>
      )
    }

    return (
      <div className="dialog-node-inspector">
        <h3 className="dialog-node-inspector-title">Storyline end</h3>
        <p className="field-hint">Terminal node — no outgoing connections.</p>
      </div>
    )
  }

  return (
    <div className="dialog-branch-editor">
      <div className="dialog-branch-toolbar">
        <button type="button" className="admin-secondary-button" onClick={() => addNode('dialog')}>
          + Dialog
        </button>
        <button type="button" className="admin-secondary-button" onClick={() => addNode('quest')}>
          + Quest
        </button>
        <button type="button" className="admin-secondary-button" onClick={() => addNode('journal')}>
          + Journal
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
                const outputSocket = fromSockets.find((entry) => entry.wireKind === 'continue')
                if (!inputSocket || !outputSocket) return null
                const midY = (outputSocket.y + inputSocket.y) / 2
                const path = `M ${outputSocket.x} ${outputSocket.y} C ${outputSocket.x} ${midY}, ${inputSocket.x} ${midY}, ${inputSocket.x} ${inputSocket.y}`
                return (
                  <g key={edge.id}>
                    <path d={path} className="dialog-branch-edge" />
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
                  <p className="dialog-branch-node-preview">{nodePreview(node)}</p>
                  {collectNodeSockets(node).map((socket) => renderSocket(socket, node))}
                </div>
              )
            })}
          </div>
        </div>

        <aside className="dialog-branch-inspector panel">{renderInspector()}</aside>
      </div>

      <StorylineFlowListEditor
        graph={graph}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
        onChange={patchGraph}
      />
    </div>
  )
}

function HookAnimationBindingsPanel({ hookId }: { hookId: string }) {
  const bindings = useAnimationsStore((state) =>
    hookId
      ? (state.hookBindings[hookId] ?? EMPTY_ANIMATION_BINDINGS)
      : EMPTY_ANIMATION_BINDINGS,
  )
  const setHookBindings = useAnimationsStore((state) => state.setHookBindings)

  if (!hookId) {
    return (
      <p className="field-hint">Set a hook id to attach on_trigger animations for this storyline entry.</p>
    )
  }

  return (
    <AnimationBindingsEditor
      bindings={bindings}
      onChange={(next) => setHookBindings(hookId, next)}
      allowedTriggers={['on_trigger', 'on_event']}
      hint="Animations fire when this storyline hook is triggered in preview or runtime."
    />
  )
}
