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
import { useAdminList } from '../../admin/useAdminList'
import type { AdminColumn } from '../../admin/types'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useContainersStore } from '../../store/containersStore'
import { useItemsStore } from '../../store/itemsStore'
import { useEditorStore } from '../../store/editorStore'

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

  const listItems: ContainerListItem[] = containers
    .filter((container) => container.kind === kind)
    .map((container) => ({
      id: container.id,
      title: container.name,
      category: CONTAINER_KIND_LABELS[container.kind],
      updatedAt: container.updatedAt,
      subtitle: container.description || undefined,
      container,
    }))

  const list = useAdminList({ items: listItems })

  const columns: AdminColumn<ContainerListItem>[] = [
    { id: 'title', header: 'Name', render: (item) => item.title },
  ]

  if (kind === 'random') {
    columns.push({
      id: 'loot',
      header: 'Loot entries',
      render: (item) => summarizeContainerLoot(item.container.lootEntries),
    })
  } else {
    columns.push({
      id: 'items',
      header: 'Unique items',
      render: (item) => String(getItemsInContainer(item.container.id).length),
    })
  }

  columns.push({
    id: 'updated',
    header: 'Modified',
    render: (item) => formatTimestamp(item.updatedAt),
  })

  function handleAdd() {
    openEntityEditor(addContainer(kind))
  }

  return (
    <AdminListShell
      title={config.title}
      description={config.description}
      addLabel={config.addLabel}
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
      <AdminDataTable<ContainerListItem>
        columns={columns}
        items={list.pageItems}
        onRowClick={(item) => openEntityEditor(item.id)}
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
