import type {
  AbilityCastSlotTemplate,
  AbilitySlotCategory,
  AbilitySlotMetadata,
  AssignableAbilityPoolEntry,
  AttemptRestInput,
  CanStartRestInput,
  CastSlotActionResult,
  CastSlotRuntimeEntry,
  CastSlotSessionState,
  CharacterCastRuntimeState,
  ItemCastSlotDefinition,
  ItemInstanceCastRuntimeState,
  LevelAssignableAbilityEntry,
  LevelCastSlotGrant,
  ResolveCastSlotsInput,
  ResolvedCastSlotDefinition,
  RestEligibility,
  RestHookId,
  RestKind,
  RestOutcome,
  RestZone,
} from './castSlotTypes.js'
import { DEFAULT_REST_CONFIG } from './castSlotTypes.js'

export type {
  AbilityCastSlotTemplate,
  AbilitySlotAssignment,
  AbilitySlotCategory,
  AbilitySlotMetadata,
  AssignableAbilityPoolEntry,
  CastFromLocation,
  CastSlotActionResult,
  CastSlotChargeSource,
  CastSlotOwner,
  CastSlotRuntimeEntry,
  CastSlotSessionState,
  CharacterCastRuntimeState,
  ConsumableCastConfig,
  ItemCastSlotDefinition,
  ItemInstanceCastRuntimeState,
  LevelAssignableAbilityEntry,
  LevelCastSlotGrant,
  ResolveCastSlotsInput,
  ResolvedCastSlotDefinition,
  RestConfig,
  RestEligibility,
  RestEligibilityFailure,
  RestHookId,
  RestKind,
  RestOutcome,
  RestZone,
  SessionRestState,
} from './castSlotTypes.js'

export { DEFAULT_REST_CONFIG } from './castSlotTypes.js'

function defaultEvaluateCondition(_conditions: unknown | null): boolean {
  return true
}

function normalizeUsesPerRest(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) return 1
  return Math.floor(value)
}

function characterSlotId(characterId: string, templateId: string): string {
  return `character:${characterId}:${templateId}`
}

function itemSlotId(itemInstanceId: string, templateId: string): string {
  return `item:${itemInstanceId}:${templateId}`
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1)
}

function isHostileInAggressiveRange(
  partyPositions: Array<{ x: number; y: number }>,
  hostilePositions: Array<{ x: number; y: number }>,
  aggressiveRange: number,
): boolean {
  for (const hostile of hostilePositions) {
    for (const party of partyPositions) {
      if (distance(party.x, party.y, hostile.x, hostile.y) <= aggressiveRange) {
        return true
      }
    }
  }
  return false
}

function activeSlotsFromGrants(
  grants: LevelCastSlotGrant[] | undefined,
  characterLevel: number,
  evaluateCondition: (conditions: unknown | null) => boolean,
): AbilityCastSlotTemplate[] {
  if (!grants?.length) return []
  const level = Math.max(1, Math.floor(characterLevel))
  const templates: AbilityCastSlotTemplate[] = []
  for (const grant of grants) {
    if (grant.level > level) continue
    for (const slot of grant.slots) {
      if (slot.unlockLevel > level) continue
      if (!evaluateCondition(slot.unlockConditions)) continue
      templates.push(slot)
    }
  }
  return templates
}

function templateToDefinition(
  template: AbilityCastSlotTemplate,
  owner: ResolvedCastSlotDefinition['owner'],
  slotId: string,
): ResolvedCastSlotDefinition {
  return {
    slotId,
    templateId: template.id,
    owner,
    category: template.category,
    assignment: template.assignment,
    fixedAbilityId:
      template.assignment === 'fixed' && template.fixedAbilityId ? template.fixedAbilityId : null,
    chargeSource: template.chargeSource ?? 'rest',
    usesPerRest: normalizeUsesPerRest(template.usesPerRest),
    ownerClassId: template.ownerClassId,
    ownerTypeId: template.ownerTypeId,
  }
}

