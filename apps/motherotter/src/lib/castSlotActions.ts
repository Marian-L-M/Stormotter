import {
  attemptRest,
  canStartRest,
  castConsumable,
  castFromSlot,
  getEffectiveAbilityForSlot,
  markCombatEnded,
  markCombatStarted,
  reassignSlot,
  type CastFromLocation,
  type CastSlotSessionState,
  type RestEligibility,
  type RestHookId,
  type RestOutcome,
  type RestZone,
} from '@otter/game-state'
import { useCharacterClassesStore } from '../store/characterClassesStore'
import { useCharacterMetaStore } from '../store/characterMetaStore'
import { useContainersStore } from '../store/containersStore'
import { useItemsStore } from '../store/itemsStore'
import { useLineageTypesStore } from '../store/lineageTypesStore'
import type { CharacterCastPreviewState } from '../admin/abilityCastSlotTypes'
import {
  buildAbilityMetadataFromPool,
  buildAssignablePoolForCharacter,
  classIdsForCharacter,
  resolveCastSlotDefinitionsForCharacter,
  resolveItemLocationsForCharacter,
  slotDefinitionById,
  syncCharacterCastPreviewState,
  type CastSlotCharacterContext,
} from '../admin/castSlotResolveUtils'
import { consumableItemCastLocations } from '../admin/characterInventoryCastUtils'

function buildContext(characterId: string): CastSlotCharacterContext | null {
  const meta = useCharacterMetaStore.getState().getMeta(characterId)
  if (!meta) return null
  const classById = Object.fromEntries(
    useCharacterClassesStore.getState().characterClasses.map((entry) => [entry.id, entry]),
  )
  const lineageType = meta.lineageTypeId
    ? useLineageTypesStore.getState().getLineageType(meta.lineageTypeId)
    : null
  const itemLocations = resolveItemLocationsForCharacter({
    characterId,
    meta,
    containers: useContainersStore.getState().containers,
    items: useItemsStore.getState().items,
  })
  return { characterId, meta, lineageType, classById, itemLocations }
}

function writePreview(characterId: string, preview: CharacterCastPreviewState) {
  useCharacterMetaStore.getState().updateMeta(characterId, { castSlotPreview: preview })
}

function sessionFromPreview(characterId: string, preview: CharacterCastPreviewState): CastSlotSessionState {
  return {
    elapsedMinutes: preview.elapsedMinutes,
    rest: preview.rest,
    characterCastState: {
      [characterId]: { characterId, slots: preview.slots },
    },
    itemInstances: { ...preview.itemInstances },
  }
}

function previewFromSession(characterId: string, session: CastSlotSessionState): CharacterCastPreviewState {
  const existing = useCharacterMetaStore.getState().getMeta(characterId)?.castSlotPreview
  return {
    slots: session.characterCastState[characterId]?.slots ?? [],
    elapsedMinutes: session.elapsedMinutes,
    rest: session.rest,
    itemInstances: session.itemInstances,
    ...(existing ? {} : {}),
  }
}

function applySessionToPreview(
  characterId: string,
  session: CastSlotSessionState,
  previous?: CharacterCastPreviewState,
): CharacterCastPreviewState {
  const preview = previewFromSession(characterId, session)
  if (!previous) return preview

  const destroyedIds = Object.entries(session.itemInstances)
    .filter(([, instance]) => instance.destroyed)
    .map(([id]) => id)

  for (const instanceId of destroyedIds) {
    const item = useItemsStore.getState().getItem(instanceId)
    if (item?.consumable?.destroyAtZero) {
      useItemsStore.getState().removeItem(instanceId)
    }
  }

  return preview
}

export function syncCharacterCastSlots(characterId: string): CharacterCastPreviewState | null {
  const context = buildContext(characterId)
  if (!context) return null
  const synced = syncCharacterCastPreviewState(context, context.meta.castSlotPreview)
  writePreview(characterId, synced)
  return synced
}

export interface CastSlotActionFeedback {
  ok: boolean
  message: string
}

