import { useMemo } from 'react'
import type { AbilityDefinition } from '../../admin/abilityTypes'
import type { AttributeDefinition } from '../../admin/attributeTypes'
import type { CharacterClass } from '../../admin/characterClassTypes'
import type { CharacterMeta } from '../../store/characterMetaStore'
import {
  getEffectiveAbilityRank,
  getEffectiveAttributeRank,
  nextClassLevelXpRequired,
  rankPointCost,
} from '../../admin/progressionUtils'
import { totalCharacterLevel } from '../../admin/progressionTypes'
import {
  applyCharacterExperience,
  setCharacterProgression,
  spendCharacterAbilityPoint,
  spendCharacterAttributePoint,
} from '../../lib/progressionActions'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useAttributesStore } from '../../store/attributesStore'

interface CharacterProgressionPanelProps {
  characterId: string
  meta: CharacterMeta
  characterClasses: CharacterClass[]
}

export function CharacterProgressionPanel({
  characterId,
  meta,
  characterClasses,
}: CharacterProgressionPanelProps) {
  const abilityDefinitions = useAbilitiesStore((state) => state.definitions)
  const attributeDefinitions = useAttributesStore((state) => state.definitions)

  const classById = useMemo(
    () => Object.fromEntries(characterClasses.map((entry) => [entry.id, entry])),
    [characterClasses],
  )

  const upgradeableAbilities = abilityDefinitions.filter(
    (entry) => entry.progression.mode === 'upgradeable',
  )
  const upgradeableAttributes = attributeDefinitions.filter(
    (entry) => entry.progression.mode === 'upgradeable',
  )

  const totalLevel = totalCharacterLevel(meta.progression)

  function addClassTrack(classId: string) {
    if (!classId || meta.progression.classes.some((track) => track.classId === classId)) return
    setCharacterProgression(characterId, {
      ...meta.progression,
      classes: [...meta.progression.classes, { classId, level: 1, experience: 0 }],
    })
  }

  function removeClassTrack(classId: string) {
    setCharacterProgression(characterId, {
      ...meta.progression,
      classes: meta.progression.classes.filter((track) => track.classId !== classId),
    })
  }

  function setClassExperience(classId: string, experience: number) {
    setCharacterProgression(characterId, {
      ...meta.progression,
      classes: meta.progression.classes.map((track) =>
        track.classId === classId
          ? { ...track, experience: Math.max(0, Math.round(experience)) }
          : track,
      ),
    })
  }

  function grantExperience(classId: string, amount: number) {
    applyCharacterExperience(characterId, classId, amount)
  }

  function spendAbility(definition: AbilityDefinition) {
    spendCharacterAbilityPoint(characterId, definition)
  }

  function spendAttribute(definition: AttributeDefinition) {
    spendCharacterAttributePoint(characterId, definition)
  }

  const availableClassOptions = characterClasses.filter(
    (entry) => !meta.progression.classes.some((track) => track.classId === entry.id),
  )

  return (
    <>
      <fieldset className="admin-fieldset">
        <legend>Class tracks</legend>
        <p className="field-hint admin-attribute-hint">
          Multi-class characters sum per-class levels for total level ({totalLevel}). XP is tracked
          per class with cumulative thresholds.
        </p>

        {meta.progression.classes.length === 0 ? (
          <p className="admin-empty admin-empty-inline">No class tracks assigned.</p>
        ) : (
          meta.progression.classes.map((track) => {
            const characterClass = classById[track.classId]
            const nextXp = nextClassLevelXpRequired(characterClass, track.level)
            return (
              <div key={track.classId} className="admin-level-grant-block">
                <div className="admin-level-grant-header">
                  <strong>{characterClass?.name ?? track.classId}</strong>
                  <button type="button" onClick={() => removeClassTrack(track.classId)}>
                    Remove
                  </button>
                </div>
                <div className="admin-progression-track-stats">
                  <span>Class level {track.level}</span>
                  <span>
                    XP {track.experience}
                    {nextXp !== null ? ` / ${nextXp} to level ${track.level + 1}` : ' (max)'}
                  </span>
                </div>
                <label className="field">
                  <span>Set cumulative XP</span>
                  <input
                    type="number"
                    min={0}
                    value={track.experience}
                    onChange={(event) =>
                      setClassExperience(track.classId, Number(event.target.value) || 0)
                    }
                  />
                </label>
                <div className="admin-editor-actions admin-editor-actions-inline">
                  <button type="button" onClick={() => grantExperience(track.classId, 100)}>
                    +100 XP
                  </button>
                  <button type="button" onClick={() => grantExperience(track.classId, 500)}>
                    +500 XP
                  </button>
                </div>
              </div>
            )
          })
        )}

        {availableClassOptions.length > 0 ? (
          <label className="field">
            <span>Add class track</span>
            <select
              defaultValue=""
              onChange={(event) => {
                addClassTrack(event.target.value)
                event.target.value = ''
              }}
            >
              <option value="" disabled>
                Select class…
              </option>
              {availableClassOptions.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </fieldset>

      <fieldset className="admin-fieldset">
        <legend>Unspent points</legend>
        <p className="admin-progression-track-stats">
          Ability points: {meta.progression.unspentAbilityPoints} · Attribute points:{' '}
          {meta.progression.unspentAttributePoints}
        </p>
      </fieldset>

      {upgradeableAbilities.length > 0 ? (
        <fieldset className="admin-fieldset">
          <legend>Spend ability points</legend>
          <ul className="admin-progression-spend-list">
            {upgradeableAbilities.map((definition) => {
              const rank = getEffectiveAbilityRank(
                definition.id,
                meta.progression,
                meta.progression.classes,
                classById,
              )
              const nextRank = rank + 1
              const cost =
                nextRank <= definition.progression.maxRank
                  ? rankPointCost(definition.progression, nextRank)
                  : null
              const canSpend =
                cost !== null && meta.progression.unspentAbilityPoints >= cost
              return (
                <li key={definition.id} className="admin-progression-spend-row">
                  <span>
                    {definition.name} — rank {rank}/{definition.progression.maxRank}
                  </span>
                  <button
                    type="button"
                    disabled={!canSpend}
                    onClick={() => spendAbility(definition)}
                  >
                    {cost !== null ? `Rank up (${cost} pt)` : 'Max rank'}
                  </button>
                </li>
              )
            })}
          </ul>
        </fieldset>
      ) : null}

      {upgradeableAttributes.length > 0 ? (
        <fieldset className="admin-fieldset">
          <legend>Spend attribute points</legend>
          <ul className="admin-progression-spend-list">
            {upgradeableAttributes.map((definition) => {
              const rank = getEffectiveAttributeRank(
                definition.id,
                meta.progression,
                meta.progression.classes,
                classById,
              )
              const nextRank = rank + 1
              const cost =
                nextRank <= definition.progression.maxRank
                  ? rankPointCost(definition.progression, nextRank)
                  : null
              const canSpend =
                cost !== null && meta.progression.unspentAttributePoints >= cost
              return (
                <li key={definition.id} className="admin-progression-spend-row">
                  <span>
                    {definition.name} — rank {rank}/{definition.progression.maxRank}
                  </span>
                  <button
                    type="button"
                    disabled={!canSpend}
                    onClick={() => spendAttribute(definition)}
                  >
                    {cost !== null ? `Rank up (${cost} pt)` : 'Max rank'}
                  </button>
                </li>
              )
            })}
          </ul>
        </fieldset>
      ) : null}
    </>
  )
}
