import { useMemo } from 'react'
import { categoryColumn, textColumn } from '../../admin/adminColumnHelpers'
import { READ_ONLY_TABLE_FEATURES } from '../../admin/entityListActions'
import type { AdminColumn, SettingsSectionItem } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { useEditorStore } from '../../store/editorStore'

const SECTIONS: SettingsSectionItem[] = [
  {
    id: 'project-metadata',
    title: 'Project metadata',
    category: 'General',
    updatedAt: new Date().toISOString(),
    subtitle: 'Game ID, title, and export manifest fields',
  },
  {
    id: 'media-library',
    title: 'Media library',
    category: 'Assets',
    updatedAt: new Date().toISOString(),
    subtitle: 'Per-file size limit and project storage warning threshold',
  },
  {
    id: 'editor-preferences',
    title: 'Editor preferences',
    category: 'General',
    updatedAt: new Date().toISOString(),
    subtitle: 'Autosave and local editor behavior',
  },
]

export function SettingsListView() {
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const columns = useMemo<AdminColumn<SettingsSectionItem>[]>(
    () => [
      textColumn('title', 'Section', (item) => item.title, { primaryLink: true }),
      categoryColumn('category', 'Group', (item) => item.category),
      textColumn('subtitle', 'Description', (item) => item.subtitle ?? '—'),
    ],
    [],
  )

  const { table } = useAdminListTable({ items: SECTIONS, columns, pageSize: 10 })

  return (
    <AdminListShell
      title="Settings"
      description="Configure project metadata and editor preferences."
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable
        columns={columns}
        items={SECTIONS}
        table={table}
        features={READ_ONLY_TABLE_FEATURES}
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{ onEdit: (item) => openEntityEditor(item.id) }}
      />
    </AdminListShell>
  )
}
