import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { AllowedSlotTypesEditor } from '../../components/admin/AllowedSlotTypesEditor'
import {
  ITEM_CLASSES,
  getItemCategory,
  getItemClassesForCategory,
  isItemCategoryId,
} from '../../admin/itemTypes'
import { defaultAllowedSlotTypesForCategory } from '../../admin/itemSlotPlacement'
import { useItemRegistrySettingsStore } from '../../store/itemRegistrySettingsStore'
import { useEditorStore } from '../../store/editorStore'

export function ItemCategoryDetailView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const categorySettings = useItemRegistrySettingsStore((state) =>
    selectedEntityId && isItemCategoryId(selectedEntityId)
      ? state.getCategorySettings(selectedEntityId)
      : { allowedSlotTypes: null },
  )
  const updateCategorySettings = useItemRegistrySettingsStore((state) => state.updateCategorySettings)

  if (!selectedEntityId || !isItemCategoryId(selectedEntityId)) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Item category not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const category = getItemCategory(selectedEntityId)!
  const classes = getItemClassesForCategory(category.id)
  const defaultSlots = defaultAllowedSlotTypesForCategory(category.id)

  return (
    <AdminEditorShell listLabel="Item Categories" itemTitle={category.name} onBack={closeEntityEditor}>
      <p className="admin-editor-lead">
        Item categories are fixed system definitions. Override allowed slot types here; item classes
        and individual items can refine these rules further.
      </p>

      <dl className="mechanic-builder-inline-meta item-registry-meta">
        <div>
          <dt>Default equip slot (legacy)</dt>
          <dd>{category.equipSlot ?? 'Non-equippable'}</dd>
        </div>
        <div>
          <dt>Resolved default slots</dt>
          <dd>{defaultSlots.length > 0 ? defaultSlots.join(', ') : 'Inventory only'}</dd>
        </div>
        <div>
          <dt>Stackable</dt>
          <dd>{category.stackable ? 'Yes' : 'No'}</dd>
        </div>
        <div>
          <dt>Consumable</dt>
          <dd>{category.consumable ? 'Yes' : 'No'}</dd>
        </div>
        <div>
          <dt>Item classes</dt>
          <dd>{classes.length}</dd>
        </div>
      </dl>

      <label className="field">
        <span>Description</span>
        <textarea className="admin-textarea" rows={3} value={category.description} disabled />
      </label>

      <AllowedSlotTypesEditor
        value={categorySettings.allowedSlotTypes}
        onChange={(allowedSlotTypes) =>
          updateCategorySettings(category.id, { allowedSlotTypes })
        }
        inheritLabel="Use legacy category default equip slot mapping"
        categoryId={category.id}
      />

      <fieldset className="admin-fieldset">
        <legend>Item classes in this category</legend>
        {classes.length === 0 ? (
          <p className="admin-empty admin-empty-inline">No classes defined for this category.</p>
        ) : (
          <ul className="item-registry-class-list">
            {classes.map((itemClass) => (
              <li key={itemClass.id}>
                <strong>{itemClass.name}</strong>
                <span>{itemClass.description}</span>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
    </AdminEditorShell>
  )
}

export function ItemClassDetailView() {
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const classSettings = useItemRegistrySettingsStore((state) =>
    selectedEntityId ? state.getClassSettings(selectedEntityId) : { allowedSlotTypes: null },
  )
  const updateClassSettings = useItemRegistrySettingsStore((state) => state.updateClassSettings)

  const itemClass = selectedEntityId
    ? ITEM_CLASSES.find((entry) => entry.id === selectedEntityId)
    : undefined

  if (!selectedEntityId || !itemClass) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Item class not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  const category = getItemCategory(itemClass.categoryId)

  return (
    <AdminEditorShell listLabel="Item Classes" itemTitle={itemClass.name} onBack={closeEntityEditor}>
      <p className="admin-editor-lead">
        Item classes refine category defaults. Individual items can override class slot placement
        rules.
      </p>

      <dl className="mechanic-builder-inline-meta item-registry-meta">
        <div>
          <dt>Category</dt>
          <dd>{category?.name ?? itemClass.categoryId}</dd>
        </div>
        <div>
          <dt>Class ID</dt>
          <dd>
            <code>{itemClass.id}</code>
          </dd>
        </div>
      </dl>

      <label className="field">
        <span>Description</span>
        <textarea className="admin-textarea" rows={3} value={itemClass.description} disabled />
      </label>

      <AllowedSlotTypesEditor
        value={classSettings.allowedSlotTypes}
        onChange={(allowedSlotTypes) => updateClassSettings(itemClass.id, { allowedSlotTypes })}
        inheritLabel="Inherit from item category rules"
        categoryId={itemClass.categoryId}
        classId={itemClass.id}
      />

      {category ? (
        <fieldset className="admin-fieldset">
          <legend>Parent category</legend>
          <p className="field-hint">{category.description}</p>
        </fieldset>
      ) : null}
    </AdminEditorShell>
  )
}
