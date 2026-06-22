import { useState } from 'react'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { EntityCastSlotsEditorPanel } from '../../components/admin/EntityCastSlotsEditorPanel'
import { ClassLevelProgressionEditor } from '../../components/admin/ClassLevelProgressionEditor'
import { AdminSectionNav } from '../../components/admin/AdminSectionNav'
import { DiceRollInput } from '../../components/admin/DiceRollInput'
import { EntityLevelAbilityFields } from '../../components/admin/EntityLevelAbilityFields'
import { EntityLevelAttributeFields } from '../../components/admin/EntityLevelAttributeFields'
import { EntityRendererEditorPanel } from '../../components/admin/EntityRendererEditorPanel'
import { StringListEditor } from '../../components/admin/StringListEditor'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useAttributesStore } from '../../store/attributesStore'
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'
import { DerivedStatBaseEditor } from '../../components/admin/DerivedStatBaseEditor'
import { DerivedStatModifierEditor } from '../../components/admin/DerivedStatModifierEditor'
import { SlotRulesEditor, HiddenInventoryToggleField } from '../../components/admin/SlotRulesEditor'

const CHARACTER_CLASS_EDITOR_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'progression', label: 'Progression' },
  { id: 'cast-slots', label: 'Cast slots' },
  { id: 'renderer', label: 'Renderer' },
] as const

type CharacterClassEditorTab = (typeof CHARACTER_CLASS_EDITOR_TABS)[number]['id']

export function CharacterClassEditorView() {
  const [activeTab, setActiveTab] = useState<CharacterClassEditorTab>('details')
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const characterClass = useCharacterClassesStore((state) =>
    selectedEntityId
      ? state.characterClasses.find((entry) => entry.id === selectedEntityId)
      : undefined,
  )
  const updateCharacterClass = useCharacterClassesStore((state) => state.updateCharacterClass)
  const removeCharacterClass = useCharacterClassesStore((state) => state.removeCharacterClass)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)
  const removeAttributeEntity = useAttributesStore((state) => state.removeEntity)
  const removeAbilityEntity = useAbilitiesStore((state) => state.removeEntity)

  if (!selectedEntityId || !characterClass) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Character class not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const cls = characterClass

  function handleRemove() {
    removeCharacterClass(cls.id)
    removeTaxonomyEntity(cls.id)
    removeAttributeEntity(cls.id)
    removeAbilityEntity(cls.id)
    closeEntityEditor()
  }

  function renderTabContent() {
    if (activeTab === 'renderer') {
      return (
        <EntityRendererEditorPanel
          value={cls.renderer}
          defaultGlyph="C"
          entityLabel="character class"
          onChange={(renderer) => updateCharacterClass(cls.id, { renderer })}
        />
      )
    }

    if (activeTab === 'progression') {
      return (
        <>
          <p className="admin-editor-lead">
            Per-level cumulative XP thresholds and point grants for this class. Auto-grants at each
            level can be configured alongside the legacy level ability/attribute fields on Details.
          </p>
          <ClassLevelProgressionEditor
            value={cls.levelProgression}
            onChange={(levelProgression) => updateCharacterClass(cls.id, { levelProgression })}
          />
        </>
      )
    }

    if (activeTab === 'cast-slots') {
      return (
        <EntityCastSlotsEditorPanel
          entityId={cls.id}
          entityKind="class"
          castSlotGrants={cls.castSlotGrants}
          assignableAbilityGrants={cls.assignableAbilityGrants}
          onCastSlotGrantsChange={(castSlotGrants) =>
            updateCharacterClass(cls.id, { castSlotGrants })
          }
          onAssignableAbilityGrantsChange={(assignableAbilityGrants) =>
            updateCharacterClass(cls.id, { assignableAbilityGrants })
          }
        />
      )
    }

    return (
      <>
        <p className="admin-editor-lead">
          Character classes define jobs, roles, and combat styles such as warrior, mage, or rogue.
        </p>

        <label className="field">
          <span>Name</span>
          <input
            value={cls.name}
            onChange={(event) => updateCharacterClass(cls.id, { name: event.target.value })}
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            className="admin-textarea"
            rows={3}
            value={cls.description}
            placeholder="Training, equipment, and role notes for this class…"
            onChange={(event) =>
              updateCharacterClass(cls.id, { description: event.target.value })
            }
          />
        </label>

        <fieldset className="admin-fieldset">
          <legend>Hit dice</legend>
          <DiceRollInput
            value={cls.hitDice}
            onChange={(hitDice) => updateCharacterClass(cls.id, { hitDice })}
            hitDiePreset
            hint="Per-level hit die rolled when gaining levels (BG2-style d4–d12)."
          />
        </fieldset>

        <StringListEditor
          label="Distinct features"
          items={cls.distinctFeatures ?? []}
          onChange={(distinctFeatures) => updateCharacterClass(cls.id, { distinctFeatures })}
          placeholder="e.g. Heavy armor proficiency, spell focus bonus…"
          addLabel="Add feature"
        />

        <EntityLevelAbilityFields
          entityId={cls.id}
          entityLabel="character class"
          hint="Abilities unlock when a character of this class reaches each level."
        />

        <EntityLevelAttributeFields
          entityId={cls.id}
          entityLabel="character class"
          hint="Add base class attributes at level 1, then unlock more at higher levels — same pattern as abilities."
        />

        <DerivedStatBaseEditor
          value={cls.derivedStatBases}
          onChange={(derivedStatBases) => updateCharacterClass(cls.id, { derivedStatBases })}
          inheritHint="Class base overrides type default, but is overridden by character-specific bases."
        />

        <DerivedStatModifierEditor
          value={cls.derivedStatModifiers}
          onChange={(derivedStatModifiers) =>
            updateCharacterClass(cls.id, { derivedStatModifiers })
          }
          legend="Class derived stat modifiers"
          hint="Bonuses from this class stacked with type, character, items, attributes, and abilities."
        />

        <TaxonomyEditorFields domain="character-classes" entityId={cls.id} />

        <SlotRulesEditor
          value={cls.slotRules}
          onChange={(slotRules) => updateCharacterClass(cls.id, { slotRules })}
          inheritLabel="Default (no parent rule)"
        />

        <HiddenInventoryToggleField
          value={cls.hiddenInventoryActivatesUnequipped}
          onChange={(hiddenInventoryActivatesUnequipped) =>
            updateCharacterClass(cls.id, { hiddenInventoryActivatesUnequipped })
          }
        />

        <div className="admin-editor-actions">
          <button type="button" className="admin-danger-button" onClick={handleRemove}>
            Delete character class
          </button>
        </div>
      </>
    )
  }

  return (
    <AdminEditorShell
      listLabel="Character Classes"
      itemTitle={cls.name}
      onBack={closeEntityEditor}
    >
      <AdminSectionNav
        sections={[...CHARACTER_CLASS_EDITOR_TABS]}
        active={activeTab}
        onChange={setActiveTab}
      />
      {renderTabContent()}
    </AdminEditorShell>
  )
}
