import {
  ABILITY_SLOT_ASSIGNMENT_LABELS,
  ABILITY_SLOT_CATEGORIES,
  ABILITY_SLOT_CATEGORY_LABELS,
  CAST_SLOT_CHARGE_SOURCE_LABELS,
  createDefaultCastSlotTemplate,
  normalizeConsumableCastConfig,
  type AbilityCastSlotTemplate,
  type ConsumableCastConfig,
} from '../../admin/abilityCastSlotTypes'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { AbilityPickerField } from './AbilityPickerField'
import { OptionalGameplayConditionField } from './OptionalGameplayConditionField'
import type { GameplayConditionGroup } from '../../admin/gameplayConditionTypes'
import type { Item } from '../../admin/itemTypes'

interface ItemCastSlotsEditorProps {
  item: Item
  onChange: (patch: {
    castSlots?: AbilityCastSlotTemplate[]
    maxItemCharges?: number | null
    consumable?: ConsumableCastConfig | null
  }) => void
}

export function ItemCastSlotsEditor({ item, onChange }: ItemCastSlotsEditorProps) {
  const definitions = useAbilitiesStore((state) => state.definitions)

  function updateSlot(slotId: string, patch: Partial<AbilityCastSlotTemplate>) {
    onChange({
      castSlots: item.castSlots.map((slot) => {
        if (slot.id !== slotId) return slot
        const next: AbilityCastSlotTemplate = { ...slot, ...patch }
        if (next.assignment === 'assignable') delete next.fixedAbilityId
        if (next.category !== 'class') delete next.ownerClassId
        if (next.category !== 'type') delete next.ownerTypeId
        return next
      }),
    })
  }

  function removeSlot(slotId: string) {
    onChange({ castSlots: item.castSlots.filter((slot) => slot.id !== slotId) })
  }

  function addSlot() {
    onChange({
      castSlots: [...item.castSlots, createDefaultCastSlotTemplate(item.id, 'class')],
    })
  }

  return (
    <>
      <p className="admin-editor-lead">
        Wands and staves can expose assignable cast slots charged by rest or item charges. Scrolls
        and potions use consumable casting from inventory or quick slots.
      </p>

      <fieldset className="admin-fieldset">
        <legend>Gear cast slots</legend>
        {item.castSlots.length === 0 ? (
          <p className="field-hint">No cast slots on this item.</p>
        ) : (
          <ul className="admin-cast-slot-grant-list">
            {item.castSlots.map((slot) => (
              <li key={slot.id} className="admin-cast-slot-grant-row">
                <label className="field">
                  <span>Label</span>
                  <input
                    type="text"
                    value={slot.label ?? ''}
                    placeholder="Optional slot label"
                    onChange={(event) => updateSlot(slot.id, { label: event.target.value || undefined })}
                  />
                </label>

                <label className="field">
                  <span>Category</span>
                  <select
                    className="admin-select admin-select-block"
                    value={slot.category}
                    onChange={(event) =>
                      updateSlot(slot.id, {
                        category: event.target.value as AbilityCastSlotTemplate['category'],
                      })
                    }
                  >
                    {ABILITY_SLOT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {ABILITY_SLOT_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Assignment</span>
                  <select
                    className="admin-select admin-select-block"
                    value={slot.assignment}
                    onChange={(event) =>
                      updateSlot(slot.id, {
                        assignment: event.target.value as AbilityCastSlotTemplate['assignment'],
                      })
                    }
                  >
                    <option value="assignable">{ABILITY_SLOT_ASSIGNMENT_LABELS.assignable}</option>
                    <option value="fixed">{ABILITY_SLOT_ASSIGNMENT_LABELS.fixed}</option>
                  </select>
                </label>

                {slot.assignment === 'fixed' ? (
                  slot.fixedAbilityId ? (
                    <div className="admin-tag-chip-row">
                      <span className="admin-tag-chip">
                        {definitions.find((entry) => entry.id === slot.fixedAbilityId)?.name ??
                          slot.fixedAbilityId}
                        <button
                          type="button"
                          className="admin-icon-button"
                          aria-label="Clear fixed ability"
                          onClick={() => updateSlot(slot.id, { fixedAbilityId: undefined })}
                        >
                          ×
                        </button>
                      </span>
                    </div>
                  ) : (
                    <AbilityPickerField
                      definitions={definitions}
                      assignedIds={[]}
                      onAssign={(definitionId) => updateSlot(slot.id, { fixedAbilityId: definitionId })}
                    />
                  )
                ) : null}

                <label className="field">
                  <span>Charge source</span>
                  <select
                    className="admin-select admin-select-block"
                    value={slot.chargeSource}
                    onChange={(event) =>
                      updateSlot(slot.id, {
                        chargeSource: event.target.value as AbilityCastSlotTemplate['chargeSource'],
                      })
                    }
                  >
                    <option value="rest">{CAST_SLOT_CHARGE_SOURCE_LABELS.rest}</option>
                    <option value="item">{CAST_SLOT_CHARGE_SOURCE_LABELS.item}</option>
                  </select>
                </label>

                <OptionalGameplayConditionField
                  value={
                    slot.unlockConditions && typeof slot.unlockConditions === 'object'
                      ? (slot.unlockConditions as GameplayConditionGroup)
                      : null
                  }
                  onChange={(unlockConditions) => updateSlot(slot.id, { unlockConditions })}
                  legend="Slot unlock conditions"
                />

                <button type="button" className="admin-danger-button" onClick={() => removeSlot(slot.id)}>
                  Remove slot
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="admin-secondary-button" onClick={addSlot}>
          Add cast slot
        </button>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Item charges</legend>
        <label className="field">
          <span>Max item charges</span>
          <input
            type="number"
            min={0}
            value={item.maxItemCharges ?? ''}
            placeholder="None"
            onChange={(event) => {
              const raw = event.target.value
              if (!raw) {
                onChange({ maxItemCharges: null })
                return
              }
              const value = Math.max(0, Math.floor(Number(raw) || 0))
              onChange({ maxItemCharges: value > 0 ? value : null })
            }}
          />
        </label>
        <p className="field-hint">
          Shared charge pool for item-charged slots. Reassigning item-charged slots does not drain
          charges.
        </p>
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Consumable casting</legend>
        <label className="admin-checkbox-field">
          <input
            type="checkbox"
            checked={item.consumable !== null}
            onChange={(event) => {
              if (!event.target.checked) {
                onChange({ consumable: null })
                return
              }
              onChange({
                consumable: normalizeConsumableCastConfig({
                  abilityId: definitions[0]?.id ?? '',
                  maxCharges: 1,
                  destroyAtZero: true,
                  castFrom: ['inventory', 'quick'],
                }),
              })
            }}
          />
          <span>Cast from inventory or quick slot (scroll / potion)</span>
        </label>

        {item.consumable ? (
          <>
            <label className="field">
              <span>Cast ability</span>
              <select
                className="admin-select admin-select-block"
                value={item.consumable.abilityId}
                onChange={(event) =>
                  onChange({
                    consumable: { ...item.consumable!, abilityId: event.target.value },
                  })
                }
              >
                {definitions.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Max charges</span>
              <input
                type="number"
                min={1}
                value={item.consumable.maxCharges}
                onChange={(event) =>
                  onChange({
                    consumable: {
                      ...item.consumable!,
                      maxCharges: Math.max(1, Math.floor(Number(event.target.value) || 1)),
                    },
                  })
                }
              />
            </label>
            <label className="admin-checkbox-field">
              <input
                type="checkbox"
                checked={item.consumable.destroyAtZero}
                onChange={(event) =>
                  onChange({
                    consumable: { ...item.consumable!, destroyAtZero: event.target.checked },
                  })
                }
              />
              <span>Destroy item at 0 charges</span>
            </label>
            <fieldset className="admin-fieldset admin-fieldset-nested">
              <legend>Cast from</legend>
              <label className="admin-checkbox-field">
                <input
                  type="checkbox"
                  checked={item.consumable.castFrom.includes('inventory')}
                  onChange={(event) => {
                    const castFrom = new Set(item.consumable!.castFrom)
                    if (event.target.checked) castFrom.add('inventory')
                    else castFrom.delete('inventory')
                    onChange({
                      consumable: {
                        ...item.consumable!,
                        castFrom: [...castFrom] as ConsumableCastConfig['castFrom'],
                      },
                    })
                  }}
                />
                <span>Inventory</span>
              </label>
              <label className="admin-checkbox-field">
                <input
                  type="checkbox"
                  checked={item.consumable.castFrom.includes('quick')}
                  onChange={(event) => {
                    const castFrom = new Set(item.consumable!.castFrom)
                    if (event.target.checked) castFrom.add('quick')
                    else castFrom.delete('quick')
                    onChange({
                      consumable: {
                        ...item.consumable!,
                        castFrom: [...castFrom] as ConsumableCastConfig['castFrom'],
                      },
                    })
                  }}
                />
                <span>Quick slot</span>
              </label>
            </fieldset>
          </>
        ) : null}
      </fieldset>
    </>
  )
}
