import { useMemo, useState } from 'react'
import type { Cell } from '@otter/game-state'
import {
  formatEntranceTarget,
  getCellContentKind,
  getCellEntityId,
} from '../../admin/mapCellUtils'
import { formatMapCellReference } from '../../admin/characterLocationTypes'
import { characterSupportsMapLocations, isUniqueNpcCharacter } from '../../admin/characterTypes'
import { formatCellCoordinate } from '../../admin/mapLayerUtils'
import { useMediaAssetObjectUrl } from '../../hooks/useMediaObjectUrl'
import { CharacterMapSettingsPanel } from '../admin/CharacterMapSettingsPanel'
import { useCharacterMetaStore } from '../../store/characterMetaStore'
import { useContainersStore } from '../../store/containersStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useEditorStore } from '../../store/editorStore'
import { useItemsStore } from '../../store/itemsStore'
import { useMediaLibraryStore } from '../../store/mediaLibraryStore'
import { MapEntranceInspector } from './MapEntranceToolPanel'
import { MapEntityDetailModal } from './MapEntityDetailModal'
import { MapToolGlyph } from './MapToolGlyph'

interface MapCellInspectorProps {
  cell: Cell
}

export function MapCellInspector({ cell }: MapCellInspectorProps) {
  const kind = getCellContentKind(cell)
  const entityId = getCellEntityId(cell)
  const removeSelectedMapCell = useEditorStore((state) => state.removeSelectedMapCell)
  const removeCharacterGridPlacement = useEditorStore((state) => state.removeCharacterGridPlacement)
  const updateSelectedCellEntranceTarget = useEditorStore((state) => state.updateSelectedCellEntranceTarget)
  const updateMeta = useCharacterMetaStore((state) => state.updateMeta)
  const markDirty = useEditorStore((state) => state.markDirty)

  const characters = useContentCatalogStore((state) => state.stubs.characters)
  const characterMeta = useCharacterMetaStore((state) => state.metaByCharacterId)
  const items = useItemsStore((state) => state.items)
  const containers = useContainersStore((state) => state.containers)
  const mediaAssets = useMediaLibraryStore((state) => state.assets)

  const clearSelectedMapCell = useEditorStore((state) => state.clearSelectedMapCell)
  const mapId = useEditorStore((state) => state.mapId)
  const world = useEditorStore((state) => state.world)

  const characterMetaEntry = kind === 'character' ? characterMeta[entityId] : undefined
  const supportsMapLocations =
    kind === 'character' && characterMetaEntry
      ? characterSupportsMapLocations(characterMetaEntry.characterType)
      : false

  const summary = useMemo(() => {
    if (kind === 'character') {
      const character = characters.find((entry) => entry.id === entityId)
      const meta = characterMeta[entityId]
      return {
        name: character?.title ?? entityId,
        description: meta?.summary ?? 'No summary yet.',
        mediaId: meta?.portraitMediaId ?? null,
        canOpenDetails: Boolean(character),
      }
    }
    if (kind === 'item') {
      const item = items.find((entry) => entry.id === entityId)
      return {
        name: item?.name ?? entityId,
        description: item?.description || item?.tooltipText || 'No description yet.',
        mediaId: item?.iconMediaId ?? item?.detailMediaId ?? null,
        canOpenDetails: Boolean(item),
      }
    }
    if (kind === 'container') {
      const container = containers.find((entry) => entry.id === entityId)
      return {
        name: container?.name ?? entityId,
        description: container?.description || 'No description yet.',
        mediaId: null,
        canOpenDetails: Boolean(container),
      }
    }
    if (kind === 'entrance') {
      return {
        name: 'Entrance',
        description: cell.entranceTarget
          ? `Leads to ${formatEntranceTarget(cell.entranceTarget)}`
          : 'No destination configured.',
        mediaId: null,
        canOpenDetails: false,
      }
    }
    if (kind === 'spawn' && cell.spawnPoint) {
      const targetLabel =
        cell.spawnPoint.entityKind === 'entrance' && cell.spawnPoint.entranceTarget
          ? formatEntranceTarget(cell.spawnPoint.entranceTarget)
          : cell.spawnPoint.entityId
      return {
        name: `Spawn point (${cell.spawnPoint.entityKind})`,
        description: cell.spawnPoint.conditions
          ? `Conditional spawn → ${targetLabel}`
          : `Always spawn → ${targetLabel}`,
        mediaId: null,
        canOpenDetails: false,
      }
    }
    if (kind === 'event') {
      return {
        name: 'Event marker',
        description: 'Map event trigger placement.',
        mediaId: null,
        canOpenDetails: false,
      }
    }
    return {
      name: cell.contentId,
      description: 'Unknown placement type.',
      mediaId: null,
      canOpenDetails: false,
    }
  }, [kind, entityId, characters, characterMeta, items, containers, cell.contentId, cell.entranceTarget])

  const [detailOpen, setDetailOpen] = useState(false)

  const mediaAsset = summary.mediaId
    ? mediaAssets.find((asset) => asset.id === summary.mediaId)
    : undefined
  const mediaUrl = useMediaAssetObjectUrl(summary.mediaId)

  return (
    <>
      <section className="map-editor-toolbar-section map-cell-inspector">
        <div className="map-cell-inspector-header">
          <MapToolGlyph
            kind={kind === 'spawn' ? 'spawn-point' : kind === 'unknown' ? 'character' : kind}
            className="map-editor-tool-panel-glyph"
            size={22}
          />
          <div>
            <h2 className="map-editor-toolbar-heading">{summary.name}</h2>
            <p className="field-hint">
              {formatCellCoordinate(cell.x, cell.y)} · {cell.layer}
            </p>
          </div>
        </div>

        <p className="field-hint map-cell-inspector-selection-hint">
          Repositioning — icon follows your cursor. Click an empty cell to place. Enter or Esc cancel.
          Delete or Backspace removes this object.
        </p>

        {mediaAsset && mediaUrl && mediaAsset.kind === 'image' ? (
          <img src={mediaUrl} alt="" className="map-cell-inspector-portrait" />
        ) : (
          <div className="map-cell-inspector-portrait map-cell-inspector-portrait-placeholder">
            <MapToolGlyph
              kind={kind === 'spawn' ? 'spawn-point' : kind === 'unknown' ? 'character' : kind}
              className="map-editor-tool-panel-glyph"
              size={28}
            />
          </div>
        )}

        <p className="map-cell-inspector-description">{summary.description}</p>

        {kind === 'character' && characterMetaEntry ? (
          <ul className="map-cell-inspector-flags field-hint">
            {characterMetaEntry.isMain ? <li>Main character</li> : null}
            {characterMetaEntry.isInGroup ? <li>In group</li> : null}
            {characterMetaEntry.isGroupAddable ? <li>Group addable</li> : null}
            {characterMetaEntry.activeLocation ? (
              <li>Active: {formatMapCellReference(characterMetaEntry.activeLocation)}</li>
            ) : null}
          </ul>
        ) : null}

        <p className="field-hint map-cell-inspector-meta">
          Content id: <code>{cell.contentId}</code>
        </p>

        {kind === 'entrance' ? (
          <MapEntranceInspector
            target={
              cell.entranceTarget ?? {
                mapId,
                x: 0,
                y: 0,
                layer: world.layers[0] ?? 'ground',
              }
            }
            onChange={updateSelectedCellEntranceTarget}
          />
        ) : null}

        {supportsMapLocations && characterMetaEntry ? (
          <CharacterMapSettingsPanel
            characterId={entityId}
            characterType={characterMetaEntry.characterType}
            activeLocation={characterMetaEntry.activeLocation}
            spawnLocationRules={characterMetaEntry.spawnLocationRules}
            despawnLocationRules={characterMetaEntry.despawnLocationRules}
            currentCell={{ mapId, x: cell.x, y: cell.y, layer: cell.layer }}
            onChange={(patch) => {
              updateMeta(entityId, patch)
              markDirty()
            }}
            onClearActiveLocation={() => {
              if (isUniqueNpcCharacter(characterMetaEntry.characterType)) {
                removeCharacterGridPlacement(entityId)
              }
            }}
          />
        ) : null}

        <div className="map-cell-inspector-actions">
          {summary.canOpenDetails ? (
            <button type="button" className="admin-secondary-button" onClick={() => setDetailOpen(true)}>
              Open details
            </button>
          ) : null}
          <button type="button" className="admin-danger-button" onClick={removeSelectedMapCell}>
            Remove from grid
          </button>
          <button type="button" className="admin-secondary-button" onClick={clearSelectedMapCell}>
            Release selection
          </button>
        </div>
      </section>

      {summary.canOpenDetails && kind !== 'entrance' && kind !== 'spawn' && kind !== 'unknown' ? (
        <MapEntityDetailModal
          open={detailOpen}
          kind={kind}
          entityId={entityId}
          onClose={() => setDetailOpen(false)}
        />
      ) : null}
    </>
  )
}
