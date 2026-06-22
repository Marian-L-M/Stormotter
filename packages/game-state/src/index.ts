export type { LoadedGame } from './game.js'
export { getActiveWorld } from './game.js'
export {
  compileCombatStats,
  createEmptyCompiledCombatStats,
  formatCompiledCombatStats,
  type AttributeDefinitionLike,
  type CompiledCombatStats,
} from '@otter/mechanics-core'
export { mapFromWorld, serializeCellKey } from './export.js'
export {
  loadGameFromBytes,
  loadGameFromDocument,
  worldFromMap,
} from './load.js'
export type {
  Cell,
  EntranceTarget,
  MapTile,
  SpawnPointConfig,
  SpawnPointEntityKind,
  WorldModel,
} from './world.js'
export { cellKey, createEmptyWorld, getCellsInRect } from './world.js'
export type {
  CharacterClassProgression,
  CharacterProgression,
  CharacterProgressionState,
  ClassLevelProgressionEntry,
  ClassProgressionAbilityGrant,
  ClassProgressionAttributeGrant,
  ClassProgressionRankGrant,
  DefinitionProgression,
  ProgressionMode,
} from './progression.js'
export type {
  AiAbilityUsage,
  AiBattlePhaseRule,
  AiProfile,
  AiRetreatBehavior,
  AiTargetPriority,
  AiWeaponPreference,
} from './ai.js'
export {
  attemptRest,
  buildAssignableAbilityPool,
  canAssignAbilityToSlot,
  canStartRest,
  castConsumable,
  castFromSlot,
  createEmptyCastSlotSession,
  DEFAULT_REST_CONFIG,
  getEffectiveAbilityForSlot,
  initializeCharacterCastState,
  initializeItemInstanceState,
  markCombatEnded,
  markCombatStarted,
  mergeCharacterCastState,
  reassignSlot,
  resolveCastSlotDefinitions,
  abilityMatchesSlotCategory,
} from './castSlots.js'
export type {
  AbilityCastSlotTemplate,
  AbilitySlotAssignment,
  AbilitySlotCategory,
  AbilitySlotMetadata,
  AssignableAbilityPoolEntry,
  AttemptRestInput,
  CanStartRestInput,
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
export type {
  AttemptRestResult,
  CastConsumableInput,
  CastFromSlotInput,
  ReassignSlotInput,
} from './castSlots.js'
export {
  CARTRIDGE_VERSION,
  buildAssignablePoolForCartridgeCharacter,
  createEmptyCartridge,
  normalizeGameCartridge,
  resolveDefinitionsForCartridgeCharacter,
  sessionFromCartridgePreview,
} from './cartridge.js'
export type {
  CartridgeCharacterCastPreview,
  CartridgeCharacterConfig,
  CartridgeClassConfig,
  CartridgeTypeConfig,
  GameCartridge,
} from './cartridge.js'
