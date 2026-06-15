import { useEffect, useRef, useState } from 'react'
import { ADMIN_TABLE_ALL } from '../../admin/adminColumnHelpers'
import type { AdminColumn, AdminListItem, AdminTableFeatures, AdminTableRowActions } from '../../admin/types'
import type { AdminTableState } from '../../admin/useAdminTable'
import { AdminRowActionsMenu } from './AdminRowActionsMenu'

interface AdminDataTableProps<T extends AdminListItem> {
  columns: AdminColumn<T>[]
  table: AdminTableState<T>
  onRowClick?: (item: T) => void
  rowActions?: AdminTableRowActions<T>
  features?: AdminTableFeatures
  emptyMessage?: string
}

function mergeFeatures(features?: AdminTableFeatures): Required<AdminTableFeatures> {
  return {
    selection: features?.selection ?? true,
    bulkDelete: features?.bulkDelete ?? true,
    rowActions: features?.rowActions ?? true,
  }
}

function columnHasActiveFilter(filterValue: string): boolean {
  return filterValue !== ADMIN_TABLE_ALL && filterValue !== ''
}

export function AdminDataTable<T extends AdminListItem>({
  columns,
  table,
  onRowClick,
  rowActions,
  features,
  emptyMessage = 'No items found.',
}: AdminDataTableProps<T>) {
  const resolvedFeatures = mergeFeatures(features)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [openFilterColumnId, setOpenFilterColumnId] = useState<string | null>(null)
  const headerRef = useRef<HTMLTableSectionElement>(null)
  const filterInputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null)

  useEffect(() => {
    if (!openFilterColumnId) return

    function handlePointerDown(event: MouseEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setOpenFilterColumnId(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openFilterColumnId])

  useEffect(() => {
    if (!openFilterColumnId) return
    filterInputRef.current?.focus()
  }, [openFilterColumnId])

  if (table.pageItems.length === 0) {
    return <p className="admin-empty">{emptyMessage}</p>
  }

  function handleEdit(item: T) {
    if (rowActions?.onEdit) {
      rowActions.onEdit(item)
      return
    }
    onRowClick?.(item)
  }

  function toggleFilterColumn(columnId: string) {
    setOpenFilterColumnId((current) => (current === columnId ? null : columnId))
  }

  return (
    <div className="admin-table-wrap admin-data-table-wrap">
      <table className="admin-table admin-data-table">
        <thead ref={headerRef}>
          <tr>
            {resolvedFeatures.selection ? (
              <th scope="col" className="admin-table-select-col">
                <input
                  type="checkbox"
                  aria-label="Select all on page"
                  checked={table.allPageSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = table.somePageSelected && !table.allPageSelected
                  }}
                  onChange={() => table.togglePageSelection()}
                />
              </th>
            ) : null}
            {columns.map((column) => {
              const isSorted = table.sortColumnId === column.id
              const filterType = column.filter?.type ?? 'none'
              const filterValue = table.columnFilters[column.id] ?? ADMIN_TABLE_ALL
              const hasActiveFilter = columnHasActiveFilter(filterValue)
              const isFilterOpen = openFilterColumnId === column.id
              const isFilterable = filterType !== 'none'

              return (
                <th key={column.id} scope="col" className={column.className}>
                  <div className="admin-table-header-cell">
                    <div className="admin-table-header-main">
                      {isFilterable ? (
                        <button
                          type="button"
                          className={`admin-table-header-label admin-table-header-label-button${isFilterOpen ? ' is-filter-open' : ''}${hasActiveFilter ? ' has-filter' : ''}`}
                          aria-expanded={isFilterOpen}
                          aria-controls={`admin-filter-${column.id}`}
                          onClick={() => toggleFilterColumn(column.id)}
                        >
                          {column.header}
                        </button>
                      ) : (
                        <span className="admin-table-header-label">{column.header}</span>
                      )}
                      {column.sortable !== false ? (
                        <button
                          type="button"
                          className={`admin-table-sort-toggle${isSorted ? ' is-active' : ''}`}
                          aria-label={
                            isSorted
                              ? `Sort ${column.header} ${table.sortDirection === 'asc' ? 'descending' : 'clear sort'}`
                              : `Sort ${column.header} ascending`
                          }
                          onClick={() => table.toggleSort(column.id)}
                        >
                          {isSorted ? (table.sortDirection === 'asc' ? '↑' : '↓') : null}
                        </button>
                      ) : null}
                    </div>
                    {isFilterOpen && isFilterable ? (
                      <div id={`admin-filter-${column.id}`} className="admin-table-header-filter-wrap">
                        {filterType === 'text' ? (
                          <input
                            ref={(node) => {
                              filterInputRef.current = node
                            }}
                            type="search"
                            className="admin-table-header-filter"
                            placeholder="Filter…"
                            value={filterValue === ADMIN_TABLE_ALL ? '' : filterValue}
                            onChange={(event) =>
                              table.setColumnFilter(column.id, event.target.value || ADMIN_TABLE_ALL)
                            }
                            aria-label={`Filter ${column.header}`}
                          />
                        ) : null}
                        {filterType === 'category' ? (
                          <select
                            ref={(node) => {
                              filterInputRef.current = node
                            }}
                            className="admin-table-header-filter admin-select"
                            value={filterValue}
                            onChange={(event) => table.setColumnFilter(column.id, event.target.value)}
                            aria-label={`Filter ${column.header}`}
                          >
                            {table.getCategoryOptions(column).map((option) => (
                              <option key={option} value={option}>
                                {option === ADMIN_TABLE_ALL ? 'All' : option}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </th>
              )
            })}
            {resolvedFeatures.rowActions && rowActions ? (
              <th scope="col" className="admin-table-actions-col" aria-label="Actions">
                ⋯
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {table.pageItems.map((item) => (
            <tr key={item.id} className={table.selectedIds.has(item.id) ? 'is-selected' : undefined}>
              {resolvedFeatures.selection ? (
                <td className="admin-table-select-col">
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.title}`}
                    checked={table.selectedIds.has(item.id)}
                    onChange={() => table.toggleRowSelection(item.id)}
                  />
                </td>
              ) : null}
              {columns.map((column) => (
                <td key={column.id} className={column.className}>
                  {column.primaryLink ? (
                    <button type="button" className="admin-row-link" onClick={() => handleEdit(item)}>
                      {column.render(item)}
                    </button>
                  ) : (
                    column.render(item)
                  )}
                </td>
              ))}
              {resolvedFeatures.rowActions && rowActions ? (
                <td className="admin-table-actions-col">
                  <AdminRowActionsMenu
                    item={item}
                    open={openMenuId === item.id}
                    onOpenChange={(open) => setOpenMenuId(open ? item.id : null)}
                    onEdit={() => handleEdit(item)}
                    onDelete={rowActions.onDelete ? () => rowActions.onDelete!(item) : undefined}
                    onDuplicate={
                      rowActions.onDuplicate ? () => rowActions.onDuplicate!(item) : undefined
                    }
                    extraActions={rowActions.getExtraActions?.(item) ?? []}
                    editLabel={rowActions.editLabel}
                    deleteLabel={rowActions.deleteLabel}
                    duplicateLabel={rowActions.duplicateLabel}
                    canDelete={rowActions.canDelete?.(item) ?? true}
                    canDuplicate={rowActions.canDuplicate?.(item) ?? true}
                  />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
