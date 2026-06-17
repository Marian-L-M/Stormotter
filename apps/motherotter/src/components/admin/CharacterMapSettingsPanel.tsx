import {
  createCharacterLocationRule,
  createEmptyMapCellReference,
  type CharacterLocationRule,
} from '../../admin/characterLocationTypes'
import { isUniqueNpcCharacter, type CharacterCategory } from '../../admin/characterTypes'
import { createGameplayConditionGroup } from '../../admin/gameplayConditionTypes'
import { GameplayConditionEditor } from './GameplayConditionEditor'
import { MapLocationPicker } from '../map/MapLocationPicker'
import { useEditorStore } from '../../store/editorStore'

interface CharacterLocationRulesEditorProps {
  legend: string
  hint: string
  rules: CharacterLocationRule[]
  onChange: (rules: CharacterLocationRule[]) => void
  characterId: string
}

export function CharacterLocationRulesEditor({
  legend,
  hint,
  rules,
  onChange,
  characterId,
}: CharacterLocationRulesEditorProps) {
  const mapId = useEditorStore((state) => state.mapId)
  const activeLayer = useEditorStore((state) => state.activeLayer)

  function updateRule(ruleId: string, patch: Partial<CharacterLocationRule>) {
    onChange(rules.map((rule) => (rule.id === ruleId ? { ...rule, ...patch } : rule)))
  }

  function addRule() {
    onChange([...rules, createCharacterLocationRule(mapId, activeLayer)])
  }

  function removeRule(ruleId: string) {
    onChange(rules.filter((rule) => rule.id !== ruleId))
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>{legend}</legend>
      <p className="field-hint">{hint}</p>

      {rules.length === 0 ? (
        <p className="admin-empty admin-empty-inline">No rules configured.</p>
      ) : (
        <ul className="character-location-rules-list">
          {rules.map((rule, index) => (
            <li key={rule.id} className="character-location-rule">
              <div className="character-location-rule-header">
                <strong>Rule {index + 1}</strong>
                <button
                  type="button"
                  className="admin-text-button admin-danger-text"
                  onClick={() => removeRule(rule.id)}
                >
                  Remove
                </button>
              </div>

              <MapLocationPicker
                label="When conditions pass, use location"
                value={rule.location}
                onChange={(location) => updateRule(rule.id, { location })}
              />

              <label className="field admin-checkbox-field">
                <input
                  type="checkbox"
                  checked={rule.conditions === null}
                  onChange={(event) =>
                    updateRule(rule.id, {
                      conditions: event.target.checked ? null : createGameplayConditionGroup('and'),
                    })
                  }
                />
                <span>Always apply (no gameplay state conditions)</span>
              </label>

              {rule.conditions ? (
                <GameplayConditionEditor
                  root={rule.conditions}
                  characterId={characterId}
                  onChange={(conditions) => updateRule(rule.id, { conditions })}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="admin-secondary-button" onClick={addRule}>
        Add rule
      </button>
    </fieldset>
  )
}

interface CharacterMapSettingsPanelProps {
  characterId: string
  characterType: CharacterCategory
  activeLocation: CharacterLocationRule['location'] | null
  spawnLocationRules: CharacterLocationRule[]
  despawnLocationRules: CharacterLocationRule[]
  onChange: (patch: {
    activeLocation?: CharacterLocationRule['location'] | null
    spawnLocationRules?: CharacterLocationRule[]
    despawnLocationRules?: CharacterLocationRule[]
  }) => void
  onClearActiveLocation?: () => void
  currentCell?: { mapId: string; x: number; y: number; layer: string }
}

export function CharacterMapSettingsPanel({
  characterId,
  characterType,
  activeLocation,
  spawnLocationRules,
  despawnLocationRules,
  onChange,
  onClearActiveLocation,
  currentCell,
}: CharacterMapSettingsPanelProps) {
  const mapId = useEditorStore((state) => state.mapId)
  const activeLayer = useEditorStore((state) => state.activeLayer)
  const isUnique = isUniqueNpcCharacter(characterType)

  const activeLocationValue =
    activeLocation ?? createEmptyMapCellReference(mapId, activeLayer)

  return (
    <div className="character-map-settings-panel">
      <fieldset className="admin-fieldset">
        <legend>Active location</legend>
        <p className="field-hint">
          {isUnique
            ? 'Optional fixed position on this map. Unique characters allow at most one non-conditional placement here; use conditional spawn rules for other appearances.'
            : 'Default map cell where this character appears when their location is active.'}
        </p>
        {currentCell ? (
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => onChange({ activeLocation: { ...currentCell } })}
          >
            Use selected grid cell
          </button>
        ) : null}
        <MapLocationPicker
          value={activeLocationValue}
          onChange={(location) => onChange({ activeLocation: location })}
        />
        {activeLocation ? (
          <button
            type="button"
            className="admin-text-button"
            onClick={() => {
              onChange({ activeLocation: null })
              onClearActiveLocation?.()
            }}
          >
            Clear active location
          </button>
        ) : null}
      </fieldset>

      <CharacterLocationRulesEditor
        legend="Conditional spawn locations"
        hint={
          isUnique
            ? 'Conditional appearances only — use these instead of a second fixed grid placement.'
            : 'Additional locations where this character can appear when gameplay state conditions are met.'
        }
        rules={spawnLocationRules}
        onChange={(nextRules) => onChange({ spawnLocationRules: nextRules })}
        characterId={characterId}
      />

      <CharacterLocationRulesEditor
        legend="Conditional despawn locations"
        hint="Locations where this character should disappear when gameplay state conditions are met."
        rules={despawnLocationRules}
        onChange={(nextRules) => onChange({ despawnLocationRules: nextRules })}
        characterId={characterId}
      />
    </div>
  )
}
