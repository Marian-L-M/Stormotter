import { useEffect, useRef } from 'react'
import type { AdminListItem, AdminRowAction } from '../../admin/types'

interface AdminRowActionsMenuProps<T extends AdminListItem> {
  item: T
  onEdit: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  extraActions?: AdminRowAction<T>[]
  editLabel?: string
  deleteLabel?: string
  duplicateLabel?: string
  canDelete?: boolean
  canDuplicate?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminRowActionsMenu<T extends AdminListItem>({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  extraActions = [],
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  duplicateLabel = 'Duplicate',
  canDelete = true,
  canDuplicate = true,
  open,
  onOpenChange,
}: AdminRowActionsMenuProps<T>) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onOpenChange])

  return (
    <div className="admin-row-actions" ref={menuRef}>
      <button
        type="button"
        className="admin-row-actions-trigger"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        ⋯
      </button>
      {open ? (
        <div className="admin-row-actions-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            className="admin-row-actions-item"
            onClick={() => {
              onOpenChange(false)
              onEdit()
            }}
          >
            {editLabel}
          </button>
          {onDuplicate && canDuplicate ? (
            <button
              type="button"
              role="menuitem"
              className="admin-row-actions-item"
              onClick={() => {
                onOpenChange(false)
                onDuplicate()
              }}
            >
              {duplicateLabel}
            </button>
          ) : null}
          {extraActions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className={`admin-row-actions-item${action.tone === 'danger' ? ' is-danger' : ''}`}
              onClick={() => {
                onOpenChange(false)
                void action.onAction(item)
              }}
            >
              {action.label}
            </button>
          ))}
          {onDelete && canDelete ? (
            <button
              type="button"
              role="menuitem"
              className="admin-row-actions-item is-danger"
              onClick={() => {
                onOpenChange(false)
                onDelete()
              }}
            >
              {deleteLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
