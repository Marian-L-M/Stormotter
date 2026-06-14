import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { ContainerLootEditor } from '../../components/admin/ContainerLootEditor'
import { ContainerUniqueItemsEditor } from '../../components/admin/ContainerUniqueItemsEditor'
import {
  CONTAINER_KIND_LABELS,
  CONTAINER_VISIBILITY_LABELS,
  containerKindUsesLootTable,
  containerKindUsesUniqueItems,
  getCharacterSlotLabel,
} from '../../admin/containerTypes'
import { getCharacterSlotDefinition } from '../../admin/characterSlotTypes'
import { isAutoProvisionedSlotContainer } from '../lists/ContainersListView'
import { useContainersStore } from '../../store/containersStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useEditorStore } from '../../store/editorStore'

export function ContainerEditorView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const container = useContainersStore((state) =>
    selectedEntityId ? state.containers.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const updateContainer = useContainersStore((state) => state.updateContainer)
  const removeContainer = useContainersStore((state) => state.removeContainer)
  const characters = useContentCatalogStore((state) => state.stubs.characters)

  if (!selectedEntityId || !container) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Container not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const isCharacterSlot = isAutoProvisionedSlotContainer(container)
  const slotDefinition = isCharacterSlot ? getCharacterSlotDefinition(container.slotKey) : undefined
  const linkedCharacter = container.characterId
    ? characters.find((entry) => entry.id === container.characterId)
    : undefined

  function handleRemove() {
    removeContainer(container!.id)
    closeEntityEditor()
  }

  return (
    <AdminEditorShell
      listLabel={CONTAINER_KIND_LABELS[container.kind]}
      itemTitle={isCharacterSlot ? getCharacterSlotLabel(container.slotKey) : container.name}
      onBack={closeEntityEditor}
    >
      <p className="admin-editor-lead">
        {container.kind === 'unique'
          ? 'Place specific unique item instances in this fixed container.'
          : container.kind === 'random'
            ? 'Define loot tables from generic item templates for generation scripts.'
            : 'Character slot container — slot layout is fixed; assign unique items below.'}
      </p>

      {isCharacterSlot ? (
        <dl className="mechanic-builder-inline-meta item-registry-meta">
          <div>
            <dt>Character</dt>
            <dd>{linkedCharacter?.title ?? container.characterId ?? '—'}</dd>
          </div>
          <div>
            <dt>Slot</dt>
            <dd>{getCharacterSlotLabel(container.slotKey)}</dd>
          </div>
          <div>
            <dt>Slot key</dt>
            <dd>
              <code>{container.slotKey}</code>
            </dd>
          </div>
          <div>
            <dt>Visibility</dt>
            <dd>{CONTAINER_VISIBILITY_LABELS[container.visibility]}</dd>
          </div>
        </dl>
      ) : (
        <>
          <label className="field">
            <span>Name</span>
            <input
              value={container.name}
              onChange={(event) => updateContainer(container.id, { name: event.target.value })}
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              className="admin-textarea"
              rows={3}
              value={container.description}
              onChange={(event) => updateContainer(container.id, { description: event.target.value })}
            />
          </label>

          <label className="field">
            <span>Container type</span>
            <input
              className="admin-select admin-select-block"
              value={CONTAINER_KIND_LABELS[container.kind]}
              disabled
            />
          </label>
        </>
      )}

      {isCharacterSlot && slotDefinition ? (
        <label className="field">
          <span>Slot description</span>
          <textarea className="admin-textarea" rows={2} value={slotDefinition.description} disabled />
        </label>
      ) : null}

      {containerKindUsesLootTable(container.kind) ? (
        <ContainerLootEditor
          entries={container.lootEntries}
          onChange={(lootEntries) => updateContainer(container.id, { lootEntries })}
        />
      ) : null}

      {containerKindUsesUniqueItems(container.kind) ? (
        <ContainerUniqueItemsEditor containerId={container.id} />
      ) : null}

      {!isCharacterSlot ? (
        <div className="admin-editor-actions">
          <button type="button" className="admin-danger-button" onClick={handleRemove}>
            Delete container
          </button>
        </div>
      ) : null}
    </AdminEditorShell>
  )
}
