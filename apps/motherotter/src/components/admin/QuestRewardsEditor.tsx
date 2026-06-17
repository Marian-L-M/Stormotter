import {
  createEmptyQuestReward,
  QUEST_REWARD_KIND_LABELS,
  type QuestReward,
  type QuestRewardKind,
} from '../../admin/questTypes'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useAttributesStore } from '../../store/attributesStore'
import { useItemsStore } from '../../store/itemsStore'
import { useStateVariablesStore } from '../../store/stateVariablesStore'

interface QuestRewardsEditorProps {
  rewards: QuestReward[]
  onChange: (rewards: QuestReward[]) => void
}

export function QuestRewardsEditor({ rewards, onChange }: QuestRewardsEditorProps) {
  const items = useItemsStore((state) => state.items)
  const variables = useStateVariablesStore((state) => state.variables)
  const attributes = useAttributesStore((state) => state.definitions)
  const abilities = useAbilitiesStore((state) => state.definitions)

  function updateReward(index: number, patch: Partial<QuestReward>) {
    onChange(
      rewards.map((reward, rewardIndex) =>
        rewardIndex === index ? { ...reward, ...patch } : reward,
      ),
    )
  }

  return (
    <div className="quest-rewards-editor">
      {rewards.length === 0 ? (
        <p className="admin-empty">No rewards configured.</p>
      ) : (
        rewards.map((reward, index) => (
          <fieldset key={reward.id} className="admin-fieldset dialog-reply-card">
            <legend>Reward {index + 1}</legend>
            <label className="field">
              <span>Type</span>
              <select
                className="admin-select admin-select-block"
                value={reward.kind}
                onChange={(event) =>
                  updateReward(index, { kind: event.target.value as QuestRewardKind })
                }
              >
                {(Object.keys(QUEST_REWARD_KIND_LABELS) as QuestRewardKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {QUEST_REWARD_KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </label>

            {reward.kind === 'item' ? (
              <>
                <label className="field">
                  <span>Item</span>
                  <select
                    className="admin-select admin-select-block"
                    value={reward.itemId ?? ''}
                    onChange={(event) =>
                      updateReward(index, {
                        itemId: event.target.value.length > 0 ? event.target.value : null,
                      })
                    }
                  >
                    <option value="">Select item…</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Quantity</span>
                  <input
                    type="number"
                    min={1}
                    value={reward.quantity}
                    onChange={(event) =>
                      updateReward(index, { quantity: Math.max(1, Number(event.target.value) || 1) })
                    }
                  />
                </label>
              </>
            ) : null}

            {reward.kind === 'state' ? (
              <>
                <label className="field">
                  <span>State variable</span>
                  <select
                    className="admin-select admin-select-block"
                    value={reward.stateVariableId ?? ''}
                    onChange={(event) =>
                      updateReward(index, {
                        stateVariableId: event.target.value.length > 0 ? event.target.value : null,
                      })
                    }
                  >
                    <option value="">Select state…</option>
                    {variables.map((variable) => (
                      <option key={variable.id} value={variable.id}>
                        {variable.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Value</span>
                  <input
                    value={reward.stateValue === null ? '' : String(reward.stateValue)}
                    onChange={(event) => updateReward(index, { stateValue: event.target.value })}
                  />
                </label>
              </>
            ) : null}

            {reward.kind === 'experience' ? (
              <label className="field">
                <span>Experience points</span>
                <input
                  type="number"
                  min={0}
                  value={reward.experienceAmount ?? 0}
                  onChange={(event) =>
                    updateReward(index, { experienceAmount: Math.max(0, Number(event.target.value)) })
                  }
                />
              </label>
            ) : null}

            {reward.kind === 'attribute' ? (
              <>
                <label className="field">
                  <span>Attribute</span>
                  <select
                    className="admin-select admin-select-block"
                    value={reward.attributeDefinitionId ?? ''}
                    onChange={(event) =>
                      updateReward(index, {
                        attributeDefinitionId:
                          event.target.value.length > 0 ? event.target.value : null,
                      })
                    }
                  >
                    <option value="">Select attribute…</option>
                    {attributes.map((attribute) => (
                      <option key={attribute.id} value={attribute.id}>
                        {attribute.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Bonus amount</span>
                  <input
                    type="number"
                    value={reward.attributeValue ?? 0}
                    onChange={(event) =>
                      updateReward(index, { attributeValue: Number(event.target.value) })
                    }
                  />
                </label>
              </>
            ) : null}

            {reward.kind === 'ability' ? (
              <label className="field">
                <span>Ability</span>
                <select
                  className="admin-select admin-select-block"
                  value={reward.abilityDefinitionId ?? ''}
                  onChange={(event) =>
                    updateReward(index, {
                      abilityDefinitionId:
                        event.target.value.length > 0 ? event.target.value : null,
                    })
                  }
                >
                  <option value="">Select ability…</option>
                  {abilities.map((ability) => (
                    <option key={ability.id} value={ability.id}>
                      {ability.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <button
              type="button"
              className="admin-danger-button"
              onClick={() => onChange(rewards.filter((_, i) => i !== index))}
            >
              Remove reward
            </button>
          </fieldset>
        ))
      )}

      <button
        type="button"
        className="admin-secondary-button"
        onClick={() => onChange([...rewards, createEmptyQuestReward()])}
      >
        Add reward
      </button>
    </div>
  )
}
