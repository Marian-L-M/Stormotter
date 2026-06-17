import { useMemo } from 'react'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import {
  deleteDialogRecord,
  duplicateDialogRecord,
} from '../../admin/entityListActions'
import type { AdminColumn } from '../../admin/types'
import {
  getDialogCategory,
  summarizeConversationGraph,
  summarizeDialogTrigger,
  type DialogCategoryListItem,
  type DialogListItem,
} from '../../admin/dialogTypes'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useDialogsStore } from '../../store/dialogsStore'
import { useEditorStore } from '../../store/editorStore'

export function DialogsListView() {
  const dialogs = useDialogsStore((state) => state.dialogs)
  const categories = useDialogsStore((state) => state.categories)
  const addDialog = useDialogsStore((state) => state.addDialog)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const characters = useContentCatalogStore((state) => state.stubs.characters)

  const listItems = useMemo<DialogListItem[]>(
    () =>
      dialogs.map((dialog) => ({
        id: dialog.id,
        title: dialog.name,
        category: getDialogCategory(dialog.categoryId, categories)?.name ?? 'Uncategorized',
        updatedAt: dialog.updatedAt,
        subtitle: dialog.summary || summarizeConversationGraph(dialog.conversation),
        dialog,
      })),
    [categories, dialogs],
  )

  const columns = useMemo<AdminColumn<DialogListItem>[]>(
    () => [
      textColumn('title', 'Name', (item) => item.title, { primaryLink: true }),
      categoryColumn('category', 'Category', (item) => item.category),
      textColumn('character', 'Character', (item) => {
        if (!item.dialog.characterId) return '—'
        const character = characters.find((entry) => entry.id === item.dialog.characterId)
        return character?.title ?? item.dialog.characterId
      }),
      textColumn('trigger', 'Trigger', (item) => summarizeDialogTrigger(item.dialog.trigger)),
      textColumn('tree', 'Conversation', (item) =>
        summarizeConversationGraph(item.dialog.conversation),
      ),
      textColumn('updated', 'Modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [characters],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  function handleAdd() {
    openEntityEditor(addDialog())
  }

  return (
    <AdminListShell
      title="Dialogs"
      description="Baldur's Gate-style branching conversations with triggers, player replies, and state-driven branches."
      addLabel="Add Dialog"
      onAdd={handleAdd}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable<DialogListItem>
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="dialog"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => deleteDialogRecord(item.id),
          onDuplicate: (item) => {
            const newId = duplicateDialogRecord(item.dialog)
            openEntityEditor(newId)
          },
        }}
        emptyMessage="No dialogs match your filters."
      />
    </AdminListShell>
  )
}

export function DialogCategoriesListView() {
  const categories = useDialogsStore((state) => state.categories)
  const dialogs = useDialogsStore((state) => state.dialogs)
  const addCategory = useDialogsStore((state) => state.addCategory)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<DialogCategoryListItem[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        title: category.name,
        category: 'Dialog category',
        updatedAt: category.updatedAt,
        subtitle: category.description,
        categoryEntity: category,
        dialogCount: dialogs.filter((dialog) => dialog.categoryId === category.id).length,
      })),
    [categories, dialogs],
  )

  const columns = useMemo<AdminColumn<DialogCategoryListItem>[]>(
    () => [
      textColumn('title', 'Name', (item) => item.title, { primaryLink: true }),
      textColumn('dialogs', 'Dialogs', (item) => String(item.dialogCount)),
      textColumn('description', 'Description', (item) => item.categoryEntity.description || '—'),
      textColumn('updated', 'Modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  function handleAdd() {
    openEntityEditor(addCategory())
  }

  return (
    <AdminListShell
      title="Dialog categories"
      description="Organize conversations into quest lines, ambient chatter, cutscenes, and more."
      addLabel="Add category"
      onAdd={handleAdd}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable<DialogCategoryListItem>
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="category"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
        }}
        emptyMessage="No dialog categories yet."
      />
    </AdminListShell>
  )
}
