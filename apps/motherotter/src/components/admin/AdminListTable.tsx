import { useMemo, useState } from 'react'
import { enrichAdminColumns } from '../../admin/adminColumnHelpers'
import type {
  AdminColumn,
  AdminListItem,
  AdminTableFeatures,
  AdminTableRowActions,
} from '../../admin/types'
import type { AdminTableState, UseAdminTableOptions } from '../../admin/useAdminTable'
import { useAdminTable } from '../../admin/useAdminTable'
import { AdminConfirmModal } from './AdminModal'
import { AdminDataTable } from './AdminDataTable'
import { AdminTableToolbar } from './AdminTableToolbar'

interface AdminListTableProps<T extends AdminListItem> {
  columns: AdminColumn<T>[]
  items: T[]
  table?: AdminTableState<T>
  pageSize?: number
  onRowClick?: (item: T) => void
  rowActions?: AdminTableRowActions<T>
  features?: AdminTableFeatures
  emptyMessage?: string
  entityLabel?: string
  onBulkDelete?: (ids: string[]) => void | Promise<void>
}

type PendingModal<T> =
  | { kind: 'delete'; item: T }
  | { kind: 'duplicate'; item: T }
  | { kind: 'bulk-delete' }
  | null

export function AdminListTable<T extends AdminListItem>({
  columns,
  items,
  table: externalTable,
  pageSize = 10,
  onRowClick,
  rowActions,
  features,
  emptyMessage,
  entityLabel = 'item',
  onBulkDelete,
}: AdminListTableProps<T>) {
  const enrichedColumns = useMemo(() => enrichAdminColumns(columns), [columns])
  const internalTable = useAdminTable({ items, columns: enrichedColumns, pageSize })
  const table = externalTable ?? internalTable
  const [pendingModal, setPendingModal] = useState<PendingModal<T>>(null)

  const deleteHandler = rowActions?.onDelete
  const duplicateHandler = rowActions?.onDuplicate

  const resolvedRowActions: AdminTableRowActions<T> | undefined = rowActions
    ? {
        ...rowActions,
        onEdit: rowActions.onEdit,
        onDelete: deleteHandler
          ? (item) => {
              setPendingModal({ kind: 'delete', item })
            }
          : undefined,
        onDuplicate: duplicateHandler
          ? (item) => {
              setPendingModal({ kind: 'duplicate', item })
            }
          : undefined,
      }
    : onRowClick
      ? {
          onEdit: onRowClick,
        }
      : undefined

  const bulkDeleteHandler =
    onBulkDelete ??
    (deleteHandler
      ? async (ids: string[]) => {
          for (const id of ids) {
            const item = items.find((entry) => entry.id === id)
            if (item) await deleteHandler(item)
          }
        }
      : undefined)

  return (
    <>
      <AdminTableToolbar
        table={table}
        entityLabel={entityLabel}
        bulkDeleteEnabled={features?.bulkDelete !== false && Boolean(bulkDeleteHandler)}
        onBulkDelete={
          bulkDeleteHandler ? () => setPendingModal({ kind: 'bulk-delete' }) : undefined
        }
      />

      <AdminDataTable
        columns={enrichedColumns}
        table={table}
        onRowClick={onRowClick}
        rowActions={resolvedRowActions}
        features={features}
        emptyMessage={emptyMessage}
      />

      <AdminConfirmModal
        open={pendingModal?.kind === 'delete'}
        title="Delete item"
        tone="danger"
        confirmLabel="Delete"
        message={
          pendingModal?.kind === 'delete' ? (
            <>
              Delete <strong>{pendingModal.item.title}</strong>? This cannot be undone.
            </>
          ) : null
        }
        onCancel={() => setPendingModal(null)}
        onConfirm={() => {
          if (pendingModal?.kind === 'delete' && deleteHandler) {
            void Promise.resolve(deleteHandler(pendingModal.item)).finally(() => {
              table.toggleRowSelection(pendingModal.item.id)
              setPendingModal(null)
            })
          }
        }}
      />

      <AdminConfirmModal
        open={pendingModal?.kind === 'duplicate'}
        title="Duplicate item"
        confirmLabel="Duplicate"
        message={
          pendingModal?.kind === 'duplicate' ? (
            <>
              Create a copy of <strong>{pendingModal.item.title}</strong>?
            </>
          ) : null
        }
        onCancel={() => setPendingModal(null)}
        onConfirm={() => {
          if (pendingModal?.kind === 'duplicate' && duplicateHandler) {
            void Promise.resolve(duplicateHandler(pendingModal.item)).finally(() =>
              setPendingModal(null),
            )
          }
        }}
      />

      <AdminConfirmModal
        open={pendingModal?.kind === 'bulk-delete'}
        title="Delete selected items"
        tone="danger"
        confirmLabel="Delete all"
        message={
          <>
            Delete <strong>{table.selectedIds.size}</strong> selected {entityLabel}
            {table.selectedIds.size === 1 ? '' : 's'}? This cannot be undone.
          </>
        }
        onCancel={() => setPendingModal(null)}
        onConfirm={() => {
          if (pendingModal?.kind === 'bulk-delete' && bulkDeleteHandler) {
            const ids = [...table.selectedIds]
            void Promise.resolve(bulkDeleteHandler(ids)).finally(() => {
              table.clearSelection()
              setPendingModal(null)
            })
          }
        }}
      />
    </>
  )
}

export function useAdminListTable<T extends AdminListItem>(
  options: Omit<UseAdminTableOptions<T>, 'columns'> & { columns: AdminColumn<T>[] },
) {
  const enrichedColumns = useMemo(() => enrichAdminColumns(options.columns), [options.columns])
  const table = useAdminTable({ ...options, columns: enrichedColumns })
  return { table, enrichedColumns }
}
