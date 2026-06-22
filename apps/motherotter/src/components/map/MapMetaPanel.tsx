import { useEffect, useState } from 'react'
import {
  clampWorldDimensions,
  cellsOutsideBounds,
  countCellsOutsideBounds,
  formatCellCoordinate,
} from '../../admin/mapWorldUtils'
import { AdminConfirmModal } from '../admin/AdminModal'
import { MapLayersPanel } from './MapLayersPanel'
import { MediaPickerField } from '../media/MediaPickerField'
import { useEditorStore } from '../../store/editorStore'

interface PendingResize {
  width: number
  height: number
  removedCount: number
}

export function MapMetaPanel() {
  const mapId = useEditorStore((state) => state.mapId)
  const mapTitle = useEditorStore(
    (state) => state.maps.find((map) => map.id === state.mapId)?.title ?? 'Untitled map',
  )
  const gameId = useEditorStore((state) => state.gameId)
  const world = useEditorStore((state) => state.world)
  const mapBackdropMediaId = useEditorStore((state) => state.mapBackdropMediaId)
  const mapRestZone = useEditorStore(
    (state) => state.maps.find((map) => map.id === state.mapId)?.restZone ?? 'none',
  )
  const setMapTitle = useEditorStore((state) => state.setMapTitle)
  const setMapRestZone = useEditorStore((state) => state.setMapRestZone)
  const setMapBackdropMediaId = useEditorStore((state) => state.setMapBackdropMediaId)
  const setWorldDimensions = useEditorStore((state) => state.setWorldDimensions)
  const markDirty = useEditorStore((state) => state.markDirty)

  const [draftWidth, setDraftWidth] = useState(String(world.width))
  const [draftHeight, setDraftHeight] = useState(String(world.height))
  const [pendingResize, setPendingResize] = useState<PendingResize | null>(null)

  useEffect(() => {
    setDraftWidth(String(world.width))
    setDraftHeight(String(world.height))
  }, [world.width, world.height])

  function applyDimensions(width: number, height: number) {
    const next = clampWorldDimensions(width, height)
    if (next.width === world.width && next.height === world.height) {
      setDraftWidth(String(next.width))
      setDraftHeight(String(next.height))
      return
    }

    const removedCount = countCellsOutsideBounds(world, next.width, next.height)
    if (removedCount === 0) {
      setWorldDimensions(next.width, next.height)
      markDirty()
      setDraftWidth(String(next.width))
      setDraftHeight(String(next.height))
      return
    }

    setPendingResize({ width: next.width, height: next.height, removedCount })
  }

  function commitDimensionField(field: 'width' | 'height') {
    const raw = field === 'width' ? draftWidth : draftHeight
    const value = Number(raw)
    if (!Number.isFinite(value)) {
      setDraftWidth(String(world.width))
      setDraftHeight(String(world.height))
      return
    }

    applyDimensions(
      field === 'width' ? value : world.width,
      field === 'height' ? value : world.height,
    )
  }

  function handleConfirmResize() {
    if (!pendingResize) return
    setWorldDimensions(pendingResize.width, pendingResize.height)
    markDirty()
    setDraftWidth(String(pendingResize.width))
    setDraftHeight(String(pendingResize.height))
    setPendingResize(null)
  }

  function handleCancelResize() {
    setDraftWidth(String(world.width))
    setDraftHeight(String(world.height))
    setPendingResize(null)
  }

  const previewRemoved =
    pendingResize === null
      ? []
      : cellsOutsideBounds(world, pendingResize.width, pendingResize.height).slice(0, 8)

  return (
    <>
      <div className="map-editor-meta-panel">
        <div className="map-editor-meta-content">
          <p className="map-editor-meta-lead">
            Map metadata is stored with the project. Grid dimensions and backdrop apply to the canvas in
            the Grid tab. Placed items are kept when the grid grows; shrinking prompts before anything
            is removed.
          </p>

          <fieldset className="admin-fieldset">
            <legend>Identity</legend>
            <label className="field">
              <span>Map title</span>
              <input
                value={mapTitle}
                onChange={(event) => {
                  setMapTitle(event.target.value)
                  markDirty()
                }}
              />
            </label>
            <label className="field">
              <span>Map id</span>
              <input value={mapId} readOnly />
              <span className="field-hint">Stable identifier used in exports and game state.</span>
            </label>
            <label className="field">
              <span>Game id</span>
              <input value={gameId} readOnly />
            </label>
            <label className="field">
              <span>Rest zone</span>
              <select
                className="admin-select admin-select-block"
                value={mapRestZone}
                onChange={(event) => {
                  setMapRestZone(event.target.value as typeof mapRestZone)
                  markDirty()
                }}
              >
                <option value="none">None — rest forbidden</option>
                <option value="inn">Inn — safe rest</option>
                <option value="inside">Inside — safe rest</option>
                <option value="outside">Outside — unsafe rest roll</option>
              </select>
              <span className="field-hint">
                Controls whether party members can rest during map preview and in Gameotter.
              </span>
            </label>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend>Backdrop</legend>
            <MediaPickerField
              label="Map backdrop"
              value={mapBackdropMediaId}
              onChange={(mediaId) => {
                setMapBackdropMediaId(mediaId)
                markDirty()
              }}
              filter="image"
              hint="Optional background image shown behind the grid canvas."
              modalTitle="Select map backdrop"
            />
          </fieldset>

          <MapLayersPanel />

          <fieldset className="admin-fieldset">
            <legend>Grid dimensions</legend>
            <div className="map-editor-dimension-grid">
              <label className="field">
                <span>Width</span>
                <input
                  type="number"
                  min={1}
                  max={256}
                  value={draftWidth}
                  onChange={(event) => setDraftWidth(event.target.value)}
                  onBlur={() => commitDimensionField('width')}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur()
                    }
                  }}
                />
              </label>
              <label className="field">
                <span>Height</span>
                <input
                  type="number"
                  min={1}
                  max={256}
                  value={draftHeight}
                  onChange={(event) => setDraftHeight(event.target.value)}
                  onBlur={() => commitDimensionField('height')}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.currentTarget.blur()
                    }
                  }}
                />
              </label>
            </div>
            <p className="field-hint">
              Expanding the grid keeps all placed items. Shrinking below existing placements asks for
              confirmation before removing out-of-bounds cells. Grid coordinates are shown from x1 and y1
              on the canvas.
            </p>
          </fieldset>
        </div>
      </div>

      <AdminConfirmModal
        open={pendingResize !== null}
        title="Remove out-of-bounds items?"
        tone="danger"
        confirmLabel="Resize and remove"
        cancelLabel="Keep current size"
        onConfirm={handleConfirmResize}
        onCancel={handleCancelResize}
        message={
          pendingResize ? (
            <>
              <p>
                Resizing to {pendingResize.width}×{pendingResize.height} will remove{' '}
                <strong>{pendingResize.removedCount}</strong>{' '}
                {pendingResize.removedCount === 1 ? 'placed item' : 'placed items'} outside the new
                bounds.
              </p>
              {previewRemoved.length > 0 ? (
                <>
                  <p className="field-hint">Examples:</p>
                  <ul className="map-editor-resize-preview-list">
                    {previewRemoved.map((cell) => (
                      <li key={`${cell.x},${cell.y},${cell.layer}`}>
                        ({formatCellCoordinate(cell.x, cell.y)}) · {cell.layer} · {cell.contentId}
                      </li>
                    ))}
                    {pendingResize.removedCount > previewRemoved.length ? (
                      <li className="field-hint">
                        …and {pendingResize.removedCount - previewRemoved.length} more
                      </li>
                    ) : null}
                  </ul>
                </>
              ) : null}
            </>
          ) : null
        }
      />
    </>
  )
}
