import { useMemo } from 'react'
import { textColumn } from '../../admin/adminColumnHelpers'
import { countFilledProfileTriggers } from '../../admin/audioProfileTypes'
import {
  deleteAudioProfileRecord,
  duplicateAudioProfileRecord,
} from '../../admin/entityListActions'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminListTable, useAdminListTable } from '../../components/admin/AdminListTable'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useAudioProfilesStore } from '../../store/audioProfilesStore'
import { useEditorStore } from '../../store/editorStore'
import { getTaxonomySummaryForEntity } from '../../store/taxonomyStore'

interface AudioProfileListItem extends AdminListItem {
  filledTriggers: number
  totalTriggers: number
}

export function AudioProfilesListView() {
  const audioProfiles = useAudioProfilesStore((state) => state.audioProfiles)
  const addAudioProfile = useAudioProfilesStore((state) => state.addAudioProfile)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const listItems = useMemo<AudioProfileListItem[]>(
    () =>
      audioProfiles.map((profile) => {
        const filled = countFilledProfileTriggers(profile)
        const total = Object.keys(profile.triggers).length + profile.customTriggers.length
        return {
          id: profile.id,
          title: profile.name,
          category: `${filled} filled`,
          updatedAt: profile.updatedAt,
          subtitle: profile.description || undefined,
          filledTriggers: filled,
          totalTriggers: total,
        }
      }),
    [audioProfiles],
  )

  const columns = useMemo<AdminColumn<AudioProfileListItem>[]>(
    () => [
      textColumn('title', 'Profile', (item) => item.title, { primaryLink: true }),
      textColumn('triggers', 'Triggers filled', (item) => `${item.filledTriggers} filled`, {
        sortValue: (item) => item.filledTriggers,
      }),
      textColumn('categories', 'Categories', (item) =>
        getTaxonomySummaryForEntity('audio-profiles', item.id).categories,
      ),
      textColumn('tags', 'Tags', (item) => getTaxonomySummaryForEntity('audio-profiles', item.id).tags),
      textColumn('updated', 'Modified', (item) => formatTimestamp(item.updatedAt), {
        getFilterValue: (item) => item.updatedAt,
        sortValue: (item) => item.updatedAt,
      }),
    ],
    [],
  )

  const { table } = useAdminListTable({ items: listItems, columns })

  function handleAdd() {
    openEntityEditor(addAudioProfile())
  }

  return (
    <AdminListShell
      title="Audio Profiles"
      description="Reusable voice sets with event triggers. Assign profiles to characters instead of single audio clips."
      addLabel="Add Audio Profile"
      onAdd={handleAdd}
      pagination={
        <AdminPagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
      }
    >
      <AdminListTable
        columns={columns}
        items={listItems}
        table={table}
        entityLabel="audio profile"
        onRowClick={(item) => openEntityEditor(item.id)}
        rowActions={{
          onEdit: (item) => openEntityEditor(item.id),
          onDelete: (item) => deleteAudioProfileRecord(item.id),
          onDuplicate: (item) => {
            const newId = duplicateAudioProfileRecord(item.id)
            openEntityEditor(newId)
          },
        }}
        emptyMessage='No audio profiles yet. Click "Add Audio Profile" to create one.'
      />
    </AdminListShell>
  )
}
