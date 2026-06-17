import { useEffect, useState } from 'react'
import {
  countCellsOnLayer,
  MAX_LAYER_COUNT,
  normalizeLayerName,
  suggestLayerName,
} from '../../admin/mapLayerUtils'
import { AdminConfirmModal } from '../admin/AdminModal'
import { useEditorStore } from '../../store/editorStore'

interface PendingLayerRemoval {
  layer: string
  cellCount: number
}

export function MapLayersPanel() {
  const world = useEditorStore((state) => state.world)
  const addWorldLayer = useEditorStore((state) => state.addWorldLayer)
  const renameWorldLayer = useEditorStore((state) => state.renameWorldLayer)
  const removeWorldLayer = useEditorStore((state) => state.removeWorldLayer)
  const moveWorldLayer = useEditorStore((state) => state.moveWorldLayer)

  const [newLayerName, setNewLayerName] = useState('')
  const [draftNames, setDraftNames] = useState<Record<string, string>>({})
  const [pendingRemoval, setPendingRemoval] = useState<PendingLayerRemoval | null>(null)

  useEffect(() => {
    setDraftNames(Object.fromEntries(world.layers.map((layer) => [layer, layer])))
  }, [world.layers])

  function handleAddLayer() {
    const name = normalizeLayerName(newLayerName) || suggestLayerName(world.layers)
    if (addWorldLayer(name)) {
      setNewLayerName('')
    }
  }

  function commitLayerRename(layer: string) {
    const draft = draftNames[layer] ?? layer
    const next = normalizeLayerName(draft)
    if (!next || next === layer) {
      setDraftNames((current) => ({ ...current, [layer]: layer }))
      return
    }
    if (renameWorldLayer(layer, next)) {
      setDraftNames((current) => {
        const { [layer]: _removed, ...rest } = current
        return { ...rest, [next]: next }
      })
    } else {
      setDraftNames((current) => ({ ...current, [layer]: layer }))
    }
  }

  function requestRemoveLayer(layer: string) {
    if (world.layers.length <= 1) return
    const cellCount = countCellsOnLayer(world, layer)
    if (cellCount === 0) {
      removeWorldLayer(layer)
      return
    }
    setPendingRemoval({ layer, cellCount })
  }

  function confirmRemoveLayer() {
    if (!pendingRemoval) return
    removeWorldLayer(pendingRemoval.layer)
    setPendingRemoval(null)
  }

  const atLayerLimit = world.layers.length >= MAX_LAYER_COUNT

  return (
    <>
      <fieldset className="admin-fieldset">
        <legend>Layers</legend>
        <p className="field-hint">
          Add and name map layers for stacking content. At least one layer is required ({world.layers.length}/
          {MAX_LAYER_COUNT}).
        </p>

        <ul className="map-editor-layer-list">
          {world.layers.map((layer, index) => (
            <li key={layer} className="map-editor-layer-row">
              <div className="map-editor-layer-order">
                <button
                  type="button"
                  className="admin-icon-button"
                  disabled={index === 0}
                  aria-label={`Move ${layer} up`}
                  onClick={() => moveWorldLayer(layer, 'up')}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="admin-icon-button"
                  disabled={index === world.layers.length - 1}
                  aria-label={`Move ${layer} down`}
                  onClick={() => moveWorldLayer(layer, 'down')}
                >
                  ↓
                </button>
              </div>
              <input
                value={draftNames[layer] ?? layer}
                onChange={(event) =>
                  setDraftNames((current) => ({ ...current, [layer]: event.target.value }))
                }
                onBlur={() => commitLayerRename(layer)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur()
                  }
                }}
                aria-label={`Layer name for ${layer}`}
              />
              <span className="field-hint map-editor-layer-count">
                {countCellsOnLayer(world, layer)} items
              </span>
              <button
                type="button"
                className="admin-text-button admin-danger-text"
                disabled={world.layers.length <= 1}
                onClick={() => requestRemoveLayer(layer)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div className="admin-taxonomy-add-row">
          <input
            value={newLayerName}
            placeholder={suggestLayerName(world.layers)}
            disabled={atLayerLimit}
            onChange={(event) => setNewLayerName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleAddLayer()
              }
            }}
          />
          <button
            type="button"
            className="admin-secondary-button"
            disabled={atLayerLimit}
            onClick={handleAddLayer}
          >
            Add layer
          </button>
        </div>
      </fieldset>

      <AdminConfirmModal
        open={pendingRemoval !== null}
        title="Remove layer and its items?"
        tone="danger"
        confirmLabel="Remove layer"
        cancelLabel="Cancel"
        onConfirm={confirmRemoveLayer}
        onCancel={() => setPendingRemoval(null)}
        message={
          pendingRemoval ? (
            <p>
              Removing layer <strong>{pendingRemoval.layer}</strong> will delete{' '}
              <strong>{pendingRemoval.cellCount}</strong>{' '}
              {pendingRemoval.cellCount === 1 ? 'placed item' : 'placed items'} on that layer.
            </p>
          ) : null
        }
      />
    </>
  )
}