export function reassignCharacterCastSlot(
  characterId: string,
  slotId: string,
  abilityId: string,
): CastSlotActionFeedback {
  const context = buildContext(characterId)
  if (!context) return { ok: false, message: 'Character not found.' }

  const definitions = resolveCastSlotDefinitionsForCharacter(context)
  const slotDefinition = slotDefinitionById(definitions, slotId)
  if (!slotDefinition) return { ok: false, message: 'Slot not found.' }

  const preview = syncCharacterCastPreviewState(context, context.meta.castSlotPreview)
  const runtime =
    preview.slots.find((entry) => entry.slotId === slotId) ??
    Object.values(preview.itemInstances)
      .flatMap((instance) => instance.slots)
      .find((entry) => entry.slotId === slotId)

  if (
    runtime?.hasBeenFilled &&
    runtime.assignedAbilityId &&
    runtime.assignedAbilityId !== abilityId &&
    slotDefinition.chargeSource === 'rest'
  ) {
    const confirmed = window.confirm(
      'Changing this slot uses today\'s charge until the character rests. Continue?',
    )
    if (!confirmed) {
      return { ok: false, message: 'Reassign cancelled.' }
    }
  }

  const pool = buildAssignablePoolForCharacter(context)
  const metadata = buildAbilityMetadataFromPool(pool)
  const session = sessionFromPreview(characterId, preview)
  const result = reassignSlot({
    session,
    slotId,
    abilityId,
    slotDefinition,
    assignablePool: pool,
    abilityMetadata: metadata,
    lineageTypeId: context.meta.lineageTypeId,
    classIds: classIdsForCharacter(context),
  })

  if (!result.ok) {
    return { ok: false, message: result.error ?? 'Could not reassign slot.' }
  }

  writePreview(characterId, applySessionToPreview(characterId, result.session, preview))
  return { ok: true, message: 'Slot updated.' }
}

export function castFromCharacterCastSlot(
  characterId: string,
  slotId: string,
): CastSlotActionFeedback {
  const context = buildContext(characterId)
  if (!context) return { ok: false, message: 'Character not found.' }

  const definitions = resolveCastSlotDefinitionsForCharacter(context)
  const slotDefinition = slotDefinitionById(definitions, slotId)
  if (!slotDefinition) return { ok: false, message: 'Slot not found.' }

  const preview = syncCharacterCastPreviewState(context, context.meta.castSlotPreview)
  const session = sessionFromPreview(characterId, preview)
  const result = castFromSlot({ session, slotId, slotDefinition })

  if (!result.ok) {
    return { ok: false, message: result.error ?? 'Could not cast.' }
  }

  writePreview(characterId, applySessionToPreview(characterId, result.session, preview))
  const abilityId = getEffectiveAbilityForSlot(
    slotDefinition,
    result.session.characterCastState[characterId]?.slots.find((entry) => entry.slotId === slotId) ??
      Object.values(result.session.itemInstances)
        .flatMap((instance) => instance.slots)
        .find((entry) => entry.slotId === slotId),
  )
  return { ok: true, message: abilityId ? `Cast ${abilityId}.` : 'Cast ability.' }
}

export function castFromCharacterConsumable(
  characterId: string,
  itemInstanceId: string,
  fromLocation: CastFromLocation,
): CastSlotActionFeedback {
  const context = buildContext(characterId)
  if (!context) return { ok: false, message: 'Character not found.' }

  const preview = syncCharacterCastPreviewState(context, context.meta.castSlotPreview)
  const session = sessionFromPreview(characterId, preview)
  const result = castConsumable({ session, itemInstanceId, fromLocation })

  if (!result.ok) {
    return { ok: false, message: result.error ?? 'Could not cast consumable.' }
  }

  writePreview(characterId, applySessionToPreview(characterId, result.session, preview))
  const abilityId = result.session.itemInstances[itemInstanceId]?.consumable?.abilityId
  return { ok: true, message: abilityId ? `Cast ${abilityId}.` : 'Cast consumable.' }
}

export interface RestCharacterCastSlotsInput {
  restZone: RestZone
  simulateUnsafeInterrupt?: boolean
  hostileNearby?: boolean
  /** When set, advances shared preview clock (map preview). */
  onMinutesAdvanced?: (minutes: number) => void
}

