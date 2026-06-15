import { useMemo } from 'react'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import { ITEM_TRIGGER_DEFINITIONS, ITEM_TRIGGER_GROUP_LABELS } from '../../admin/itemTypes'
import { READ_ONLY_TABLE_FEATURES } from '../../admin/entityListActions'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
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

  const columns = useMemo<AdminColumn<AdminListItem>[]>(
    () => [
      textColumn('title', 'Trigger', (item) => item.title, { primaryLink: true }),
      categoryColumn('category', 'Group', (item) => item.category, {
        getCategoryOptions: () => Object.values(ITEM_TRIGGER_GROUP_LABELS),
      }),
      textColumn('description', 'Description', (item) => item.subtitle ?? ''),
    ],
    [],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  return (
    <AdminListShell
      title="Triggers"
      description="Fixed trigger events for item effects and mechanics. Triggers cannot be edited."
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable<AdminListItem>
        columns={columns}
        items={listItems}
        table={table}
        features={READ_ONLY_TABLE_FEATURES}
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{ onEdit: (item) => openEntityEditor(item.id), editLabel: 'View' }}
        emptyMessage="No triggers match your filters."
      />
    </AdminListShell>
  )
}
