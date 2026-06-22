import { MAX_CHARACTER_LEVEL, normalizeCharacterLevel } from '../../admin/characterLevelTypes'
import {
  ABILITY_SLOT_ASSIGNMENT_LABELS,
  ABILITY_SLOT_CATEGORIES,
  ABILITY_SLOT_CATEGORY_LABELS,
  CAST_SLOT_CHARGE_SOURCE_LABELS,
  createDefaultCastSlotTemplate,
  getNextCastSlotGrantLevel,
  type AbilityCastSlotTemplate,
  type AbilitySlotAssignment,
  type AbilitySlotCategory,
  type LevelCastSlotGrant,
} from '../../admin/abilityCastSlotTypes'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { AbilityPickerField } from './AbilityPickerField'
import { OptionalGameplayConditionField } from './OptionalGameplayConditionField'

interface EntityCastSlotGrantFieldsProps {
  entityId: string
  entityKind: 'class' | 'type'
  value: LevelCastSlotGrant[]
  onChange: (value: LevelCastSlotGrant[]) => void
}

function sortedGrants(value: LevelCastSlotGrant[]): LevelCastSlotGrant[] {
  return [...value].sort((left, right) => left.level - right.level)
}

export function EntityCastSlotGrantFields({
  entityId,
  entityKind,
  value,
  onChange,
}: EntityCastSlotGrantFieldsProps) {
  const definitions = useAbilitiesStore((state) => state.definitions)
  const grants = sortedGrants(value)

  function replaceGrants(next: LevelCastSlotGrant[]) {
    onChange(sortedGrants(next))
  }

  function updateGrantLevel(fromLevel: number, toLevel: number) {
    const normalized = normalizeCharacterLevel(toLevel)
    if (fromLevel === normalized) return
    const source = grants.find((entry) => entry.level === fromLevel)
    if (!source) return
    const withoutSource = grants.filter((entry) => entry.level !== fromLevel)
    const existing = withoutSource.find((entry) => entry.level === normalized)
    if (existing) {
      existing.slots.push(...source.slots)
      replaceGrants(withoutSource)
      return
    }
    replaceGrants([...withoutSource, { level: normalized, slots: [...source.slots] }])
  }

  function updateSlot(level: number, slotId: string, patch: Partial<AbilityCastSlotTemplate>) {
    replaceGrants(
      grants.map((grant) => {
        if (grant.level !== level) return grant
        return {
          ...grant,
          slots: grant.slots.map((slot) => {
            if (slot.id !== slotId) return slot
            const next: AbilityCastSlotTemplate = { ...slot, ...patch }
            if (patch.category === 'class') {
              next.ownerClassId = entityId
              delete next.ownerTypeId
            } else if (patch.category === 'type') {
              next.ownerTypeId = entityId
              delete next.ownerClassId
            } else if (patch.category) {
              delete next.ownerClassId
              delete next.ownerTypeId
            }
            if (next.assignment === 'assignable') {
              delete next.fixedAbilityId
            }
            return next
          }),
        }
      }),
    )
  }

  function removeSlot(level: number, slotId: string) {
    replaceGrants(
      grants
        .map((grant) =>
          grant.level === level
            ? { ...grant, slots: grant.slots.filter((slot) => slot.id !== slotId) }
            : grant,
        )
        .filter((grant) => grant.slots.length > 0),
    )
  }

  function addSlot(level: number) {
    replaceGrants(
      grants.map((grant) =>
        grant.level === level
          ? {
              ...grant,
              slots: [...grant.slots, createDefaultCastSlotTemplate(entityId, entityKind)],
            }
          : grant,
      ),
    )
  }

  function addLevelGrant() {
    const level = getNextCastSlotGrantLevel(grants)
    if (grants.some((entry) => entry.level === level)) return
    replaceGrants([
      ...grants,
      {
        level,
        slots: [createDefaultCastSlotTemplate(entityId, entityKind)],
      },
    ])
  }

  const entityLabel = entityKind === 'class' ? 'class' : 'type'

  return (
    <fieldset className="admin-fieldset">
      <legend>Cast slots by level</legend>
      <p className="field-hint admin-attribute-hint">
        BG2-style ability slots granted at each level. Fixed slots pin a specific ability; assignable
        slots let the player choose from the assignable pool below. Slots are hidden until granted.
      </p>

      {grants.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No cast slot grants yet.</p>
      ) : (
        grants.map((grant) => (
          <div key={grant.level} className="admin-level-grant-block">
            <div className="admin-level-grant-header">
              <label className="admin-level-grant-level-field">
                <span>Level</span>
                <input
                  type="number"
                  className="admin-stat-range-input admin-level-grant-level-input"
                  min={1}
                  max={MAX_CHARACTER_LEVEL}
                  value={grant.level}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    if (!Number.isFinite(next)) return
                    updateGrantLevel(grant.level, next)
                  }}
                />
              </label>
              <button
                type="button"
                className="admin-text-button admin-level-grant-remove"
                onClick={() => replaceGrants(grants.filter((entry) => entry.level !== grant.level))}
              >
                Remove level
              </button>
            </div>

            {grant.slots.length === 0 ? (
              <p className="admin-empty admin-empty-inline">No slots at this level.</p>
            ) : (
              grant.slots.map((slot) => (
                <CastSlotTemplateEditor
                  key={slot.id}
                  slot={slot}
                  entityKind={entityKind}
                  definitions={definitions}
                  onChange={(patch) => updateSlot(grant.level, slot.id, patch)}
                  onRemove={() => removeSlot(grant.level, slot.id)}
                />
              ))
            )}

            <button type="button" className="admin-secondary-button" onClick={() => addSlot(grant.level)}>
              Add slot at level {grant.level}
            </button>
          </div>
        ))
      )}

      <button type="button" className="admin-secondary-button" onClick={addLevelGrant}>
        Add level grant
      </button>

      <p className="field-hint">
        {entityKind === 'class'
          ? 'Class-category slots are tied to this class automatically.'
          : `Type-category slots are tied to this ${entityLabel} automatically.`}
      </p>
    </fieldset>
  )
}

