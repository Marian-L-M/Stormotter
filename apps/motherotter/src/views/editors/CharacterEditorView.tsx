import { useState } from 'react'
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
import { CharacterDerivedStatsPanel } from '../../components/admin/CharacterDerivedStatsPanel'
import { CharacterHitPointsFields } from '../../components/admin/CharacterHitPointsFields'
import { CharacterLevelAbilityFields } from '../../components/admin/CharacterLevelAbilityFields'
import { resolveCharacterSlotEnabled } from '../../admin/slotRules'
import { SlotRulesEditor } from '../../components/admin/SlotRulesEditor'
import { CharacterInventorySlotsPanel } from '../../components/admin/CharacterInventorySlotsPanel'
import { CharacterSlotItemsPanel } from '../../components/admin/CharacterSlotItemsPanel'
import { MediaPickerField } from '../../components/media/MediaPickerField'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { AdminSectionNav } from '../../components/admin/AdminSectionNav'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { useAttributesStore } from '../../store/attributesStore'
import { useAudioProfilesStore } from '../../store/audioProfilesStore'
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { useCharacterMetaStore, DEFAULT_META } from '../../store/characterMetaStore'
import { useContainersStore } from '../../store/containersStore'
import { useItemsStore } from '../../store/itemsStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useLineageTypesStore } from '../../store/lineageTypesStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

const CHARACTER_EDITOR_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'levels', label: 'Levels' },
  { id: 'stats', label: 'Stats' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'inventory', label: 'Inventory' },
] as const

type CharacterEditorTab = (typeof CHARACTER_EDITOR_TABS)[number]['id']

