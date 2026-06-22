import { normalizeCharacterLevel, MAX_CHARACTER_LEVEL } from './characterLevelTypes'
import { normalizeGameplayConditionGroup } from './gameplayConditionTypes'
import type {
  AbilityCastSlotTemplate,
  AbilitySlotAssignment,
  AbilitySlotCategory,
  CastFromLocation,
  CastSlotChargeSource,
  CastSlotRuntimeEntry,
  ConsumableCastConfig,
  ItemInstanceCastRuntimeState,
  LevelAssignableAbilityEntry,
  LevelCastSlotGrant,
  SessionRestState,
} from '@otter/game-state'

export type {
  AbilityCastSlotTemplate,
  AbilitySlotAssignment,
  AbilitySlotCategory,
  AssignableAbilityPoolEntry,
  CastFromLocation,
  CastSlotChargeSource,
  CastSlotRuntimeEntry,
  ConsumableCastConfig,
  ItemCastSlotDefinition,
  LevelAssignableAbilityEntry,
  LevelCastSlotGrant,
  SessionRestState,
} from '@otter/game-state'

export interface CharacterCastPreviewState {
  slots: CastSlotRuntimeEntry[]
  elapsedMinutes: number
  rest: SessionRestState
  itemInstances: Record<string, ItemInstanceCastRuntimeState>
}

export const ABILITY_SLOT_CATEGORY_LABELS: Record<AbilitySlotCategory, string> = {
  generic: 'Generic',
  divine: 'Divine',
  magic: 'Magic',
  class: 'Character class',
  type: 'Character type',
}

export const ABILITY_SLOT_ASSIGNMENT_LABELS: Record<AbilitySlotAssignment, string> = {
  fixed: 'Fixed ability',
  assignable: 'Player assignable',
}

export const CAST_SLOT_CHARGE_SOURCE_LABELS: Record<CastSlotChargeSource, string> = {
  rest: 'Rest charge (1/day until rest)',
  item: 'Item charge',
}

export const ABILITY_SLOT_CATEGORIES = Object.keys(
  ABILITY_SLOT_CATEGORY_LABELS,
) as AbilitySlotCategory[]

export function createCastSlotTemplateId(): string {
  return `cast-slot-${crypto.randomUUID().slice(0, 8)}`
}

export function createDefaultCastSlotTemplate(
  entityId: string,
  entityKind: 'class' | 'type',
): AbilityCastSlotTemplate {
  return {
    id: createCastSlotTemplateId(),
    category: entityKind === 'class' ? 'class' : 'type',
    assignment: 'assignable',
    usesPerRest: 1,
    unlockLevel: 1,
    unlockConditions: null,
    chargeSource: 'rest',
    ...(entityKind === 'class' ? { ownerClassId: entityId } : { ownerTypeId: entityId }),
  }
}

function normalizeCategory(value: unknown): AbilitySlotCategory {
  if (typeof value === 'string' && value in ABILITY_SLOT_CATEGORY_LABELS) {
    return value as AbilitySlotCategory
  }
  return 'generic'
}

function normalizeAssignment(value: unknown): AbilitySlotAssignment {
  return value === 'fixed' ? 'fixed' : 'assignable'
}

function normalizeChargeSource(value: unknown): CastSlotChargeSource {
  return value === 'item' ? 'item' : 'rest'
}

export function normalizeAbilityCastSlotTemplate(
  raw: Partial<AbilityCastSlotTemplate> | undefined,
  entityId: string,
  _entityKind: 'class' | 'type',
): AbilityCastSlotTemplate {
  const category = normalizeCategory(raw?.category)
  const assignment = normalizeAssignment(raw?.assignment)
  const template: AbilityCastSlotTemplate = {
    id: typeof raw?.id === 'string' && raw.id.length > 0 ? raw.id : createCastSlotTemplateId(),
    category,
    assignment,
    label: typeof raw?.label === 'string' ? raw.label : undefined,
    usesPerRest:
      typeof raw?.usesPerRest === 'number' && raw.usesPerRest >= 1
        ? Math.floor(raw.usesPerRest)
        : 1,
    unlockLevel: normalizeCharacterLevel(raw?.unlockLevel ?? 1),
    unlockConditions: normalizeGameplayConditionGroup(raw?.unlockConditions),
    chargeSource: normalizeChargeSource(raw?.chargeSource),
  }

  if (assignment === 'fixed' && typeof raw?.fixedAbilityId === 'string' && raw.fixedAbilityId.length > 0) {
    template.fixedAbilityId = raw.fixedAbilityId
  }

  if (category === 'class') {
    template.ownerClassId =
      typeof raw?.ownerClassId === 'string' && raw.ownerClassId.length > 0
        ? raw.ownerClassId
        : entityId
  }

  if (category === 'type') {
    template.ownerTypeId =
      typeof raw?.ownerTypeId === 'string' && raw.ownerTypeId.length > 0
        ? raw.ownerTypeId
        : entityId
  }

  return template
}

