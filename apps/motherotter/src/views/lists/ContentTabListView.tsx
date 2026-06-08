import { formatTimestamp } from '../../lib/format'
import { useAdminList } from '../../admin/useAdminList'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import type { AdminColumn, AdminListItem, StubContentType } from '../../admin/types'
import type { TaxonomyDomain } from '../../admin/taxonomyTypes'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { getTaxonomySummaryForEntity } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

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

  const list = useAdminList({ items })

  const columns: AdminColumn[] = [
    { id: 'title', header: 'Title', render: (item) => item.title },
    {
      id: 'categories',
      header: 'Categories',
      render: (item) => getTaxonomySummaryForEntity(domain, item.id).categories,
    },
    {
      id: 'tags',
      header: 'Tags',
      render: (item) => getTaxonomySummaryForEntity(domain, item.id).tags,
    },
    {
      id: 'updated',
      header: 'Last modified',
      render: (item) => formatTimestamp(item.updatedAt),
    },
  ]

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
        onRowClick={(item: AdminListItem) => openEntityEditor(item.id)}
        emptyMessage={`No ${title.toLowerCase()} yet. Click "${addLabel}" to create one.`}
      />
    </AdminListShell>
  )
}
