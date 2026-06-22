import { useState } from 'react'
import {
  CHARACTER_CATEGORY_LABELS,
  CHARACTER_CATEGORY_ORDER,
  characterHasGroupFlags,
  characterHasMainFlag,
  characterSupportsMapLocations,
  isUniqueNpcCharacter,
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
import { CharacterProgressionPanel } from '../../components/admin/CharacterProgressionPanel'
import { CharacterHitPointsFields } from '../../components/admin/CharacterHitPointsFields'
import { CharacterLevelAbilityFields } from '../../components/admin/CharacterLevelAbilityFields'
import { resolveCharacterSlotEnabled } from '../../admin/slotRules'
import { SlotRulesEditor } from '../../components/admin/SlotRulesEditor'
import { CharacterInventorySlotsPanel } from '../../components/admin/CharacterInventorySlotsPanel'
import { CharacterSlotItemsPanel } from '../../components/admin/CharacterSlotItemsPanel'
import { MediaPickerField } from '../../components/media/MediaPickerField'
import { CharacterMapSettingsPanel } from '../../components/admin/CharacterMapSettingsPanel'
import { EntityRendererEditorPanel } from '../../components/admin/EntityRendererEditorPanel'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { AdminSectionNav } from '../../components/admin/AdminSectionNav'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useAttributesStore } from '../../store/attributesStore'
import { useAiProfilesStore } from '../../store/aiProfilesStore'
import { useAudioProfilesStore } from '../../store/audioProfilesStore'
import { summarizeAiProfile } from '../../admin/aiProfileTypes'
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
  { id: 'renderer', label: 'Renderer' },
  { id: 'map', label: 'Map' },
  { id: 'levels', label: 'Levels' },
  { id: 'stats', label: 'Stats' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'inventory', label: 'Inventory' },
] as const

type CharacterEditorTab = (typeof CHARACTER_EDITOR_TABS)[number]['id']

interface CharacterEditorViewProps {
  overrideEntityId?: string
  variant?: 'page' | 'embedded'
  onBack?: () => void
}

