import { useMemo } from 'react'
import type { CharacterClassListItem } from '../../admin/characterClassTypes'
import { useAdminList } from '../../admin/useAdminList'
import type { AdminColumn } from '../../admin/types'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { getTaxonomySummaryForEntity } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

export function CharacterClassesListView() {
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)
  const addCharacterClass = useCharacterClassesStore((state) => state.addCharacterClass)
  const abilities = useContentCatalogStore((state) => state.stubs.abilities)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<CharacterClassListItem[]>(
    () =>
      characterClasses.map((characterClass) => ({
        id: characterClass.id,
        title: characterClass.name,
        category: `${characterClass.distinctFeatures.length} feature${characterClass.distinctFeatures.length === 1 ? '' : 's'}`,
        updatedAt: characterClass.updatedAt,
        subtitle: characterClass.description || undefined,
        characterClass,
      })),
    [characterClasses],
  )

  const list = useAdminList({ items: listItems })

  const columns: AdminColumn<CharacterClassListItem>[] = [
    { id: 'title', header: 'Class', render: (item) => item.title },
    {
      id: 'features',
      header: 'Features',
      render: (item) => item.category,
    },
    {
      id: 'categories',
      header: 'Categories',
      render: (item) => getTaxonomySummaryForEntity('character-classes', item.id).categories,
    },
    {
      id: 'tags',
      header: 'Tags',
      render: (item) => getTaxonomySummaryForEntity('character-classes', item.id).tags,
    },
    {
      id: 'abilities',
      header: 'Abilities',
      render: (item) => {
        if (item.characterClass.abilityIds.length === 0) return '—'
        const names = item.characterClass.abilityIds
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
    openEntityEditor(addCharacterClass())
  }

  return (
    <AdminListShell
      title="Character Classes"
      description="Define jobs and roles with distinct traits, abilities, categories, and tags."
      addLabel="Add Character Class"
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
        emptyMessage='No character classes yet. Click "Add Character Class" to define one.'
      />
    </AdminListShell>
  )
}
