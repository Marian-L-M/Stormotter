import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { DiceRollInput } from '../../components/admin/DiceRollInput'
import { EntityLevelAttributeFields } from '../../components/admin/EntityLevelAttributeFields'
import { LevelAbilityEditor } from '../../components/admin/LevelAbilityEditor'
import { StringListEditor } from '../../components/admin/StringListEditor'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useAttributesStore } from '../../store/attributesStore'
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'
import { useEditorStore } from '../../store/editorStore'

export function CharacterClassEditorView() {
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
  const abilities = useContentCatalogStore((state) => state.stubs.abilities)

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

  function handleRemove() {
    if (!characterClass) return
    removeCharacterClass(characterClass.id)
    removeTaxonomyEntity(characterClass.id)
    removeAttributeEntity(characterClass.id)
    closeEntityEditor()
  }

  return (
    <AdminEditorShell
      listLabel="Character Classes"
      itemTitle={characterClass.name}
      onBack={closeEntityEditor}
    >
      <p className="admin-editor-lead">
        Character classes define jobs, roles, and combat styles such as warrior, mage, or rogue.
      </p>

      <label className="field">
        <span>Name</span>
        <input
          value={characterClass.name}
          onChange={(event) =>
            updateCharacterClass(characterClass.id, { name: event.target.value })
          }
        />
      </label>

      <label className="field">
        <span>Description</span>
        <textarea
          className="admin-textarea"
          rows={3}
          value={characterClass.description}
          placeholder="Training, equipment, and role notes for this class…"
          onChange={(event) =>
            updateCharacterClass(characterClass.id, { description: event.target.value })
          }
        />
      </label>

      <fieldset className="admin-fieldset">
        <legend>Hit dice</legend>
        <DiceRollInput
          value={characterClass.hitDice}
          onChange={(hitDice) => updateCharacterClass(characterClass.id, { hitDice })}
          hitDiePreset
          hint="Per-level hit die rolled when gaining levels (BG2-style d4–d12)."
        />
      </fieldset>

      <StringListEditor
        label="Distinct features"
        items={characterClass.distinctFeatures ?? []}
        onChange={(distinctFeatures) =>
          updateCharacterClass(characterClass.id, { distinctFeatures })
        }
        placeholder="e.g. Heavy armor proficiency, spell focus bonus…"
        addLabel="Add feature"
      />

      <LevelAbilityEditor
        label="Class abilities by level"
        grants={characterClass.levelAbilities}
        abilities={abilities}
        onChange={(levelAbilities) =>
          updateCharacterClass(characterClass.id, { levelAbilities })
        }
        hint="Abilities unlock when a character of this class reaches each level."
      />

      <EntityLevelAttributeFields
        entityId={characterClass.id}
        entityLabel="character class"
        hint="Add base class attributes at level 1, then unlock more at higher levels — same pattern as abilities."
      />

      <TaxonomyEditorFields domain="character-classes" entityId={characterClass.id} />

      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete character class
        </button>
      </div>
    </AdminEditorShell>
  )
}
