import { useRef, useState } from 'react'
import type { AbilityDefinition } from '../../admin/abilityTypes'
import { reorderAbilityPriorityIds } from '../../admin/aiProfileTypes'
import { AbilityPickerField } from './AbilityPickerField'

interface AiAbilityPriorityEditorProps {
  abilityPriorityIds: string[]
  definitions: AbilityDefinition[]
  onChange: (abilityPriorityIds: string[]) => void
}

export function AiAbilityPriorityEditor({
  abilityPriorityIds,
  definitions,
  onChange,
}: AiAbilityPriorityEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const dragIndexRef = useRef<number | null>(null)
  const dropIndexRef = useRef<number | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const definitionById = new Map(definitions.map((entry) => [entry.id, entry]))
  const orderedIds = abilityPriorityIds.filter((id) => definitionById.has(id))

  function handleReorder(fromIndex: number, toIndex: number) {
    onChange(reorderAbilityPriorityIds(orderedIds, fromIndex, toIndex))
  }

  function handleAssign(definitionId: string) {
    if (orderedIds.includes(definitionId)) return
    onChange([...orderedIds, definitionId])
  }

  function handleRemove(definitionId: string) {
    onChange(orderedIds.filter((id) => id !== definitionId))
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>Use ability if available</legend>
      <p className="field-hint admin-attribute-hint">
        Drag to set priority — the AI tries each ability top-to-bottom when abilities are used in
        combat.
      </p>

      <AbilityPickerField
        definitions={definitions}
        assignedIds={orderedIds}
        onAssign={handleAssign}
        placeholder="Search abilities to add…"
      />

      <ul ref={listRef} className="dialog-conversation-list-blocks ai-ability-priority-list">
        {orderedIds.length === 0 ? (
          <li className="field-hint">No abilities in priority list yet.</li>
        ) : (
          orderedIds.map((definitionId, index) => {
            const definition = definitionById.get(definitionId)
            if (!definition) return null
            const isDragging = dragIndex === index
            const showDropBefore = dropIndex === index && dragIndex !== null && dragIndex !== index

            return (
              <li
                key={definitionId}
                className={`dialog-conversation-list-item${isDragging ? ' is-dragging' : ''}${showDropBefore ? ' is-drop-target' : ''}`}
              >
                <button
                  type="button"
                  className="dialog-conversation-list-drag"
                  aria-label={`Reorder ability ${index + 1}`}
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
                      let nextDrop = orderedIds.length - 1
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
                <div className="dialog-conversation-list-body ai-ability-priority-body">
                  <span className="dialog-conversation-list-index">{index + 1}</span>
                  <span className="dialog-conversation-list-text">{definition.name}</span>
                </div>
                <button
                  type="button"
                  className="admin-secondary-button admin-secondary-button-sm"
                  onClick={() => handleRemove(definitionId)}
                >
                  Remove
                </button>
              </li>
            )
          })
        )}
      </ul>
    </fieldset>
  )
}
