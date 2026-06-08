import type { ReactNode } from 'react'
import { AdminPageHeader } from './AdminPageHeader'

interface AdminListShellProps {
  title: string
  description?: string
  addLabel?: string
  onAdd?: () => void
  action?: ReactNode
  filters?: ReactNode
  children: ReactNode
  pagination?: ReactNode
}

export function AdminListShell({
  title,
  description,
  addLabel = 'Add New',
  onAdd,
  action,
  filters,
  children,
  pagination,
}: AdminListShellProps) {
  const headerAction =
    action ??
    (onAdd ? (
      <button type="button" className="admin-primary-button" onClick={onAdd}>
        {addLabel}
      </button>
    ) : undefined)

  return (
    <section className="editor-view admin-list-view">
      <AdminPageHeader title={title} description={description} action={headerAction} />
      {filters}
      <div className="admin-list-panel panel">{children}</div>
      {pagination}
    </section>
  )
}
