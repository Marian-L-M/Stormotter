import { useState } from 'react'
import {
  AUDIO_TRIGGER_GROUP_LABELS,
  countFilledCustomTriggers,
  countFilledProfileTriggers,
  countFilledStandardTriggers,
  triggersByGroup,
  type AudioTriggerId,
} from '../../admin/audioProfileTypes'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { AdminSectionNav } from '../../components/admin/AdminSectionNav'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { MediaLibraryModal } from '../../components/media/MediaLibraryModal'
import { useMediaAssetObjectUrl } from '../../hooks/useMediaObjectUrl'
import { useAudioProfilesStore } from '../../store/audioProfilesStore'
import { useMediaLibraryStore } from '../../store/mediaLibraryStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

const TRIGGER_TABS: { id: AudioProfileEditorTab; label: string }[] = [
  { id: 'standard', label: 'Standard triggers' },
  { id: 'custom', label: 'Custom triggers' },
]

type AudioProfileEditorTab = 'standard' | 'custom'

function TriggerAudioCell({
  mediaId,
  onSelect,
  onClear,
}: {
  mediaId: string | null
  onSelect: (mediaId: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const asset = useMediaLibraryStore((state) =>
    mediaId ? state.assets.find((entry) => entry.id === mediaId) : undefined,
  )
  const previewUrl = useMediaAssetObjectUrl(mediaId)

  return (
    <div className="audio-trigger-audio-cell">
      {asset && previewUrl ? (
        <audio controls src={previewUrl} className="audio-trigger-player" preload="none" />
      ) : (
        <span className="muted audio-trigger-empty">No clip</span>
      )}
      <div className="audio-trigger-actions">
        <button type="button" className="admin-secondary-button admin-secondary-button-sm" onClick={() => setOpen(true)}>
          {mediaId ? 'Replace' : 'Select'}
        </button>
        {mediaId ? (
          <button type="button" className="admin-secondary-button admin-secondary-button-sm" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>
      <MediaLibraryModal
        open={open}
        title="Select trigger audio"
        filter="audio"
        selectedId={mediaId}
        onClose={() => setOpen(false)}
        onSelect={(nextId) => {
          onSelect(nextId)
          setOpen(false)
        }}
      />
    </div>
  )
}

export function AudioProfileEditorView() {
  const [activeTab, setActiveTab] = useState<AudioProfileEditorTab>('standard')
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const profile = useAudioProfilesStore((state) =>
    selectedEntityId ? state.audioProfiles.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const updateAudioProfile = useAudioProfilesStore((state) => state.updateAudioProfile)
  const setTriggerMedia = useAudioProfilesStore((state) => state.setTriggerMedia)
  const addCustomTrigger = useAudioProfilesStore((state) => state.addCustomTrigger)
  const updateCustomTrigger = useAudioProfilesStore((state) => state.updateCustomTrigger)
  const setCustomTriggerMedia = useAudioProfilesStore((state) => state.setCustomTriggerMedia)
  const removeCustomTrigger = useAudioProfilesStore((state) => state.removeCustomTrigger)
  const removeAudioProfile = useAudioProfilesStore((state) => state.removeAudioProfile)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)

  if (!selectedEntityId || !profile) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Audio profile not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const standardFilled = countFilledStandardTriggers(profile.triggers)
  const customFilled = countFilledCustomTriggers(profile.customTriggers)
  const totalFilled = countFilledProfileTriggers(profile)
  const groupedTriggers = triggersByGroup()

  function handleRemove() {
    removeAudioProfile(profile!.id)
    removeTaxonomyEntity(profile!.id)
    closeEntityEditor()
  }

  function updateTrigger(triggerId: AudioTriggerId, mediaId: string | null) {
    setTriggerMedia(profile!.id, triggerId, mediaId)
  }

  return (
    <AdminEditorShell
      listLabel="Audio Profiles"
      itemTitle={profile.name}
      onBack={closeEntityEditor}
    >
      <p className="admin-editor-lead">
        Map voice triggers to audio clips from the media library. Characters link to a profile
        rather than a single file.
      </p>

      <label className="field">
        <span>Name</span>
        <input
          value={profile.name}
          onChange={(event) => updateAudioProfile(profile.id, { name: event.target.value })}
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          value={profile.description}
          onChange={(event) => updateAudioProfile(profile.id, { description: event.target.value })}
          rows={3}
        />
      </label>

      <AdminSectionNav sections={TRIGGER_TABS} active={activeTab} onChange={setActiveTab} />

      <p className="field-hint admin-audio-profile-summary">
        {activeTab === 'standard'
          ? `${standardFilled} of ${Object.keys(profile.triggers).length} standard triggers have audio assigned.`
          : `${customFilled} of ${profile.customTriggers.length} custom triggers have audio assigned.`}
        {' '}
        ({totalFilled} total with audio)
      </p>

      {activeTab === 'standard' ? (
        Object.entries(groupedTriggers).map(([groupId, definitions]) => (
          <fieldset key={groupId} className="admin-fieldset admin-audio-trigger-group">
            <legend>{AUDIO_TRIGGER_GROUP_LABELS[groupId as keyof typeof AUDIO_TRIGGER_GROUP_LABELS]}</legend>
            <div className="admin-audio-trigger-table-wrap">
              <table className="admin-audio-trigger-table">
                <thead>
                  <tr>
                    <th scope="col">Trigger</th>
                    <th scope="col">Audio</th>
                  </tr>
                </thead>
                <tbody>
                  {definitions.map((definition) => (
                    <tr key={definition.id}>
                      <td className="admin-audio-trigger-label">
                        <strong>{definition.label}</strong>
                        <span className="field-hint">{definition.description}</span>
                      </td>
                      <td>
                        <TriggerAudioCell
                          mediaId={profile.triggers[definition.id]}
                          onSelect={(mediaId) => updateTrigger(definition.id, mediaId)}
                          onClear={() => updateTrigger(definition.id, null)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </fieldset>
        ))
      ) : (
        <div className="admin-audio-custom-triggers">
          <div className="admin-audio-custom-triggers-toolbar">
            <button type="button" className="admin-secondary-button" onClick={() => addCustomTrigger(profile.id)}>
              Add custom trigger
            </button>
          </div>

          {profile.customTriggers.length === 0 ? (
            <p className="admin-empty admin-empty-inline">
              No custom triggers yet. Add project-specific events beyond the standard set.
            </p>
          ) : (
            <div className="admin-audio-trigger-table-wrap">
              <table className="admin-audio-trigger-table admin-audio-custom-trigger-table">
                <thead>
                  <tr>
                    <th scope="col">Trigger</th>
                    <th scope="col">Audio</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.customTriggers.map((trigger) => (
                    <tr key={trigger.id}>
                      <td className="admin-audio-custom-trigger-fields">
                        <label className="field admin-audio-custom-trigger-field">
                          <span>Name</span>
                          <input
                            value={trigger.label}
                            onChange={(event) =>
                              updateCustomTrigger(profile.id, trigger.id, { label: event.target.value })
                            }
                          />
                        </label>
                        <label className="field admin-audio-custom-trigger-field">
                          <span>Description</span>
                          <input
                            value={trigger.description}
                            placeholder="When this line should play"
                            onChange={(event) =>
                              updateCustomTrigger(profile.id, trigger.id, {
                                description: event.target.value,
                              })
                            }
                          />
                        </label>
                      </td>
                      <td>
                        <TriggerAudioCell
                          mediaId={trigger.mediaId}
                          onSelect={(mediaId) => setCustomTriggerMedia(profile.id, trigger.id, mediaId)}
                          onClear={() => setCustomTriggerMedia(profile.id, trigger.id, null)}
                        />
                      </td>
                      <td className="admin-audio-custom-trigger-actions">
                        <button
                          type="button"
                          className="admin-secondary-button admin-secondary-button-sm"
                          onClick={() => removeCustomTrigger(profile.id, trigger.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <TaxonomyEditorFields domain="audio-profiles" entityId={profile.id} />

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete profile
        </button>
      </div>
    </AdminEditorShell>
  )
}
