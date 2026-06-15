import { useMemo } from 'react'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import type { CharacterCategory } from '../../admin/characterTypes'
import {
  deleteCharacterRecord,
  duplicateCharacterRecord,
} from '../../admin/entityListActions'
import { formatStatRangesSummary } from '../../admin/lineageTypes'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { filterCharactersByType } from '../../lib/projectContent'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { useCharacterMetaStore } from '../../store/characterMetaStore'
import { useContainersStore } from '../../store/containersStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useEditorStore } from '../../store/editorStore'
import { useLineageTypesStore } from '../../store/lineageTypesStore'
import { getTaxonomySummaryForEntity } from '../../store/taxonomyStore'

interface CharactersListViewProps {
  characterType: CharacterCategory
}

export function CharactersListView({ characterType }: CharactersListViewProps) {
  const allItems = useContentCatalogStore((state) => state.stubs.characters)
  const addItem = useContentCatalogStore((state) => state.addItem)
  const ensureCharacterInventory = useContainersStore((state) => state.ensureCharacterInventory)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const metaByCharacterId = useCharacterMetaStore((state) => state.metaByCharacterId)
  const updateMeta = useCharacterMetaStore((state) => state.updateMeta)
  const lineageTypes = useLineageTypesStore((state) => state.lineageTypes)
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)

  const items = useMemo(
    () => filterCharactersByType(allItems, metaByCharacterId, characterType),
    [allItems, metaByCharacterId, characterType],
  )

  const columns = useMemo<AdminColumn<AdminListItem>[]>(
    () => [
      textColumn('title', 'Title', (item) => item.title, { primaryLink: true }),
      textColumn('categories', 'Categories', (item) =>
        getTaxonomySummaryForEntity('characters', item.id).categories,
      ),
      textColumn('tags', 'Tags', (item) => getTaxonomySummaryForEntity('characters', item.id).tags),
      categoryColumn('lineage-type', 'Type', (item) => {
        const lineageTypeId = metaByCharacterId[item.id]?.lineageTypeId
        if (!lineageTypeId) return '—'
        return lineageTypes.find((entry) => entry.id === lineageTypeId)?.name ?? lineageTypeId
      }),
      textColumn('lineage-ranges', 'Type ranges', (item) => {
        const lineageTypeId = metaByCharacterId[item.id]?.lineageTypeId
        if (!lineageTypeId) return '—'
        const lineageType = lineageTypes.find((entry) => entry.id === lineageTypeId)
        if (!lineageType) return '—'
        return formatStatRangesSummary(lineageType.statRanges)
      }),
      categoryColumn('class', 'Class', (item) => {
        const classId = metaByCharacterId[item.id]?.classId
        if (!classId) return '—'
        return characterClasses.find((entry) => entry.id === classId)?.name ?? classId
      }),
      textColumn('level', 'Level', (item) => String(metaByCharacterId[item.id]?.level ?? 1), {
        sortValue: (item) => metaByCharacterId[item.id]?.level ?? 1,
      }),
      textColumn('updated', 'Last modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [metaByCharacterId, lineageTypes, characterClasses],
  )

  const { table } = useAdminListTable({ items, columns })

  function handleAdd() {
    const id = addItem('characters', characterType)
    updateMeta(id, { characterType })
    const created = useContentCatalogStore.getState().getItem('characters', id)
    ensureCharacterInventory(id, created?.title ?? 'Character')
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
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable
        columns={columns}
        items={items}
        table={table}
        entityLabel="character"
        onRowClick={handleRowClick}
        rowActions={{
          onEdit: handleRowClick,
          onDelete: (item) => deleteCharacterRecord(item.id),
          onDuplicate: (item) => {
            const newId = duplicateCharacterRecord(item.id, characterType)
            openEntityEditor(newId)
          },
        }}
        emptyMessage='No characters in this group yet. Click "Add Character" to create one.'
      />
    </AdminListShell>
  )
}
