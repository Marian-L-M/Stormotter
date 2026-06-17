import { useState } from 'react'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { AdminSectionNav } from '../../components/admin/AdminSectionNav'
import { EntityLevelAbilityFields } from '../../components/admin/EntityLevelAbilityFields'
import { EntityLevelAttributeFields } from '../../components/admin/EntityLevelAttributeFields'
import { ItemEffectsEditor } from '../../components/admin/ItemEffectsEditor'
import { ItemRequirementsEditor } from '../../components/admin/ItemRequirementsEditor'
import { EntityRendererEditorPanel } from '../../components/admin/EntityRendererEditorPanel'
import { AllowedSlotTypesEditor } from '../../components/admin/AllowedSlotTypesEditor'
import { MediaPickerField } from '../../components/media/MediaPickerField'
import {
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABELS,
  ITEM_SCOPE_LABELS,
  getItemClassesForCategory,
  type ItemCategoryId,
  type ItemClassId,
  type ItemScope,
} from '../../admin/itemTypes'
import { CONTAINER_KIND_LABELS, containerKindUsesUniqueItems } from '../../admin/containerTypes'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useAttributesStore } from '../../store/attributesStore'
import { useItemsStore } from '../../store/itemsStore'
import { useContainersStore } from '../../store/containersStore'
import { useEditorStore } from '../../store/editorStore'

const ITEM_EDITOR_TABS = [
  { id: 'details', label: 'Details' },
  { id: 'media', label: 'Media' },
  { id: 'renderer', label: 'Renderer' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'effects', label: 'Abilities & Effects' },
  { id: 'slots', label: 'Slots' },
] as const

type ItemEditorTab = (typeof ITEM_EDITOR_TABS)[number]['id']

interface ItemEditorViewProps {
  overrideEntityId?: string
  variant?: 'page' | 'embedded'
  onBack?: () => void
}

