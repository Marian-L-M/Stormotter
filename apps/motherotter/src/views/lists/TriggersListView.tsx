import { useMemo } from 'react'
import { ITEM_TRIGGER_DEFINITIONS, ITEM_TRIGGER_GROUP_LABELS } from '../../admin/itemTypes'
import { useAdminList } from '../../admin/useAdminList'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { useEditorStore } from '../../store/editorStore'

export function TriggersListView() {
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<AdminListItem[]>(
    () =>
      ITEM_TRIGGER_DEFINITIONS.map((trigger) => ({
        id: trigger.id,
        title: trigger.label,
        category: ITEM_TRIGGER_GROUP_LABELS[trigger.group],
        updatedAt: '',
        subtitle: trigger.description,
      })),
    [],
  )

  const list = useAdminList({
    items: listItems,
    categories: Object.values(ITEM_TRIGGER_GROUP_LABELS),
  })

  const columns: AdminColumn<AdminListItem>[] = [
    { id: 'title', header: 'Trigger', render: (item) => item.title },
    { id: 'category', header: 'Group', render: (item) => item.category },
    {
      id: 'description',
      header: 'Description',
      render: (item) => item.subtitle ?? '',
    },
  ]

  return (
    <AdminListShell
      title="Triggers"
      description="Fixed trigger events for item effects and mechanics. Triggers cannot be edited."
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
      <AdminDataTable<AdminListItem>
        columns={columns}
        items={list.pageItems}
        onRowClick={(item) => openEntityEditor(item.id)}
        emptyMessage="No triggers match your filters."
      />
    </AdminListShell>
  )
}
