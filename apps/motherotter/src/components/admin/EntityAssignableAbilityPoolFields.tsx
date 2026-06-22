import { MAX_CHARACTER_LEVEL, normalizeCharacterLevel } from '../../admin/characterLevelTypes'
import {
  ABILITY_SLOT_CATEGORIES,
  ABILITY_SLOT_CATEGORY_LABELS,
  type AbilitySlotCategory,
  type LevelAssignableAbilityEntry,
} from '../../admin/abilityCastSlotTypes'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { AbilityPickerField } from './AbilityPickerField'
import { OptionalGameplayConditionField } from './OptionalGameplayConditionField'

interface EntityAssignableAbilityPoolFieldsProps {
  value: LevelAssignableAbilityEntry[]
  onChange: (value: LevelAssignableAbilityEntry[]) => void
}

function sortedEntries(value: LevelAssignableAbilityEntry[]): LevelAssignableAbilityEntry[] {
  return [...value].sort(
    (left, right) => left.level - right.level || left.definitionId.localeCompare(right.definitionId),
  )
}

export function EntityAssignableAbilityPoolFields({
  value,
  onChange,
}: EntityAssignableAbilityPoolFieldsProps) {
  const definitions = useAbilitiesStore((state) => state.definitions)
  const entries = sortedEntries(value)
  const assignedIds = entries.map((entry) => entry.definitionId)

  function replaceEntries(next: LevelAssignableAbilityEntry[]) {
    onChange(sortedEntries(next))
  }

  function addAbility(definitionId: string) {
    if (entries.some((entry) => entry.definitionId === definitionId)) return
    replaceEntries([
      ...entries,
      {
        level: 1,
        definitionId,
        categories: ['generic'],
        conditions: null,
      },
    ])
  }

  function updateEntry(definitionId: string, patch: Partial<LevelAssignableAbilityEntry>) {
    replaceEntries(
      entries.map((entry) =>
        entry.definitionId === definitionId ? { ...entry, ...patch } : entry,
      ),
    )
  }

  function toggleCategory(definitionId: string, category: AbilitySlotCategory) {
    const entry = entries.find((item) => item.definitionId === definitionId)
    if (!entry) return
    const hasCategory = entry.categories.includes(category)
    const categories = hasCategory
      ? entry.categories.filter((item) => item !== category)
      : [...entry.categories, category]
    updateEntry(definitionId, { categories: categories.length > 0 ? categories : ['generic'] })
  }

  function removeEntry(definitionId: string) {
    replaceEntries(entries.filter((entry) => entry.definitionId !== definitionId))
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>Assignable ability pool</legend>
      <p className="field-hint admin-attribute-hint">
        Abilities the player may place into assignable cast slots once they reach each unlock level.
        Use categories to restrict which slot types accept each ability.
      </p>

      <AbilityPickerField
        definitions={definitions}
        assignedIds={assignedIds}
        onAssign={addAbility}
      />

      {entries.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No assignable abilities yet.</p>
      ) : (
        entries.map((entry) => {
          const definition = definitions.find((item) => item.id === entry.definitionId)
          return (
            <div key={entry.definitionId} className="admin-cast-slot-card">
              <div className="admin-cast-slot-card-header">
                <strong>{definition?.name ?? entry.definitionId}</strong>
                <button
                  type="button"
                  className="admin-text-button"
                  onClick={() => removeEntry(entry.definitionId)}
                >
                  Remove
                </button>
              </div>

              <label className="field">
                <span>Unlock level</span>
                <input
                  type="number"
                  min={1}
                  max={MAX_CHARACTER_LEVEL}
                  className="admin-stat-range-input"
                  value={entry.level}
                  onChange={(event) =>
                    updateEntry(entry.definitionId, {
                      level: normalizeCharacterLevel(Number(event.target.value) || 1),
                    })
                  }
                />
              </label>

              <fieldset className="admin-fieldset admin-fieldset-nested">
                <legend>Slot categories</legend>
                <div className="admin-checkbox-grid">
                  {ABILITY_SLOT_CATEGORIES.map((category) => (
                    <label key={category} className="admin-checkbox-field">
                      <input
                        type="checkbox"
                        checked={entry.categories.includes(category)}
                        onChange={() => toggleCategory(entry.definitionId, category)}
                      />
                      <span>{ABILITY_SLOT_CATEGORY_LABELS[category]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <OptionalGameplayConditionField
                value={
                  entry.conditions && typeof entry.conditions === 'object'
                    ? (entry.conditions as import('../../admin/gameplayConditionTypes').GameplayConditionGroup)
                    : null
                }
                onChange={(conditions) => updateEntry(entry.definitionId, { conditions })}
                legend="Availability conditions"
                hint="Optional extra requirements beyond level (quests, stats, flags)."
              />
            </div>
          )
        })
      )}
    </fieldset>
  )
}
