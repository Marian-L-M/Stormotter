import { useMemo } from 'react'
import { formatTimestamp } from '../../lib/format'
import { useAdminList } from '../../admin/useAdminList'
import type { AdminListItem } from '../../admin/types'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import type { AdminColumn } from '../../admin/types'
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

  const list = useAdminList({
    items,
    categories: ['Single layer', 'Multi-layer'],
  })

  const columns: AdminColumn[] = [
    { id: 'title', header: 'Map', render: (item) => item.title },
    { id: 'category', header: 'Type', render: (item) => item.category },
    {
      id: 'size',
      header: 'Size',
      render: (item) => item.subtitle ?? '—',
    },
    {
      id: 'updated',
      header: 'Last modified',
      render: (item) => formatTimestamp(item.updatedAt),
    },
  ]

  return (
    <AdminListShell
      title="Maps"
      description="All maps in the active project. Open a map to place tiles and entities."
      addLabel="Add Map"
      onAdd={() => openEntityEditor(mapId)}
      filters={
        <AdminFilterBar
          search={list.search}
          onSearchChange={list.setSearch}
          category={list.category}
          onCategoryChange={list.setCategory}
          categoryOptions={list.categoryOptions}
          resultCount={list.totalItems}
        />
      }
      pagination={
        <AdminPagination page={list.page} totalPages={list.totalPages} onPageChange={list.setPage} />
      }
    >
      <AdminDataTable
        columns={columns}
        items={list.pageItems}
        onRowClick={(item) => openEntityEditor(item.id)}
      />
    </AdminListShell>
  )
}
