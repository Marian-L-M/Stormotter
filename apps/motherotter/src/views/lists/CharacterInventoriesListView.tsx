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
import { textColumn } from '../../admin/adminColumnHelpers'
import { READ_ONLY_TABLE_FEATURES } from '../../admin/entityListActions'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useContainersStore } from '../../store/containersStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useEditorStore } from '../../store/editorStore'
import { useItemsStore } from '../../store/itemsStore'

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

  const listItems = useMemo<CharacterInventoryListItem[]>(
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

  const columns = useMemo<AdminColumn<CharacterInventoryListItem>[]>(
    () => [
      textColumn('title', 'Character', (item) => item.title, { primaryLink: true }),
      textColumn('slots', 'Filled slots', (item) => `${item.filledSlots} / ${item.totalSlots}`, {
        sortValue: (item) => item.filledSlots,
      }),
      textColumn(
        'layout',
        'Layout',
        () =>
          `${MAIN_HAND_SLOT_COUNT}+${OFF_HAND_SLOT_COUNT} hands · ${QUICK_SLOT_COUNT} quick · ${QUIVER_SLOT_COUNT} quiver · ${PUBLIC_STORAGE_SLOT_COUNT} public · ${HIDDEN_STORAGE_SLOT_COUNT} hidden`,
        { sortable: false, filter: { type: 'none' } },
      ),
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
      title="Character Inventories"
      description="Each character has a fixed inventory: equipment slots plus 20 public and 20 hidden storage cells. Select a character to manage items in each slot."
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable<CharacterInventoryListItem>
        columns={columns}
        items={listItems}
        table={table}
        features={READ_ONLY_TABLE_FEATURES}
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{ onEdit: (item) => openEntityEditor(item.id) }}
        emptyMessage="No characters found. Create characters first, then manage their inventories here."
      />
    </AdminListShell>
  )
}