export function ItemEditorView({
  overrideEntityId,
  variant = 'page',
  onBack,
}: ItemEditorViewProps = {}) {
  const [activeTab, setActiveTab] = useState<ItemEditorTab>('details')
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const entityId = overrideEntityId ?? selectedEntityId
  const handleBack = onBack ?? closeEntityEditor
  const itemOrUndefined = useItemsStore((state) =>
    entityId ? state.items.find((entry) => entry.id === entityId) : undefined,
  )
  const updateItem = useItemsStore((state) => state.updateItem)
  const removeItem = useItemsStore((state) => state.removeItem)
  const removeAttributeEntity = useAttributesStore((state) => state.removeEntity)
  const removeAbilityEntity = useAbilitiesStore((state) => state.removeEntity)
  const containers = useContainersStore((state) => state.containers)

  const containerOptions = containers.filter((entry) => containerKindUsesUniqueItems(entry.kind))

  if (!entityId || !itemOrUndefined) {
    return (
      <section className="editor-view">
        <p className="admin-empty">Item not found.</p>
        <button type="button" onClick={handleBack}>
          Back to list
        </button>
      </section>
    )
  }

  const item = itemOrUndefined
  const classOptions = getItemClassesForCategory(item.categoryId)

  function handleRemove() {
    removeItem(item.id)
    removeAttributeEntity(item.id)
    removeAbilityEntity(item.id)
    if (variant === 'page') {
      closeEntityEditor()
    } else {
      handleBack()
    }
  }

  function renderTabContent() {
    switch (activeTab) {
      case 'details':
        return (
          <>
            <p className="admin-editor-lead">
              Generic items are templates for generation scripts. Unique items are specific instances
              that must be placed in a container.
            </p>

            <div className="admin-form-grid">
              <label className="field">
                <span>Item scope</span>
                <select
                  className="admin-select admin-select-block"
                  value={item.scope}
                  onChange={(event) =>
                    updateItem(item.id, {
                      scope: event.target.value as ItemScope,
                      containerId: event.target.value === 'generic' ? null : item.containerId,
                    })
                  }
                >
                  {Object.entries(ITEM_SCOPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {item.scope === 'unique' ? (
                <label className="field">
                  <span>Container</span>
                  <select
                    className="admin-select admin-select-block"
                    value={item.containerId ?? ''}
                    onChange={(event) =>
                      updateItem(item.id, { containerId: event.target.value || null })
                    }
                  >
                    <option value="">Select container…</option>
                    {containerOptions.map((container) => (
                      <option key={container.id} value={container.id}>
                        {container.name} ({CONTAINER_KIND_LABELS[container.kind]})
                      </option>
                    ))}
                  </select>
                  {!item.containerId ? (
                    <span className="field-hint admin-attribute-hint">
                      Unique items must be assigned to a container.
                    </span>
                  ) : null}
                </label>
              ) : (
                <div className="field">
                  <span>Template use</span>
                  <p className="field-hint admin-attribute-hint">
                    Generic items are referenced by random container loot tables and item generation
                    scripts — they are not placed directly in the world.
                  </p>
                </div>
              )}
            </div>

            <label className="field">
              <span>Name</span>
              <input
                value={item.name}
                onChange={(event) => updateItem(item.id, { name: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                className="admin-textarea"
                rows={3}
                value={item.description}
                placeholder="Full item description shown in inventory detail views…"
                onChange={(event) => updateItem(item.id, { description: event.target.value })}
              />
            </label>

            <label className="field">
              <span>Tooltip text</span>
              <textarea
                className="admin-textarea"
                rows={2}
                value={item.tooltipText}
                placeholder="Short hover tooltip shown in inventory and equipment slots…"
                onChange={(event) => updateItem(item.id, { tooltipText: event.target.value })}
              />
            </label>

            <div className="admin-form-grid">
              <label className="field">
                <span>Item category</span>
                <select
                  className="admin-select admin-select-block"
                  value={item.categoryId}
                  onChange={(event) =>
                    updateItem(item.id, {
                      categoryId: event.target.value as ItemCategoryId,
                      classId: null,
                    })
                  }
                >
                  {ITEM_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Item class</span>
                <select
                  className="admin-select admin-select-block"
                  value={item.classId ?? ''}
                  onChange={(event) =>
                    updateItem(item.id, {
                      classId: (event.target.value || null) as ItemClassId | null,
                    })
                  }
                >
                  <option value="">None</option>
                  {classOptions.map((itemClass) => (
                    <option key={itemClass.id} value={itemClass.id}>
                      {itemClass.name}
                    </option>
                  ))}
                </select>
                <span className="field-hint">
                  Classes are scoped to {ITEM_CATEGORY_LABELS[item.categoryId]}.
                </span>
              </label>
            </div>

            <div className="admin-editor-actions">
              <button type="button" className="admin-danger-button" onClick={handleRemove}>
                Delete item
              </button>
            </div>
          </>
        )

      case 'media':
        return (
          <>
            <p className="admin-editor-lead">
              Visual and audio assets for this item in inventory, detail views, and gameplay events.
            </p>

            <fieldset className="admin-fieldset">
              <legend>Images</legend>
              <MediaPickerField
                label="Icon image"
                value={item.iconMediaId}
                onChange={(mediaId) => updateItem(item.id, { iconMediaId: mediaId })}
                filter="image"
                hint="Small icon shown in inventory slots and loot lists."
                modalTitle="Select item icon"
              />

              <MediaPickerField
                label="Detail image"
                value={item.detailMediaId}
                onChange={(mediaId) => updateItem(item.id, { detailMediaId: mediaId })}
                filter="image"
                hint="Large illustration shown in item detail panels."
                modalTitle="Select detail image"
              />
            </fieldset>

            <fieldset className="admin-fieldset">
              <legend>Sound</legend>
              <MediaPickerField
                label="On pickup"
                value={item.pickupSoundMediaId}
                onChange={(mediaId) => updateItem(item.id, { pickupSoundMediaId: mediaId })}
                filter="audio"
                hint="Played when the item is picked up or added to inventory."
                modalTitle="Select pickup sound"
              />

              <MediaPickerField
                label="On action"
                value={item.actionSoundMediaId}
                onChange={(mediaId) => updateItem(item.id, { actionSoundMediaId: mediaId })}
                filter="audio"
                hint="Played when the item is used, equipped, or activated."
                modalTitle="Select action sound"
              />
            </fieldset>
          </>
        )

      case 'renderer':
        return (
          <EntityRendererEditorPanel
            value={item.renderer}
            defaultGlyph="*"
            entityLabel="item"
            onChange={(renderer) => updateItem(item.id, { renderer })}
          />
        )

      case 'attributes':
        return (
          <>
            <p className="admin-editor-lead">
              Passive bonuses and mechanics granted while this item is equipped.
            </p>
            <EntityLevelAttributeFields
              entityId={item.id}
              entityLabel="item"
              hint="Attributes granted to the wearer while this item is equipped. Use level 1 for flat bonuses."
            />
          </>
        )

      case 'effects':
        return (
          <>
            <p className="admin-editor-lead">
              Requirements to use or equip this item, plus abilities and effects when equipped,
              consumed, used, or triggered.
            </p>
            <EntityLevelAbilityFields
              entityId={item.id}
              entityLabel="item"
              hint="Abilities granted while this item is equipped. Use level 1 for always-on effects; set a trigger for reactive abilities."
            />
            <ItemRequirementsEditor
              requirements={item.requirements}
              onChange={(requirements) => updateItem(item.id, { requirements })}
            />
            <ItemEffectsEditor
              effects={item.effects}
              onChange={(effects) => updateItem(item.id, { effects })}
            />
          </>
        )

      case 'slots':
        return (
          <>
            <p className="admin-editor-lead">
              Where this item can be placed in character inventories and whether it can be dropped
              or stolen.
            </p>
            <AllowedSlotTypesEditor
              value={item.allowedSlotTypes}
              onChange={(allowedSlotTypes) => updateItem(item.id, { allowedSlotTypes })}
              inheritLabel={
                item.classId
                  ? 'Inherit from item class / category defaults'
                  : 'Inherit from item category defaults'
              }
              categoryId={item.categoryId}
              classId={item.classId}
            />

            <fieldset className="admin-fieldset">
              <legend>Inventory behavior</legend>
              <div className="admin-form-grid">
                <label className="field admin-checkbox-field">
                  <input
                    type="checkbox"
                    checked={item.droppable}
                    onChange={(event) => updateItem(item.id, { droppable: event.target.checked })}
                  />
                  <span>Droppable</span>
                </label>
                <label className="field admin-checkbox-field">
                  <input
                    type="checkbox"
                    checked={item.stealable}
                    onChange={(event) => updateItem(item.id, { stealable: event.target.checked })}
                  />
                  <span>Stealable</span>
                </label>
              </div>
            </fieldset>
          </>
        )
    }
  }

  const tabContent = (
    <>
      <AdminSectionNav sections={[...ITEM_EDITOR_TABS]} active={activeTab} onChange={setActiveTab} />
      {renderTabContent()}
    </>
  )

  if (variant === 'embedded') {
    return <div className="admin-editor-embedded">{tabContent}</div>
  }

  return (
    <AdminEditorShell listLabel="Items" itemTitle={item.name} onBack={handleBack}>
      {tabContent}
    </AdminEditorShell>
  )
}
