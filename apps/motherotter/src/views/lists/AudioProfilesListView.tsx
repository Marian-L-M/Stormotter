import { useMemo } from 'react'
import { countFilledProfileTriggers } from '../../admin/audioProfileTypes'
import { useAdminList } from '../../admin/useAdminList'
import type { AdminColumn, AdminListItem } from '../../admin/types'
import { AdminDataTable } from '../../components/admin/AdminDataTable'
import { AdminFilterBar } from '../../components/admin/AdminFilterBar'
import { AdminListShell } from '../../components/admin/AdminListShell'
import { AdminPagination } from '../../components/admin/AdminPagination'
import { formatTimestamp } from '../../lib/format'
import { useAudioProfilesStore } from '../../store/audioProfilesStore'
import { getTaxonomySummaryForEntity } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

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

  const list = useAdminList({ items: listItems })

  const columns: AdminColumn<AudioProfileListItem>[] = [
    { id: 'title', header: 'Profile', render: (item) => item.title },
    {
      id: 'triggers',
      header: 'Triggers filled',
      render: (item) => `${item.filledTriggers} filled`,
    },
    {
      id: 'categories',
      header: 'Categories',
      render: (item) => getTaxonomySummaryForEntity('audio-profiles', item.id).categories,
    },
    {
      id: 'tags',
      header: 'Tags',
      render: (item) => getTaxonomySummaryForEntity('audio-profiles', item.id).tags,
    },
    {
      id: 'updated',
      header: 'Modified',
      render: (item) => formatTimestamp(item.updatedAt),
    },
  ]

  function handleAdd() {
    openEntityEditor(addAudioProfile())
  }

  return (
    <AdminListShell
      title="Audio Profiles"
      description="Reusable voice sets with event triggers. Assign profiles to characters instead of single audio clips."
      addLabel="Add Audio Profile"
      onAdd={handleAdd}
      filters={
        <AdminFilterBar
          search={list.search}
          onSearchChange={list.setSearch}
          category={list.category}
          onCategoryChange={list.setCategory}
          categoryOptions={list.categoryOptions}
          resultCount={list.totalItems}
        />
      }
      pagination={
        <AdminPagination page={list.page} totalPages={list.totalPages} onPageChange={list.setPage} />
      }
    >
      <AdminDataTable
        columns={columns}
        items={list.pageItems}
        onRowClick={(item) => openEntityEditor(item.id)}
        emptyMessage='No audio profiles yet. Click "Add Audio Profile" to create one.'
      />
    </AdminListShell>
  )
}
