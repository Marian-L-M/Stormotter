import { useMemo } from 'react'
import type { AttributeSource } from '../../admin/attributeTypes'
import {
  ATTRIBUTE_INPUT_TYPE_LABELS,
  ATTRIBUTE_SOURCE_LABELS,
  formatMechanicComposition,
  getAttributeCategoryName,
} from '../../admin/attributeTypes'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import {
  deleteAttributeDefinitionRecord,
  duplicateAttributeDefinitionRecord,
} from '../../admin/entityListActions'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { AdminSectionNav } from '../../components/admin/AdminSectionNav'
import { AttributeCategoriesPanel } from '../../components/admin/AttributeCategoriesPanel'
import { formatTimestamp } from '../../lib/format'
import { useAttributesStore } from '../../store/attributesStore'
import { useEditorStore } from '../../store/editorStore'

const SECTIONS: { id: AttributeSource; label: string }[] = [
  { id: 'standard', label: ATTRIBUTE_SOURCE_LABELS.standard },
  { id: 'custom', label: ATTRIBUTE_SOURCE_LABELS.custom },
]

interface AttributeListItem extends AdminListItem {
  inputTypeLabel: string
  mechanicLabel: string
  engineKey: string
  source: AttributeSource
}

export function AttributesListView() {
  const attributeSourceTab = useEditorStore((state) => state.attributeSourceTab)
  const setAttributeSourceTab = useEditorStore((state) => state.setAttributeSourceTab)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const definitions = useAttributesStore((state) => state.definitions)
  const categories = useAttributesStore((state) => state.categories)
  const addDefinition = useAttributesStore((state) => state.addDefinition)

  const listItems = useMemo<AttributeListItem[]>(
    () =>
      definitions
        .filter((definition) => definition.source === attributeSourceTab)
        .map((definition) => ({
          id: definition.id,
          title: definition.name,
          category: getAttributeCategoryName(definition.categoryId, categories),
          updatedAt: definition.updatedAt,
          subtitle: definition.description || undefined,
          inputTypeLabel: ATTRIBUTE_INPUT_TYPE_LABELS[definition.inputType],
          mechanicLabel: formatMechanicComposition(definition.mechanic),
          engineKey: definition.key,
          source: definition.source,
        })),
    [definitions, categories, attributeSourceTab],
  )

  const columns = useMemo<AdminColumn<AttributeListItem>[]>(
    () => [
      textColumn('title', 'Attribute', (item) => item.title, { primaryLink: true }),
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

  function handleSectionChange(section: AttributeSource) {
    if (section !== attributeSourceTab) {
      closeEntityEditor()
      setAttributeSourceTab(section)
    }
  }

  function handleAdd() {
    openEntityEditor(addDefinition(attributeSourceTab))
  }

  const sourceLabel = ATTRIBUTE_SOURCE_LABELS[attributeSourceTab].toLowerCase()

  return (
    <div className="attributes-tab">
      <AdminSectionNav sections={SECTIONS} active={attributeSourceTab} onChange={handleSectionChange} />
      <AttributeCategoriesPanel />
      <AdminListShell
        title={`${ATTRIBUTE_SOURCE_LABELS[attributeSourceTab]} attributes`}
        description={
          attributeSourceTab === 'standard'
            ? 'Standard attributes are assigned via level grants on characters, types, and classes. Values stack on characters.'
            : 'Custom attributes are searched and assigned individually on characters, types, and classes.'
        }
        addLabel={`Add ${sourceLabel} attribute`}
        onAdd={handleAdd}
        pagination={
          <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
        }
      >
        <AdminListTable
          columns={columns}
          items={listItems}
          table={table}
          entityLabel="attribute"
          onRowClick={(item) => openEntityEditor(item.id)}
          rowActions={{
            onEdit: (item) => openEntityEditor(item.id),
            onDelete: (item) => deleteAttributeDefinitionRecord(item.id),
            onDuplicate: (item) => {
              const newId = duplicateAttributeDefinitionRecord(item.id)
              openEntityEditor(newId)
            },
          }}
          emptyMessage={`No ${sourceLabel} attributes yet. Click "Add ${sourceLabel} attribute" to create one.`}
        />
      </AdminListShell>
    </div>
  )
}