/** Merge slot templates from type → class tracks → character. Later sources override same template id. */
export function resolveCastSlotDefinitions(input: ResolveCastSlotsInput): ResolvedCastSlotDefinition[] {
  const evaluateCondition = input.evaluateCondition ?? defaultEvaluateCondition
  const bySlotId = new Map<string, ResolvedCastSlotDefinition>()

  function addTemplate(
    template: AbilityCastSlotTemplate,
    owner: ResolvedCastSlotDefinition['owner'],
    slotId: string,
  ) {
    bySlotId.set(slotId, templateToDefinition(template, owner, slotId))
  }

  for (const template of activeSlotsFromGrants(
    input.typeGrants,
    input.totalLevel,
    evaluateCondition,
  )) {
    if (template.category === 'type' && template.ownerTypeId && template.ownerTypeId !== input.lineageTypeId) {
      continue
    }
    addTemplate(
      template,
      { type: 'character', characterId: input.characterId },
      characterSlotId(input.characterId, template.id),
    )
  }

  for (const track of input.classTracks) {
    const grants = input.classGrantsByClassId[track.classId] ?? []
    for (const template of activeSlotsFromGrants(grants, track.level, evaluateCondition)) {
      if (template.category === 'class' && template.ownerClassId && template.ownerClassId !== track.classId) {
        continue
      }
      addTemplate(
        template,
        { type: 'character', characterId: input.characterId },
        characterSlotId(input.characterId, template.id),
      )
    }
  }

  for (const template of activeSlotsFromGrants(
    input.characterGrants,
    input.totalLevel,
    evaluateCondition,
  )) {
    addTemplate(
      template,
      { type: 'character', characterId: input.characterId },
      characterSlotId(input.characterId, template.id),
    )
  }

  const definitionById = new Map(
    input.equippedItemDefinitions.map((entry) => [entry.itemDefinitionId, entry]),
  )

  for (const instance of input.equippedItemInstances) {
    if (instance.ownerCharacterId !== input.characterId) continue
    const definition = definitionById.get(instance.definitionId)
    if (!definition?.castSlots.length) continue
    for (const template of definition.castSlots) {
      addTemplate(
        template,
        {
          type: 'item',
          characterId: input.characterId,
          itemInstanceId: instance.instanceId,
        },
        itemSlotId(instance.instanceId, template.id),
      )
    }
  }

  return [...bySlotId.values()]
}

function runtimeEntryFromDefinition(definition: ResolvedCastSlotDefinition): CastSlotRuntimeEntry {
  const fixedAssigned = definition.fixedAbilityId
  return {
    slotId: definition.slotId,
    assignedAbilityId: fixedAssigned,
    usesRemaining: definition.usesPerRest,
    hasBeenFilled: fixedAssigned !== null,
  }
}

export function createEmptyCastSlotSession(): CastSlotSessionState {
  return {
    elapsedMinutes: 0,
    rest: {
      lastCombatEndedAtMs: null,
      isInCombat: false,
    },
    characterCastState: {},
    itemInstances: {},
  }
}

export function initializeCharacterCastState(
  characterId: string,
  definitions: ResolvedCastSlotDefinition[],
): CharacterCastRuntimeState {
  const characterSlots = definitions.filter(
    (entry) => entry.owner.type === 'character' && entry.owner.characterId === characterId,
  )
  return {
    characterId,
    slots: characterSlots.map(runtimeEntryFromDefinition),
  }
}

export function initializeItemInstanceState(
  instanceId: string,
  definitionId: string,
  ownerCharacterId: string,
  itemDefinition: ItemCastSlotDefinition,
  slotDefinitions: ResolvedCastSlotDefinition[],
): ItemInstanceCastRuntimeState {
  const itemSlots = slotDefinitions.filter(
    (entry) => entry.owner.type === 'item' && entry.owner.itemInstanceId === instanceId,
  )
  return {
    instanceId,
    definitionId,
    ownerCharacterId,
    itemChargesRemaining: itemDefinition.maxItemCharges,
    slots: itemSlots.map(runtimeEntryFromDefinition),
    destroyed: false,
    consumable: itemDefinition.consumable ?? null,
  }
}

/** Preserve assignments and usage for slots that still exist; add new slots at full charge. */
export function mergeCharacterCastState(
  existing: CharacterCastRuntimeState | undefined,
  definitions: ResolvedCastSlotDefinition[],
): CharacterCastRuntimeState {
  const characterId = existing?.characterId ?? definitions[0]?.owner.characterId ?? ''
  const characterSlots = definitions.filter(
    (entry) => entry.owner.type === 'character' && entry.owner.characterId === characterId,
  )
  const previousBySlotId = new Map(existing?.slots.map((entry) => [entry.slotId, entry]) ?? [])

  return {
    characterId,
    slots: characterSlots.map((definition) => {
      const previous = previousBySlotId.get(definition.slotId)
      if (previous) {
        const fixedAbilityId = definition.fixedAbilityId
        return {
          slotId: definition.slotId,
          assignedAbilityId: fixedAbilityId ?? previous.assignedAbilityId,
          usesRemaining: Math.min(previous.usesRemaining, definition.usesPerRest),
          hasBeenFilled: previous.hasBeenFilled || fixedAbilityId !== null,
        }
      }
      return runtimeEntryFromDefinition(definition)
    }),
  }
}

