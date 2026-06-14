import { useItemsStore } from '../../store/itemsStore'
import { useEditorStore } from '../../store/editorStore'

interface ContainerUniqueItemsEditorProps {
  containerId: string
  allowCreate?: boolean
}

export function ContainerUniqueItemsEditor({
  containerId,
  allowCreate = true,
}: ContainerUniqueItemsEditorProps) {
  const items = useItemsStore((state) => state.items)
  const addItem = useItemsStore((state) => state.addItem)
  const assignItemToContainer = useItemsStore((state) => state.assignItemToContainer)
  const unassignItemFromContainer = useItemsStore((state) => state.unassignItemFromContainer)
  const openEntityEditor = useEditorStore((state) => state.openEntityEditor)

  const containedItems = items.filter(
    (entry) => entry.scope === 'unique' && entry.containerId === containerId,
  )
  const unassignedUniqueItems = items.filter(
    (entry) => entry.scope === 'unique' && !entry.containerId,
  )

  function handleCreateUniqueItem() {
    const id = addItem('unique')
    assignItemToContainer(id, containerId)
    openEntityEditor(id)
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>Unique items</legend>
      <p className="field-hint admin-attribute-hint">
        Unique items are specific instances placed in this container. Generic templates are used
        separately for random loot generation.
      </p>

      {containedItems.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No unique items in this container yet.</p>
      ) : (
        <ul className="container-item-list">
          {containedItems.map((item) => (
            <li key={item.id} className="container-item-list-row">
              <button type="button" className="admin-row-link" onClick={() => openEntityEditor(item.id)}>
                {item.name}
              </button>
              <button
                type="button"
                className="admin-text-button admin-danger-text"
                onClick={() => unassignItemFromContainer(item.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {unassignedUniqueItems.length > 0 ? (
        <label className="field">
          <span>Add existing unique item</span>
          <select
            className="admin-select admin-select-block"
            defaultValue=""
            onChange={(event) => {
              const itemId = event.target.value
              if (!itemId) return
              assignItemToContainer(itemId, containerId)
              event.target.value = ''
            }}
          >
            <option value="">Select unassigned unique item…</option>
            {unassignedUniqueItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {allowCreate ? (
        <button type="button" className="admin-secondary-button" onClick={handleCreateUniqueItem}>
          Create unique item in container
        </button>
      ) : null}
    </fieldset>
  )
}