function CastSlotTemplateEditor({
  slot,
  entityKind,
  definitions,
  onChange,
  onRemove,
}: {
  slot: AbilityCastSlotTemplate
  entityKind: 'class' | 'type'
  definitions: ReturnType<typeof useAbilitiesStore.getState>['definitions']
  onChange: (patch: Partial<AbilityCastSlotTemplate>) => void
  onRemove: () => void
}) {
  return (
    <div className="admin-cast-slot-card">
      <div className="admin-cast-slot-card-header">
        <strong>{slot.label?.trim() || 'Cast slot'}</strong>
        <button type="button" className="admin-text-button" onClick={onRemove}>
          Remove slot
        </button>
      </div>

      <label className="field">
        <span>Label (optional)</span>
        <input
          value={slot.label ?? ''}
          placeholder="e.g. Arcane slot 1"
          onChange={(event) => onChange({ label: event.target.value })}
        />
      </label>

      <div className="admin-cast-slot-grid">
        <label className="field">
          <span>Category</span>
          <select
            className="admin-select admin-select-block"
            value={slot.category}
            onChange={(event) =>
              onChange({ category: event.target.value as AbilitySlotCategory })
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
              onChange({ assignment: event.target.value as AbilitySlotAssignment })
            }
          >
            {Object.entries(ABILITY_SLOT_ASSIGNMENT_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Uses per rest</span>
          <input
            type="number"
            min={1}
            className="admin-stat-range-input"
            value={slot.usesPerRest}
            onChange={(event) =>
              onChange({ usesPerRest: Math.max(1, Math.round(Number(event.target.value) || 1)) })
            }
          />
        </label>

        <label className="field">
          <span>Unlock level</span>
          <input
            type="number"
            min={1}
            max={MAX_CHARACTER_LEVEL}
            className="admin-stat-range-input"
            value={slot.unlockLevel}
            onChange={(event) =>
              onChange({ unlockLevel: normalizeCharacterLevel(Number(event.target.value) || 1) })
            }
          />
        </label>
      </div>

      <p className="field-hint">
        Charge: {CAST_SLOT_CHARGE_SOURCE_LABELS.rest} (character {entityKind} slots)
      </p>

      {slot.assignment === 'fixed' ? (
        <>
          {slot.fixedAbilityId ? (
            <div className="admin-tag-list">
              <span className="admin-tag-chip">
                {definitions.find((entry) => entry.id === slot.fixedAbilityId)?.name ?? slot.fixedAbilityId}
                <button
                  type="button"
                  className="admin-icon-button"
                  aria-label="Clear fixed ability"
                  onClick={() => onChange({ fixedAbilityId: undefined })}
                >
                  ×
                </button>
              </span>
            </div>
          ) : (
            <AbilityPickerField
              definitions={definitions}
              assignedIds={[]}
              onAssign={(definitionId) => onChange({ fixedAbilityId: definitionId })}
            />
          )}
        </>
      ) : null}

      <OptionalGameplayConditionField
        value={
          slot.unlockConditions && typeof slot.unlockConditions === 'object'
            ? (slot.unlockConditions as import('../../admin/gameplayConditionTypes').GameplayConditionGroup)
            : null
        }
        onChange={(unlockConditions) => onChange({ unlockConditions })}
        legend="Slot unlock conditions"
      />
    </div>
  )
}
