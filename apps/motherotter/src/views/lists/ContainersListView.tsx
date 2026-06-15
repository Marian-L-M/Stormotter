import { useMemo } from 'react'
import { textColumn } from '../../admin/adminColumnHelpers'
import {
  CONTAINER_KIND_LABELS,
  containerKindUsesLootTable,
  containerKindUsesUniqueItems,
  containerKindUsesVisibility,
  getCharacterSlotLabel,
  summarizeContainerLoot,
  type ContainerKind,
  type ContainerListItem,
} from '../../admin/containerTypes'
import { isCharacterSlotDefinitionId } from '../../admin/characterSlotTypes'
import {
  deleteContainerRecord,
  duplicateContainerRecord,
} from '../../admin/entityListActions'
import type { AdminColumn } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useContainersStore } from '../../store/containersStore'
import { useEditorStore } from '../../store/editorStore'
import { useItemsStore } from '../../store/itemsStore'

type ManualContainerKind = Exclude<ContainerKind, 'character_slot'>

const SECTION_CONFIG: Record<
  ManualContainerKind,
  { title: string; description: string; addLabel: string }
> = {
  unique: {
    title: 'Unique Containers',
    description: 'Fixed loot containers with specific unique item instances (chests, corpses, quest stashes).',
    addLabel: 'Add Unique Container',
  },
  random: {
    title: 'Random Containers',
    description: 'Loot tables that roll from generic item templates for procedural generation scripts.',
    addLabel: 'Add Random Container',
  },
}

interface ContainersListViewProps {
  kind: ManualContainerKind
}

export function ContainersListView({ kind }: ContainersListViewProps) {
  const containers = useContainersStore((state) => state.containers)
  const addContainer = useContainersStore((state) => state.addContainer)
  const getItemsInContainer = useItemsStore((state) => state.getItemsInContainer)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const config = SECTION_CONFIG[kind]

  const listItems = useMemo<ContainerListItem[]>(
    () =>
      containers
        .filter((container) => container.kind === kind)
        .map((container) => ({
          id: container.id,
          title: container.name,
          category: CONTAINER_KIND_LABELS[container.kind],
          updatedAt: container.updatedAt,
          subtitle: container.description || undefined,
          container,
        })),
    [containers, kind],
  )

  const columns = useMemo<AdminColumn<ContainerListItem>[]>(() => {
    const base: AdminColumn<ContainerListItem>[] = [
      textColumn('title', 'Name', (item) => item.title, { primaryLink: true }),
    ]

    if (kind === 'random') {
      base.push(
        textColumn('loot', 'Loot entries', (item) =>
          summarizeContainerLoot(item.container.lootEntries),
        ),
      )
    } else {
      base.push(
        textColumn('items', 'Unique items', (item) =>
          String(getItemsInContainer(item.container.id).length),
        ),
      )
    }

    base.push(
      textColumn('updated', 'Modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    )

    return base
  }, [kind, getItemsInContainer])

  const { table } = useAdminListTable({ items: listItems, columns })

  function handleAdd() {
    openEntityEditor(addContainer(kind))
  }

  return (
    <AdminListShell
      title={config.title}
      description={config.description}
      addLabel={config.addLabel}
      onAdd={handleAdd}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable<ContainerListItem>
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="container"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => deleteContainerRecord(item.id),
          onDuplicate: (item) => {
            const newId = duplicateContainerRecord(item.id)
            openEntityEditor(newId)
          },
        }}
        emptyMessage="No containers match your filters."
      />
    </AdminListShell>
  )
}

export function isAutoProvisionedSlotContainer(container: {
  kind: ContainerKind
  characterId: string | null
  slotKey: string | null
}): boolean {
  return (
    container.kind === 'character_slot' &&
    Boolean(container.characterId && container.slotKey && isCharacterSlotDefinitionId(container.slotKey))
  )
}

export { containerKindUsesLootTable, containerKindUsesUniqueItems, containerKindUsesVisibility, getCharacterSlotLabel }
