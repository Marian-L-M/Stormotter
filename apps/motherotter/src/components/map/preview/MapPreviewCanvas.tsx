import { useEffect, useMemo, useRef } from 'react'
import { toWorldView } from '@otter/renderer-api'
import { createDemoRenderer } from '@otter/renderer-demo'
import type { CellEntityAppearance, Renderer } from '@otter/renderer-api'
import type { WorldModel } from '@otter/game-state'
import {
  resolveCharacterCellAppearance,
  resolveEntranceCellAppearance,
  resolveEventCellAppearance,
  resolveItemCellAppearance,
} from '../../../admin/entityAppearanceUtils'
import { mergeDeOttererIcons, buildDeOttererIconLibrary } from '../../../admin/deOttererIconTypes'
import {
  PREVIEW_DUMMY_MAIN_ID,
  buildPreviewRenderCells,
  isWithinWorldBounds,
  type PreviewPosition,
} from '../../../admin/mapPreviewUtils'
import { clampPan } from '../../../admin/mapPreviewViewportUtils'
import { isTilePassable } from '../../../admin/mapTileUtils'
import { parseContentId } from '../../../editorTools'
import { useMediaAssetObjectUrl } from '../../../hooks/useMediaObjectUrl'
import { useCharacterMetaStore } from '../../../store/characterMetaStore'
import { useDeOttererIconsStore } from '../../../store/deOttererIconsStore'
import { useItemsStore } from '../../../store/itemsStore'
import { useMapPreviewStore } from '../../../store/mapPreviewStore'
import { MapPreviewAnimationOverlay } from './MapPreviewAnimationOverlay'

interface MapPreviewCanvasProps {
  world: WorldModel
  currentMapId: string
  activeLayer: string
  mapBackdropMediaId: string | null
  selectedCharacterId: string | null
  positions: Record<string, PreviewPosition>
  placingDummy: boolean
  partyCharacterIds: Set<string>
  onWalkToCell: (target: PreviewPosition) => void
  onInteractAtCell: (target: PreviewPosition) => void
  onPlaceDummy: (position: PreviewPosition) => void
}

