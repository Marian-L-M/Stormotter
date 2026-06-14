import { ContainerUniqueItemsEditor } from './ContainerUniqueItemsEditor'
import { CONTAINER_VISIBILITY_LABELS, getCharacterSlotLabel } from '../../admin/containerTypes'
import { getCharacterSlotDefinition } from '../../admin/characterSlotTypes'
import { useContainersStore } from '../../store/containersStore'

interface CharacterSlotItemsPanelProps {
  containerId: string
  onBack: () => void
}

export function CharacterSlotItemsPanel({ containerId, onBack }: CharacterSlotItemsPanelProps) {
  const container = useContainersStore((state) =>
    state.containers.find((entry) => entry.id === containerId),
  )
  const slotDefinition = container?.slotKey ? getCharacterSlotDefinition(container.slotKey) : undefined

  if (!container) {
    return (
      <>
        <p className="admin-empty">Slot not found.</p>
        <button type="button" className="admin-secondary-button" onClick={onBack}>
          Back to slots
        </button>
      </>
    )
  }

  return (
    <>
      <div className="admin-breadcrumb">
        <button type="button" className="admin-breadcrumb-link" onClick={onBack}>
          Inventory
        </button>
        <span className="admin-breadcrumb-sep">/</span>
        <span className="admin-breadcrumb-current">
          {getCharacterSlotLabel(container.slotKey)}
        </span>
      </div>

      <dl className="mechanic-builder-inline-meta item-registry-meta">
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

      {slotDefinition ? (
        <label className="field">
          <span>Description</span>
          <textarea className="admin-textarea" rows={2} value={slotDefinition.description} disabled />
        </label>
      ) : null}

      <ContainerUniqueItemsEditor containerId={container.id} />
    </>
  )
}
