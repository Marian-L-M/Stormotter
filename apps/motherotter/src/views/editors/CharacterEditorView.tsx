import {
  CHARACTER_CATEGORY_LABELS,
  CHARACTER_CATEGORY_ORDER,
  type CharacterCategory,
} from '../../admin/characterTypes'
import {
  LINEAGE_STAT_KEYS,
  LINEAGE_STAT_LABELS,
  formatStatRange,
  isStatOutsideRange,
  type LineageStatKey,
} from '../../admin/lineageTypes'
import { countFilledProfileTriggers } from '../../admin/audioProfileTypes'
import { CharacterAttributeFields } from '../../components/admin/CharacterAttributeFields'
import { CharacterHitPointsFields } from '../../components/admin/CharacterHitPointsFields'
import { CharacterLevelAbilityFields } from '../../components/admin/CharacterLevelAbilityFields'
import { MediaPickerField } from '../../components/media/MediaPickerField'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { useAttributesStore } from '../../store/attributesStore'
import { useAudioProfilesStore } from '../../store/audioProfilesStore'
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { useCharacterMetaStore, DEFAULT_META } from '../../store/characterMetaStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useLineageTypesStore } from '../../store/lineageTypesStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

export function CharacterEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const item = useContentCatalogStore((state) =>
    selectedEntityId
      ? state.stubs.characters.find((entry) => entry.id === selectedEntityId)
      : undefined,
  )
  const updateItem = useContentCatalogStore((state) => state.updateItem)
  const removeItem = useContentCatalogStore((state) => state.removeItem)
  const storedMeta = useCharacterMetaStore((state) =>
    selectedEntityId ? state.metaByCharacterId[selectedEntityId] : undefined,
  )
  const updateMeta = useCharacterMetaStore((state) => state.updateMeta)
  const removeMeta = useCharacterMetaStore((state) => state.removeMeta)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)
  const removeAttributeEntity = useAttributesStore((state) => state.removeEntity)
  const lineageTypes = useLineageTypesStore((state) => state.lineageTypes)
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)
  const audioProfiles = useAudioProfilesStore((state) => state.audioProfiles)
  const abilities = useContentCatalogStore((state) => state.stubs.abilities)

  if (!selectedEntityId || !item) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Character not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const meta = storedMeta ?? DEFAULT_META
  const linkedLineageType = meta.lineageTypeId
    ? lineageTypes.find((entry) => entry.id === meta.lineageTypeId)
    : undefined
  const linkedAudioProfile = meta.audioProfileId
    ? audioProfiles.find((entry) => entry.id === meta.audioProfileId)
    : undefined
  const linkedCharacterClass = meta.classId
    ? characterClasses.find((entry) => entry.id === meta.classId)
    : undefined

  function handleRemove() {
    if (!item) return
    removeItem('characters', item.id)
    removeMeta(item.id)
    removeTaxonomyEntity(item.id)
    removeAttributeEntity(item.id)
    closeEntityEditor()
  }

  function updateStat(stat: LineageStatKey, rawValue: string) {
    const trimmed = rawValue.trim()
    const nextValue = trimmed === '' ? null : Number(trimmed)
    if (trimmed !== '' && !Number.isFinite(nextValue)) return

    updateMeta(item!.id, {
      stats: {
        ...meta.stats,
        [stat]: nextValue,
      },
    })
  }

  return (
    <AdminEditorShell listLabel="Characters" itemTitle={item.title} onBack={closeEntityEditor}>
      <p className="admin-editor-lead">
        Character definitions for user-created, unique NPC, and random characters.
      </p>

      <label className="field">
        <span>Title</span>
        <input
          value={item.title}
          onChange={(event) => updateItem('characters', item.id, { title: event.target.value })}
        />
      </label>

      <label className="field">
        <span>Character category</span>
        <select
          className="admin-select admin-select-block"
          value={meta.characterType}
          onChange={(event) =>
            updateMeta(item.id, {
              characterType: event.target.value as CharacterCategory,
            })
          }
        >
          {CHARACTER_CATEGORY_ORDER.map((category) => (
            <option key={category} value={category}>
              {CHARACTER_CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Character type</span>
        <select
          className="admin-select admin-select-block"
          value={meta.lineageTypeId ?? ''}
          onChange={(event) =>
            updateMeta(item.id, { lineageTypeId: event.target.value || null })
          }
        >
          <option value="">Unassigned</option>
          {lineageTypes.map((lineageType) => (
            <option key={lineageType.id} value={lineageType.id}>
              {lineageType.name}
            </option>
          ))}
        </select>
        <span className="field-hint">Optional link to a lineage type (formerly race).</span>
      </label>

      <label className="field">
        <span>Character class</span>
        <select
          className="admin-select admin-select-block"
          value={meta.classId ?? ''}
          onChange={(event) =>
            updateMeta(item.id, { classId: event.target.value || null })
          }
        >
          <option value="">Unassigned</option>
          {characterClasses.map((characterClass) => (
            <option key={characterClass.id} value={characterClass.id}>
              {characterClass.name}
            </option>
          ))}
        </select>
        <span className="field-hint">Optional link to a job or role class.</span>
      </label>

      <MediaPickerField
        label="Portrait"
        value={meta.portraitMediaId}
        onChange={(portraitMediaId) => updateMeta(item.id, { portraitMediaId })}
        filter="image"
        hint="Character portrait image from the media library."
        modalTitle="Select portrait"
      />

      <label className="field">
        <span>Audio profile</span>
        <select
          className="admin-select admin-select-block"
          value={meta.audioProfileId ?? ''}
          onChange={(event) =>
            updateMeta(item.id, { audioProfileId: event.target.value || null })
          }
        >
          <option value="">Unassigned</option>
          {audioProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
        <span className="field-hint">
          Reusable voice set with event triggers. Create profiles under Assets → Audio Profiles.
        </span>
        {linkedAudioProfile ? (
          <span className="field-hint">
            {countFilledProfileTriggers(linkedAudioProfile)} triggers have audio assigned.
          </span>
        ) : null}
      </label>

      <CharacterHitPointsFields
        meta={meta}
        linkedClass={linkedCharacterClass}
        linkedLineageType={linkedLineageType}
        onChange={(patch) => updateMeta(item.id, patch)}
      />

      <CharacterLevelAbilityFields
        characterLevel={meta.level}
        typeGrants={linkedLineageType?.levelAbilities}
        classGrants={linkedCharacterClass?.levelAbilities}
        characterGrants={meta.levelAbilities}
        typeName={linkedLineageType?.name}
        className={linkedCharacterClass?.name}
        abilities={abilities}
        onChange={(levelAbilities) => updateMeta(item.id, { levelAbilities })}
      />

      <fieldset className="admin-fieldset">
        <legend>Stats</legend>
        {!linkedLineageType ? (
          <p className="field-hint admin-empty-inline">
            Assign a character type to see suggested racial stat ranges. Values can still be set
            without a type.
          </p>
        ) : (
          <p className="field-hint admin-stat-range-note">
            Suggested ranges from {linkedLineageType.name}. Values outside the range are allowed.
          </p>
        )}
        <div className="admin-stat-range-grid admin-character-stat-grid">
          <div className="admin-stat-range-row admin-stat-range-headers admin-character-stat-headers">
            <span className="admin-stat-range-header">Stat</span>
            <span className="admin-stat-range-header">Suggested</span>
            <span className="admin-stat-range-header">Value</span>
          </div>
          {LINEAGE_STAT_KEYS.map((stat) => {
            const value = meta.stats[stat]
            const suggestedRange = linkedLineageType?.statRanges[stat]
            const outsideRange =
              suggestedRange !== undefined && isStatOutsideRange(value, suggestedRange)

            return (
              <div key={stat} className="admin-stat-range-row admin-character-stat-row">
                <span className="admin-stat-range-label">{LINEAGE_STAT_LABELS[stat]}</span>
                <span className="admin-stat-suggested">
                  {suggestedRange ? formatStatRange(suggestedRange) : '—'}
                </span>
                <input
                  type="number"
                  className={`admin-stat-range-input${outsideRange ? ' is-outside-range' : ''}`}
                  value={value ?? ''}
                  placeholder="—"
                  onChange={(event) => updateStat(stat, event.target.value)}
                />
              </div>
            )
          })}
        </div>
      </fieldset>

      <CharacterAttributeFields
        characterId={item.id}
        characterLevel={meta.level}
        lineageTypeId={meta.lineageTypeId}
        classId={meta.classId}
        lineageTypeName={linkedLineageType?.name}
        className={linkedCharacterClass?.name}
      />

      <label className="field">
        <span>Summary</span>
        <textarea
          className="admin-textarea"
          rows={4}
          value={meta.summary}
          placeholder="Optional notes for this character…"
          onChange={(event) => updateMeta(item.id, { summary: event.target.value })}
        />
      </label>

      <TaxonomyEditorFields domain="characters" entityId={item.id} />

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete character
        </button>
      </div>
    </AdminEditorShell>
  )
}
