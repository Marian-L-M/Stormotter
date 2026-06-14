import { useMemo } from 'react'
import {
  CHARACTER_SLOT_DEFINITIONS,
  HIDDEN_STORAGE_SLOT_COUNT,
  MAIN_HAND_SLOT_COUNT,
  OFF_HAND_SLOT_COUNT,
  PUBLIC_STORAGE_SLOT_COUNT,
  QUICK_SLOT_COUNT,
  QUIVER_SLOT_COUNT,
} from '../../admin/characterSlotTypes'
import { useAdminList } from '../../admin/useAdminList'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useContainersStore } from '../../store/containersStore'
import { useItemsStore } from '../../store/itemsStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useEditorStore } from '../../store/editorStore'

interface CharacterInventoryListItem extends AdminListItem {
  filledSlots: number
  totalSlots: number
}

export function CharacterInventoriesListView() {
  const characters = useContentCatalogStore((state) => state.stubs.characters)
  const containers = useContainersStore((state) => state.containers)
  const items = useItemsStore((state) => state.items)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const totalSlots = CHARACTER_SLOT_DEFINITIONS.length

  const listItems: CharacterInventoryListItem[] = useMemo(
    () =>
      characters.map((character) => {
        const slotContainers = containers.filter(
          (entry) => entry.kind === 'character_slot' && entry.characterId === character.id,
        )
        const slotIds = new Set(slotContainers.map((entry) => entry.id))
        const filledSlots = new Set(
          items
            .filter((entry) => entry.scope === 'unique' && entry.containerId && slotIds.has(entry.containerId))
            .map((entry) => entry.containerId),
        ).size

        return {
          id: character.id,
          title: character.title,
          category: character.category,
          updatedAt: character.updatedAt,
          filledSlots,
          totalSlots,
        }
      }),
    [characters, containers, items, totalSlots],
  )

  const list = useAdminList({ items: listItems })

  const columns: AdminColumn<CharacterInventoryListItem>[] = [
    { id: 'title', header: 'Character', render: (item) => item.title },
    {
      id: 'slots',
      header: 'Filled slots',
      render: (item) => `${item.filledSlots} / ${item.totalSlots}`,
    },
    {
      id: 'layout',
      header: 'Layout',
      render: () =>
        `${MAIN_HAND_SLOT_COUNT}+${OFF_HAND_SLOT_COUNT} hands · ${QUICK_SLOT_COUNT} quick · ${QUIVER_SLOT_COUNT} quiver · ${PUBLIC_STORAGE_SLOT_COUNT} public · ${HIDDEN_STORAGE_SLOT_COUNT} hidden`,
    },
    {
      id: 'updated',
      header: 'Modified',
      render: (item) => formatTimestamp(item.updatedAt),
    },
  ]

  return (
    <AdminListShell
      title="Character Inventories"
      description="Each character has a fixed inventory: equipment slots plus 20 public and 20 hidden storage cells. Select a character to manage items in each slot."
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
      <AdminDataTable<CharacterInventoryListItem>
        columns={columns}
        items={list.pageItems}
        onRowClick={(item) => openEntityEditor(item.id)}
        emptyMessage="No characters found. Create characters first, then manage their inventories here."
      />
    </AdminListShell>
  )
}
