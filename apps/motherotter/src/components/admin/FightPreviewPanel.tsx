import { useMemo, useState } from 'react'
import {
  resolveFightCombatant,
  runFightPreview,
  type FightPreviewResult,
} from '../../admin/fightPreviewUtils'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useAiProfilesStore } from '../../store/aiProfilesStore'
import { useAttributesStore } from '../../store/attributesStore'
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { useCharacterMetaStore } from '../../store/characterMetaStore'
import { useContainersStore } from '../../store/containersStore'
import { useContentCatalogStore } from '../../store/contentCatalogStore'
import { useItemsStore } from '../../store/itemsStore'
import { useLineageTypesStore } from '../../store/lineageTypesStore'

/** Sandbox fight preview — pit two characters against each other. */
export function FightPreviewPanel() {
  const characters = useContentCatalogStore((state) => state.stubs.characters)
  const metaByCharacterId = useCharacterMetaStore((state) => state.metaByCharacterId)
  const lineageTypes = useLineageTypesStore((state) => state.lineageTypes)
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)
  const aiProfiles = useAiProfilesStore((state) => state.aiProfiles)
  const attributeDefinitions = useAttributesStore((state) => state.definitions)
  const entityValues = useAttributesStore((state) => state.entityValues)
  const levelAttributeGrants = useAttributesStore((state) => state.levelAttributeGrants)
  const abilityDefinitions = useAbilitiesStore((state) => state.definitions)
  const levelAbilityGrants = useAbilitiesStore((state) => state.levelAbilityGrants)
  const containers = useContainersStore((state) => state.containers)
  const items = useItemsStore((state) => state.items)

  const [sideAId, setSideAId] = useState(characters[0]?.id ?? '')
  const [sideBId, setSideBId] = useState(characters[1]?.id ?? characters[0]?.id ?? '')
  const [maxRounds, setMaxRounds] = useState(15)
  const [result, setResult] = useState<FightPreviewResult | null>(null)

  function buildCombatant(characterId: string) {
    const character = characters.find((entry) => entry.id === characterId)
    const meta = metaByCharacterId[characterId]
    if (!character || !meta) return null

    const lineageType = lineageTypes.find((entry) => entry.id === meta.lineageTypeId)
    const characterClass = characterClasses.find((entry) => entry.id === meta.classId)
    const aiProfile = meta.aiProfileId
      ? aiProfiles.find((entry) => entry.id === meta.aiProfileId)
      : undefined

    return resolveFightCombatant({
      characterId,
      title: character.title,
      meta,
      lineageType,
      characterClass,
      characterClasses,
      aiProfile,
      attributeDefinitions,
      entityValues,
      levelAttributeGrants,
      abilityDefinitions,
      levelAbilityGrants,
      containers,
      items,
    })
  }

  const sideA = useMemo(() => (sideAId ? buildCombatant(sideAId) : null), [
    sideAId,
    characters,
    metaByCharacterId,
    lineageTypes,
    characterClasses,
    aiProfiles,
    attributeDefinitions,
    entityValues,
    levelAttributeGrants,
    abilityDefinitions,
    levelAbilityGrants,
    containers,
    items,
  ])

  const sideB = useMemo(() => (sideBId ? buildCombatant(sideBId) : null), [
    sideBId,
    characters,
    metaByCharacterId,
    lineageTypes,
    characterClasses,
    aiProfiles,
    attributeDefinitions,
    entityValues,
    levelAttributeGrants,
    abilityDefinitions,
    levelAbilityGrants,
    containers,
    items,
  ])

  function runPreview() {
    if (!sideA || !sideB || sideA.characterId === sideB.characterId) return
    const profileA = sideAId ? aiProfiles.find((p) => p.id === metaByCharacterId[sideAId]?.aiProfileId) : undefined
    const profileB = sideBId ? aiProfiles.find((p) => p.id === metaByCharacterId[sideBId]?.aiProfileId) : undefined
    const abilityNamesById = Object.fromEntries(
      abilityDefinitions.map((definition) => [definition.id, definition.name]),
    )
    setResult(
      runFightPreview({
        sideA,
        sideB,
        profileA,
        profileB,
        abilityNamesById,
        maxRounds,
      }),
    )
  }

  if (characters.length < 2) {
    return (
      <section className="admin-initializer-panel admin-fight-preview-panel">
        <h3 className="admin-initializer-title">Fight preview</h3>
        <p className="field-hint">Add at least two characters to run a fight preview.</p>
      </section>
    )
  }

  return (
    <section className="admin-initializer-panel admin-fight-preview-panel">
      <h3 className="admin-initializer-title">Fight preview</h3>
      <p className="field-hint admin-attribute-hint">
        Pit two characters against each other using derived combat stats and assigned AI profiles.
        Results are randomized — for design testing only.
      </p>

      <div className="admin-fight-preview-matchup">
        <label className="field">
          <span>Side A</span>
          <select value={sideAId} onChange={(event) => setSideAId(event.target.value)}>
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.title}
              </option>
            ))}
          </select>
        </label>

        <span className="admin-fight-preview-vs">vs</span>

        <label className="field">
          <span>Side B</span>
          <select value={sideBId} onChange={(event) => setSideBId(event.target.value)}>
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Max rounds</span>
        <input
          type="number"
          min={1}
          max={50}
          value={maxRounds}
          onChange={(event) => setMaxRounds(Math.max(1, Math.min(50, Number(event.target.value) || 1)))}
        />
      </label>

      {sideA && sideB ? (
        <div className="admin-fight-preview-stats">
          <div className="admin-fight-preview-side">
            <strong>{sideA.title}</strong>
            <span>
              HP {sideA.maxHp} · AC {sideA.armorClass} · Melee +{sideA.meleeAttack}
            </span>
            <span className="field-hint">
              {sideA.aiProfileName ? `AI: ${sideA.aiProfileName}` : 'No AI profile'}
            </span>
          </div>
          <div className="admin-fight-preview-side">
            <strong>{sideB.title}</strong>
            <span>
              HP {sideB.maxHp} · AC {sideB.armorClass} · Melee +{sideB.meleeAttack}
            </span>
            <span className="field-hint">
              {sideB.aiProfileName ? `AI: ${sideB.aiProfileName}` : 'No AI profile'}
            </span>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        disabled={!sideA || !sideB || sideAId === sideBId}
        onClick={runPreview}
      >
        Run fight preview
      </button>

      {result ? (
        <div className="admin-fight-preview-log">
          <p className="admin-progression-track-stats">
            {result.winnerId
              ? `Winner: ${characters.find((c) => c.id === result.winnerId)?.title ?? result.winnerId}`
              : 'No winner'}{' '}
            · {result.rounds} round(s)
          </p>
          <ol className="admin-fight-preview-log-list">
            {result.log.map((entry, index) => (
              <li key={`${entry.round}-${index}`}>
                {entry.round > 0 ? `[R${entry.round}] ` : ''}
                {entry.message}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  )
}
