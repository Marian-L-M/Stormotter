import type { AdminListItem } from '../../admin/types'
import type { AdminTableState } from '../../admin/useAdminTable'

interface AdminTableToolbarProps<T extends AdminListItem> {
  table: AdminTableState<T>
  entityLabel?: string
  onBulkDelete?: () => void
  bulkDeleteEnabled?: boolean
}

export function AdminTableToolbar<T extends AdminListItem>({
  table,
  entityLabel = 'item',
  onBulkDelete,
  bulkDeleteEnabled = true,
}: AdminTableToolbarProps<T>) {
  const selectedCount = table.selectedIds.size
  const plural = selectedCount === 1 ? entityLabel : `${entityLabel}s`

  return (
    <div className="admin-table-toolbar">
      <span className="admin-result-count muted">{table.totalItems} items</span>
      {bulkDeleteEnabled && selectedCount > 0 ? (
        <div className="admin-bulk-actions">
          <span className="admin-bulk-count">
            {selectedCount} {plural} selected
          </span>
          <button type="button" className="admin-secondary-button" onClick={() => table.clearSelection()}>
            Clear selection
          </button>
          {onBulkDelete ? (
            <button type="button" className="admin-danger-button" onClick={onBulkDelete}>
              Delete selected
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
