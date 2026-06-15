import { useMemo } from 'react'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import { READ_ONLY_TABLE_FEATURES } from '../../admin/entityListActions'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useEditorStore } from '../../store/editorStore'

export function MapsListView() {
  const mapId = useEditorStore((state) => state.mapId)
  const title = useEditorStore((state) => state.title)
  const world = useEditorStore((state) => state.world)
  const lastSavedAt = useEditorStore((state) => state.lastSavedAt)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const items = useMemo<AdminListItem[]>(
    () => [
      {
        id: mapId,
        title: `${title} — ${mapId}`,
        category: world.layers.length > 1 ? 'Multi-layer' : 'Single layer',
        updatedAt: lastSavedAt ?? new Date().toISOString(),
        subtitle: `${world.width}×${world.height} · ${world.cells.size} cells`,
      },
    ],
    [mapId, title, world, lastSavedAt],
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
      description="All maps in the active project. Open a map to place tiles and entities."
      addLabel="Add Map"
      onAdd={() => openEntityEditor(mapId)}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
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
