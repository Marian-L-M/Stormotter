/** BG2-style ability cast slot types — authoring and runtime. */

export type AbilitySlotCategory = 'generic' | 'divine' | 'magic' | 'class' | 'type'

export type AbilitySlotAssignment = 'fixed' | 'assignable'

export type CastSlotChargeSource = 'rest' | 'item'

export type CastFromLocation = 'inventory' | 'quick'

export type RestZone = 'inn' | 'inside' | 'outside' | 'none'

export type RestKind = 'inside' | 'outside'

export type RestEligibilityFailure =
  | 'in_combat'
  | 'enemies_nearby'
  | 'combat_cooldown'
  | 'rest_forbidden'

export type RestHookId =
  | 'on_rest_unsafe'
  | 'on_rest'
  | 'on_rest_inside'
  | 'on_rest_outside'

/** Authoring template granted at a level on class, type, or character. */
export interface AbilityCastSlotTemplate {
  id: string
  category: AbilitySlotCategory
  assignment: AbilitySlotAssignment
  label?: string
  usesPerRest: number
  unlockLevel: number
  /** Gameplay condition JSON — evaluated via optional callback at resolve time. */
  unlockConditions: unknown | null
  fixedAbilityId?: string
  chargeSource: CastSlotChargeSource
  /** Required when category === 'class'. */
  ownerClassId?: string
  /** Required when category === 'type'. */
  ownerTypeId?: string
}

export interface LevelCastSlotGrant {
  level: number
  slots: AbilityCastSlotTemplate[]
}

export interface LevelAssignableAbilityEntry {
  level: number
  definitionId: string
  categories: AbilitySlotCategory[]
  conditions: unknown | null
}

/** Scrolls, potions — single-use cast from inventory or quick slot. */
export interface ConsumableCastConfig {
  abilityId: string
  maxCharges: number
  destroyAtZero: boolean
  castFrom: CastFromLocation[]
}

export interface ItemCastSlotDefinition {
  itemDefinitionId: string
  castSlots: AbilityCastSlotTemplate[]
  maxItemCharges: number | null
  consumable?: ConsumableCastConfig | null
}

export interface AbilitySlotMetadata {
  slotCategories: AbilitySlotCategory[]
  classIds?: string[]
  typeIds?: string[]
}

export type CastSlotOwner =
  | { type: 'character'; characterId: string }
  | { type: 'item'; characterId: string; itemInstanceId: string }

/** Resolved slot definition (no per-session usage yet). */
export interface ResolvedCastSlotDefinition {
  slotId: string
  templateId: string
  owner: CastSlotOwner
  category: AbilitySlotCategory
  assignment: AbilitySlotAssignment
  fixedAbilityId: string | null
  chargeSource: CastSlotChargeSource
  usesPerRest: number
  ownerClassId?: string
  ownerTypeId?: string
}

export interface CastSlotRuntimeEntry {
  slotId: string
  assignedAbilityId: string | null
  usesRemaining: number
  /** True once the slot has been filled (assign or fixed at init). */
  hasBeenFilled: boolean
}

export interface CharacterCastRuntimeState {
  characterId: string
  slots: CastSlotRuntimeEntry[]
}

export interface ItemInstanceCastRuntimeState {
  instanceId: string
  definitionId: string
  ownerCharacterId: string
  itemChargesRemaining: number | null
  slots: CastSlotRuntimeEntry[]
  destroyed: boolean
  /** Consumable-only: cast without occupying a character slot. */
  consumable: ConsumableCastConfig | null
}

export interface SessionRestState {
  lastCombatEndedAtMs: number | null
  isInCombat: boolean
}

export interface RestConfig {
  durationMinutes: number
  combatCooldownSeconds: number
  aggressiveRange: number
}

export const DEFAULT_REST_CONFIG: RestConfig = {
  durationMinutes: 480,
  combatCooldownSeconds: 30,
  aggressiveRange: 12,
}

export interface CastSlotSessionState {
  elapsedMinutes: number
  rest: SessionRestState
  characterCastState: Record<string, CharacterCastRuntimeState>
  itemInstances: Record<string, ItemInstanceCastRuntimeState>
}

export interface RestEligibility {
  ok: boolean
  reason?: RestEligibilityFailure
}

export interface RestOutcome {
  completed: boolean
  interrupted: boolean
  minutesAdvanced: number
  slotsRefreshed: boolean
  restKind: RestKind | null
  hooks: RestHookId[]
}

export interface CastSlotActionResult {
  ok: boolean
  error?: string
  session: CastSlotSessionState
  hooks?: RestHookId[]
}

export interface ResolveCastSlotsInput {
  characterId: string
  lineageTypeId: string | null
  classTracks: Array<{ classId: string; level: number }>
  totalLevel: number
  characterGrants: LevelCastSlotGrant[]
  typeGrants: LevelCastSlotGrant[]
  classGrantsByClassId: Record<string, LevelCastSlotGrant[]>
  equippedItemDefinitions: ItemCastSlotDefinition[]
  equippedItemInstances: Array<{
    instanceId: string
    definitionId: string
    ownerCharacterId: string
  }>
  /** abilityId → metadata for category / class / type validation. */
  abilityMetadata: Record<string, AbilitySlotMetadata>
  evaluateCondition?: (conditions: unknown | null) => boolean
}

export interface CanStartRestInput {
  session: CastSlotSessionState
  restZone: RestZone
  nowMs: number
  config?: RestConfig
  hostilePositions?: Array<{ x: number; y: number }>
  partyPositions?: Array<{ x: number; y: number }>
}

export interface AttemptRestInput {
  session: CastSlotSessionState
  restZone: RestZone
  nowMs: number
  config?: RestConfig
  hostilePositions?: Array<{ x: number; y: number }>
  partyPositions?: Array<{ x: number; y: number }>
  /** Called for outdoor rest (not inn/inside). Return true to interrupt with encounter. */
  rollUnsafeRestInterrupt?: () => boolean
}

export interface AssignableAbilityPoolEntry {
  definitionId: string
  categories: AbilitySlotCategory[]
}