export function buildAssignableAbilityPool(
  entries: LevelAssignableAbilityEntry[],
  _characterLevel: number,
  classTracks: Array<{ classId: string; level: number }>,
  totalLevel: number,
  evaluateCondition: (conditions: unknown | null) => boolean = defaultEvaluateCondition,
): AssignableAbilityPoolEntry[] {
  const maxClassLevel = classTracks.reduce((max, track) => Math.max(max, track.level), totalLevel)
  const effectiveLevel = Math.max(maxClassLevel, totalLevel)
  const pool = new Map<string, Set<AbilitySlotCategory>>()

  for (const entry of entries) {
    if (entry.level > effectiveLevel) continue
    if (!evaluateCondition(entry.conditions)) continue
    const categories = pool.get(entry.definitionId) ?? new Set<AbilitySlotCategory>()
    for (const category of entry.categories) {
      categories.add(category)
    }
    pool.set(entry.definitionId, categories)
  }

  return [...pool.entries()].map(([definitionId, categories]) => ({
    definitionId,
    categories: [...categories],
  }))
}

export function abilityMatchesSlotCategory(
  slot: ResolvedCastSlotDefinition,
  _abilityId: string,
  metadata: AbilitySlotMetadata | undefined,
  lineageTypeId: string | null,
  classIds: string[],
): boolean {
  if (!metadata?.slotCategories.length) {
    return slot.category === 'generic'
  }

  if (slot.category !== 'generic' && !metadata.slotCategories.includes(slot.category)) {
    return false
  }

  if (slot.category === 'class') {
    if (slot.ownerClassId && !classIds.includes(slot.ownerClassId)) return false
    if (metadata.classIds?.length && !metadata.classIds.some((id) => classIds.includes(id))) {
      return false
    }
  }

  if (slot.category === 'type') {
    if (slot.ownerTypeId && slot.ownerTypeId !== lineageTypeId) return false
    if (metadata.typeIds?.length && lineageTypeId && !metadata.typeIds.includes(lineageTypeId)) {
      return false
    }
  }

  return true
}

export function canAssignAbilityToSlot(
  slot: ResolvedCastSlotDefinition,
  abilityId: string,
  pool: AssignableAbilityPoolEntry[],
  metadata: Record<string, AbilitySlotMetadata>,
  lineageTypeId: string | null,
  classIds: string[],
): boolean {
  if (slot.assignment !== 'assignable') return false
  const poolEntry = pool.find((entry) => entry.definitionId === abilityId)
  if (!poolEntry) return false
  if (!poolEntry.categories.includes(slot.category) && slot.category !== 'generic') {
    if (!poolEntry.categories.includes('generic')) return false
  }
  return abilityMatchesSlotCategory(slot, abilityId, metadata[abilityId], lineageTypeId, classIds)
}

function findCharacterSlot(
  session: CastSlotSessionState,
  slotId: string,
): { state: CharacterCastRuntimeState; entry: CastSlotRuntimeEntry } | null {
  for (const state of Object.values(session.characterCastState)) {
    const entry = state.slots.find((slot) => slot.slotId === slotId)
    if (entry) return { state, entry }
  }
  return null
}

function findItemSlot(
  session: CastSlotSessionState,
  slotId: string,
): { instance: ItemInstanceCastRuntimeState; entry: CastSlotRuntimeEntry } | null {
  for (const instance of Object.values(session.itemInstances)) {
    if (instance.destroyed) continue
    const entry = instance.slots.find((slot) => slot.slotId === slotId)
    if (entry) return { instance, entry }
  }
  return null
}

function cloneSession(session: CastSlotSessionState): CastSlotSessionState {
  return JSON.parse(JSON.stringify(session)) as CastSlotSessionState
}

function resolveRestKind(restZone: RestZone): RestKind | null {
  if (restZone === 'inn' || restZone === 'inside') return 'inside'
  if (restZone === 'outside') return 'outside'
  return null
}

function isSafeRestZone(restZone: RestZone): boolean {
  return restZone === 'inn' || restZone === 'inside'
}

