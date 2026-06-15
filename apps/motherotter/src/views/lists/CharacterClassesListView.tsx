import { useMemo } from 'react'
import { textColumn } from '../../admin/adminColumnHelpers'
import type { CharacterClassListItem } from '../../admin/characterClassTypes'
import {
  deleteCharacterClassRecord,
  duplicateCharacterClassRecord,
} from '../../admin/entityListActions'
import { formatDiceRoll } from '../../admin/diceTypes'
import { summarizeLevelAbilityBindingGrants } from '../../admin/abilityTypes'
import type { AdminColumn } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { useEditorStore } from '../../store/editorStore'
import { getTaxonomySummaryForEntity } from '../../store/taxonomyStore'

export function CharacterClassesListView() {
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)
  const levelAbilityGrants = useAbilitiesStore((state) => state.levelAbilityGrants)
  const addCharacterClass = useCharacterClassesStore((state) => state.addCharacterClass)
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

  const columns = useMemo<AdminColumn<CharacterClassListItem>[]>(
    () => [
      textColumn('title', 'Class', (item) => item.title, { primaryLink: true }),
      textColumn('hitDice', 'Hit dice', (item) => formatDiceRoll(item.characterClass.hitDice)),
      textColumn('features', 'Features', (item) => item.category),
      textColumn('categories', 'Categories', (item) =>
        getTaxonomySummaryForEntity('character-classes', item.id).categories,
      ),
      textColumn('tags', 'Tags', (item) => getTaxonomySummaryForEntity('character-classes', item.id).tags),
      textColumn('abilities', 'Abilities', (item) =>
        summarizeLevelAbilityBindingGrants(levelAbilityGrants[item.id] ?? []),
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
    openEntityEditor(addCharacterClass())
  }

  return (
    <AdminListShell
      title="Character Classes"
      description="Define jobs and roles with distinct traits, abilities, categories, and tags."
      addLabel="Add Character Class"
      onAdd={handleAdd}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="character class"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => deleteCharacterClassRecord(item.id),
          onDuplicate: (item) => {
            const newId = duplicateCharacterClassRecord(item.id)
            openEntityEditor(newId)
          },
        }}
        emptyMessage='No character classes yet. Click "Add Character Class" to define one.'
      />
    </AdminListShell>
  )
}
