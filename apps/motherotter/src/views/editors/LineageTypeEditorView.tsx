import { useState } from 'react'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { AdminSectionNav } from '../../components/admin/AdminSectionNav'
import { DiceRollInput } from '../../components/admin/DiceRollInput'
import { EntityLevelAbilityFields } from '../../components/admin/EntityLevelAbilityFields'
import { EntityLevelAttributeFields } from '../../components/admin/EntityLevelAttributeFields'
import { EntityRendererEditorPanel } from '../../components/admin/EntityRendererEditorPanel'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import {
  LINEAGE_STAT_KEYS,
  LINEAGE_STAT_LABELS,
  type LineageStatKey,
} from '../../admin/lineageTypes'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useAttributesStore } from '../../store/attributesStore'
import { useLineageTypesStore } from '../../store/lineageTypesStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'
import { DerivedStatBaseEditor } from '../../components/admin/DerivedStatBaseEditor'
import { DerivedStatModifierEditor } from '../../components/admin/DerivedStatModifierEditor'
import { EntityCastSlotsEditorPanel } from '../../components/admin/EntityCastSlotsEditorPanel'
import { SlotRulesEditor, HiddenInventoryToggleField } from '../../components/admin/SlotRulesEditor'

const LINEAGE_TYPE_EDITOR_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'cast-slots', label: 'Cast slots' },
  { id: 'renderer', label: 'Renderer' },
] as const

type LineageTypeEditorTab = (typeof LINEAGE_TYPE_EDITOR_TABS)[number]['id']

export function LineageTypeEditorView() {
  const [activeTab, setActiveTab] = useState<LineageTypeEditorTab>('details')
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const lineageType = useLineageTypesStore((state) =>
    selectedEntityId ? state.lineageTypes.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const updateLineageType = useLineageTypesStore((state) => state.updateLineageType)
  const removeLineageType = useLineageTypesStore((state) => state.removeLineageType)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)
  const removeAttributeEntity = useAttributesStore((state) => state.removeEntity)
  const removeAbilityEntity = useAbilitiesStore((state) => state.removeEntity)

  if (!selectedEntityId || !lineageType) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Character type not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const type = lineageType

  function updateStatRange(stat: LineageStatKey, field: 'min' | 'max', value: number) {
    if (!Number.isFinite(value)) return
    updateLineageType(type.id, {
      statRanges: {
        ...type.statRanges,
        [stat]: {
          ...type.statRanges[stat],
          [field]: value,
        },
      },
    })
  }

  function handleRemove() {
    removeLineageType(type.id)
    removeTaxonomyEntity(type.id)
    removeAttributeEntity(type.id)
    removeAbilityEntity(type.id)
    closeEntityEditor()
  }

  function renderTabContent() {
    if (activeTab === 'renderer') {
      return (
        <EntityRendererEditorPanel
          value={type.renderer}
          defaultGlyph="T"
          entityLabel="character type"
          onChange={(renderer) => updateLineageType(type.id, { renderer })}
        />
      )
    }

    if (activeTab === 'cast-slots') {
      return (
        <EntityCastSlotsEditorPanel
          entityId={type.id}
          entityKind="type"
          castSlotGrants={type.castSlotGrants}
          assignableAbilityGrants={type.assignableAbilityGrants}
          onCastSlotGrantsChange={(castSlotGrants) => updateLineageType(type.id, { castSlotGrants })}
          onAssignableAbilityGrantsChange={(assignableAbilityGrants) =>
            updateLineageType(type.id, { assignableAbilityGrants })
          }
        />
      )
    }

    return (
      <>
        <p className="admin-editor-lead">
          Character types define allowed stat ranges and innate abilities for each lineage.
        </p>

        <label className="field">
          <span>Name</span>
          <input
            value={type.name}
            onChange={(event) => updateLineageType(type.id, { name: event.target.value })}
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            className="admin-textarea"
            rows={3}
            value={type.description}
            placeholder="Lore, physiology, and cultural notes for this type…"
            onChange={(event) => updateLineageType(type.id, { description: event.target.value })}
          />
        </label>

        <fieldset className="admin-fieldset">
          <legend>Stat ranges</legend>
          <div className="admin-stat-range-grid">
            <div className="admin-stat-range-row admin-stat-range-headers">
              <span className="admin-stat-range-header">Stat</span>
              <span className="admin-stat-range-header">Minimum</span>
              <span className="admin-stat-range-header">Maximum</span>
            </div>
            {LINEAGE_STAT_KEYS.map((stat) => (
              <div key={stat} className="admin-stat-range-row">
                <span className="admin-stat-range-label">{LINEAGE_STAT_LABELS[stat]}</span>
                <input
                  type="number"
                  className="admin-stat-range-input"
                  value={type.statRanges[stat].min}
                  onChange={(event) => updateStatRange(stat, 'min', Number(event.target.value))}
                />
                <input
                  type="number"
                  className="admin-stat-range-input"
                  value={type.statRanges[stat].max}
                  onChange={(event) => updateStatRange(stat, 'max', Number(event.target.value))}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Hit point bonus dice</legend>
          <DiceRollInput
            value={type.hitPointBonusDice}
            onChange={(hitPointBonusDice) => updateLineageType(type.id, { hitPointBonusDice })}
            allowEmpty
            hint="Extra dice added to class hit die when rolling HP. Set dice count to 0 for none."
          />
        </fieldset>

        <EntityLevelAbilityFields
          entityId={type.id}
          entityLabel="character type"
          hint="Abilities unlock when a character of this type reaches each level."
        />

        <EntityLevelAttributeFields
          entityId={type.id}
          entityLabel="character type"
          hint="Add innate attributes at level 1, then unlock more at higher levels — same pattern as abilities."
        />

        <DerivedStatBaseEditor
          value={type.derivedStatBases}
          onChange={(derivedStatBases) => updateLineageType(type.id, { derivedStatBases })}
          inheritHint="Type base overrides class default, but is overridden by character-specific bases."
        />

        <DerivedStatModifierEditor
          value={type.derivedStatModifiers}
          onChange={(derivedStatModifiers) =>
            updateLineageType(type.id, { derivedStatModifiers })
          }
          legend="Type derived stat modifiers"
          hint="Bonuses from this character type stacked with class, character, items, attributes, and abilities."
        />

        <TaxonomyEditorFields domain="character-types" entityId={type.id} />

        <SlotRulesEditor
          value={type.slotRules}
          onChange={(slotRules) => updateLineageType(type.id, { slotRules })}
          inheritLabel="Inherit from class defaults"
        />

        <HiddenInventoryToggleField
          value={type.hiddenInventoryActivatesUnequipped}
          onChange={(hiddenInventoryActivatesUnequipped) =>
            updateLineageType(type.id, { hiddenInventoryActivatesUnequipped })
          }
        />

        <div className="admin-editor-actions">
          <button type="button" className="admin-danger-button" onClick={handleRemove}>
            Delete character type
          </button>
        </div>
      </>
    )
  }

  return (
    <AdminEditorShell
      listLabel="Character Types"
      itemTitle={type.name}
      onBack={closeEntityEditor}
    >
      <AdminSectionNav
        sections={[...LINEAGE_TYPE_EDITOR_TABS]}
        active={activeTab}
        onChange={setActiveTab}
      />
      {renderTabContent()}
    </AdminEditorShell>
  )
}
