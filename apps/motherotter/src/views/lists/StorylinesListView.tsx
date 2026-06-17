import { useMemo } from 'react'
import { textColumn } from '../../admin/adminColumnHelpers'
import {
  deleteStorylineRecord,
  duplicateStorylineRecord,
} from '../../admin/entityListActions'
import type { AdminColumn } from '../../admin/types'
import { summarizeStorylineFlow, type StorylineListItem } from '../../admin/storylineTypes'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useEditorStore } from '../../store/editorStore'
import { useStorylinesStore } from '../../store/storylinesStore'

export function StorylinesListView() {
  const storylines = useStorylinesStore((state) => state.storylines)
  const addStoryline = useStorylinesStore((state) => state.addStoryline)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<StorylineListItem[]>(
    () =>
      storylines.map((storyline) => ({
        id: storyline.id,
        title: storyline.name,
        category: 'Storyline',
        updatedAt: storyline.updatedAt,
        subtitle: storyline.summary || summarizeStorylineFlow(storyline.flow),
        storyline,
      })),
    [storylines],
  )

  const columns = useMemo<AdminColumn<StorylineListItem>[]>(
    () => [
      textColumn('title', 'Name', (item) => item.title, { primaryLink: true }),
      textColumn('flow', 'Flow', (item) => summarizeStorylineFlow(item.storyline.flow)),
      textColumn('updated', 'Modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  return (
    <AdminListShell
      title="Storylines"
      description="Visual narrative flows connecting dialogs, quests, and journal entries."
      addLabel="Add storyline"
      onAdd={() => openEntityEditor(addStoryline())}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable<StorylineListItem>
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="storyline"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => deleteStorylineRecord(item.id),
          onDuplicate: (item) => openEntityEditor(duplicateStorylineRecord(item.storyline)),
        }}
        emptyMessage="No storylines yet."
      />
    </AdminListShell>
  )
}
