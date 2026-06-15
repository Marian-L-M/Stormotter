import { useMemo } from 'react'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import {
  READ_ONLY_TABLE_FEATURES,
  deleteItemRecord,
  duplicateItemRecord,
} from '../../admin/entityListActions'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import {
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABELS,
  ITEM_CLASSES,
  ITEM_SCOPE_LABELS,
  getItemClass,
  summarizeItemEffects,
  summarizeItemRequirements,
  type ItemListItem,
} from '../../admin/itemTypes'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useContainersStore } from '../../store/containersStore'
import { useEditorStore } from '../../store/editorStore'
import { useItemsStore } from '../../store/itemsStore'

type ItemCategoryListItem = AdminListItem & { classCount: number }

export function ItemsListView() {
  const items = useItemsStore((state) => state.items)
  const containers = useContainersStore((state) => state.containers)
  const addItem = useItemsStore((state) => state.addItem)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const containerNameById = useMemo(
    () => new Map(containers.map((entry) => [entry.id, entry.name])),
    [containers],
  )

  const listItems = useMemo<ItemListItem[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        title: item.name,
        category: ITEM_CATEGORY_LABELS[item.categoryId],
        updatedAt: item.updatedAt,
        subtitle: getItemClass(item.classId)?.name,
        item,
      })),
    [items],
  )

  const columns = useMemo<AdminColumn<ItemListItem>[]>(
    () => [
      textColumn('title', 'Name', (item) => item.title, { primaryLink: true }),
      categoryColumn('scope', 'Scope', (item) => ITEM_SCOPE_LABELS[item.item.scope]),
      categoryColumn('category', 'Category', (item) => item.category),
      textColumn('class', 'Class', (item) => getItemClass(item.item.classId)?.name ?? '—'),
      textColumn('container', 'Container', (item) =>
        item.item.scope === 'unique'
          ? containerNameById.get(item.item.containerId ?? '') ?? 'Unassigned'
          : '—',
      ),
      textColumn('requirements', 'Requirements', (item) =>
        summarizeItemRequirements(item.item.requirements),
      ),
      textColumn('effects', 'Effects', (item) => summarizeItemEffects(item.item.effects)),
      textColumn('updated', 'Modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [containerNameById],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  function handleAdd() {
    openEntityEditor(addItem())
  }

  return (
    <AdminListShell
      title="Items"
      description="Inventory objects, equipment, consumables, and pickup definitions."
      addLabel="Add Item"
      onAdd={handleAdd}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable<ItemListItem>
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="item"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => deleteItemRecord(item.id),
          onDuplicate: (item) => {
            const newId = duplicateItemRecord(item.item)
            openEntityEditor(newId)
          },
        }}
        emptyMessage="No items match your filters."
      />
    </AdminListShell>
  )
}

export function ItemCategoriesListView() {
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<ItemCategoryListItem[]>(
    () =>
      ITEM_CATEGORIES.map((category) => ({
        id: category.id,
        title: category.name,
        category: category.equipSlot ?? 'Non-equippable',
        updatedAt: '',
        subtitle: category.description,
        classCount: ITEM_CLASSES.filter((entry) => entry.categoryId === category.id).length,
      })),
    [],
  )

  const columns = useMemo<AdminColumn<ItemCategoryListItem>[]>(
    () => [
      textColumn('title', 'Category', (item) => item.title, { primaryLink: true }),
      categoryColumn('slot', 'Equip slot', (item) => item.category),
      textColumn('classes', 'Classes', (item) => String(item.classCount), {
        sortValue: (item) => item.classCount,
      }),
      textColumn('description', 'Description', (item) => item.subtitle ?? ''),
    ],
    [],
  )

  const { table } = useAdminListTable({ items: listItems, columns, pageSize: 50 })

  return (
    <AdminListShell
      title="Item Categories"
      description="Fixed item categories used to classify all items. Categories cannot be edited."
    >
      <AdminListTable<ItemCategoryListItem>
        columns={columns}
        items={listItems}
        table={table}
        features={READ_ONLY_TABLE_FEATURES}
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{ onEdit: (item) => openEntityEditor(item.id), editLabel: 'View' }}
        emptyMessage="No categories found."
      />
    </AdminListShell>
  )
}

export function ItemClassesListView() {
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<AdminListItem[]>(
    () =>
      ITEM_CLASSES.map((itemClass) => ({
        id: itemClass.id,
        title: itemClass.name,
        category: ITEM_CATEGORY_LABELS[itemClass.categoryId],
        updatedAt: '',
        subtitle: itemClass.description,
      })),
    [],
  )

  const columns = useMemo<AdminColumn<AdminListItem>[]>(
    () => [
      textColumn('title', 'Class', (item) => item.title, { primaryLink: true }),
      categoryColumn('category', 'Category', (item) => item.category, {
        getCategoryOptions: () => ITEM_CATEGORIES.map((entry) => entry.name),
      }),
      textColumn('description', 'Description', (item) => item.subtitle ?? ''),
    ],
    [],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  return (
    <AdminListShell
      title="Item Classes"
      description="Fixed item classes scoped to a category (e.g. daggers under Weapons). Classes cannot be edited."
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
        emptyMessage="No classes match your filters."
      />
    </AdminListShell>
  )
}
