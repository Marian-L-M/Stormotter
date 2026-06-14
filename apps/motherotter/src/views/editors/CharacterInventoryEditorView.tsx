import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { CharacterInventorySlotsPanel } from '../../components/admin/CharacterInventorySlotsPanel'
import { resolveCharacterSlotEnabled } from '../../admin/slotRules'
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { useCharacterMetaStore, DEFAULT_META } from '../../store/characterMetaStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useLineageTypesStore } from '../../store/lineageTypesStore'
import { useEditorStore } from '../../store/editorStore'

export function CharacterInventoryEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)
  const updateMeta = useCharacterMetaStore((state) => state.updateMeta)
  const character = useContentCatalogStore((state) =>
    selectedEntityId
      ? state.stubs.characters.find((entry) => entry.id === selectedEntityId)
      : undefined,
  )
  const meta = useCharacterMetaStore((state) =>
    selectedEntityId ? state.metaByCharacterId[selectedEntityId] ?? DEFAULT_META : DEFAULT_META,
  )
  const lineageTypes = useLineageTypesStore((state) => state.lineageTypes)
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)

  if (!selectedEntityId || !character) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Character not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const linkedLineageType = meta.lineageTypeId
    ? lineageTypes.find((entry) => entry.id === meta.lineageTypeId)
    : undefined
  const linkedCharacterClass = meta.classId
    ? characterClasses.find((entry) => entry.id === meta.classId)
    : undefined

  return (
    <AdminEditorShell
      listLabel="Character Inventories"
      itemTitle={character.title}
      onBack={closeEntityEditor}
    >
      <p className="field-hint">
        Tip: open this character in Characters and use the Inventory tab for the same view while
        editing character details.
      </p>
      <CharacterInventorySlotsPanel
        characterId={character.id}
        activeMainHandSlot={meta.activeMainHandSlot}
        activeOffHandSlot={meta.activeOffHandSlot}
        slotEnabled={(slotKey) =>
          resolveCharacterSlotEnabled(slotKey, linkedLineageType, linkedCharacterClass, meta.slotRules)
        }
        onSlotClick={openEntityEditor}
        onSetActiveMainHand={(index) => updateMeta(character.id, { activeMainHandSlot: index })}
        onSetActiveOffHand={(index) => updateMeta(character.id, { activeOffHandSlot: index })}
      />
    </AdminEditorShell>
  )
}
