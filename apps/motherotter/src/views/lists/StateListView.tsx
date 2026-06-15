import { useMemo } from 'react'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import {
  deleteStateVariableRecord,
  duplicateStateVariableRecord,
} from '../../admin/entityListActions'
import {
  formatDefaultValue,
  STATE_SCOPE_LABELS,
  STATE_TYPE_LABELS,
  type StateVariableListItem,
} from '../../admin/stateTypes'
import type { AdminColumn } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useEditorStore } from '../../store/editorStore'
import { useStateVariablesStore } from '../../store/stateVariablesStore'

export function StateListView() {
  const variables = useStateVariablesStore((state) => state.variables)
  const addVariable = useStateVariablesStore((state) => state.addVariable)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const characters = useContentCatalogStore((state) => state.stubs.characters)

  const listItems = useMemo<StateVariableListItem[]>(
    () =>
      variables.map((variable) => ({
        id: variable.id,
        title: variable.title,
        category: STATE_SCOPE_LABELS[variable.scope],
        updatedAt: variable.updatedAt,
        subtitle: variable.key,
        scope: variable.scope,
        variable,
      })),
    [variables],
  )

  const columns = useMemo<AdminColumn<StateVariableListItem>[]>(
    () => [
      textColumn('title', 'Variable', (item) => item.title, {
        primaryLink: true,
        render: (item) => (
          <>
            <strong>{item.title}</strong>{' '}
            <code className="admin-inline-code">{item.variable.key}</code>
          </>
        ),
      }),
      categoryColumn('scope', 'Scope', (item) => item.category, {
        getCategoryOptions: () => ['Global', 'Character'],
      }),
      categoryColumn('type', 'Type', (item) => STATE_TYPE_LABELS[item.variable.varType]),
      textColumn('default', 'Default', (item) => formatDefaultValue(item.variable.defaultValue)),
      categoryColumn('character', 'Character', (item) => {
        if (item.variable.scope !== 'character') return '—'
        if (!item.variable.characterId) return 'Any character'
        const character = characters.find((c) => c.id === item.variable.characterId)
        return character?.title ?? item.variable.characterId
      }),
      textColumn('updated', 'Modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [characters],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  return (
    <AdminListShell
      title="State"
      description="Global game state and per-character story variables. Battle/combat state is managed separately in Rules."
      action={
        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => openEntityEditor(addVariable('character'))}
          >
            Add character variable
          </button>
          <button
            type="button"
            className="admin-primary-button"
            onClick={() => openEntityEditor(addVariable('global'))}
          >
            Add global variable
          </button>
        </div>
      }
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="variable"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => deleteStateVariableRecord(item.id),
          onDuplicate: (item) => {
            const newId = duplicateStateVariableRecord(item.id)
            openEntityEditor(newId)
          },
        }}
        emptyMessage="No state variables yet. Add a global or character variable for story scripting."
      />
    </AdminListShell>
  )
}
