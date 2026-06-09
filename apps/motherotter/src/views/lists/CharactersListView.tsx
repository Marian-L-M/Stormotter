import { useMemo } from 'react'
import type { CharacterCategory } from '../../admin/characterTypes'
import { formatStatRangesSummary } from '../../admin/lineageTypes'
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
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { useLineageTypesStore } from '../../store/lineageTypesStore'
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
  const lineageTypes = useLineageTypesStore((state) => state.lineageTypes)
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)

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
      id: 'lineage-type',
      header: 'Type',
      render: (item) => {
        const lineageTypeId = metaByCharacterId[item.id]?.lineageTypeId
        if (!lineageTypeId) return '—'
        return lineageTypes.find((entry) => entry.id === lineageTypeId)?.name ?? lineageTypeId
      },
    },
    {
      id: 'lineage-ranges',
      header: 'Type ranges',
      render: (item) => {
        const lineageTypeId = metaByCharacterId[item.id]?.lineageTypeId
        if (!lineageTypeId) return '—'
        const lineageType = lineageTypes.find((entry) => entry.id === lineageTypeId)
        if (!lineageType) return '—'
        return formatStatRangesSummary(lineageType.statRanges)
      },
    },
    {
      id: 'class',
      header: 'Class',
      render: (item) => {
        const classId = metaByCharacterId[item.id]?.classId
        if (!classId) return '—'
        return characterClasses.find((entry) => entry.id === classId)?.name ?? classId
      },
    },
    {
      id: 'level',
      header: 'Level',
      render: (item) => metaByCharacterId[item.id]?.level ?? 1,
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