export function canStartRest(input: CanStartRestInput): RestEligibility {
  const config = input.config ?? DEFAULT_REST_CONFIG
  const { session, restZone, nowMs } = input

  if (restZone === 'none') {
    return { ok: false, reason: 'rest_forbidden' }
  }

  if (session.rest.isInCombat) {
    return { ok: false, reason: 'in_combat' }
  }

  if (session.rest.lastCombatEndedAtMs !== null) {
    const cooldownMs = config.combatCooldownSeconds * 1000
    if (nowMs - session.rest.lastCombatEndedAtMs < cooldownMs) {
      return { ok: false, reason: 'combat_cooldown' }
    }
  }

  const hostiles = input.hostilePositions ?? []
  const party = input.partyPositions ?? []
  if (
    hostiles.length > 0 &&
    party.length > 0 &&
    isHostileInAggressiveRange(party, hostiles, config.aggressiveRange)
  ) {
    return { ok: false, reason: 'enemies_nearby' }
  }

  return { ok: true }
}

function refreshRestChargedSlots(session: CastSlotSessionState, definitions: ResolvedCastSlotDefinition[]): void {
  const definitionBySlotId = new Map(definitions.map((entry) => [entry.slotId, entry]))

  for (const characterState of Object.values(session.characterCastState)) {
    for (const slot of characterState.slots) {
      const definition = definitionBySlotId.get(slot.slotId)
      if (!definition || definition.chargeSource !== 'rest') continue
      slot.usesRemaining = definition.usesPerRest
    }
  }

  for (const instance of Object.values(session.itemInstances)) {
    if (instance.destroyed) continue
    for (const slot of instance.slots) {
      const definition = definitionBySlotId.get(slot.slotId)
      if (!definition || definition.chargeSource !== 'rest') continue
      slot.usesRemaining = definition.usesPerRest
    }
  }
}

export interface AttemptRestResult {
  outcome: RestOutcome
  session: CastSlotSessionState
}

export function attemptRest(
  input: AttemptRestInput,
  slotDefinitionsByCharacterId: Record<string, ResolvedCastSlotDefinition[]>,
): AttemptRestResult {
  const config = input.config ?? DEFAULT_REST_CONFIG
  const eligibility = canStartRest(input)
  const session = cloneSession(input.session)
  const emptyOutcome: RestOutcome = {
    completed: false,
    interrupted: false,
    minutesAdvanced: 0,
    slotsRefreshed: false,
    restKind: null,
    hooks: [],
  }

  if (!eligibility.ok) {
    return { outcome: emptyOutcome, session: input.session }
  }

  const restKind = resolveRestKind(input.restZone)
  if (!restKind) {
    return { outcome: emptyOutcome, session: input.session }
  }

  const hooks: RestHookId[] = []
  let interrupted = false

  if (!isSafeRestZone(input.restZone)) {
    hooks.push('on_rest_unsafe')
    interrupted = input.rollUnsafeRestInterrupt?.() ?? false
    if (interrupted) {
      return {
        outcome: {
          completed: false,
          interrupted: true,
          minutesAdvanced: 0,
          slotsRefreshed: false,
          restKind,
          hooks,
        },
        session: input.session,
      }
    }
  }

  for (const definitions of Object.values(slotDefinitionsByCharacterId)) {
    refreshRestChargedSlots(session, definitions)
  }

  session.elapsedMinutes += config.durationMinutes
  hooks.push('on_rest')
  hooks.push(restKind === 'inside' ? 'on_rest_inside' : 'on_rest_outside')

  return {
    outcome: {
      completed: true,
      interrupted: false,
      minutesAdvanced: config.durationMinutes,
      slotsRefreshed: true,
      restKind,
      hooks,
    },
    session,
  }
}

export function markCombatEnded(session: CastSlotSessionState, nowMs: number): CastSlotSessionState {
  const next = cloneSession(session)
  next.rest.isInCombat = false
  next.rest.lastCombatEndedAtMs = nowMs
  return next
}

export function markCombatStarted(session: CastSlotSessionState): CastSlotSessionState {
  const next = cloneSession(session)
  next.rest.isInCombat = true
  return next
}

export interface ReassignSlotInput {
  session: CastSlotSessionState
  slotId: string
  abilityId: string
  slotDefinition: ResolvedCastSlotDefinition
  assignablePool: AssignableAbilityPoolEntry[]
  abilityMetadata: Record<string, AbilitySlotMetadata>
  lineageTypeId: string | null
  classIds: string[]
}

