import { useMemo } from 'react'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import { deleteJournalEntryRecord, duplicateJournalEntryRecord } from '../../admin/entityListActions'
import type { AdminColumn } from '../../admin/types'
import {
  getJournalCategory,
  summarizeJournalDisplayConditions,
  summarizeJournalEntry,
  type JournalCategoryListItem,
  type JournalEntryListItem,
} from '../../admin/journalTypes'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useEditorStore } from '../../store/editorStore'
import { useJournalStore } from '../../store/journalStore'
import { useQuestsStore } from '../../store/questsStore'

export function JournalEntriesListView() {
  const entries = useJournalStore((state) => state.entries)
  const categories = useJournalStore((state) => state.categories)
  const quests = useQuestsStore((state) => state.quests)
  const addEntry = useJournalStore((state) => state.addEntry)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<JournalEntryListItem[]>(
    () =>
      entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        category: getJournalCategory(entry.categoryId, categories)?.name ?? 'Uncategorized',
        updatedAt: entry.updatedAt,
        subtitle: summarizeJournalEntry(entry),
        entry,
      })),
    [categories, entries],
  )

  const columns = useMemo<AdminColumn<JournalEntryListItem>[]>(
    () => [
      textColumn('title', 'Title', (item) => item.title, { primaryLink: true }),
      categoryColumn('category', 'Category', (item) => item.category),
      textColumn('preview', 'Preview', (item) => summarizeJournalEntry(item.entry)),
      textColumn('quest', 'Quest', (item) => {
        if (!item.entry.linkedQuestId) return '—'
        return quests.find((quest) => quest.id === item.entry.linkedQuestId)?.name ?? item.entry.linkedQuestId
      }),
      textColumn('visibility', 'State visibility', (item) =>
        summarizeJournalDisplayConditions(item.entry),
      ),
      textColumn('updated', 'Modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [quests],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  return (
    <AdminListShell
      title="Journal"
      description="Player-facing journal entries linked to quests, state visibility, and storylines."
      addLabel="Add entry"
      onAdd={() => openEntityEditor(addEntry())}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable<JournalEntryListItem>
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="entry"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => deleteJournalEntryRecord(item.id),
          onDuplicate: (item) => openEntityEditor(duplicateJournalEntryRecord(item.entry)),
        }}
        emptyMessage="No journal entries yet."
      />
    </AdminListShell>
  )
}

export function JournalCategoriesListView() {
  const categories = useJournalStore((state) => state.categories)
  const entries = useJournalStore((state) => state.entries)
  const addCategory = useJournalStore((state) => state.addCategory)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<JournalCategoryListItem[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        title: category.name,
        category: 'Journal category',
        updatedAt: category.updatedAt,
        subtitle: category.description,
        categoryEntity: category,
        entryCount: entries.filter((entry) => entry.categoryId === category.id).length,
      })),
    [categories, entries],
  )

  const columns = useMemo<AdminColumn<JournalCategoryListItem>[]>(
    () => [
      textColumn('title', 'Name', (item) => item.title, { primaryLink: true }),
      textColumn('entries', 'Entries', (item) => String(item.entryCount)),
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
      title="Journal categories"
      addLabel="Add category"
      onAdd={() => openEntityEditor(addCategory())}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable<JournalCategoryListItem>
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="category"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{ onEdit: (item) => openEntityEditor(item.id) }}
        emptyMessage="No categories yet."
      />
    </AdminListShell>
  )
}
