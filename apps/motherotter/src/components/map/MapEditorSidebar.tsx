import { useMemo } from 'react'
import { isAutoProvisionedSlotContainer } from '../../views/lists/ContainersListView'
import { getMapToolMeta } from '../../editorTools'
import {
  characterSupportsMapLocations,
  isUniqueNpcCharacter,
  normalizeCharacterCategory,
} from '../../admin/characterTypes'
import { mergeDeOttererIcons } from '../../admin/deOttererIconTypes'
import { parseCoordKey } from '../../admin/mapTileUtils'
import { uniqueCharacterHasFixedPlacement } from '../../admin/mapCharacterPlacementUtils'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useCharacterMetaStore } from '../../store/characterMetaStore'
import { useContainersStore } from '../../store/containersStore'
import { useDeOttererIconsStore } from '../../store/deOttererIconsStore'
import { useEditorStore } from '../../store/editorStore'
import { useItemsStore } from '../../store/itemsStore'
import { MapCellInspector } from './MapCellInspector'
import { MapCellStatusToolPanel } from './MapCellStatusToolPanel'
import { MapEntranceToolPanel } from './MapEntranceToolPanel'
import { MapEntitySearchPicker } from './MapEntitySearchPicker'
import { MapSpawnPointToolPanel } from './MapSpawnPointToolPanel'
import { MapToolGlyph } from './MapToolGlyph'