export function CharacterEditorView() {
  const [activeTab, setActiveTab] = useState<CharacterEditorTab>('details')
  const [activeSlotContainerId, setActiveSlotContainerId] = useState<string | null>(null)
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
  const removeCharacterInventory = useContainersStore((state) => state.removeCharacterInventory)
  const clearContainerFromItems = useItemsStore((state) => state.clearContainerFromItems)
  const ensureCharacterInventory = useContainersStore((state) => state.ensureCharacterInventory)
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

  const character = item
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
    for (const containerId of removeCharacterInventory(character.id)) {
      clearContainerFromItems(containerId)
    }
    removeItem('characters', character.id)
    removeMeta(character.id)
    removeTaxonomyEntity(character.id)
    removeAttributeEntity(character.id)
    closeEntityEditor()
  }

  function updateStat(stat: LineageStatKey, rawValue: string) {
    const trimmed = rawValue.trim()
    const nextValue = trimmed === '' ? null : Number(trimmed)
    if (trimmed !== '' && !Number.isFinite(nextValue)) return

    updateMeta(character.id, {
      stats: {
        ...meta.stats,
        [stat]: nextValue,
      },
    })
  }

  function handleTitleChange(title: string) {
    updateItem('characters', character.id, { title })
    ensureCharacterInventory(character.id, title)
  }

  function handleTabChange(tab: CharacterEditorTab) {
    setActiveTab(tab)
    if (tab !== 'inventory') {
      setActiveSlotContainerId(null)
    }
    if (tab === 'inventory') {
      ensureCharacterInventory(character.id, character.title)
    }
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'details':
        return (
          <>
            <p className="admin-editor-lead">
              Character definitions for user-created, unique NPC, and random characters.
            </p>

            <label className="field">
              <span>Title</span>
              <input value={character.title} onChange={(event) => handleTitleChange(event.target.value)} />
            </label>

            <label className="field">
              <span>Character category</span>
              <select
                className="admin-select admin-select-block"
                value={meta.characterType}
                onChange={(event) =>
                  updateMeta(character.id, {
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
                  updateMeta(character.id, { lineageTypeId: event.target.value || null })
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
                  updateMeta(character.id, { classId: event.target.value || null })
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
              onChange={(portraitMediaId) => updateMeta(character.id, { portraitMediaId })}
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
                  updateMeta(character.id, { audioProfileId: event.target.value || null })
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
                Reusable voice set with event triggers. Create profiles under Assets → Audio
                Profiles.
              </span>
              {linkedAudioProfile ? (
                <span className="field-hint">
                  {countFilledProfileTriggers(linkedAudioProfile)} triggers have audio assigned.
                </span>
              ) : null}
            </label>

            <label className="field">
              <span>Summary</span>
              <textarea
                className="admin-textarea"
                rows={4}
                value={meta.summary}
                placeholder="Optional notes for this character…"
                onChange={(event) => updateMeta(character.id, { summary: event.target.value })}
              />
            </label>

            <TaxonomyEditorFields domain="characters" entityId={character.id} />

            <div className="admin-editor-actions">
              <button type="button" className="admin-danger-button" onClick={handleRemove}>
                Delete character
              </button>
            </div>
          </>
        )

      case 'levels':
        return (
          <>
            <p className="admin-editor-lead">
              Character level and hit points. Derived values use the linked class hit die and type
              bonus dice unless overridden.
            </p>
            <CharacterHitPointsFields
              meta={meta}
              linkedClass={linkedCharacterClass}
              linkedLineageType={linkedLineageType}
              onChange={(patch) => updateMeta(character.id, patch)}
            />
          </>
        )

      case 'stats':
        return (
          <>
            <p className="admin-editor-lead">
              Core ability scores for this character. Suggested ranges come from the linked character
              type.
            </p>
            <fieldset className="admin-fieldset">
              <legend>Stats</legend>
              {!linkedLineageType ? (
                <p className="field-hint admin-empty-inline">
                  Assign a character type on the Details tab to see suggested racial stat ranges.
                  Values can still be set without a type.
                </p>
              ) : (
                <p className="field-hint admin-stat-range-note">
                  Suggested ranges from {linkedLineageType.name}. Values outside the range are
                  allowed.
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

            <CharacterDerivedStatsPanel
              characterId={character.id}
              meta={meta}
              linkedLineageType={linkedLineageType}
              linkedCharacterClass={linkedCharacterClass}
              onChange={(patch) => updateMeta(character.id, patch)}
            />
          </>
        )

      case 'abilities':
        return (
          <>
            <p className="admin-editor-lead">
              Abilities granted to this character by level, including inherited type and class
              grants.
            </p>
            <CharacterLevelAbilityFields
              characterLevel={meta.level}
              typeGrants={linkedLineageType?.levelAbilities}
              classGrants={linkedCharacterClass?.levelAbilities}
              characterGrants={meta.levelAbilities}
              typeName={linkedLineageType?.name}
              className={linkedCharacterClass?.name}
              abilities={abilities}
              onChange={(levelAbilities) => updateMeta(character.id, { levelAbilities })}
            />
          </>
        )

      case 'attributes':
        return (
          <>
            <p className="admin-editor-lead">
              Character-specific attributes and slot availability overrides. Attributes stack with
              type and class; slot rules override inherited type and class settings.
            </p>
            <CharacterAttributeFields
              characterId={character.id}
              characterLevel={meta.level}
              lineageTypeId={meta.lineageTypeId}
              classId={meta.classId}
              lineageTypeName={linkedLineageType?.name}
              className={linkedCharacterClass?.name}
            />
            <SlotRulesEditor
              value={meta.slotRules}
              onChange={(slotRules) => updateMeta(character.id, { slotRules })}
              inheritLabel="Inherit from type/class"
            />
          </>
        )

      case 'inventory':
        if (activeSlotContainerId) {
          return (
            <CharacterSlotItemsPanel
              containerId={activeSlotContainerId}
              onBack={() => setActiveSlotContainerId(null)}
            />
          )
        }
        return (
          <CharacterInventorySlotsPanel
            characterId={character.id}
            activeMainHandSlot={meta.activeMainHandSlot}
            activeOffHandSlot={meta.activeOffHandSlot}
            slotEnabled={(slotKey) =>
              resolveCharacterSlotEnabled(
                slotKey,
                linkedLineageType,
                linkedCharacterClass,
                meta.slotRules,
              )
            }
            onSlotClick={(containerId) => setActiveSlotContainerId(containerId)}
            onSetActiveMainHand={(index) => updateMeta(character.id, { activeMainHandSlot: index })}
            onSetActiveOffHand={(index) => updateMeta(character.id, { activeOffHandSlot: index })}
          />
        )
    }
  }

  return (
    <AdminEditorShell listLabel="Characters" itemTitle={character.title} onBack={closeEntityEditor}>
      <AdminSectionNav sections={[...CHARACTER_EDITOR_TABS]} active={activeTab} onChange={handleTabChange} />
      {renderTabContent()}
    </AdminEditorShell>
  )
}
