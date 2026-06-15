import { useMemo } from 'react'
import { textColumn } from '../../admin/adminColumnHelpers'
import {
  deleteStubRecord,
  duplicateStubRecord,
} from '../../admin/entityListActions'
import type { AdminColumn, AdminListItem, StubContentType } from '../../admin/types'
import type { TaxonomyDomain } from '../../admin/taxonomyTypes'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useEditorStore } from '../../store/editorStore'
import { getTaxonomySummaryForEntity } from '../../store/taxonomyStore'

interface ContentTabListViewProps {
  type: StubContentType
  title: string
  description: string
  addLabel: string
}

function stubTypeToDomain(type: StubContentType): TaxonomyDomain {
  return type === 'characters' ? 'characters' : type
}

export function ContentTabListView({ type, title, description, addLabel }: ContentTabListViewProps) {
  const items = useContentCatalogStore((state) => state.stubs[type])
  const addItem = useContentCatalogStore((state) => state.addItem)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const domain = stubTypeToDomain(type)

  const columns = useMemo<AdminColumn<AdminListItem>[]>(
    () => [
      textColumn('title', 'Title', (item) => item.title, { primaryLink: true }),
      textColumn('categories', 'Categories', (item) =>
        getTaxonomySummaryForEntity(domain, item.id).categories,
      ),
      textColumn('tags', 'Tags', (item) => getTaxonomySummaryForEntity(domain, item.id).tags),
      textColumn('updated', 'Last modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [domain],
  )

  const { table } = useAdminListTable({ items, columns })

  function handleAdd() {
    const id = addItem(type)
    openEntityEditor(id)
  }

  return (
    <AdminListShell
      title={title}
      description={description}
      addLabel={addLabel}
      onAdd={handleAdd}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable
        columns={columns}
        items={items}
        table={table}
        entityLabel={title.toLowerCase().replace(/s$/, '')}
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => deleteStubRecord(type, item.id),
          onDuplicate: (item) => {
            const newId = duplicateStubRecord(type, item.id)
            openEntityEditor(newId)
          },
        }}
        emptyMessage={`No ${title.toLowerCase()} yet. Click "${addLabel}" to create one.`}
      />
    </AdminListShell>
  )
}