export function normalizeLevelCastSlotGrants(
  raw: Partial<LevelCastSlotGrant>[] | undefined,
  entityId: string,
  entityKind: 'class' | 'type',
): LevelCastSlotGrant[] {
  if (!raw?.length) return []
  const byLevel = new Map<number, AbilityCastSlotTemplate[]>()

  for (const entry of raw) {
    const level = normalizeCharacterLevel(entry.level ?? 1)
    const bucket = byLevel.get(level) ?? []
    for (const slot of entry.slots ?? []) {
      bucket.push(normalizeAbilityCastSlotTemplate(slot, entityId, entityKind))
    }
    byLevel.set(level, bucket)
  }

  return [...byLevel.entries()]
    .sort(([left], [right]) => left - right)
    .map(([level, slots]) => ({ level, slots }))
}

function normalizeCategories(raw: unknown): AbilitySlotCategory[] {
  if (!Array.isArray(raw)) return ['generic']
  const categories = raw
    .map((entry) => normalizeCategory(entry))
    .filter((entry, index, array) => array.indexOf(entry) === index)
  return categories.length > 0 ? categories : ['generic']
}

export function normalizeAssignableAbilityGrants(
  raw: Partial<LevelAssignableAbilityEntry>[] | undefined,
): LevelAssignableAbilityEntry[] {
  if (!raw?.length) return []
  return raw
    .map((entry) => ({
      level: normalizeCharacterLevel(entry.level ?? 1),
      definitionId: typeof entry.definitionId === 'string' ? entry.definitionId : '',
      categories: normalizeCategories(entry.categories),
      conditions: normalizeGameplayConditionGroup(entry.conditions),
    }))
    .filter((entry) => entry.definitionId.length > 0)
    .sort((left, right) => left.level - right.level || left.definitionId.localeCompare(right.definitionId))
}

export function getNextCastSlotGrantLevel(grants: LevelCastSlotGrant[]): number {
  if (grants.length === 0) return 1
  return Math.min(MAX_CHARACTER_LEVEL, Math.max(...grants.map((entry) => entry.level)) + 1)
}

export function summarizeCastSlotGrants(grants: LevelCastSlotGrant[]): string {
  if (grants.length === 0) return '—'
  const slotCount = grants.reduce((sum, entry) => sum + entry.slots.length, 0)
  return `${slotCount} slot${slotCount === 1 ? '' : 's'}`
}

export function summarizeAssignableAbilityGrants(grants: LevelAssignableAbilityEntry[]): string {
  if (grants.length === 0) return '—'
  return `${grants.length} unlock${grants.length === 1 ? '' : 's'}`
}

export function remapCastSlotGrantsForEntity(
  grants: LevelCastSlotGrant[],
  entityId: string,
  entityKind: 'class' | 'type',
): LevelCastSlotGrant[] {
  return grants.map((grant) => ({
    level: grant.level,
    slots: grant.slots.map((slot) =>
      normalizeAbilityCastSlotTemplate(
        {
          ...slot,
          id: createCastSlotTemplateId(),
          ownerClassId: slot.category === 'class' ? entityId : slot.ownerClassId,
          ownerTypeId: slot.category === 'type' ? entityId : slot.ownerTypeId,
        },
        entityId,
        entityKind,
      ),
    ),
  }))
}

export function createDefaultCharacterCastPreviewState(): CharacterCastPreviewState {
  return {
    slots: [],
    elapsedMinutes: 0,
    rest: { lastCombatEndedAtMs: null, isInCombat: false },
    itemInstances: {},
  }
}

