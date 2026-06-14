import { useMemo } from 'react'
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
import { useAdminList } from '../../admin/useAdminList'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useItemsStore } from '../../store/itemsStore'
import { useContainersStore } from '../../store/containersStore'
import { useEditorStore } from '../../store/editorStore'

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

  const list = useAdminList({
    items: listItems,
    categories: [
      ...ITEM_CATEGORIES.map((entry) => entry.name),
      ITEM_SCOPE_LABELS.unique,
      ITEM_SCOPE_LABELS.generic,
    ],
  })

  const columns: AdminColumn<ItemListItem>[] = [
    { id: 'title', header: 'Name', render: (item) => item.title },
    {
      id: 'scope',
      header: 'Scope',
      render: (item) => ITEM_SCOPE_LABELS[item.item.scope],
    },
    { id: 'category', header: 'Category', render: (item) => item.category },
    {
      id: 'class',
      header: 'Class',
      render: (item) => getItemClass(item.item.classId)?.name ?? '—',
    },
    {
      id: 'container',
      header: 'Container',
      render: (item) =>
        item.item.scope === 'unique'
          ? containerNameById.get(item.item.containerId ?? '') ?? 'Unassigned'
          : '—',
    },
    {
      id: 'requirements',
      header: 'Requirements',
      render: (item) => summarizeItemRequirements(item.item.requirements),
    },
    {
      id: 'effects',
      header: 'Effects',
      render: (item) => summarizeItemEffects(item.item.effects),
    },
    {
      id: 'updated',
      header: 'Modified',
      render: (item) => formatTimestamp(item.updatedAt),
    },
  ]

  function handleAdd() {
    openEntityEditor(addItem())
  }

  return (
    <AdminListShell
      title="Items"
      description="Inventory objects, equipment, consumables, and pickup definitions."
      addLabel="Add Item"
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
      <AdminDataTable<ItemListItem>
        columns={columns}
        items={list.pageItems}
        onRowClick={(item) => openEntityEditor(item.id)}
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

  const list = useAdminList({ items: listItems })

  const columns: AdminColumn<ItemCategoryListItem>[] = [
    { id: 'title', header: 'Category', render: (item) => item.title },
    { id: 'slot', header: 'Equip slot', render: (item) => item.category },
    {
      id: 'classes',
      header: 'Classes',
      render: (item) => String(item.classCount),
    },
    {
      id: 'description',
      header: 'Description',
      render: (item) => item.subtitle ?? '',
    },
  ]

  return (
    <AdminListShell
      title="Item Categories"
      description="Fixed item categories used to classify all items. Categories cannot be edited."
    >
      <AdminDataTable<ItemCategoryListItem>
        columns={columns}
        items={list.filtered}
        onRowClick={(item) => openEntityEditor(item.id)}
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

  const list = useAdminList({
    items: listItems,
    categories: ITEM_CATEGORIES.map((entry) => entry.name),
  })

  const columns: AdminColumn<AdminListItem>[] = [
    { id: 'title', header: 'Class', render: (item) => item.title },
    { id: 'category', header: 'Category', render: (item) => item.category },
    {
      id: 'description',
      header: 'Description',
      render: (item) => item.subtitle ?? '',
    },
  ]

  return (
    <AdminListShell
      title="Item Classes"
      description="Fixed item classes scoped to a category (e.g. daggers under Weapons). Classes cannot be edited."
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
        emptyMessage="No classes match your filters."
      />
    </AdminListShell>
  )
}
