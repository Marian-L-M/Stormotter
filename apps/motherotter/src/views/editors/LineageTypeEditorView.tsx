import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { DiceRollInput } from '../../components/admin/DiceRollInput'
import { EntityLevelAttributeFields } from '../../components/admin/EntityLevelAttributeFields'
import { LevelAbilityEditor } from '../../components/admin/LevelAbilityEditor'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import {
  LINEAGE_STAT_KEYS,
  LINEAGE_STAT_LABELS,
  type LineageStatKey,
} from '../../admin/lineageTypes'
import { useAttributesStore } from '../../store/attributesStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useLineageTypesStore } from '../../store/lineageTypesStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'
import { DerivedStatBaseEditor } from '../../components/admin/DerivedStatBaseEditor'
import { DerivedStatModifierEditor } from '../../components/admin/DerivedStatModifierEditor'
import { SlotRulesEditor, HiddenInventoryToggleField } from '../../components/admin/SlotRulesEditor'

export function LineageTypeEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const lineageType = useLineageTypesStore((state) =>
    selectedEntityId ? state.lineageTypes.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const updateLineageType = useLineageTypesStore((state) => state.updateLineageType)
  const removeLineageType = useLineageTypesStore((state) => state.removeLineageType)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)
  const removeAttributeEntity = useAttributesStore((state) => state.removeEntity)
  const abilities = useContentCatalogStore((state) => state.stubs.abilities)

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

  function updateStatRange(stat: LineageStatKey, field: 'min' | 'max', value: number) {
    if (!Number.isFinite(value)) return
    updateLineageType(lineageType!.id, {
      statRanges: {
        ...lineageType!.statRanges,
        [stat]: {
          ...lineageType!.statRanges[stat],
          [field]: value,
        },
      },
    })
  }

  function handleRemove() {
    if (!lineageType) return
    removeLineageType(lineageType.id)
    removeTaxonomyEntity(lineageType.id)
    removeAttributeEntity(lineageType.id)
    closeEntityEditor()
  }

  return (
    <AdminEditorShell
      listLabel="Character Types"
      itemTitle={lineageType.name}
      onBack={closeEntityEditor}
    >
      <p className="admin-editor-lead">
        Character types define allowed stat ranges and innate abilities for each lineage.
      </p>

      <label className="field">
        <span>Name</span>
        <input
          value={lineageType.name}
          onChange={(event) => updateLineageType(lineageType.id, { name: event.target.value })}
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          className="admin-textarea"
          rows={3}
          value={lineageType.description}
          placeholder="Lore, physiology, and cultural notes for this type…"
          onChange={(event) =>
            updateLineageType(lineageType.id, { description: event.target.value })
          }
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
                value={lineageType.statRanges[stat].min}
                onChange={(event) => updateStatRange(stat, 'min', Number(event.target.value))}
              />
              <input
                type="number"
                className="admin-stat-range-input"
                value={lineageType.statRanges[stat].max}
                onChange={(event) => updateStatRange(stat, 'max', Number(event.target.value))}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Hit point bonus dice</legend>
        <DiceRollInput
          value={lineageType.hitPointBonusDice}
          onChange={(hitPointBonusDice) =>
            updateLineageType(lineageType.id, { hitPointBonusDice })
          }
          allowEmpty
          hint="Extra dice added to class hit die when rolling HP. Set dice count to 0 for none."
        />
      </fieldset>

      <LevelAbilityEditor
        label="Type abilities by level"
        grants={lineageType.levelAbilities}
        abilities={abilities}
        onChange={(levelAbilities) => updateLineageType(lineageType.id, { levelAbilities })}
        hint="Abilities unlock when a character of this type reaches each level."
      />

      <EntityLevelAttributeFields
        entityId={lineageType.id}
        entityLabel="character type"
        hint="Add innate attributes at level 1, then unlock more at higher levels — same pattern as abilities."
      />

      <DerivedStatBaseEditor
        value={lineageType.derivedStatBases}
        onChange={(derivedStatBases) => updateLineageType(lineageType.id, { derivedStatBases })}
        inheritHint="Type base overrides class default, but is overridden by character-specific bases."
      />

      <DerivedStatModifierEditor
        value={lineageType.derivedStatModifiers}
        onChange={(derivedStatModifiers) =>
          updateLineageType(lineageType.id, { derivedStatModifiers })
        }
        legend="Type derived stat modifiers"
        hint="Bonuses from this character type stacked with class, character, items, attributes, and abilities."
      />

      <TaxonomyEditorFields domain="character-types" entityId={lineageType.id} />

      <SlotRulesEditor
        value={lineageType.slotRules}
        onChange={(slotRules) => updateLineageType(lineageType.id, { slotRules })}
        inheritLabel="Inherit from class defaults"
      />

      <HiddenInventoryToggleField
        value={lineageType.hiddenInventoryActivatesUnequipped}
        onChange={(hiddenInventoryActivatesUnequipped) =>
          updateLineageType(lineageType.id, { hiddenInventoryActivatesUnequipped })
        }
      />

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete character type
        </button>
      </div>
    </AdminEditorShell>
  )
}