export function MapEditorSidebar() {
  const world = useEditorStore((state) => state.world)
  const activeLayer = useEditorStore((state) => state.activeLayer)
  const mapToolKind = useEditorStore((state) => state.mapToolKind)
  const mapPlacementEntityId = useEditorStore((state) => state.mapPlacementEntityId)
  const entranceDraft = useEditorStore((state) => state.entranceDraft)
  const selectedMapCellKey = useEditorStore((state) => state.selectedMapCellKey)
  const selectedTileKeys = useEditorStore((state) => state.selectedTileKeys)
  const mapEditorNotice = useEditorStore((state) => state.mapEditorNotice)
  const setMapPlacementEntityId = useEditorStore((state) => state.setMapPlacementEntityId)
  const setEntranceDraft = useEditorStore((state) => state.setEntranceDraft)
  const setActiveLayer = useEditorStore((state) => state.setActiveLayer)
  const clearMapSelection = useEditorStore((state) => state.clearMapSelection)
  const customIcons = useDeOttererIconsStore((state) => state.customIcons)

  const characters = useContentCatalogStore((state) => state.stubs.characters)
  const characterMeta = useCharacterMetaStore((state) => state.metaByCharacterId)
  const items = useItemsStore((state) => state.items)
  const containers = useContainersStore((state) => state.containers)

  const selectedCell = selectedMapCellKey ? world.cells.get(selectedMapCellKey) : null
  const activeLayerCells = [...world.cells.values()].filter((cell) => cell.layer === activeLayer).length
  const activeTool = getMapToolMeta(mapToolKind)
  const iconOptions = useMemo(() => mergeDeOttererIcons(customIcons), [customIcons])

  const characterOptions = useMemo(
    () =>
      characters
        .filter((character) => {
          const type = normalizeCharacterCategory(
            characterMeta[character.id]?.characterType ?? character.category,
          )
          return characterSupportsMapLocations(type)
        })
        .map((character) => {
          const type = normalizeCharacterCategory(
            characterMeta[character.id]?.characterType ?? character.category,
          )
          const fixedOnMap =
            isUniqueNpcCharacter(type) && uniqueCharacterHasFixedPlacement(world, character.id)
          return {
            id: character.id,
            name: character.title,
            subtitle: fixedOnMap
              ? `${character.category} · Fixed on map`
              : character.category,
          }
        }),
    [characters, characterMeta, world],
  )

  const itemOptions = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        subtitle: item.scope === 'unique' ? 'Unique item' : 'Generic template',
      })),
    [items],
  )

  const containerOptions = useMemo(
    () =>
      containers
        .filter((container) => !isAutoProvisionedSlotContainer(container))
        .map((container) => ({
          id: container.id,
          name: container.name,
          subtitle: container.kind,
        })),
    [containers],
  )

  const hasSelection = Boolean(selectedCell) || selectedTileKeys.length > 0

  return (
    <aside className="map-editor-toolbar" aria-label="Map editor sidebar">
      {mapEditorNotice ? (
        <p className="map-editor-notice" role="status">
          {mapEditorNotice}
        </p>
      ) : null}

      {selectedCell ? (
        <MapCellInspector cell={selectedCell} />
      ) : (
        <section className="map-editor-toolbar-section map-editor-toolbar-tool-panel">
          <h2 className="map-editor-toolbar-heading">{activeTool.label}</h2>
          <div className="map-editor-tool-panel-preview">
            <MapToolGlyph kind={mapToolKind} className="map-editor-tool-panel-glyph" size={22} />
            <div>
              <p className="map-editor-tool-panel-description">
                {mapToolKind === 'select'
                  ? 'Click a placed object to select it. While selected, its icon follows your cursor — click an empty cell to move it.'
                  : mapToolKind === 'entrance'
                  ? 'Place entrances that link to a cell on this or another map.'
                  : mapToolKind === 'spawn-point'
                    ? 'Place conditional spawn points for characters, items, containers, or entrances.'
                    : mapToolKind === 'event'
                      ? 'Place event markers on empty cells. Each marker gets a unique event id.'
                      : mapToolKind === 'cell-status'
                        ? 'Select cells to set passability and tile decoration. Ctrl+click toggles; Shift+click selects a rectangle.'
                        : `Select a ${activeTool.label.toLowerCase()} to place on empty cells.`}
              </p>
            </div>
          </div>

          {mapToolKind === 'character' ? (
            <MapEntitySearchPicker
              label="Character"
              options={characterOptions}
              value={mapPlacementEntityId}
              onChange={setMapPlacementEntityId}
              placeholder="Search characters…"
              emptyMessage="No characters match your search."
            />
          ) : null}

          {mapToolKind === 'item' ? (
            <MapEntitySearchPicker
              label="Item"
              options={itemOptions}
              value={mapPlacementEntityId}
              onChange={setMapPlacementEntityId}
              placeholder="Search items…"
              emptyMessage="No items match your search."
            />
          ) : null}

          {mapToolKind === 'container' ? (
            <MapEntitySearchPicker
              label="Container"
              options={containerOptions}
              value={mapPlacementEntityId}
              onChange={setMapPlacementEntityId}
              placeholder="Search containers…"
              emptyMessage="No containers match your search."
            />
          ) : null}

          {mapToolKind === 'entrance' ? (
            <MapEntranceToolPanel draft={entranceDraft} onChange={setEntranceDraft} />
          ) : null}

          {mapToolKind === 'spawn-point' ? (
            <MapSpawnPointToolPanel
              characterOptions={characterOptions}
              itemOptions={itemOptions}
              containerOptions={containerOptions}
            />
          ) : null}

          {mapToolKind === 'cell-status' ? (
            <MapCellStatusToolPanel iconOptions={iconOptions} />
          ) : null}

          {mapToolKind !== 'cell-status' && mapToolKind !== 'select' ? (
            <p className="field-hint map-editor-tool-panel-hint">
              Click an empty cell to place.
            </p>
          ) : null}

          {mapToolKind === 'select' ? (
            <p className="field-hint map-editor-tool-panel-hint">
              Enter or Esc cancel repositioning. Delete or Backspace removes the selected object.
            </p>
          ) : null}
        </section>
      )}

      <section className="map-editor-toolbar-section">
        <h2 className="map-editor-toolbar-heading">Active layer</h2>
        <div className="map-editor-layer-tabs" role="tablist" aria-label="Map layers">
          {world.layers.map((layer) => (
            <button
              key={layer}
              type="button"
              role="tab"
              aria-selected={layer === activeLayer}
              className={`map-editor-layer-tab${layer === activeLayer ? ' is-active' : ''}`}
              onClick={() => setActiveLayer(layer)}
            >
              {layer}
            </button>
          ))}
        </div>
        <p className="field-hint map-editor-layer-hint">
          Placements apply to the active layer only.
        </p>
      </section>

      <section className="map-editor-toolbar-section map-editor-toolbar-stats">
        <h2 className="map-editor-toolbar-heading">Grid</h2>
        <dl className="map-editor-stats-list">
          <div>
            <dt>Size</dt>
            <dd>
              {world.width}×{world.height}
            </dd>
          </div>
          <div>
            <dt>Cells on layer</dt>
            <dd>{activeLayerCells}</dd>
          </div>
          <div>
            <dt>Total cells</dt>
            <dd>{world.cells.size}</dd>
          </div>
          {selectedMapCellKey ? (
            <div>
              <dt>Selected cell</dt>
              <dd>{selectedMapCellKey.replace(/,\d+$/, '').replace(',', ', ')}</dd>
            </div>
          ) : null}
          {selectedTileKeys.length > 0 ? (
            <div>
              <dt>Selected tiles</dt>
              <dd>{selectedTileKeys.length}</dd>
            </div>
          ) : null}
          {hasSelection ? (
            <div className="map-editor-release-selection">
              <button type="button" className="admin-secondary-button" onClick={clearMapSelection}>
                Release selection
              </button>
              <span className="field-hint">Enter or Esc</span>
            </div>
          ) : null}
        </dl>
        {selectedTileKeys.length > 0 && selectedTileKeys.length <= 6 ? (
          <ul className="map-editor-selected-tiles">
            {selectedTileKeys.map((key) => {
              const { x, y } = parseCoordKey(key)
              return (
                <li key={key}>
                  x{x + 1}, y{y + 1}
                </li>
              )
            })}
          </ul>
        ) : null}
      </section>
    </aside>
  )
}