export function reassignSlot(input: ReassignSlotInput): CastSlotActionResult {
  const {
    session,
    slotId,
    abilityId,
    slotDefinition,
    assignablePool,
    abilityMetadata,
    lineageTypeId,
    classIds,
  } = input

  if (slotDefinition.assignment !== 'assignable') {
    return { ok: false, error: 'Slot is not assignable.', session }
  }

  if (
    !canAssignAbilityToSlot(
      slotDefinition,
      abilityId,
      assignablePool,
      abilityMetadata,
      lineageTypeId,
      classIds,
    )
  ) {
    return { ok: false, error: 'Ability is not eligible for this slot.', session }
  }

  const next = cloneSession(session)
  const characterMatch = findCharacterSlot(next, slotId)
  if (characterMatch) {
    const { entry } = characterMatch
    if (entry.hasBeenFilled && entry.assignedAbilityId !== null && entry.assignedAbilityId !== abilityId) {
      entry.usesRemaining = 0
    }
    entry.assignedAbilityId = abilityId
    entry.hasBeenFilled = true
    return { ok: true, session: next }
  }

  const itemMatch = findItemSlot(next, slotId)
  if (itemMatch) {
    const { entry } = itemMatch
    if (slotDefinition.chargeSource === 'rest') {
      if (entry.hasBeenFilled && entry.assignedAbilityId !== null && entry.assignedAbilityId !== abilityId) {
        entry.usesRemaining = 0
      }
    }
    entry.assignedAbilityId = abilityId
    entry.hasBeenFilled = true
    return { ok: true, session: next }
  }

  return { ok: false, error: 'Slot not found.', session }
}

export interface CastFromSlotInput {
  session: CastSlotSessionState
  slotId: string
  slotDefinition: ResolvedCastSlotDefinition
}

export function castFromSlot(input: CastFromSlotInput): CastSlotActionResult {
  const { session, slotId, slotDefinition } = input
  const next = cloneSession(session)
  const abilityId =
    slotDefinition.assignment === 'fixed'
      ? slotDefinition.fixedAbilityId
      : findCharacterSlot(next, slotId)?.entry.assignedAbilityId ??
        findItemSlot(next, slotId)?.entry.assignedAbilityId ??
        null

  if (!abilityId) {
    return { ok: false, error: 'No ability assigned to slot.', session }
  }

  const characterMatch = findCharacterSlot(next, slotId)
  if (characterMatch) {
    const { entry } = characterMatch
    if (entry.usesRemaining <= 0) {
      return { ok: false, error: 'No charges remaining until rest.', session }
    }
    entry.usesRemaining = 0
    return { ok: true, session: next }
  }

  const itemMatch = findItemSlot(next, slotId)
  if (itemMatch) {
    const { instance, entry } = itemMatch
    if (slotDefinition.chargeSource === 'rest') {
      if (entry.usesRemaining <= 0) {
        return { ok: false, error: 'No charges remaining until rest.', session }
      }
      entry.usesRemaining = 0
      return { ok: true, session: next }
    }

    if (instance.itemChargesRemaining === null || instance.itemChargesRemaining <= 0) {
      return { ok: false, error: 'No item charges remaining.', session }
    }
    instance.itemChargesRemaining -= 1
    if (instance.itemChargesRemaining <= 0 && instance.consumable?.destroyAtZero) {
      instance.destroyed = true
      instance.itemChargesRemaining = 0
    }
    return { ok: true, session: next }
  }

  return { ok: false, error: 'Slot not found.', session }
}

export interface CastConsumableInput {
  session: CastSlotSessionState
  itemInstanceId: string
  fromLocation: 'inventory' | 'quick'
}

export function castConsumable(input: CastConsumableInput): CastSlotActionResult {
  const next = cloneSession(input.session)
  const instance = next.itemInstances[input.itemInstanceId]
  if (!instance || instance.destroyed) {
    return { ok: false, error: 'Item not found.', session: input.session }
  }

  const consumable = instance.consumable
  if (!consumable) {
    return { ok: false, error: 'Item is not a consumable caster.', session: input.session }
  }

  if (!consumable.castFrom.includes(input.fromLocation)) {
    return { ok: false, error: `Cannot cast from ${input.fromLocation}.`, session: input.session }
  }

  if (instance.itemChargesRemaining === null || instance.itemChargesRemaining <= 0) {
    return { ok: false, error: 'No charges remaining.', session: input.session }
  }

  instance.itemChargesRemaining -= 1
  if (instance.itemChargesRemaining <= 0 && consumable.destroyAtZero) {
    instance.destroyed = true
    instance.itemChargesRemaining = 0
  }

  return { ok: true, session: next }
}

export function getEffectiveAbilityForSlot(
  slotDefinition: ResolvedCastSlotDefinition,
  runtimeEntry: CastSlotRuntimeEntry | undefined,
): string | null {
  if (slotDefinition.fixedAbilityId) return slotDefinition.fixedAbilityId
  return runtimeEntry?.assignedAbilityId ?? null
}
