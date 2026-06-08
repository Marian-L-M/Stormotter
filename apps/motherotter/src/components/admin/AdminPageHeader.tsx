import type { ReactNode } from 'react'

interface AdminPageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="admin-page-header">
      <div className="admin-page-header-text">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="admin-page-header-action">{action}</div> : null}
    </div>
  )
}
