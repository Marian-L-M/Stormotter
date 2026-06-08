import { useMemo } from 'react'
import {
  formatDefaultValue,
  STATE_SCOPE_LABELS,
  STATE_TYPE_LABELS,
  type StateVariableListItem,
} from '../../admin/stateTypes'
import { useAdminList } from '../../admin/useAdminList'
import type { AdminColumn } from '../../admin/types'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useStateVariablesStore } from '../../store/stateVariablesStore'
import { useEditorStore } from '../../store/editorStore'

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

  const list = useAdminList({
    items: listItems,
    categories: ['Global', 'Character'],
  })

  const columns: AdminColumn<StateVariableListItem>[] = [
    {
      id: 'title',
      header: 'Variable',
      render: (item) => (
        <>
          <strong>{item.title}</strong>
          <code className="admin-inline-code">{item.variable.key}</code>
        </>
      ),
    },
    { id: 'scope', header: 'Scope', render: (item) => item.category },
    {
      id: 'type',
      header: 'Type',
      render: (item) => STATE_TYPE_LABELS[item.variable.varType],
    },
    {
      id: 'default',
      header: 'Default',
      render: (item) => formatDefaultValue(item.variable.defaultValue),
    },
    {
      id: 'character',
      header: 'Character',
      render: (item) => {
        if (item.variable.scope !== 'character') return '—'
        if (!item.variable.characterId) return 'Any character'
        const character = characters.find((c) => c.id === item.variable.characterId)
        return character?.title ?? item.variable.characterId
      },
    },
    {
      id: 'updated',
      header: 'Modified',
      render: (item) => formatTimestamp(item.updatedAt),
    },
  ]

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
        emptyMessage="No state variables yet. Add a global or character variable for story scripting."
      />
    </AdminListShell>
  )
}
