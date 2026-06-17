import { useEffect, useMemo, useRef } from 'react'
import { toWorldView } from '@otter/renderer-api'
import { createDemoRenderer } from '@otter/renderer-demo'
import type { CellEntityAppearance, Renderer } from '@otter/renderer-api'
import {
  resolveCharacterCellAppearance,
  resolveEntranceCellAppearance,
  resolveEventCellAppearance,
  resolveItemCellAppearance,
  resolvePlacedCellAppearance,
} from '../admin/entityAppearanceUtils'
import { mergeDeOttererIcons, buildDeOttererIconLibrary } from '../admin/deOttererIconTypes'
import { parseCoordKey } from '../admin/mapTileUtils'
import { parseContentId } from '../editorTools'
import { useMediaAssetObjectUrl } from '../hooks/useMediaObjectUrl'
import { useCharacterMetaStore } from '../store/characterMetaStore'
import { useDeOttererIconsStore } from '../store/deOttererIconsStore'
import { useEditorStore } from '../store/editorStore'
import { useItemsStore } from '../store/itemsStore'
import { MapSelectionCursorGhost } from './map/MapSelectionCursorGhost'

export function MapCanvas() {
  const hostRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const world = useEditorStore((state) => state.world)
  const activeLayer = useEditorStore((state) => state.activeLayer)
  const selectedMapCellKey = useEditorStore((state) => state.selectedMapCellKey)
  const selectedTileKeys = useEditorStore((state) => state.selectedTileKeys)
  const mapToolKind = useEditorStore((state) => state.mapToolKind)
  const mapBackdropMediaId = useEditorStore((state) => state.mapBackdropMediaId)
  const applyMapGridClick = useEditorStore((state) => state.applyMapGridClick)
  const customIcons = useDeOttererIconsStore((state) => state.customIcons)
  const characterMeta = useCharacterMetaStore((state) => state.metaByCharacterId)
  const items = useItemsStore((state) => state.items)
  const backdropUrl = useMediaAssetObjectUrl(mapBackdropMediaId)

  const iconLibrary = useMemo(
    () => buildDeOttererIconLibrary(mergeDeOttererIcons(customIcons)),
    [customIcons],
  )

  const entityAppearances = useMemo(() => {
    const appearances: Record<string, CellEntityAppearance> = {}
    for (const cell of world.cells.values()) {
      if (cell.layer !== activeLayer) continue
      const { kind, entityId } = parseContentId(cell.contentId)
      if (kind === 'character') {
        appearances[cell.contentId] = resolveCharacterCellAppearance(
          characterMeta[entityId]?.renderer['de-otterer'],
          iconLibrary,
        )
      } else if (kind === 'item') {
        const item = items.find((entry) => entry.id === entityId)
        appearances[cell.contentId] = resolveItemCellAppearance(
          item?.renderer['de-otterer'],
          iconLibrary,
        )
      } else if (kind === 'event') {
        appearances[cell.contentId] = resolveEventCellAppearance(iconLibrary)
      } else if (kind === 'entrance') {
        appearances[cell.contentId] = resolveEntranceCellAppearance(iconLibrary)
      }
    }
    return appearances
  }, [activeLayer, characterMeta, iconLibrary, items, world.cells])

  const isSelectRepositioning = mapToolKind === 'select' && Boolean(selectedMapCellKey)

  const selectedCellAppearance = useMemo(() => {
    if (!isSelectRepositioning || !selectedMapCellKey) return null
    const cell = world.cells.get(selectedMapCellKey)
    if (!cell) return null
    return resolvePlacedCellAppearance(cell.contentId, entityAppearances)
  }, [entityAppearances, isSelectRepositioning, selectedMapCellKey, world.cells])

  const hideEntityAt = (() => {
    if (!isSelectRepositioning || !selectedMapCellKey) return null
    const cell = world.cells.get(selectedMapCellKey)
    if (!cell || cell.layer !== activeLayer) return null
    return { x: cell.x, y: cell.y }
  })()

  const selectedCell = (() => {
    if (!isSelectRepositioning || !selectedMapCellKey) return null
    const cell = world.cells.get(selectedMapCellKey)
    if (!cell || cell.layer !== activeLayer) return null
    return { x: cell.x, y: cell.y }
  })()

  const selectedCells = useMemo(() => {
    if (mapToolKind !== 'cell-status' && selectedTileKeys.length === 0) return []
    return selectedTileKeys
      .filter((key) => parseCoordKey(key).layer === activeLayer)
      .map((key) => {
        const { x, y } = parseCoordKey(key)
        return { x, y }
      })
  }, [activeLayer, mapToolKind, selectedTileKeys])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const renderer = createDemoRenderer()
    renderer.mount(host)
    rendererRef.current = renderer

    const unsubscribe = renderer.onIntent((intent) => {
      if (intent.type === 'cellClicked') {
        applyMapGridClick(intent.x, intent.y, intent.layer, {
          ctrlKey: intent.ctrlKey,
          shiftKey: intent.shiftKey,
        })
      }
    })

    return () => {
      unsubscribe()
      renderer.dispose()
      rendererRef.current = null
    }
  }, [applyMapGridClick])

  useEffect(() => {
    if (!rendererRef.current) return
    rendererRef.current.render(
      toWorldView(world, {
        activeLayer,
        selectedCell,
        selectedCells,
        iconLibrary,
        entityAppearances,
        hideEntityAt,
      }),
    )
  }, [world, activeLayer, selectedCell, selectedCells, iconLibrary, entityAppearances, hideEntityAt])

  return (
    <div className={`map-canvas-shell map-canvas-shell-fill${isSelectRepositioning ? ' is-repositioning' : ''}`}>
      {backdropUrl ? (
        <img src={backdropUrl} alt="" className="map-canvas-backdrop" aria-hidden="true" />
      ) : null}
      <div ref={hostRef} className="renderer-host map-renderer-host-fill" />
      <MapSelectionCursorGhost active={isSelectRepositioning} appearance={selectedCellAppearance} />
    </div>
  )
}
