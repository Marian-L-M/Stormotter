import { useMemo } from 'react'
import { textColumn } from '../../admin/adminColumnHelpers'
import {
  deleteLineageTypeRecord,
  duplicateLineageTypeRecord,
} from '../../admin/entityListActions'
import type { LineageTypeListItem } from '../../admin/lineageTypes'
import { formatStatRangesSummary } from '../../admin/lineageTypes'
import {
  summarizeAssignableAbilityGrants,
  summarizeCastSlotGrants,
} from '../../admin/abilityCastSlotTypes'
import { summarizeLevelAbilityBindingGrants } from '../../admin/abilityTypes'
import type { AdminColumn } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useEditorStore } from '../../store/editorStore'
import { useLineageTypesStore } from '../../store/lineageTypesStore'
import { getTaxonomySummaryForEntity } from '../../store/taxonomyStore'

export function LineageTypesListView() {
  const lineageTypes = useLineageTypesStore((state) => state.lineageTypes)
  const levelAbilityGrants = useAbilitiesStore((state) => state.levelAbilityGrants)
  const addLineageType = useLineageTypesStore((state) => state.addLineageType)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<LineageTypeListItem[]>(
    () =>
      lineageTypes.map((lineageType) => ({
        id: lineageType.id,
        title: lineageType.name,
        category: formatStatRangesSummary(lineageType.statRanges),
        updatedAt: lineageType.updatedAt,
        subtitle: lineageType.description || undefined,
        lineageType,
      })),
    [lineageTypes],
  )

  const columns = useMemo<AdminColumn<LineageTypeListItem>[]>(
    () => [
      textColumn('title', 'Type', (item) => item.title, { primaryLink: true }),
      textColumn('stat-ranges', 'Stat ranges', (item) => item.category),
      textColumn('categories', 'Categories', (item) =>
        getTaxonomySummaryForEntity('character-types', item.id).categories,
      ),
      textColumn('tags', 'Tags', (item) => getTaxonomySummaryForEntity('character-types', item.id).tags),
      textColumn('abilities', 'Abilities', (item) =>
        summarizeLevelAbilityBindingGrants(levelAbilityGrants[item.id] ?? []),
      ),
      textColumn('castSlots', 'Cast slots', (item) =>
        summarizeCastSlotGrants(item.lineageType.castSlotGrants),
      ),
      textColumn('assignablePool', 'Assignable pool', (item) =>
        summarizeAssignableAbilityGrants(item.lineageType.assignableAbilityGrants),
      ),
      textColumn('updated', 'Modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [levelAbilityGrants],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  function handleAdd() {
    openEntityEditor(addLineageType())
  }

  return (
    <AdminListShell
      title="Character Types"
      description="Define character lineages with stat ranges, abilities, categories, and tags."
      addLabel="Add Character Type"
      onAdd={handleAdd}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="character type"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => deleteLineageTypeRecord(item.id),
          onDuplicate: (item) => {
            const newId = duplicateLineageTypeRecord(item.id)
            openEntityEditor(newId)
          },
        }}
        emptyMessage='No character types yet. Click "Add Character Type" to define one.'
      />
    </AdminListShell>
  )
}
