import { useMemo, useState } from 'react'
import { characterHasMainFlag, normalizeCharacterCategory } from '../../admin/characterTypes'
import { totalCharacterLevel } from '../../admin/progressionTypes'
import { CharacterCastSlotsPanel } from '../../components/admin/CharacterCastSlotsPanel'
import {
  applyCharacterExperience,
  setCharacterProgression,
  spendCharacterAbilityPoint,
  spendCharacterAttributePoint,
} from '../../lib/progressionActions'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useAttributesStore } from '../../store/attributesStore'
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { useCharacterMetaStore } from '../../store/characterMetaStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import {
  getEffectiveAbilityRank,
  getEffectiveAttributeRank,
  rankPointCost,
} from '../../admin/progressionUtils'

/** Preview-mode character initializer — simulates Gameotter character setup. */
export function CharacterInitializerPanel() {
  const characters = useContentCatalogStore((state) => state.stubs.characters)
  const metaByCharacterId = useCharacterMetaStore((state) => state.metaByCharacterId)
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)
  const abilityDefinitions = useAbilitiesStore((state) => state.definitions)
  const attributeDefinitions = useAttributesStore((state) => state.definitions)

  const previewCandidates = useMemo(
    () =>
      characters.filter((character) => {
        const meta = metaByCharacterId[character.id]
        if (!meta) return false
        const category = normalizeCharacterCategory(character.category)
        return meta.isMain && characterHasMainFlag(category)
      }),
    [characters, metaByCharacterId],
  )

  const [characterId, setCharacterId] = useState(previewCandidates[0]?.id ?? '')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [xpAmount, setXpAmount] = useState(100)

  const meta = characterId ? metaByCharacterId[characterId] : undefined
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

  function resetProgression() {
    if (!characterId || !selectedClassId) return
    setCharacterProgression(characterId, {
      classes: [{ classId: selectedClassId, level: 1, experience: 0 }],
      unspentAbilityPoints: 0,
      unspentAttributePoints: 0,
      abilityRanks: {},
      attributeRanks: {},
    })
  }

  function addClassTrack() {
    if (!characterId || !selectedClassId || !meta) return
    if (meta.progression.classes.some((track) => track.classId === selectedClassId)) return
    setCharacterProgression(characterId, {
      ...meta.progression,
      classes: [...meta.progression.classes, { classId: selectedClassId, level: 1, experience: 0 }],
    })
  }

  function applyXp() {
    if (!characterId || !selectedClassId || xpAmount <= 0) return
    applyCharacterExperience(characterId, selectedClassId, xpAmount)
  }

  if (previewCandidates.length === 0) {
    return (
      <section className="admin-initializer-panel">
        <h3 className="admin-initializer-title">Preview character initializer</h3>
        <p className="field-hint">
          Mark a character as main (Details tab) to configure preview progression here.
        </p>
      </section>
    )
  }

  return (
    <section className="admin-initializer-panel">
      <h3 className="admin-initializer-title">Preview character initializer</h3>
      <p className="field-hint admin-attribute-hint">
        Test class selection, XP, and point spending for map preview. Full runtime initialization
        will live in Gameotter.
      </p>

      <label className="field">
        <span>Preview character</span>
        <select value={characterId} onChange={(event) => setCharacterId(event.target.value)}>
          {previewCandidates.map((character) => (
            <option key={character.id} value={character.id}>
              {character.title}
            </option>
          ))}
        </select>
      </label>

      {meta ? (
        <>
          <p className="admin-progression-track-stats">
            Total level {totalCharacterLevel(meta.progression)} · Ability pts{' '}
            {meta.progression.unspentAbilityPoints} · Attribute pts{' '}
            {meta.progression.unspentAttributePoints}
          </p>

          <label className="field">
            <span>Class track</span>
            <select value={selectedClassId} onChange={(event) => setSelectedClassId(event.target.value)}>
              <option value="">Select class…</option>
              {characterClasses.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>

          <div className="admin-editor-actions admin-editor-actions-inline">
            <button type="button" disabled={!selectedClassId} onClick={resetProgression}>
              Reset to class
            </button>
            <button type="button" disabled={!selectedClassId} onClick={addClassTrack}>
              Add class track
            </button>
          </div>

          <label className="field">
            <span>Grant XP</span>
            <input
              type="number"
              min={1}
              value={xpAmount}
              onChange={(event) => setXpAmount(Math.max(1, Number(event.target.value) || 1))}
            />
          </label>
          <button type="button" disabled={!selectedClassId} onClick={applyXp}>
            Apply XP to selected class
          </button>

          {meta.progression.classes.length > 0 ? (
            <ul className="admin-progression-spend-list">
              {meta.progression.classes.map((track) => {
                const cls = classById[track.classId]
                return (
                  <li key={track.classId}>
                    {cls?.name ?? track.classId}: level {track.level}, {track.experience} XP
                  </li>
                )
              })}
            </ul>
          ) : null}

          {upgradeableAbilities.length > 0 ? (
            <fieldset className="admin-fieldset">
              <legend>Distribute ability points</legend>
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
                  return (
                    <li key={definition.id} className="admin-progression-spend-row">
                      <span>
                        {definition.name} (rank {rank})
                      </span>
                      <button
                        type="button"
                        disabled={
                          cost === null || meta.progression.unspentAbilityPoints < cost
                        }
                        onClick={() => spendCharacterAbilityPoint(characterId, definition)}
                      >
                        Rank up
                      </button>
                    </li>
                  )
                })}
              </ul>
            </fieldset>
          ) : null}

          {upgradeableAttributes.length > 0 ? (
            <fieldset className="admin-fieldset">
              <legend>Distribute attribute points</legend>
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
                  return (
                    <li key={definition.id} className="admin-progression-spend-row">
                      <span>
                        {definition.name} (rank {rank})
                      </span>
                      <button
                        type="button"
                        disabled={
                          cost === null || meta.progression.unspentAttributePoints < cost
                        }
                        onClick={() => spendCharacterAttributePoint(characterId, definition)}
                      >
                        Rank up
                      </button>
                    </li>
                  )
                })}
              </ul>
            </fieldset>
          ) : null}

          <CharacterCastSlotsPanel characterId={characterId} />
        </>
      ) : null}
    </section>
  )
}
