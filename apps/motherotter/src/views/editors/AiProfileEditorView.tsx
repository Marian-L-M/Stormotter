import { useState } from 'react'
import {
  AI_ABILITY_USAGE_LABELS,
  AI_RETREAT_BEHAVIOR_LABELS,
  AI_TARGET_PRIORITY_LABELS,
  AI_WEAPON_PREFERENCE_LABELS,
  type AiAbilityUsage,
  type AiRetreatBehavior,
  type AiTargetPriority,
  type AiWeaponPreference,
} from '../../admin/aiProfileTypes'
import { AiAbilityPriorityEditor } from '../../components/admin/AiAbilityPriorityEditor'
import { AdminEditorShell } from '../../components/admin/AdminEditorShell'
import { AdminSectionNav } from '../../components/admin/AdminSectionNav'
import { TaxonomyEditorFields } from '../../components/admin/TaxonomyEditorFields'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useAiProfilesStore } from '../../store/aiProfilesStore'
import { useEditorStore } from '../../store/editorStore'
import { useTaxonomyStore } from '../../store/taxonomyStore'

const AI_PROFILE_EDITOR_TABS = [
  { id: 'core', label: 'Core behavior' },
  { id: 'abilities', label: 'Ability priority' },
  { id: 'phases', label: 'Phase rules' },
] as const

type AiProfileEditorTab = (typeof AI_PROFILE_EDITOR_TABS)[number]['id']

