import { useMemo } from 'react'
import { summarizeAiProfile } from '../../admin/aiProfileTypes'
import { textColumn } from '../../admin/adminColumnHelpers'
import { deleteAiProfileRecord, duplicateAiProfileRecord } from '../../admin/entityListActions'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useAiProfilesStore } from '../../store/aiProfilesStore'
import { useEditorStore } from '../../store/editorStore'
import { getTaxonomySummaryForEntity } from '../../store/taxonomyStore'

interface AiProfileListItem extends AdminListItem {
  summary: string
}

export function AiProfilesListView() {
  const aiProfiles = useAiProfilesStore((state) => state.aiProfiles)
  const addAiProfile = useAiProfilesStore((state) => state.addAiProfile)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<AiProfileListItem[]>(
    () =>
      aiProfiles.map((profile) => ({
        id: profile.id,
        title: profile.name,
        category: `Aggression ${profile.aggression}`,
        updatedAt: profile.updatedAt,
        subtitle: profile.description || undefined,
        summary: summarizeAiProfile(profile),
      })),
    [aiProfiles],
  )

  const columns = useMemo<AdminColumn<AiProfileListItem>[]>(
    () => [
      textColumn('title', 'Profile', (item) => item.title, { primaryLink: true }),
      textColumn('behavior', 'Behavior', (item) => item.summary),
      textColumn('categories', 'Categories', (item) =>
        getTaxonomySummaryForEntity('ai-profiles', item.id).categories,
      ),
      textColumn('tags', 'Tags', (item) => getTaxonomySummaryForEntity('ai-profiles', item.id).tags),
      textColumn('updated', 'Modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  function handleAdd() {
    openEntityEditor(addAiProfile())
  }

  return (
    <AdminListShell
      title="AI Profiles"
      description="Reusable battle behavior presets. Assign profiles to characters for fight preview and Gameotter combat AI."
      addLabel="Add AI Profile"
      onAdd={handleAdd}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="AI profile"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => deleteAiProfileRecord(item.id),
          onDuplicate: (item) => {
            const newId = duplicateAiProfileRecord(item.id)
            openEntityEditor(newId)
          },
        }}
        emptyMessage='No AI profiles yet. Click "Add AI Profile" to create one.'
      />
    </AdminListShell>
  )
}
