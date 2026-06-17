import { useRef, useState } from 'react'
import {
  conversationNodeListPreview,
  nodeTypeLabel,
  reorderGraphList,
} from '../../admin/dialogGraphUtils'
import type { DialogConversationGraph, DialogConversationNode } from '../../admin/dialogTypes'

interface DialogConversationListEditorProps {
  graph: DialogConversationGraph
  selectedNodeId: string | null
  onSelectNode: (nodeId: string) => void
  onChange: (graph: DialogConversationGraph) => void
}

export function DialogConversationListEditor({
  graph,
  selectedNodeId,
  onSelectNode,
  onChange,
}: DialogConversationListEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const dragIndexRef = useRef<number | null>(null)
  const dropIndexRef = useRef<number | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const orderedNodes = graph.listOrder
    .map((id) => graph.nodes[id])
    .filter((node): node is DialogConversationNode => Boolean(node))

  function handleReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return
    onChange(reorderGraphList(graph, fromIndex, toIndex))
  }

  return (
    <section className="dialog-conversation-list">
      <div className="dialog-conversation-list-header">
        <h3 className="dialog-conversation-list-title">Script list</h3>
        <span className="field-hint">Drag to reorder · click to edit in the panel</span>
      </div>
      <ul ref={listRef} className="dialog-conversation-list-blocks">
        {orderedNodes.length === 0 ? (
          <li className="field-hint">No conversation blocks yet.</li>
        ) : (
          orderedNodes.map((node, index) => {
            const isSelected = node.id === selectedNodeId
            const isDragging = dragIndex === index
            const showDropBefore = dropIndex === index && dragIndex !== null && dragIndex !== index
            return (
              <li
                key={node.id}
                className={`dialog-conversation-list-item${isSelected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}${showDropBefore ? ' is-drop-target' : ''}`}
              >
                <button
                  type="button"
                  className="dialog-conversation-list-drag"
                  aria-label={`Reorder block ${index + 1}`}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    dragIndexRef.current = index
                    dropIndexRef.current = index
                    setDragIndex(index)
                    setDropIndex(index)
                    const listEl = listRef.current
                    if (!listEl) return

                    function onPointerMove(moveEvent: PointerEvent) {
                      const items = listEl!.querySelectorAll('.dialog-conversation-list-item')
                      let nextDrop = orderedNodes.length - 1
                      for (let i = 0; i < items.length; i++) {
                        const rect = items[i]!.getBoundingClientRect()
                        const midY = rect.top + rect.height / 2
                        if (moveEvent.clientY < midY) {
                          nextDrop = i
                          break
                        }
                      }
                      dropIndexRef.current = nextDrop
                      setDropIndex(nextDrop)
                    }

                    function onPointerUp() {
                      window.removeEventListener('pointermove', onPointerMove)
                      window.removeEventListener('pointerup', onPointerUp)
                      window.removeEventListener('pointercancel', onPointerUp)
                      const from = dragIndexRef.current
                      const to = dropIndexRef.current
                      dragIndexRef.current = null
                      dropIndexRef.current = null
                      setDragIndex(null)
                      setDropIndex(null)
                      if (from !== null && to !== null) handleReorder(from, to)
                    }

                    window.addEventListener('pointermove', onPointerMove)
                    window.addEventListener('pointerup', onPointerUp)
                    window.addEventListener('pointercancel', onPointerUp)
                  }}
                >
                  ⋮⋮
                </button>
                <button
                  type="button"
                  className="dialog-conversation-list-body"
                  onClick={() => onSelectNode(node.id)}
                >
                  <span className="dialog-conversation-list-index">{index + 1}</span>
                  <span className={`dialog-conversation-list-kind dialog-branch-node-${node.kind}`}>
                    {nodeTypeLabel(node)}
                  </span>
                  <span className="dialog-conversation-list-text">
                    {conversationNodeListPreview(node)}
                  </span>
                </button>
              </li>
            )
          })
        )}
      </ul>
    </section>
  )
}
