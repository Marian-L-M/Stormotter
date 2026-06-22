import { useEffect, useMemo, useState } from 'react'
import {
  ABILITY_SLOT_ASSIGNMENT_LABELS,
  ABILITY_SLOT_CATEGORY_LABELS,
  type CharacterCastPreviewState,
} from '../../admin/abilityCastSlotTypes'
import {
  buildAbilityMetadataFromPool,
  buildAssignablePoolForCharacter,
  classIdsForCharacter,
  resolveCastSlotDefinitionsForCharacter,
  resolveItemLocationsForCharacter,
  runtimeEntryForSlot,
  type CastSlotCharacterContext,
} from '../../admin/castSlotResolveUtils'
import { consumableItemCastLocations } from '../../admin/characterInventoryCastUtils'
import { formatGameTimeDetailed, resolveGameTime } from '../../admin/gameTimeTypes'
import {
  castFromCharacterCastSlot,
  castFromCharacterConsumable,
  checkCharacterRestEligibility,
  reassignCharacterCastSlot,
  restCharacterCastSlots,
  setCharacterCombatState,
  syncCharacterCastSlots,
} from '../../lib/castSlotActions'
import { useAbilitiesStore } from '../../store/abilitiesStore'
import { useCharacterClassesStore } from '../../store/characterClassesStore'
import { useCharacterMetaStore } from '../../store/characterMetaStore'
import { useContainersStore } from '../../store/containersStore'
import { useGameplaySettingsStore } from '../../store/gameplaySettingsStore'
import { useItemsStore } from '../../store/itemsStore'
import { useLineageTypesStore } from '../../store/lineageTypesStore'
import {
  canAssignAbilityToSlot,
  getEffectiveAbilityForSlot,
  type RestZone,
} from '@otter/game-state'

interface CharacterCastSlotsPanelProps {
  characterId: string
}

function buildContext(
  characterId: string,
  meta: ReturnType<typeof useCharacterMetaStore.getState>['metaByCharacterId'][string],
  lineageTypes: ReturnType<typeof useLineageTypesStore.getState>['lineageTypes'],
  characterClasses: ReturnType<typeof useCharacterClassesStore.getState>['characterClasses'],
  containers: ReturnType<typeof useContainersStore.getState>['containers'],
  items: ReturnType<typeof useItemsStore.getState>['items'],
): CastSlotCharacterContext | null {
  if (!meta) return null
  const classById = Object.fromEntries(characterClasses.map((entry) => [entry.id, entry]))
  const lineageType = meta.lineageTypeId
    ? lineageTypes.find((entry) => entry.id === meta.lineageTypeId)
    : null
  const itemLocations = resolveItemLocationsForCharacter({
    characterId,
    meta,
    containers,
    items,
  })
  return { characterId, meta, lineageType, classById, itemLocations }
}

function runtimeForSlot(preview: CharacterCastPreviewState | undefined, slotId: string) {
  const characterEntry = preview ? runtimeEntryForSlot(preview, slotId) : undefined
  if (characterEntry) return characterEntry
  if (!preview) return undefined
  for (const instance of Object.values(preview.itemInstances)) {
    const entry = instance.slots.find((slot) => slot.slotId === slotId)
    if (entry) return entry
  }
  return undefined
}

