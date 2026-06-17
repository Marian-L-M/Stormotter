import { useMemo } from 'react'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import {
  deleteQuestRecord,
  duplicateQuestRecord,
} from '../../admin/entityListActions'
import type { AdminColumn } from '../../admin/types'
import {
  getQuestCategory,
  summarizeQuestObjectives,
  summarizeQuestTrigger,
  type QuestCategoryListItem,
  type QuestListItem,
} from '../../admin/questTypes'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useEditorStore } from '../../store/editorStore'
import { useQuestsStore } from '../../store/questsStore'

export function QuestsListView() {
  const quests = useQuestsStore((state) => state.quests)
  const categories = useQuestsStore((state) => state.categories)
  const addQuest = useQuestsStore((state) => state.addQuest)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<QuestListItem[]>(
    () =>
      quests.map((quest) => ({
        id: quest.id,
        title: quest.name,
        category: getQuestCategory(quest.categoryId, categories)?.name ?? 'Uncategorized',
        updatedAt: quest.updatedAt,
        subtitle: quest.summary || summarizeQuestObjectives(quest),
        quest,
      })),
    [categories, quests],
  )

  const columns = useMemo<AdminColumn<QuestListItem>[]>(
    () => [
      textColumn('title', 'Name', (item) => item.title, { primaryLink: true }),
      categoryColumn('category', 'Category', (item) => item.category),
      textColumn('trigger', 'Trigger', (item) => summarizeQuestTrigger(item.quest.trigger)),
      textColumn('objectives', 'Objectives', (item) => summarizeQuestObjectives(item.quest)),
      textColumn('rewards', 'Rewards', (item) => `${item.quest.rewards.length} reward(s)`),
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
      title="Quests"
      description="Quest definitions with triggers, stacked objectives, rewards, and completion chains."
      addLabel="Add Quest"
      onAdd={() => openEntityEditor(addQuest())}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable<QuestListItem>
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="quest"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => deleteQuestRecord(item.id),
          onDuplicate: (item) => openEntityEditor(duplicateQuestRecord(item.quest)),
        }}
        emptyMessage="No quests match your filters."
      />
    </AdminListShell>
  )
}

export function QuestCategoriesListView() {
  const categories = useQuestsStore((state) => state.categories)
  const quests = useQuestsStore((state) => state.quests)
  const addCategory = useQuestsStore((state) => state.addCategory)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<QuestCategoryListItem[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        title: category.name,
        category: 'Quest category',
        updatedAt: category.updatedAt,
        subtitle: category.description,
        categoryEntity: category,
        questCount: quests.filter((quest) => quest.categoryId === category.id).length,
      })),
    [categories, quests],
  )

  const columns = useMemo<AdminColumn<QuestCategoryListItem>[]>(
    () => [
      textColumn('title', 'Name', (item) => item.title, { primaryLink: true }),
      textColumn('quests', 'Quests', (item) => String(item.questCount)),
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
      title="Quest categories"
      description="Organize main quest lines, side content, and repeatable tasks."
      addLabel="Add category"
      onAdd={() => openEntityEditor(addCategory())}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable<QuestCategoryListItem>
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