export interface RestCharacterCastSlotsResult {
  ok: boolean
  message: string
  outcome?: RestOutcome
  hooks?: RestHookId[]
}

export function checkCharacterRestEligibility(
  characterId: string,
  restZone: RestZone,
  hostileNearby = false,
): RestEligibility {
  const context = buildContext(characterId)
  if (!context) return { ok: false, reason: 'rest_forbidden' }
  const preview = syncCharacterCastPreviewState(context, context.meta.castSlotPreview)
  const session = sessionFromPreview(characterId, preview)
  return canStartRest({
    session,
    restZone,
    nowMs: Date.now(),
    partyPositions: hostileNearby ? [{ x: 0, y: 0 }] : [{ x: 0, y: 0 }],
    hostilePositions: hostileNearby ? [{ x: 5, y: 0 }] : [],
  })
}

export function restCharacterCastSlots(
  characterId: string,
  input: RestCharacterCastSlotsInput,
): RestCharacterCastSlotsResult {
  const context = buildContext(characterId)
  if (!context) return { ok: false, message: 'Character not found.' }

  const definitions = resolveCastSlotDefinitionsForCharacter(context)
  const preview = syncCharacterCastPreviewState(context, context.meta.castSlotPreview)
  const session = sessionFromPreview(characterId, preview)

  const eligibility = canStartRest({
    session,
    restZone: input.restZone,
    nowMs: Date.now(),
    partyPositions: [{ x: 0, y: 0 }],
    hostilePositions: input.hostileNearby ? [{ x: 5, y: 0 }] : [],
  })

  if (!eligibility.ok) {
    const reason =
      eligibility.reason === 'in_combat'
        ? 'Cannot rest during combat.'
        : eligibility.reason === 'enemies_nearby'
          ? 'Hostiles are too close to rest.'
          : eligibility.reason === 'combat_cooldown'
            ? 'Wait 30s after combat before resting.'
            : 'Rest is not allowed here.'
    return { ok: false, message: reason }
  }

  const { outcome, session: nextSession } = attemptRest(
    {
      session,
      restZone: input.restZone,
      nowMs: Date.now(),
      partyPositions: [{ x: 0, y: 0 }],
      hostilePositions: input.hostileNearby ? [{ x: 5, y: 0 }] : [],
      rollUnsafeRestInterrupt: () => input.simulateUnsafeInterrupt === true,
    },
    { [characterId]: definitions },
  )

  if (outcome.interrupted) {
    return {
      ok: false,
      message: 'Rest interrupted — no time passed and slots were not refreshed.',
      outcome,
      hooks: outcome.hooks,
    }
  }

  if (!outcome.completed) {
    return { ok: false, message: 'Rest failed.', outcome, hooks: outcome.hooks }
  }

  if (outcome.minutesAdvanced > 0) {
    input.onMinutesAdvanced?.(outcome.minutesAdvanced)
  }

  writePreview(characterId, applySessionToPreview(characterId, nextSession, preview))
  return {
    ok: true,
    message: `Rested for ${outcome.minutesAdvanced} minutes. All rest-charged slots refreshed.`,
    outcome,
    hooks: outcome.hooks,
  }
}

export function setCharacterCombatState(characterId: string, inCombat: boolean): void {
  const context = buildContext(characterId)
  if (!context) return
  const preview = syncCharacterCastPreviewState(context, context.meta.castSlotPreview)
  const session = sessionFromPreview(characterId, preview)
  const next = inCombat ? markCombatStarted(session) : markCombatEnded(session, Date.now())
  writePreview(characterId, previewFromSession(characterId, next))
}

export function setCharacterElapsedMinutes(characterId: string, elapsedMinutes: number): void {
  const context = buildContext(characterId)
  if (!context) return
  const preview = syncCharacterCastPreviewState(context, context.meta.castSlotPreview)
  writePreview(characterId, { ...preview, elapsedMinutes: Math.max(0, Math.floor(elapsedMinutes)) })
}

export function resetCharacterCastPreview(characterId: string): void {
  syncCharacterCastSlots(characterId)
}

export function listCharacterConsumables(characterId: string) {
  const context = buildContext(characterId)
  if (!context) return []
  return consumableItemCastLocations(context.itemLocations ?? [])
}
