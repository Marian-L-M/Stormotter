import {
  ITEM_EFFECT_APPLICATION_LABELS,
  ITEM_TRIGGER_GROUP_LABELS,
  createItemEffectId,
  itemTriggersByGroup,
  type ItemEffect,
  type ItemEffectApplicationMode,
  type ItemTriggerId,
} from '../../admin/itemTypes'
import { useAbilitiesStore } from '../../store/abilitiesStore'

interface ItemEffectsEditorProps {
  effects: ItemEffect[]
  onChange: (effects: ItemEffect[]) => void
}

const triggerGroups = itemTriggersByGroup()

export function ItemEffectsEditor({ effects, onChange }: ItemEffectsEditorProps) {
  const abilities = useAbilitiesStore((state) => state.definitions)

  function updateEffect(id: string, patch: Partial<ItemEffect>) {
    onChange(
      effects.map((entry) => {
        if (entry.id !== id) return entry
        const next = { ...entry, ...patch }
        if (patch.applicationMode !== undefined && patch.applicationMode !== 'trigger') {
          next.triggerId = null
        }
        if (patch.applicationMode !== undefined && patch.applicationMode !== 'usage') {
          next.maxCharges = null
          next.rechargeIntervalSeconds = null
        }
        return next
      }),
    )
  }

  function addEffect() {
    onChange([
      ...effects,
      {
        id: createItemEffectId(),
        label: 'New effect',
        description: '',
        applicationMode: 'equipped',
        abilityId: null,
        triggerId: null,
        maxCharges: null,
        rechargeIntervalSeconds: null,
      },
    ])
  }

  function removeEffect(id: string) {
    onChange(effects.filter((entry) => entry.id !== id))
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>Abilities &amp; effects</legend>
      <p className="field-hint admin-attribute-hint">
        Link abilities and define when they apply: while equipped, on consumption, on usage, or on a
        trigger event.
      </p>

      {effects.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No effects configured.</p>
      ) : (
        <div className="item-effects-list">
          {effects.map((effect) => (
            <div key={effect.id} className="item-effect-row">
              <label className="field">
                <span>Label</span>
                <input
                  value={effect.label}
                  onChange={(event) => updateEffect(effect.id, { label: event.target.value })}
                />
              </label>

              <label className="field">
                <span>Application</span>
                <select
                  className="admin-select admin-select-block"
                  value={effect.applicationMode}
                  onChange={(event) =>
                    updateEffect(effect.id, {
                      applicationMode: event.target.value as ItemEffectApplicationMode,
                    })
                  }
                >
                  {Object.entries(ITEM_EFFECT_APPLICATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Ability</span>
                <select
                  className="admin-select admin-select-block"
                  value={effect.abilityId ?? ''}
                  onChange={(event) =>
                    updateEffect(effect.id, { abilityId: event.target.value || null })
                  }
                >
                  <option value="">None</option>
                  {abilities.map((ability) => (
                    <option key={ability.id} value={ability.id}>
                      {ability.name}
                    </option>
                  ))}
                </select>
              </label>

              {effect.applicationMode === 'trigger' ? (
                <label className="field">
                  <span>Trigger</span>
                  <select
                    className="admin-select admin-select-block"
                    value={effect.triggerId ?? ''}
                    onChange={(event) =>
                      updateEffect(effect.id, {
                        triggerId: (event.target.value || null) as ItemTriggerId | null,
                      })
                    }
                  >
                    <option value="">Select trigger…</option>
                    {Object.entries(triggerGroups).map(([groupId, triggers]) => (
                      <optgroup
                        key={groupId}
                        label={ITEM_TRIGGER_GROUP_LABELS[groupId as keyof typeof ITEM_TRIGGER_GROUP_LABELS]}
                      >
                        {triggers.map((trigger) => (
                          <option key={trigger.id} value={trigger.id}>
                            {trigger.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              ) : null}

              {effect.applicationMode === 'usage' ? (
                <>
                  <label className="field">
                    <span>Max charges</span>
                    <input
                      type="number"
                      min={0}
                      value={effect.maxCharges ?? ''}
                      placeholder="Unlimited"
                      onChange={(event) => {
                        const raw = event.target.value
                        if (!raw) {
                          updateEffect(effect.id, { maxCharges: null })
                          return
                        }
                        const value = Number(raw)
                        updateEffect(effect.id, {
                          maxCharges: Number.isFinite(value) ? value : null,
                        })
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>Recharge interval (seconds)</span>
                    <input
                      type="number"
                      min={0}
                      value={effect.rechargeIntervalSeconds ?? ''}
                      placeholder="Manual recharge"
                      onChange={(event) => {
                        const raw = event.target.value
                        if (!raw) {
                          updateEffect(effect.id, { rechargeIntervalSeconds: null })
                          return
                        }
                        const value = Number(raw)
                        updateEffect(effect.id, {
                          rechargeIntervalSeconds: Number.isFinite(value) ? value : null,
                        })
                      }}
                    />
                  </label>
                </>
              ) : null}

              <label className="field">
                <span>Description</span>
                <textarea
                  className="admin-textarea"
                  rows={2}
                  value={effect.description}
                  onChange={(event) => updateEffect(effect.id, { description: event.target.value })}
                />
              </label>

              <button
                type="button"
                className="admin-text-button admin-danger-text item-effect-remove"
                onClick={() => removeEffect(effect.id)}
              >
                Remove effect
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="admin-secondary-button" onClick={addEffect}>
        Add effect
      </button>
    </fieldset>
  )
}
