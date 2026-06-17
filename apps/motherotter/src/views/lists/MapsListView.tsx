import { useMemo } from 'react'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import { READ_ONLY_TABLE_FEATURES } from '../../admin/entityListActions'
import {
  getMapRenderEngineLabel,
  MAP_RENDER_ENGINES,
} from '../../admin/renderEngineTypes'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useEditorStore } from '../../store/editorStore'

export function MapsListView() {
  const maps = useEditorStore((state) => state.maps)
  const lastSavedAt = useEditorStore((state) => state.lastSavedAt)
  const mapRenderEngine = useEditorStore((state) => state.mapRenderEngine)
  const enabledMapRenderEngines = useEditorStore((state) => state.enabledMapRenderEngines)
  const setMapRenderEngine = useEditorStore((state) => state.setMapRenderEngine)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const addMap = useEditorStore((state) => state.addMap)

  const engineTabs = MAP_RENDER_ENGINES.filter((engine) =>
    enabledMapRenderEngines.includes(engine.id),
  )

  const items = useMemo<AdminListItem[]>(
    () =>
      maps.map((map) => ({
        id: map.id,
        title: map.title,
        category: map.world.layers.length > 1 ? 'Multi-layer' : 'Single layer',
        updatedAt: lastSavedAt ?? new Date().toISOString(),
        subtitle: `${map.world.width}×${map.world.height} · ${map.world.cells.size} cells · ${map.world.tiles.size} tiles`,
      })),
    [maps, lastSavedAt],
  )

  const columns = useMemo<AdminColumn<AdminListItem>[]>(
    () => [
      textColumn('title', 'Map', (item) => item.title, { primaryLink: true }),
      categoryColumn('category', 'Type', (item) => item.category, {
        getCategoryOptions: () => ['Single layer', 'Multi-layer'],
      }),
      textColumn('size', 'Size', (item) => item.subtitle ?? '—'),
      textColumn('updated', 'Last modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [],
  )

  const { table } = useAdminListTable({ items, columns })

  return (
    <AdminListShell
      title="Maps"
      description={`Maps for ${getMapRenderEngineLabel(mapRenderEngine)}. Open a map to place tiles and entities.`}
      addLabel="Add Map"
      onAdd={() => addMap()}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <div className="map-render-engine-tabs" role="tablist" aria-label="Render engines">
        {engineTabs.map((engine) => (
          <button
            key={engine.id}
            type="button"
            role="tab"
            aria-selected={engine.id === mapRenderEngine}
            className={`map-render-engine-tab${engine.id === mapRenderEngine ? ' is-active' : ''}`}
            onClick={() => setMapRenderEngine(engine.id)}
          >
            {engine.label}
          </button>
        ))}
      </div>

      <AdminListTable
        columns={columns}
        items={items}
        table={table}
        features={READ_ONLY_TABLE_FEATURES}
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{ onEdit: (item) => openEntityEditor(item.id) }}
      />
    </AdminListShell>
  )
}
