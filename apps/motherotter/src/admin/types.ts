import type { ReactNode } from 'react'

export type EditorScreen = 'list' | 'edit'

export type AdminSortDirection = 'asc' | 'desc'

export type AdminColumnFilterType = 'text' | 'category' | 'none'

export interface AdminColumnFilter {
  type: AdminColumnFilterType
}

export interface AdminListItem {
  id: string
  title: string
  category: string
  updatedAt: string
  subtitle?: string
}

export interface AdminColumn<T extends AdminListItem = AdminListItem> {
  id: string
  header: string
  render: (item: T) => ReactNode
  className?: string
  /** Opens editor when clicked (defaults to title/name column) */
  primaryLink?: boolean
  sortable?: boolean
  sortValue?: (item: T) => string | number
  filter?: AdminColumnFilter
  getFilterValue?: (item: T) => string
  getCategoryOptions?: (items: T[]) => string[]
}

export interface AdminRowAction<T extends AdminListItem = AdminListItem> {
  id: string
  label: string
  tone?: 'default' | 'danger'
  onAction: (item: T) => void | Promise<void>
}

export interface AdminTableRowActions<T extends AdminListItem = AdminListItem> {
  onEdit: (item: T) => void
  onDelete?: (item: T) => void | Promise<void>
  onDuplicate?: (item: T) => string | void | Promise<string | void>
  getExtraActions?: (item: T) => AdminRowAction<T>[]
  canDelete?: (item: T) => boolean
  canDuplicate?: (item: T) => boolean
  editLabel?: string
  deleteLabel?: string
  duplicateLabel?: string
}

export interface AdminTableFeatures {
  selection?: boolean
  bulkDelete?: boolean
  rowActions?: boolean
}

export const DEFAULT_ADMIN_TABLE_FEATURES: Required<AdminTableFeatures> = {
  selection: true,
  bulkDelete: true,
  rowActions: true,
}

export type StubContentType =
  | 'stories'
  | 'characters'
  | 'items'
  | 'containers'
  | 'abilities'
  | 'rules'

export type SettingsSectionId = 'project-metadata' | 'editor-preferences' | 'media-library'

export interface SettingsSectionItem extends AdminListItem {
  id: SettingsSectionId
}
