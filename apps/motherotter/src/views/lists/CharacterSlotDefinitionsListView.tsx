import { useMemo } from 'react'
import {
  CHARACTER_SLOT_DEFINITIONS,
  CHARACTER_SLOT_GROUP_LABELS,
  characterSlotDefinitionsByGroup,
  getCharacterSlotDefinition,
} from '../../admin/characterSlotTypes'
import { CONTAINER_VISIBILITY_LABELS } from '../../admin/containerTypes'
import { useAdminList } from '../../admin/useAdminList'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { useEditorStore } from '../../store/editorStore'

interface SlotDefinitionListItem extends AdminListItem {
  slotKey: string
  group: string
  visibility: string
}

export function CharacterSlotDefinitionsListView() {
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const grouped = characterSlotDefinitionsByGroup()

  const listItems: SlotDefinitionListItem[] = useMemo(
    () =>
      CHARACTER_SLOT_DEFINITIONS.map((definition) => ({
        id: definition.slotKey,
        title: definition.name,
        category: CHARACTER_SLOT_GROUP_LABELS[definition.group],
        updatedAt: '',
        slotKey: definition.slotKey,
        group: CHARACTER_SLOT_GROUP_LABELS[definition.group],
        visibility: CONTAINER_VISIBILITY_LABELS[definition.visibility],
      })),
    [],
  )

  const list = useAdminList({ items: listItems })

  const columns: AdminColumn<SlotDefinitionListItem>[] = [
    { id: 'title', header: 'Slot', render: (item) => item.title },
    { id: 'group', header: 'Group', render: (item) => item.group },
    {
      id: 'key',
      header: 'Slot key',
      render: (item) => <code>{item.slotKey}</code>,
    },
    { id: 'visibility', header: 'Visibility', render: (item) => item.visibility },
  ]

  return (
    <AdminListShell
      title="Slot Definitions"
      description={`Fixed character inventory layout: ${grouped.equipment.length} equipment slots, ${grouped.public_storage.length} public storage slots, and ${grouped.hidden_storage.length} hidden storage slots. Slots are read-only and auto-created for each character.`}
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
      <AdminDataTable<SlotDefinitionListItem>
        columns={columns}
        items={list.pageItems}
        onRowClick={(item) => openEntityEditor(item.id)}
        emptyMessage="No slot definitions match your filters."
      />
    </AdminListShell>
  )
}

export { getCharacterSlotDefinition }