export function AiProfileEditorView() {
  const [activeTab, setActiveTab] = useState<AiProfileEditorTab>('core')
  const selectedEntityId = useEditorStore((state) => state.selectedEntityId)
  const closeEntityEditor = useEditorStore((state) => state.closeEntityEditor)
  const profile = useAiProfilesStore((state) =>
    selectedEntityId ? state.aiProfiles.find((entry) => entry.id === selectedEntityId) : undefined,
  )
  const abilityDefinitions = useAbilitiesStore((state) => state.definitions)
  const updateAiProfile = useAiProfilesStore((state) => state.updateAiProfile)
  const addPhaseRule = useAiProfilesStore((state) => state.addPhaseRule)
  const updatePhaseRule = useAiProfilesStore((state) => state.updatePhaseRule)
  const removePhaseRule = useAiProfilesStore((state) => state.removePhaseRule)
  const removeAiProfile = useAiProfilesStore((state) => state.removeAiProfile)
  const removeTaxonomyEntity = useTaxonomyStore((state) => state.removeEntity)

  if (!selectedEntityId || !profile) {
    return (
      <section className="editor-view">
        <p className="admin-empty">AI profile not found.</p>
        <button type="button" onClick={closeEntityEditor}>
          Back to list
        </button>
      </section>
    )
  }

  function handleRemove() {
    removeAiProfile(profile!.id)
    removeTaxonomyEntity(profile!.id)
    closeEntityEditor()
  }

  function renderCoreTab() {
    return (
      <>
        <label className="field">
          <span>Name</span>
          <input
            value={profile!.name}
            onChange={(event) => updateAiProfile(profile!.id, { name: event.target.value })}
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            className="admin-textarea"
            rows={3}
            value={profile!.description}
            placeholder="When and how this AI behaves in combat…"
            onChange={(event) => updateAiProfile(profile!.id, { description: event.target.value })}
          />
        </label>

        <label className="field">
          <span>Aggression ({profile!.aggression})</span>
          <input
            type="range"
            min={0}
            max={100}
            value={profile!.aggression}
            onChange={(event) =>
              updateAiProfile(profile!.id, { aggression: Number(event.target.value) })
            }
          />
          <span className="field-hint">0 cautious — 100 reckless</span>
        </label>

        <label className="field">
          <span>Retreat threshold ({profile!.retreatThreshold}% HP)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={profile!.retreatThreshold}
            onChange={(event) =>
              updateAiProfile(profile!.id, {
                retreatThreshold: Math.max(0, Math.min(100, Number(event.target.value) || 0)),
              })
            }
          />
        </label>

        <label className="field">
          <span>Target priority</span>
          <select
            value={profile!.targetPriority}
            onChange={(event) =>
              updateAiProfile(profile!.id, {
                targetPriority: event.target.value as AiTargetPriority,
              })
            }
          >
            {Object.entries(AI_TARGET_PRIORITY_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Ability usage</span>
          <select
            value={profile!.abilityUsage}
            onChange={(event) =>
              updateAiProfile(profile!.id, {
                abilityUsage: event.target.value as AiAbilityUsage,
              })
            }
          >
            {Object.entries(AI_ABILITY_USAGE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Retreat behavior</span>
          <select
            value={profile!.retreatBehavior}
            onChange={(event) =>
              updateAiProfile(profile!.id, {
                retreatBehavior: event.target.value as AiRetreatBehavior,
              })
            }
          >
            {Object.entries(AI_RETREAT_BEHAVIOR_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="admin-fieldset">
          <legend>Ranged &amp; melee behavior</legend>

          <label className="field">
            <span>Weapon preference</span>
            <select
              value={profile!.weaponPreference}
              onChange={(event) =>
                updateAiProfile(profile!.id, {
                  weaponPreference: event.target.value as AiWeaponPreference,
                })
              }
            >
              {Object.entries(AI_WEAPON_PREFERENCE_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={profile!.retreatFromMelee}
              onChange={(event) =>
                updateAiProfile(profile!.id, { retreatFromMelee: event.target.checked })
              }
            />
            <span>Retreat from melee — disengage when enemies close distance</span>
          </label>
        </fieldset>

        <label className="admin-checkbox-label">
          <input
            type="checkbox"
            checked={profile!.prioritizeAbilities}
            onChange={(event) =>
              updateAiProfile(profile!.id, { prioritizeAbilities: event.target.checked })
            }
          />
          <span>Prioritize abilities over basic attacks (when no priority list is set)</span>
        </label>
      </>
    )
  }

  function renderAbilitiesTab() {
    return (
      <AiAbilityPriorityEditor
        abilityPriorityIds={profile!.abilityPriorityIds}
        definitions={abilityDefinitions}
        onChange={(abilityPriorityIds) =>
          updateAiProfile(profile!.id, { abilityPriorityIds })
        }
      />
    )
  }

  function renderPhasesTab() {
    return (
      <>
        <p className="field-hint admin-attribute-hint">
          Phase rules override core behavior when HP drops to the threshold or below. The lowest
          matching threshold wins. Ability priority list is shared across all phases.
        </p>

        <button type="button" onClick={() => addPhaseRule(profile!.id)}>
          Add phase rule
        </button>

        {profile!.phaseRules.length === 0 ? (
          <p className="admin-empty admin-empty-inline">No phase rules — core behavior always applies.</p>
        ) : (
          profile!.phaseRules.map((rule) => (
            <fieldset key={rule.id} className="admin-fieldset admin-level-grant-block">
              <legend>{rule.label}</legend>
              <label className="field">
                <span>Label</span>
                <input
                  value={rule.label}
                  onChange={(event) =>
                    updatePhaseRule(profile!.id, rule.id, { label: event.target.value })
                  }
                />
              </label>
              <label className="field">
                <span>HP threshold max (%)</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={rule.hpThresholdMax}
                  onChange={(event) =>
                    updatePhaseRule(profile!.id, rule.id, {
                      hpThresholdMax: Math.max(1, Math.min(100, Number(event.target.value) || 1)),
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Target priority</span>
                <select
                  value={rule.targetPriority}
                  onChange={(event) =>
                    updatePhaseRule(profile!.id, rule.id, {
                      targetPriority: event.target.value as AiTargetPriority,
                    })
                  }
                >
                  {Object.entries(AI_TARGET_PRIORITY_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Ability usage</span>
                <select
                  value={rule.abilityUsage}
                  onChange={(event) =>
                    updatePhaseRule(profile!.id, rule.id, {
                      abilityUsage: event.target.value as AiAbilityUsage,
                    })
                  }
                >
                  {Object.entries(AI_ABILITY_USAGE_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Retreat behavior</span>
                <select
                  value={rule.retreatBehavior}
                  onChange={(event) =>
                    updatePhaseRule(profile!.id, rule.id, {
                      retreatBehavior: event.target.value as AiRetreatBehavior,
                    })
                  }
                >
                  {Object.entries(AI_RETREAT_BEHAVIOR_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Weapon preference</span>
                <select
                  value={rule.weaponPreference}
                  onChange={(event) =>
                    updatePhaseRule(profile!.id, rule.id, {
                      weaponPreference: event.target.value as AiWeaponPreference,
                    })
                  }
                >
                  {Object.entries(AI_WEAPON_PREFERENCE_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={rule.retreatFromMelee}
                  onChange={(event) =>
                    updatePhaseRule(profile!.id, rule.id, {
                      retreatFromMelee: event.target.checked,
                    })
                  }
                />
                <span>Retreat from melee</span>
              </label>
              <label className="admin-checkbox-label">
                <input
                  type="checkbox"
                  checked={rule.prioritizeAbilities}
                  onChange={(event) =>
                    updatePhaseRule(profile!.id, rule.id, {
                      prioritizeAbilities: event.target.checked,
                    })
                  }
                />
                <span>Prioritize abilities</span>
              </label>
              <button type="button" onClick={() => removePhaseRule(profile!.id, rule.id)}>
                Remove phase rule
              </button>
            </fieldset>
          ))
        )}
      </>
    )
  }

  return (
    <AdminEditorShell listLabel="AI Profiles" itemTitle={profile.name} onBack={closeEntityEditor}>
      <AdminSectionNav
        sections={[...AI_PROFILE_EDITOR_TABS]}
        active={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === 'phases'
        ? renderPhasesTab()
        : activeTab === 'abilities'
          ? renderAbilitiesTab()
          : renderCoreTab()}
      <TaxonomyEditorFields domain="ai-profiles" entityId={profile.id} />
      <div className="admin-editor-actions">
        <button type="button" className="admin-danger-button" onClick={handleRemove}>
          Delete AI profile
        </button>
      </div>
    </AdminEditorShell>
  )
}