export function CharacterCastSlotsPanel({ characterId }: CharacterCastSlotsPanelProps) {
  const meta = useCharacterMetaStore((state) => state.metaByCharacterId[characterId])
  const lineageTypes = useLineageTypesStore((state) => state.lineageTypes)
  const characterClasses = useCharacterClassesStore((state) => state.characterClasses)
  const containers = useContainersStore((state) => state.containers)
  const items = useItemsStore((state) => state.items)
  const abilityDefinitions = useAbilitiesStore((state) => state.definitions)
  const gameplaySettings = useGameplaySettingsStore((state) => state.settings)

  const [restZone, setRestZone] = useState<RestZone>('inn')
  const [simulateUnsafeInterrupt, setSimulateUnsafeInterrupt] = useState(false)
  const [hostileNearby, setHostileNearby] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [restLog, setRestLog] = useState<string[]>([])

  useEffect(() => {
    if (!characterId) return
    syncCharacterCastSlots(characterId)
  }, [characterId, meta?.progression, meta?.lineageTypeId, meta?.activeMainHandSlot, meta?.activeOffHandSlot, lineageTypes, characterClasses, containers, items])

  const context = useMemo(
    () => buildContext(characterId, meta, lineageTypes, characterClasses, containers, items),
    [characterId, meta, lineageTypes, characterClasses, containers, items],
  )

  const definitions = useMemo(
    () => (context ? resolveCastSlotDefinitionsForCharacter(context) : []),
    [context],
  )

  const assignablePool = useMemo(
    () => (context ? buildAssignablePoolForCharacter(context) : []),
    [context],
  )

  const abilityMetadata = useMemo(
    () => buildAbilityMetadataFromPool(assignablePool),
    [assignablePool],
  )

  const classIds = useMemo(() => (context ? classIdsForCharacter(context) : []), [context])

  const characterDefinitions = useMemo(
    () => definitions.filter((entry) => entry.owner.type === 'character'),
    [definitions],
  )
  const itemDefinitions = useMemo(
    () => definitions.filter((entry) => entry.owner.type === 'item'),
    [definitions],
  )
  const consumables = useMemo(
    () => (context ? consumableItemCastLocations(context.itemLocations ?? []) : []),
    [context],
  )

  const preview: CharacterCastPreviewState | undefined = meta?.castSlotPreview
  const gameTime = resolveGameTime(preview?.elapsedMinutes ?? 0, gameplaySettings)
  const restEligibility = checkCharacterRestEligibility(characterId, restZone, hostileNearby)

  const definitionById = useMemo(
    () => new Map(abilityDefinitions.map((entry) => [entry.id, entry])),
    [abilityDefinitions],
  )

  function abilityName(abilityId: string | null | undefined): string {
    if (!abilityId) return '—'
    return definitionById.get(abilityId)?.name ?? abilityId
  }

  function handleReassign(slotId: string, abilityId: string) {
    const result = reassignCharacterCastSlot(characterId, slotId, abilityId)
    setFeedback(result.message)
  }

  function handleCast(slotId: string) {
    const result = castFromCharacterCastSlot(characterId, slotId)
    if (result.ok) {
      const slotDef = definitions.find((entry) => entry.slotId === slotId)
      const runtime = preview ? runtimeForSlot(preview, slotId) : undefined
      const abilityId = slotDef ? getEffectiveAbilityForSlot(slotDef, runtime) : null
      setFeedback(`Cast ${abilityName(abilityId)}.`)
    } else {
      setFeedback(result.message)
    }
  }

  function handleCastConsumable(instanceId: string, fromLocation: 'inventory' | 'quick') {
    const result = castFromCharacterConsumable(characterId, instanceId, fromLocation)
    setFeedback(result.message)
  }

  function renderSlotRow(slotDef: (typeof definitions)[number], itemLabel?: string) {
    const runtime = preview ? runtimeForSlot(preview, slotDef.slotId) : undefined
    const abilityId = getEffectiveAbilityForSlot(slotDef, runtime)
    const eligible = assignablePool.filter((entry) =>
      canAssignAbilityToSlot(
        slotDef,
        entry.definitionId,
        assignablePool,
        abilityMetadata,
        meta!.lineageTypeId,
        classIds,
      ),
    )

    return (
      <li key={slotDef.slotId} className="admin-cast-slot-preview-row">
        <div className="admin-cast-slot-preview-head">
          <strong>
            {itemLabel ? `${itemLabel} · ` : ''}
            {ABILITY_SLOT_CATEGORY_LABELS[slotDef.category]}
          </strong>
          <span className="admin-cast-slot-preview-meta">
            {ABILITY_SLOT_ASSIGNMENT_LABELS[slotDef.assignment]}
            {slotDef.chargeSource === 'item' ? ' · item charge' : ''}
          </span>
          <span
            className={`admin-cast-slot-charge${(runtime?.usesRemaining ?? 0) > 0 ? ' is-ready' : ' is-spent'}`}
          >
            {(runtime?.usesRemaining ?? 0) > 0 ? 'Ready' : 'Spent'}
          </span>
        </div>

        {slotDef.assignment === 'fixed' ? (
          <p className="admin-cast-slot-preview-ability">{abilityName(abilityId)}</p>
        ) : (
          <label className="field">
            <span>Prepared ability</span>
            <select
              className="admin-select admin-select-block"
              value={abilityId ?? ''}
              onChange={(event) => {
                const nextId = event.target.value
                if (!nextId) return
                handleReassign(slotDef.slotId, nextId)
              }}
            >
              <option value="">Select ability…</option>
              {eligible.map((entry) => (
                <option key={entry.definitionId} value={entry.definitionId}>
                  {abilityName(entry.definitionId)}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          className="admin-secondary-button"
          disabled={!abilityId || (runtime?.usesRemaining ?? 0) <= 0}
          onClick={() => handleCast(slotDef.slotId)}
        >
          Cast
        </button>
      </li>
    )
  }

  function handleRest() {
    const result = restCharacterCastSlots(characterId, {
      restZone,
      simulateUnsafeInterrupt,
      hostileNearby,
    })
    setFeedback(result.message)
    if (result.hooks?.length) {
      setRestLog((previous) => [...result.hooks!.map((hook) => `[${hook}]`), ...previous].slice(0, 8))
    }
  }

  if (!context || !meta) {
    return null
  }

  if (definitions.length === 0 && consumables.length === 0) {
    return (
      <fieldset className="admin-fieldset">
        <legend>Cast slots</legend>
        <p className="field-hint">
          No cast slots yet. Assign a character type and class with cast slot grants, then set up
          class tracks above.
        </p>
      </fieldset>
    )
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>Cast slots</legend>
      <p className="field-hint admin-attribute-hint">
        Prepare abilities in unlocked slots. Reassigning a filled slot burns its charge until rest.
        {formatGameTimeDetailed(gameTime)}
      </p>

      <ul className="admin-cast-slot-preview-list">
        {characterDefinitions.map((slotDef) => renderSlotRow(slotDef))}
      </ul>

      {itemDefinitions.length > 0 ? (
        <fieldset className="admin-fieldset admin-fieldset-nested">
          <legend>Equipped item slots</legend>
          <ul className="admin-cast-slot-preview-list">
            {itemDefinitions.map((slotDef) => {
              const itemInstanceId =
                slotDef.owner.type === 'item' ? slotDef.owner.itemInstanceId : null
              const item = itemInstanceId ? items.find((entry) => entry.id === itemInstanceId) : undefined
              return renderSlotRow(slotDef, item?.name ?? itemInstanceId ?? 'Item')
            })}
          </ul>
        </fieldset>
      ) : null}

      {consumables.length > 0 ? (
        <fieldset className="admin-fieldset admin-fieldset-nested">
          <legend>Consumables</legend>
          <ul className="admin-cast-slot-preview-list">
            {consumables.map((entry) => {
              const instance = preview?.itemInstances[entry.instanceId]
              const charges = instance?.itemChargesRemaining ?? entry.item.consumable?.maxCharges ?? 0
              const fromLocation = entry.castFrom ?? 'inventory'
              return (
                <li key={entry.instanceId} className="admin-cast-slot-preview-row">
                  <div className="admin-cast-slot-preview-head">
                    <strong>{entry.item.name}</strong>
                    <span className="admin-cast-slot-preview-meta">{entry.location}</span>
                    <span
                      className={`admin-cast-slot-charge${charges > 0 ? ' is-ready' : ' is-spent'}`}
                    >
                      {charges} charge{charges === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="admin-cast-slot-preview-ability">
                    {abilityName(entry.item.consumable?.abilityId)}
                  </p>
                  <button
                    type="button"
                    className="admin-secondary-button"
                    disabled={charges <= 0}
                    onClick={() => handleCastConsumable(entry.instanceId, fromLocation)}
                  >
                    Cast
                  </button>
                </li>
              )
            })}
          </ul>
        </fieldset>
      ) : null}

      <fieldset className="admin-fieldset admin-fieldset-nested">
        <legend>Rest (preview)</legend>
        <label className="field">
          <span>Rest location</span>
          <select
            className="admin-select admin-select-block"
            value={restZone}
            onChange={(event) => setRestZone(event.target.value as RestZone)}
          >
            <option value="inn">Inn (safe)</option>
            <option value="inside">Inside (safe)</option>
            <option value="outside">Outside (unsafe roll)</option>
          </select>
        </label>

        <label className="admin-checkbox-field">
          <input
            type="checkbox"
            checked={hostileNearby}
            onChange={(event) => setHostileNearby(event.target.checked)}
          />
          <span>Simulate hostiles in aggressive range</span>
        </label>

        <label className="admin-checkbox-field">
          <input
            type="checkbox"
            checked={simulateUnsafeInterrupt}
            onChange={(event) => setSimulateUnsafeInterrupt(event.target.checked)}
          />
          <span>Simulate unsafe rest interruption</span>
        </label>

        <div className="admin-editor-actions admin-editor-actions-inline">
          <button
            type="button"
            disabled={!restEligibility.ok}
            onClick={() => {
              setCharacterCombatState(characterId, true)
              setFeedback('Combat started — rest blocked.')
            }}
          >
            Start combat
          </button>
          <button
            type="button"
            onClick={() => {
              setCharacterCombatState(characterId, false)
              setFeedback('Combat ended — 30s cooldown before rest.')
            }}
          >
            End combat
          </button>
          <button type="button" disabled={!restEligibility.ok} onClick={handleRest}>
            Rest (8h)
          </button>
        </div>

        {!restEligibility.ok ? (
          <p className="field-hint admin-cast-slot-warning">
            Rest blocked: {restEligibility.reason?.replaceAll('_', ' ')}
          </p>
        ) : null}

        {restLog.length > 0 ? (
          <ul className="admin-cast-slot-rest-log">
            {restLog.map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry}</li>
            ))}
          </ul>
        ) : null}
      </fieldset>

      {feedback ? <p className="field-hint admin-cast-slot-feedback">{feedback}</p> : null}
    </fieldset>
  )
}
