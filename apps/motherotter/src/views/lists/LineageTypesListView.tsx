import { useMemo } from 'react'
import type { LineageTypeListItem } from '../../admin/lineageTypes'
import { formatStatRangesSummary } from '../../admin/lineageTypes'
import { summarizeLevelAbilityGrants } from '../../admin/levelGrantTypes'
import { useAdminList } from '../../admin/useAdminList'
import type { AdminColumn } from '../../admin/types'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useLineageTypesStore } from '../../store/lineageTypesStore'
import { getTaxonomySummaryForEntity } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

export function LineageTypesListView() {
  const lineageTypes = useLineageTypesStore((state) => state.lineageTypes)
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

  const list = useAdminList({ items: listItems })

  const columns: AdminColumn<LineageTypeListItem>[] = [
    { id: 'title', header: 'Type', render: (item) => item.title },
    {
      id: 'stat-ranges',
      header: 'Stat ranges',
      render: (item) => item.category,
    },
    {
      id: 'categories',
      header: 'Categories',
      render: (item) => getTaxonomySummaryForEntity('character-types', item.id).categories,
    },
    {
      id: 'tags',
      header: 'Tags',
      render: (item) => getTaxonomySummaryForEntity('character-types', item.id).tags,
    },
    {
      id: 'abilities',
      header: 'Abilities',
      render: (item) => summarizeLevelAbilityGrants(item.lineageType.levelAbilities),
    },
    {
      id: 'updated',
      header: 'Modified',
      render: (item) => formatTimestamp(item.updatedAt),
    },
  ]

  function handleAdd() {
    openEntityEditor(addLineageType())
  }

  return (
    <AdminListShell
      title="Character Types"
      description="Define character lineages with stat ranges, abilities, categories, and tags."
      addLabel="Add Character Type"
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
      <AdminDataTable
        columns={columns}
        items={list.pageItems}
        onRowClick={(item) => openEntityEditor(item.id)}
        emptyMessage='No character types yet. Click "Add Character Type" to define one.'
      />
    </AdminListShell>
  )
}
