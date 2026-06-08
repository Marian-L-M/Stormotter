import { useMemo } from 'react'
import type { RaceListItem } from '../../admin/raceTypes'
import { useAdminList } from '../../admin/useAdminList'
import type { AdminColumn } from '../../admin/types'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useRacesStore } from '../../store/racesStore'
import { getTaxonomySummaryForEntity } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

export function RacesListView() {
  const races = useRacesStore((state) => state.races)
  const addRace = useRacesStore((state) => state.addRace)
  const abilities = useContentCatalogStore((state) => state.stubs.abilities)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<RaceListItem[]>(
    () =>
      races.map((race) => ({
        id: race.id,
        title: race.name,
        category: `${race.distinctFeatures.length} feature${race.distinctFeatures.length === 1 ? '' : 's'}`,
        updatedAt: race.updatedAt,
        subtitle: race.description || undefined,
        race,
      })),
    [races],
  )

  const list = useAdminList({ items: listItems })

  const columns: AdminColumn<RaceListItem>[] = [
    { id: 'title', header: 'Race', render: (item) => item.title },
    {
      id: 'features',
      header: 'Features',
      render: (item) => item.category,
    },
    {
      id: 'categories',
      header: 'Categories',
      render: (item) => getTaxonomySummaryForEntity('races', item.id).categories,
    },
    {
      id: 'tags',
      header: 'Tags',
      render: (item) => getTaxonomySummaryForEntity('races', item.id).tags,
    },
    {
      id: 'abilities',
      header: 'Abilities',
      render: (item) => {
        if (item.race.abilityIds.length === 0) return '—'
        const names = item.race.abilityIds
          .map((id) => abilities.find((ability) => ability.id === id)?.title ?? id)
          .join(', ')
        return names
      },
    },
    {
      id: 'updated',
      header: 'Modified',
      render: (item) => formatTimestamp(item.updatedAt),
    },
  ]

  function handleAdd() {
    openEntityEditor(addRace())
  }

  return (
    <AdminListShell
      title="Races"
      description="Define playable and NPC races with distinct traits, abilities, categories, and tags."
      addLabel="Add Race"
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
        emptyMessage='No races yet. Click "Add Race" to define one.'
      />
    </AdminListShell>
  )
}
