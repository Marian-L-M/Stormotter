import type { ReactNode } from 'react'

export type EditorScreen = 'list' | 'edit'

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
}

export type StubContentType =
  | 'stories'
  | 'characters'
  | 'items'
  | 'containers'
  | 'abilities'
  | 'rules'

export type SettingsSectionId = 'project-metadata' | 'editor-preferences'

export interface SettingsSectionItem extends AdminListItem {
  id: SettingsSectionId
}
