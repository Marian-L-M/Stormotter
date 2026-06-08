import { useMemo } from 'react'
import type { CharacterCategory } from '../../admin/characterTypes'
import { useAdminList } from '../../admin/useAdminList'
import { filterCharactersByType } from '../../lib/projectContent'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { formatTimestamp } from '../../lib/format'
import { useCharacterMetaStore } from '../../store/characterMetaStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useRacesStore } from '../../store/racesStore'
import { getTaxonomySummaryForEntity } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

interface CharactersListViewProps {
  characterType: CharacterCategory
}

export function CharactersListView({ characterType }: CharactersListViewProps) {
  const allItems = useContentCatalogStore((state) => state.stubs.characters)
  const addItem = useContentCatalogStore((state) => state.addItem)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const metaByCharacterId = useCharacterMetaStore((state) => state.metaByCharacterId)
  const updateMeta = useCharacterMetaStore((state) => state.updateMeta)
  const races = useRacesStore((state) => state.races)

  const items = useMemo(
    () => filterCharactersByType(allItems, metaByCharacterId, characterType),
    [allItems, metaByCharacterId, characterType],
  )

  const list = useAdminList({ items })

  const columns: AdminColumn[] = [
    { id: 'title', header: 'Title', render: (item) => item.title },
    {
      id: 'categories',
      header: 'Categories',
      render: (item) => getTaxonomySummaryForEntity('characters', item.id).categories,
    },
    {
      id: 'tags',
      header: 'Tags',
      render: (item) => getTaxonomySummaryForEntity('characters', item.id).tags,
    },
    {
      id: 'race',
      header: 'Race',
      render: (item) => {
        const raceId = metaByCharacterId[item.id]?.raceId
        if (!raceId) return '—'
        return races.find((race) => race.id === raceId)?.name ?? raceId
      },
    },
    {
      id: 'updated',
      header: 'Last modified',
      render: (item) => formatTimestamp(item.updatedAt),
    },
  ]

  function handleAdd() {
    const id = addItem('characters', characterType)
    updateMeta(id, { characterType })
    openEntityEditor(id)
  }

  function handleRowClick(item: AdminListItem) {
    if (!metaByCharacterId[item.id]) {
      updateMeta(item.id, { characterType })
    }
    openEntityEditor(item.id)
  }

  return (
    <AdminListShell
      title="Characters"
      description="Character definitions grouped by type. Assign categories and tags in the editor."
      addLabel="Add Character"
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
        onRowClick={handleRowClick}
        emptyMessage='No characters in this group yet. Click "Add Character" to create one.'
      />
    </AdminListShell>
  )
}
