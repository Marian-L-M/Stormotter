import { useMemo } from 'react'
import {
  CHARACTER_SLOT_DEFINITIONS,
  CHARACTER_SLOT_GROUP_LABELS,
  characterSlotDefinitionsByGroup,
  getCharacterSlotDefinition,
} from '../../admin/characterSlotTypes'
import { CONTAINER_VISIBILITY_LABELS } from '../../admin/containerTypes'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import { READ_ONLY_TABLE_FEATURES } from '../../admin/entityListActions'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
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

  const listItems = useMemo<SlotDefinitionListItem[]>(
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

  const columns = useMemo<AdminColumn<SlotDefinitionListItem>[]>(
    () => [
      textColumn('title', 'Slot', (item) => item.title, { primaryLink: true }),
      categoryColumn('group', 'Group', (item) => item.group),
      textColumn('key', 'Slot key', (item) => item.slotKey, {
        render: (item) => <code>{item.slotKey}</code>,
      }),
      categoryColumn('visibility', 'Visibility', (item) => item.visibility),
    ],
    [],
  )

  const { table } = useAdminListTable({ items: listItems, columns, pageSize: 50 })

  return (
    <AdminListShell
      title="Slot Definitions"
      description={`Fixed character inventory layout: ${grouped.equipment.length} equipment slots, ${grouped.public_storage.length} public storage slots, and ${grouped.hidden_storage.length} hidden storage slots. Slots are read-only and auto-created for each character.`}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable<SlotDefinitionListItem>
        columns={columns}
        items={listItems}
        table={table}
        features={READ_ONLY_TABLE_FEATURES}
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{ onEdit: (item) => openEntityEditor(item.id), editLabel: 'View' }}
        emptyMessage="No slot definitions match your filters."
      />
    </AdminListShell>
  )
}

export { getCharacterSlotDefinition }
