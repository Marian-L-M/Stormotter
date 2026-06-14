import { PLACEMENT_SLOT_TYPES, type ItemSlotPlacementSettings } from '../../admin/slotRules'
import { defaultAllowedSlotTypesForCategory } from '../../admin/itemSlotPlacement'
import { getItemClass } from '../../admin/itemTypes'

interface AllowedSlotTypesEditorProps {
  value: string[] | null
  onChange: (value: string[] | null) => void
  inheritLabel?: string
  categoryId?: string
  classId?: string | null
}

export function AllowedSlotTypesEditor({
  value,
  onChange,
  inheritLabel = 'Inherit from parent rules',
  categoryId,
  classId,
}: AllowedSlotTypesEditorProps) {
  const inheritedDefaults = (() => {
    if (classId) {
      const itemClass = getItemClass(classId)
      if (itemClass) return defaultAllowedSlotTypesForCategory(itemClass.categoryId)
    }
    if (categoryId) return defaultAllowedSlotTypesForCategory(categoryId)
    return []
  })()

  const effective = value ?? inheritedDefaults

  function toggle(slotType: string) {
    const base = value ?? [...inheritedDefaults]
    const next = base.includes(slotType)
      ? base.filter((entry) => entry !== slotType)
      : [...base, slotType]
    onChange(next.length > 0 ? next : null)
  }

  function handleInheritToggle(checked: boolean) {
    onChange(checked ? null : [...effective])
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>Allowed slot types</legend>
      <p className="field-hint">
        Items can always be placed in public and hidden inventory. Select equipment, quick, and
        quiver slots where this item may be equipped.
      </p>

      <label className="field admin-checkbox-field">
        <input
          type="checkbox"
          checked={value === null}
          onChange={(event) => handleInheritToggle(event.target.checked)}
        />
        <span>{inheritLabel}</span>
      </label>

      <div className="allowed-slot-types-grid">
        {PLACEMENT_SLOT_TYPES.map((slotType) => (
          <label key={slotType.id} className="field admin-checkbox-field">
            <input
              type="checkbox"
              disabled={value === null}
              checked={effective.includes(slotType.id)}
              onChange={() => toggle(slotType.id)}
            />
            <span>{slotType.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function summarizeAllowedSlotTypes(settings: ItemSlotPlacementSettings, fallback: string[]): string {
  const allowed = settings.allowedSlotTypes ?? fallback
  if (allowed.length === 0) return 'Inventory only'
  return allowed.join(', ')
}