export function CharacterEditorView({
  overrideEntityId,
  variant = 'page',
  onBack,
}: CharacterEditorViewProps = {}) {
  const [activeTab, setActiveTab] = useState<CharacterEditorTab>('details')
  const [activeSlotContainerId, setActiveSlotContainerId] = useState<string | null>(null)
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const entityId = overrideEntityId ?? selectedEntityId
  const handleBack = onBack ?? closeEntityEditor
  const item = useContentCatalogStore((state) =>
    entityId ? state.stubs.characters.find((entry) => entry.id === entityId) : undefined,
  )
  const updateItem = useContentCatalogStore((state) => state.updateItem)
  const removeItem = useContentCatalogStore((state) => state.removeItem)
  const storedMeta = useCharacterMetaStore((state) =>
    entityId ? state.metaByCharacterId[entityId] : undefined,
  )
  const updateMeta = useCharacterMetaStore((state) => state.updateMeta)
  const removeMeta = useCharacterMetaStore((state) => state.removeMeta)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)
  const removeAttributeEntity = useAttributesStore((state) => state.removeEntity)
  const removeAbilityEntity = useAbilitiesStore((state) => state.removeEntity)
  const removeCharacterInventory = useContainersStore((state) => state.removeCharacterInventory)
  const clearContainerFromItems = useItemsStore((state) => state.clearContainerFromItems)
  const ensureCharacterInventory = useContainersStore((state) => state.ensureCharacterInventory)
  const lineageTypes = useLineageTypesStore((state) => state.lineageTypes)
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)
  const audioProfiles = useAudioProfilesStore((state) => state.audioProfiles)
  const aiProfiles = useAiProfilesStore((state) => state.aiProfiles)

  if (!entityId || !item) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Character not found.</p>
        <button type="button" onClick={handleBack}>
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
  const linkedAiProfile = meta.aiProfileId
    ? aiProfiles.find((entry) => entry.id === meta.aiProfileId)
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
    removeAbilityEntity(character.id)
    if (variant === 'page') {
      closeEntityEditor()
    } else {
      handleBack()
    }
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

            {characterHasMainFlag(meta.characterType) ? (
              <label className="field admin-checkbox-field">
                <input
                  type="checkbox"
                  checked={meta.isMain}
                  onChange={(event) => updateMeta(character.id, { isMain: event.target.checked })}
                />
                <span>Main character</span>
              </label>
            ) : null}

            {characterHasGroupFlags(meta.characterType) ? (
              <>
                <label className="field admin-checkbox-field">
                  <input
                    type="checkbox"
                    checked={meta.isInGroup}
                    onChange={(event) => updateMeta(character.id, { isInGroup: event.target.checked })}
                  />
                  <span>In group</span>
                </label>
                <label className="field admin-checkbox-field">
                  <input
                    type="checkbox"
                    checked={meta.isGroupAddable}
                    onChange={(event) =>
                      updateMeta(character.id, { isGroupAddable: event.target.checked })
                    }
                  />
                  <span>Group addable</span>
                </label>
              </>
            ) : null}

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
              <span>AI profile</span>
              <select
                className="admin-select admin-select-block"
                value={meta.aiProfileId ?? ''}
                onChange={(event) =>
                  updateMeta(character.id, { aiProfileId: event.target.value || null })
                }
              >
                <option value="">Unassigned</option>
                {aiProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <span className="field-hint">
                Battle behavior preset for combat and fight preview. Create profiles under Mechanics
                → AI.
              </span>
              {linkedAiProfile ? (
                <span className="field-hint">{summarizeAiProfile(linkedAiProfile)}</span>
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

      case 'renderer':
        return (
          <EntityRendererEditorPanel
            value={meta.renderer}
            defaultGlyph="@"
            entityLabel="character"
            onChange={(renderer) => updateMeta(character.id, { renderer })}
          />
        )

      case 'map':
        if (!characterSupportsMapLocations(meta.characterType)) {
          return (
            <p className="admin-empty">
              Map locations are only available for user-generated and unique NPC characters.
            </p>
          )
        }
        return (
          <>
            <p className="admin-editor-lead">
              Configure where this character appears on the map, plus conditional spawn and despawn
              locations driven by gameplay state.
            </p>
            <CharacterMapSettingsPanel
              characterId={character.id}
              characterType={meta.characterType}
              activeLocation={meta.activeLocation}
              spawnLocationRules={meta.spawnLocationRules}
              despawnLocationRules={meta.despawnLocationRules}
              onChange={(patch) => updateMeta(character.id, patch)}
              onClearActiveLocation={() => {
                if (isUniqueNpcCharacter(meta.characterType)) {
                  useEditorStore.getState().removeCharacterGridPlacement(character.id)
                }
              }}
            />
          </>
        )

      case 'levels':
        return (
          <>
            <p className="admin-editor-lead">
              Multi-class progression, XP tracks, and hit points. Total level is the sum of class
              levels. Points grant immediately on level-up.
            </p>
            <CharacterProgressionPanel
              characterId={character.id}
              meta={meta}
              characterClasses={characterClasses}
            />
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
              characterId={character.id}
              characterLevel={meta.level}
              typeId={meta.lineageTypeId}
              classId={meta.classId}
              typeName={linkedLineageType?.name}
              className={linkedCharacterClass?.name}
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

  const editorTabs = CHARACTER_EDITOR_TABS.filter(
    (tab) => tab.id !== 'map' || characterSupportsMapLocations(meta.characterType),
  )

  const tabContent = (
    <>
      <AdminSectionNav sections={[...editorTabs]} active={activeTab} onChange={handleTabChange} />
      {renderTabContent()}
    </>
  )

  if (variant === 'embedded') {
    return <div className="admin-editor-embedded">{tabContent}</div>
  }

  return (
    <AdminEditorShell listLabel="Characters" itemTitle={character.title} onBack={handleBack}>
      {tabContent}
    </AdminEditorShell>
  )
}