export function normalizeConsumableCastConfig(raw: unknown): ConsumableCastConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Partial<ConsumableCastConfig>
  if (typeof value.abilityId !== 'string' || !value.abilityId) return null
  const castFrom: CastFromLocation[] = Array.isArray(value.castFrom)
    ? value.castFrom.filter((entry): entry is CastFromLocation => entry === 'inventory' || entry === 'quick')
    : ['inventory', 'quick']
  return {
    abilityId: value.abilityId,
    maxCharges: typeof value.maxCharges === 'number' && value.maxCharges >= 1 ? Math.floor(value.maxCharges) : 1,
    destroyAtZero: value.destroyAtZero !== false,
    castFrom: castFrom.length > 0 ? castFrom : ['inventory', 'quick'],
  }
}

export function itemToCastSlotDefinition(item: {
  id: string
  castSlots: AbilityCastSlotTemplate[]
  maxItemCharges: number | null
  consumable: ConsumableCastConfig | null
}): import('@otter/game-state').ItemCastSlotDefinition {
  return {
    itemDefinitionId: item.id,
    castSlots: item.castSlots,
    maxItemCharges: item.maxItemCharges,
    consumable: item.consumable,
  }
}

export function normalizeCharacterCastPreviewState(raw: unknown): CharacterCastPreviewState {
  const defaults = createDefaultCharacterCastPreviewState()
  if (!raw || typeof raw !== 'object') return defaults
  const value = raw as Partial<CharacterCastPreviewState>
  const slots = Array.isArray(value.slots)
    ? value.slots
        .filter((entry) => entry && typeof entry === 'object' && typeof entry.slotId === 'string')
        .map((entry) => ({
          slotId: entry.slotId,
          assignedAbilityId:
            typeof entry.assignedAbilityId === 'string' ? entry.assignedAbilityId : null,
          usesRemaining:
            typeof entry.usesRemaining === 'number' && entry.usesRemaining >= 0
              ? Math.floor(entry.usesRemaining)
              : 0,
          hasBeenFilled: entry.hasBeenFilled === true,
        }))
    : defaults.slots
  const elapsedMinutes =
    typeof value.elapsedMinutes === 'number' && value.elapsedMinutes >= 0
      ? Math.floor(value.elapsedMinutes)
      : defaults.elapsedMinutes
  const restRaw = value.rest
  const rest: SessionRestState = {
    lastCombatEndedAtMs:
      restRaw &&
      typeof restRaw === 'object' &&
      typeof restRaw.lastCombatEndedAtMs === 'number'
        ? restRaw.lastCombatEndedAtMs
        : null,
    isInCombat:
      restRaw && typeof restRaw === 'object' && restRaw.isInCombat === true ? true : false,
  }
  const itemInstances: Record<string, ItemInstanceCastRuntimeState> = {}
  if (value.itemInstances && typeof value.itemInstances === 'object') {
    for (const [key, entry] of Object.entries(value.itemInstances as Record<string, unknown>)) {
      if (!entry || typeof entry !== 'object') continue
      const raw = entry as Partial<ItemInstanceCastRuntimeState>
      if (typeof raw.instanceId !== 'string' || typeof raw.definitionId !== 'string') continue
      itemInstances[key] = {
        instanceId: raw.instanceId,
        definitionId: raw.definitionId,
        ownerCharacterId: typeof raw.ownerCharacterId === 'string' ? raw.ownerCharacterId : '',
        itemChargesRemaining:
          raw.itemChargesRemaining === null || typeof raw.itemChargesRemaining === 'number'
            ? raw.itemChargesRemaining
            : null,
        slots: Array.isArray(raw.slots)
          ? raw.slots
              .filter((slot) => slot && typeof slot === 'object' && typeof slot.slotId === 'string')
              .map((slot) => ({
                slotId: slot.slotId,
                assignedAbilityId:
                  typeof slot.assignedAbilityId === 'string' ? slot.assignedAbilityId : null,
                usesRemaining:
                  typeof slot.usesRemaining === 'number' ? Math.max(0, Math.floor(slot.usesRemaining)) : 0,
                hasBeenFilled: slot.hasBeenFilled === true,
              }))
          : [],
        destroyed: raw.destroyed === true,
        consumable: normalizeConsumableCastConfig(raw.consumable),
      }
    }
  }
  return { slots, elapsedMinutes, rest, itemInstances }
}
