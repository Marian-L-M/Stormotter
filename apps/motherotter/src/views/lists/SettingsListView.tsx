import { useAdminList } from '../../admin/useAdminList'
import type { AdminColumn, SettingsSectionItem } from '../../admin/types'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminListShell } from '../../components/admin/AdminListShell'
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
    id: 'editor-preferences',
    title: 'Editor preferences',
    category: 'General',
    updatedAt: new Date().toISOString(),
    subtitle: 'Autosave and local editor behavior',
  },
]

export function SettingsListView() {
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const list = useAdminList({ items: SECTIONS, pageSize: 10 })

  const columns: AdminColumn<SettingsSectionItem>[] = [
    { id: 'title', header: 'Section', render: (item) => item.title },
    { id: 'category', header: 'Group', render: (item) => item.category },
    { id: 'subtitle', header: 'Description', render: (item) => item.subtitle ?? '—' },
  ]

  return (
    <AdminListShell
      title="Settings"
      description="Configure project metadata and editor preferences."
      pagination={
        <AdminPagination page={list.page} totalPages={list.totalPages} onPageChange={list.setPage} />
      }
    >
      <AdminDataTable
        columns={columns}
        items={list.pageItems}
        onRowClick={(item) => openEntityEditor(item.id)}
      />
    </AdminListShell>
  )
}
