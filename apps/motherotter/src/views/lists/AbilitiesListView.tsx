import { useMemo } from 'react'
import {
  ABILITY_INPUT_TYPE_LABELS,
  getAbilityCategoryName,
} from '../../admin/abilityTypes'
import { formatMechanicComposition } from '../../admin/attributeTypes'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import {
  deleteAbilityDefinitionRecord,
  duplicateAbilityDefinitionRecord,
} from '../../admin/entityListActions'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { AbilityCategoriesPanel } from '../../components/admin/AbilityCategoriesPanel'
import { formatTimestamp } from '../../lib/format'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useEditorStore } from '../../store/editorStore'

interface AbilityListItem extends AdminListItem {
  inputTypeLabel: string
  mechanicLabel: string
  engineKey: string
}

export function AbilitiesListView() {
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const definitions = useAbilitiesStore((state) => state.definitions)
  const categories = useAbilitiesStore((state) => state.categories)
  const addDefinition = useAbilitiesStore((state) => state.addDefinition)

  const listItems = useMemo<AbilityListItem[]>(
    () =>
      definitions.map((definition) => ({
        id: definition.id,
        title: definition.name,
        category: getAbilityCategoryName(definition.categoryId, categories),
        updatedAt: definition.updatedAt,
        subtitle: definition.description || undefined,
        inputTypeLabel: ABILITY_INPUT_TYPE_LABELS[definition.inputType],
        mechanicLabel: formatMechanicComposition(definition.mechanic),
        engineKey: definition.key,
      })),
    [definitions, categories],
  )

  const columns = useMemo<AdminColumn<AbilityListItem>[]>(
    () => [
      textColumn('title', 'Ability', (item) => item.title, { primaryLink: true }),
      textColumn('key', 'Key', (item) => item.engineKey),
      textColumn('mechanic', 'Mechanic', (item) => item.mechanicLabel),
      categoryColumn('category', 'Category', (item) => item.category),
      categoryColumn('type', 'Input type', (item) => item.inputTypeLabel),
      textColumn('updated', 'Modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  function handleAdd() {
    openEntityEditor(addDefinition())
  }

  return (
    <div className="attributes-tab">
      <AbilityCategoriesPanel />
      <AdminListShell
        title="Abilities"
        description="Define reusable abilities with mechanics. Attach them to characters, types, classes, and items with a value and trigger."
        addLabel="New ability"
        onAdd={handleAdd}
        pagination={
          <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
        }
      >
        <AdminListTable
          columns={columns}
          items={listItems}
          table={table}
          entityLabel="ability"
          onRowClick={(item) => openEntityEditor(item.id)}
          rowActions={{
            onEdit: (item) => openEntityEditor(item.id),
            onDelete: (item) => deleteAbilityDefinitionRecord(item.id),
            onDuplicate: (item) => {
              const newId = duplicateAbilityDefinitionRecord(item.id)
              openEntityEditor(newId)
            },
          }}
          emptyMessage="No abilities yet."
        />
      </AdminListShell>
    </div>
  )
}