export function MapPreviewCanvas({
  world,
  currentMapId,
  activeLayer,
  mapBackdropMediaId,
  selectedCharacterId,
  positions,
  placingDummy,
  partyCharacterIds,
  onWalkToCell,
  onInteractAtCell,
  onPlaceDummy,
}: MapPreviewCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const panSessionRef = useRef<{ pointerId: number; startX: number; startY: number; panX: number; panY: number } | null>(
    null,
  )
  const currentMapIdRef = useRef(currentMapId)
  const worldRef = useRef(world)
  const activeLayerRef = useRef(activeLayer)
  const onWalkToCellRef = useRef(onWalkToCell)
  const onInteractAtCellRef = useRef(onInteractAtCell)
  const onPlaceDummyRef = useRef(onPlaceDummy)

  worldRef.current = world
  activeLayerRef.current = activeLayer
  currentMapIdRef.current = currentMapId
  onWalkToCellRef.current = onWalkToCell
  onInteractAtCellRef.current = onInteractAtCell
  onPlaceDummyRef.current = onPlaceDummy

  const customIcons = useDeOttererIconsStore((state) => state.customIcons)
  const characterMeta = useCharacterMetaStore((state) => state.metaByCharacterId)
  const items = useItemsStore((state) => state.items)
  const backdropUrl = useMediaAssetObjectUrl(mapBackdropMediaId)

  const viewportPan = useMapPreviewStore((state) => state.viewportPan)
  const viewportSize = useMapPreviewStore((state) => state.viewportSize)
  const setViewportPan = useMapPreviewStore((state) => state.setViewportPan)
  const setViewportSize = useMapPreviewStore((state) => state.setViewportSize)
  const setViewportFollowCharacter = useMapPreviewStore((state) => state.setViewportFollowCharacter)

  const iconLibrary = useMemo(
    () => buildDeOttererIconLibrary(mergeDeOttererIcons(customIcons)),
    [customIcons],
  )

  const entityAppearances = useMemo(() => {
    const appearances: Record<string, CellEntityAppearance> = {}
    for (const cell of buildPreviewRenderCells(world, currentMapId, positions, partyCharacterIds)) {
      if (cell.layer !== activeLayer) continue
      const { kind, entityId } = parseContentId(cell.contentId)
      if (kind === 'character') {
        if (entityId === PREVIEW_DUMMY_MAIN_ID) {
          appearances[cell.contentId] = resolveCharacterCellAppearance(
            { glyph: null, iconId: 'stickman', fill: null, stroke: null, strokeWidth: null },
            iconLibrary,
          )
        } else {
          appearances[cell.contentId] = resolveCharacterCellAppearance(
            characterMeta[entityId]?.renderer['de-otterer'],
            iconLibrary,
          )
        }
      } else if (kind === 'item') {
        const item = items.find((entry) => entry.id === entityId)
        appearances[cell.contentId] = resolveItemCellAppearance(item?.renderer['de-otterer'], iconLibrary)
      } else if (kind === 'event') {
        appearances[cell.contentId] = resolveEventCellAppearance(iconLibrary)
      } else if (kind === 'entrance') {
        appearances[cell.contentId] = resolveEntranceCellAppearance(iconLibrary)
      }
    }
    return appearances
  }, [activeLayer, characterMeta, currentMapId, iconLibrary, items, partyCharacterIds, positions, world])

  const selectedCell = useMemo(() => {
    if (!selectedCharacterId) return null
    const pos = positions[selectedCharacterId]
    if (!pos || pos.mapId !== currentMapId || pos.layer !== activeLayer) return null
    return { x: pos.x, y: pos.y }
  }, [activeLayer, currentMapId, positions, selectedCharacterId])

  const previewCells = useMemo(
    () => buildPreviewRenderCells(world, currentMapId, positions, partyCharacterIds),
    [currentMapId, partyCharacterIds, positions, world],
  )

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [setViewportSize])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const renderer = createDemoRenderer()
    renderer.mount(host)
    rendererRef.current = renderer

    const unsubscribe = renderer.onIntent((intent) => {
      const layer = activeLayerRef.current
      const currentWorld = worldRef.current
      if (intent.type !== 'cellClicked' || intent.layer !== layer) return
      if (panSessionRef.current) return

      const target: PreviewPosition = {
        x: intent.x,
        y: intent.y,
        layer: intent.layer,
        mapId: currentMapIdRef.current,
      }
      if (!isWithinWorldBounds(currentWorld, target.x, target.y)) return

      const previewState = useMapPreviewStore.getState()
      if (previewState.placingDummy) {
        if (!isTilePassable(currentWorld, target.x, target.y, target.layer)) return
        onPlaceDummyRef.current(target)
        return
      }

      const characterId = previewState.selectedCharacterId
      if (!characterId) return
      const current = previewState.positions[characterId]
      if (!current || current.mapId !== currentMapIdRef.current) return

      if (current.x === target.x && current.y === target.y) {
        onInteractAtCellRef.current(target)
        return
      }

      onWalkToCellRef.current(target)
    })

    return () => {
      unsubscribe()
      renderer.dispose()
      rendererRef.current = null
    }
  }, [activeLayer])

  useEffect(() => {
    if (!rendererRef.current) return
    const baseView = toWorldView(world, {
      activeLayer,
      selectedCell,
      iconLibrary,
      entityAppearances,
    })
    rendererRef.current.render({
      ...baseView,
      cells: previewCells,
    })
  }, [world, activeLayer, selectedCell, iconLibrary, entityAppearances, previewCells])

  function clampCurrentPan(pan: { x: number; y: number }) {
    return clampPan(pan, viewportSize.width, viewportSize.height, world.width, world.height)
  }

  function beginPan(event: React.PointerEvent<HTMLDivElement>) {
    const isMiddleButton = event.button === 1
    const isShiftLeft = event.button === 0 && event.shiftKey
    if (!isMiddleButton && !isShiftLeft) return

    event.preventDefault()
    setViewportFollowCharacter(false)
    panSessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: viewportPan.x,
      panY: viewportPan.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function movePan(event: React.PointerEvent<HTMLDivElement>) {
    const session = panSessionRef.current
    if (!session || session.pointerId !== event.pointerId) return
    event.preventDefault()
    const dx = event.clientX - session.startX
    const dy = event.clientY - session.startY
    setViewportPan(
      clampCurrentPan({
        x: session.panX - dx,
        y: session.panY - dy,
      }),
    )
  }

  function endPan(event: React.PointerEvent<HTMLDivElement>) {
    const session = panSessionRef.current
    if (!session || session.pointerId !== event.pointerId) return
    panSessionRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      className={`map-preview-canvas-shell${placingDummy ? ' is-placing-dummy' : ''}`}
      onDragOver={(event) => {
        if (!placingDummy) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(event) => {
        if (!placingDummy) return
        event.preventDefault()
        const target = document.elementFromPoint(event.clientX, event.clientY)
        const cellButton = target?.closest('.otter-demo-cell') as HTMLElement | null
        if (!cellButton) return
        const x = Number(cellButton.dataset.x)
        const y = Number(cellButton.dataset.y)
        if (!Number.isFinite(x) || !Number.isFinite(y)) return
        const dropTarget: PreviewPosition = { x, y, layer: activeLayer, mapId: currentMapId }
        if (!isTilePassable(world, dropTarget.x, dropTarget.y, dropTarget.layer)) return
        onPlaceDummy(dropTarget)
      }}
    >
      {backdropUrl ? (
        <img src={backdropUrl} alt="" className="map-canvas-backdrop" aria-hidden="true" />
      ) : null}
      <div
        ref={viewportRef}
        className="map-preview-viewport"
        onPointerDown={beginPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <div
          className="map-preview-viewport-inner"
          style={{ transform: `translate(${-viewportPan.x}px, ${-viewportPan.y}px)` }}
        >
          <div ref={hostRef} className="renderer-host map-preview-renderer-host" />
          <MapPreviewAnimationOverlay />
        </div>
      </div>
      {placingDummy ? (
        <div className="map-preview-placement-hint">Click a passable cell to place the dummy main character</div>
      ) : null}
    </div>
  )
}
