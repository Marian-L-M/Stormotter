import {
  normalizeGameplayConditionGroup,
  type GameplayConditionGroup,
} from './gameplayConditionTypes'
import type { AdminListItem } from './types'

export type QuestSectionTab = 'quests' | 'quest-categories'

export const QUEST_SECTION_TABS: { id: QuestSectionTab; label: string }[] = [
  { id: 'quests', label: 'Quests' },
  { id: 'quest-categories', label: 'Categories' },
]

export type QuestTriggerMode =
  | 'storyline'
  | 'automatic_state'
  | 'manual_dialog'
  | 'manual_map_event'

export interface QuestEnvironmentTrigger {
  requireNotInBattle: boolean
  onlyAfterReset: boolean
}

export interface QuestTriggerConfig {
  mode: QuestTriggerMode
  /** Storyline node or external hook id. */
  storylineTriggerId: string | null
  autoStateConditions: GameplayConditionGroup | null
  environment: QuestEnvironmentTrigger
  gameTimeDelayMinutes: number | null
  /** Conversation that can offer / advance this quest. */
  manualDialogId: string | null
  /** Map event id (spawn point / world event). */
  manualMapEventId: string | null
}

export type QuestObjectiveKind =
  | 'collect_item'
  | 'kill_character'
  | 'talk_to_character'
  | 'trigger_state'
  | 'reach_map_event'

export interface QuestObjective {
  id: string
  kind: QuestObjectiveKind
  label: string
  itemId: string | null
  characterId: string | null
  requiredCount: number
  stateVariableId: string | null
  stateCompareValue: string | number | boolean | null
  mapEventId: string | null
}

export type QuestRewardKind =
  | 'item'
  | 'state'
  | 'experience'
  | 'attribute'
  | 'ability'

export interface QuestReward {
  id: string
  kind: QuestRewardKind
  itemId: string | null
  quantity: number
  stateVariableId: string | null
  stateValue: string | number | boolean | null
  attributeDefinitionId: string | null
  attributeValue: number | null
  abilityDefinitionId: string | null
  experienceAmount: number | null
}

export type QuestCompletionActionKind =
  | 'start_dialog'
  | 'start_quest'
  | 'add_journal'
  | 'fire_storyline'

export interface QuestCompletionAction {
  id: string
  kind: QuestCompletionActionKind
  dialogId: string | null
  questId: string | null
  journalEntryId: string | null
  storylineTriggerId: string | null
}

export interface Quest {
  id: string
  name: string
  summary: string
  categoryId: string | null
  journalPreview: string
  trigger: QuestTriggerConfig
  objectives: QuestObjective[]
  objectiveJoin: 'and' | 'or'
  rewards: QuestReward[]
  completionActions: QuestCompletionAction[]
  updatedAt: string
}

export interface QuestCategory {
  id: string
  name: string
  description: string
  updatedAt: string
}

export type QuestPatch = Partial<
  Pick<
    Quest,
    | 'name'
    | 'summary'
    | 'categoryId'
    | 'journalPreview'
    | 'trigger'
    | 'objectives'
    | 'objectiveJoin'
    | 'rewards'
    | 'completionActions'
  >
>

export type QuestCategoryPatch = Partial<Pick<QuestCategory, 'name' | 'description'>>

export interface QuestListItem extends AdminListItem {
  quest: Quest
}

export interface QuestCategoryListItem extends AdminListItem {
  categoryEntity: QuestCategory
  questCount: number
}

export function createQuestId(): string {
  return `quest-${crypto.randomUUID().slice(0, 8)}`
}

export function createQuestCategoryId(): string {
  return `quest-cat-${crypto.randomUUID().slice(0, 8)}`
}

export function createQuestObjectiveId(): string {
  return `quest-obj-${crypto.randomUUID().slice(0, 8)}`
}

export function createQuestRewardId(): string {
  return `quest-reward-${crypto.randomUUID().slice(0, 8)}`
}

export function createQuestCompletionActionId(): string {
  return `quest-complete-${crypto.randomUUID().slice(0, 8)}`
}

export function createEmptyQuestObjective(kind: QuestObjectiveKind = 'collect_item'): QuestObjective {
  return {
    id: createQuestObjectiveId(),
    kind,
    label: '',
    itemId: null,
    characterId: null,
    requiredCount: 1,
    stateVariableId: null,
    stateCompareValue: null,
    mapEventId: null,
  }
}

export function createEmptyQuestReward(kind: QuestRewardKind = 'item'): QuestReward {
  return {
    id: createQuestRewardId(),
    kind,
    itemId: null,
    quantity: 1,
    stateVariableId: null,
    stateValue: null,
    attributeDefinitionId: null,
    attributeValue: null,
    abilityDefinitionId: null,
    experienceAmount: null,
  }
}

export function createEmptyQuestCompletionAction(
  kind: QuestCompletionActionKind = 'start_dialog',
): QuestCompletionAction {
  return {
    id: createQuestCompletionActionId(),
    kind,
    dialogId: null,
    questId: null,
    journalEntryId: null,
    storylineTriggerId: null,
  }
}

export function createDefaultQuestTrigger(): QuestTriggerConfig {
  return {
    mode: 'manual_dialog',
    storylineTriggerId: null,
    autoStateConditions: null,
    environment: { requireNotInBattle: true, onlyAfterReset: false },
    gameTimeDelayMinutes: null,
    manualDialogId: null,
    manualMapEventId: null,
  }
}

export function createEmptyQuest(name = 'Untitled quest'): Quest {
  const timestamp = new Date().toISOString()
  return {
    id: createQuestId(),
    name,
    summary: '',
    categoryId: null,
    journalPreview: '',
    trigger: createDefaultQuestTrigger(),
    objectives: [createEmptyQuestObjective()],
    objectiveJoin: 'and',
    rewards: [],
    completionActions: [],
    updatedAt: timestamp,
  }
}

export function createEmptyQuestCategory(name = 'New category'): QuestCategory {
  const timestamp = new Date().toISOString()
  return {
    id: createQuestCategoryId(),
    name,
    description: '',
    updatedAt: timestamp,
  }
}

export function defaultQuestCategories(): QuestCategory[] {
  const timestamp = new Date().toISOString()
  return [
    {
      id: 'quest-cat-main',
      name: 'Main quest',
      description: 'Primary storyline objectives.',
      updatedAt: timestamp,
    },
    {
      id: 'quest-cat-side',
      name: 'Side quest',
      description: 'Optional objectives.',
      updatedAt: timestamp,
    },
  ]
}

function normalizeObjective(raw: Partial<QuestObjective>): QuestObjective {
  const kind =
    raw.kind === 'kill_character' ||
    raw.kind === 'talk_to_character' ||
    raw.kind === 'trigger_state' ||
    raw.kind === 'reach_map_event' ||
    raw.kind === 'collect_item'
      ? raw.kind
      : 'collect_item'
  return {
    id: raw.id ?? createQuestObjectiveId(),
    kind,
    label: raw.label ?? '',
    itemId: typeof raw.itemId === 'string' && raw.itemId.length > 0 ? raw.itemId : null,
    characterId:
      typeof raw.characterId === 'string' && raw.characterId.length > 0 ? raw.characterId : null,
    requiredCount:
      typeof raw.requiredCount === 'number' && raw.requiredCount > 0 ? raw.requiredCount : 1,
    stateVariableId:
      typeof raw.stateVariableId === 'string' && raw.stateVariableId.length > 0
        ? raw.stateVariableId
        : null,
    stateCompareValue: raw.stateCompareValue ?? null,
    mapEventId:
      typeof raw.mapEventId === 'string' && raw.mapEventId.length > 0 ? raw.mapEventId : null,
  }
}

function normalizeReward(raw: Partial<QuestReward>): QuestReward {
  const kind =
    raw.kind === 'state' ||
    raw.kind === 'experience' ||
    raw.kind === 'attribute' ||
    raw.kind === 'ability' ||
    raw.kind === 'item'
      ? raw.kind
      : 'item'
  return {
    id: raw.id ?? createQuestRewardId(),
    kind,
    itemId: typeof raw.itemId === 'string' && raw.itemId.length > 0 ? raw.itemId : null,
    quantity: typeof raw.quantity === 'number' && raw.quantity > 0 ? raw.quantity : 1,
    stateVariableId:
      typeof raw.stateVariableId === 'string' && raw.stateVariableId.length > 0
        ? raw.stateVariableId
        : null,
    stateValue: raw.stateValue ?? null,
    attributeDefinitionId:
      typeof raw.attributeDefinitionId === 'string' && raw.attributeDefinitionId.length > 0
        ? raw.attributeDefinitionId
        : null,
    attributeValue:
      typeof raw.attributeValue === 'number' && Number.isFinite(raw.attributeValue)
        ? raw.attributeValue
        : null,
    abilityDefinitionId:
      typeof raw.abilityDefinitionId === 'string' && raw.abilityDefinitionId.length > 0
        ? raw.abilityDefinitionId
        : null,
    experienceAmount:
      typeof raw.experienceAmount === 'number' && raw.experienceAmount >= 0
        ? raw.experienceAmount
        : null,
  }
}

function normalizeCompletionAction(raw: Partial<QuestCompletionAction>): QuestCompletionAction {
  const kind =
    raw.kind === 'start_quest' ||
    raw.kind === 'add_journal' ||
    raw.kind === 'fire_storyline' ||
    raw.kind === 'start_dialog'
      ? raw.kind
      : 'start_dialog'
  return {
    id: raw.id ?? createQuestCompletionActionId(),
    kind,
    dialogId: typeof raw.dialogId === 'string' && raw.dialogId.length > 0 ? raw.dialogId : null,
    questId: typeof raw.questId === 'string' && raw.questId.length > 0 ? raw.questId : null,
    journalEntryId:
      typeof raw.journalEntryId === 'string' && raw.journalEntryId.length > 0
        ? raw.journalEntryId
        : null,
    storylineTriggerId:
      typeof raw.storylineTriggerId === 'string' && raw.storylineTriggerId.length > 0
        ? raw.storylineTriggerId
        : null,
  }
}

function normalizeTrigger(raw: Partial<QuestTriggerConfig> | undefined): QuestTriggerConfig {
  const defaults = createDefaultQuestTrigger()
  if (!raw) return defaults
  const mode =
    raw.mode === 'storyline' ||
    raw.mode === 'automatic_state' ||
    raw.mode === 'manual_dialog' ||
    raw.mode === 'manual_map_event'
      ? raw.mode
      : defaults.mode
  return {
    mode,
    storylineTriggerId:
      typeof raw.storylineTriggerId === 'string' && raw.storylineTriggerId.length > 0
        ? raw.storylineTriggerId
        : null,
    autoStateConditions: normalizeGameplayConditionGroup(raw.autoStateConditions),
    environment: {
      requireNotInBattle: raw.environment?.requireNotInBattle !== false,
      onlyAfterReset: raw.environment?.onlyAfterReset === true,
    },
    gameTimeDelayMinutes:
      typeof raw.gameTimeDelayMinutes === 'number' && raw.gameTimeDelayMinutes >= 0
        ? raw.gameTimeDelayMinutes
        : null,
    manualDialogId:
      typeof raw.manualDialogId === 'string' && raw.manualDialogId.length > 0
        ? raw.manualDialogId
        : null,
    manualMapEventId:
      typeof raw.manualMapEventId === 'string' && raw.manualMapEventId.length > 0
        ? raw.manualMapEventId
        : null,
  }
}

export function normalizeQuest(raw: Partial<Quest> & { id: string }): Quest {
  return {
    id: raw.id,
    name: raw.name?.trim() || 'Untitled quest',
    summary: raw.summary ?? '',
    categoryId:
      typeof raw.categoryId === 'string' && raw.categoryId.length > 0 ? raw.categoryId : null,
    journalPreview: raw.journalPreview ?? '',
    trigger: normalizeTrigger(raw.trigger),
    objectives:
      Array.isArray(raw.objectives) && raw.objectives.length > 0
        ? raw.objectives.map((entry) => normalizeObjective(entry))
        : [createEmptyQuestObjective()],
    objectiveJoin: raw.objectiveJoin === 'or' ? 'or' : 'and',
    rewards: (raw.rewards ?? []).map((entry) => normalizeReward(entry)),
    completionActions: (raw.completionActions ?? []).map((entry) =>
      normalizeCompletionAction(entry),
    ),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function normalizeQuestCategory(raw: Partial<QuestCategory> & { id: string }): QuestCategory {
  return {
    id: raw.id,
    name: raw.name?.trim() || 'Untitled category',
    description: raw.description ?? '',
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function isQuestCategoryId(id: string, categories: readonly QuestCategory[]): boolean {
  return categories.some((entry) => entry.id === id)
}

export function getQuestCategory(
  categoryId: string | null,
  categories: readonly QuestCategory[],
): QuestCategory | undefined {
  if (!categoryId) return undefined
  return categories.find((entry) => entry.id === categoryId)
}

export function summarizeQuestTrigger(trigger: QuestTriggerConfig): string {
  if (trigger.mode === 'storyline') {
    return trigger.storylineTriggerId ? `Storyline · ${trigger.storylineTriggerId}` : 'Storyline'
  }
  if (trigger.mode === 'automatic_state') return 'Automatic (state)'
  if (trigger.mode === 'manual_map_event') {
    return trigger.manualMapEventId ? `Map event · ${trigger.manualMapEventId}` : 'Map event'
  }
  return trigger.manualDialogId ? `Dialog · ${trigger.manualDialogId}` : 'Manual dialog'
}

export function summarizeQuestObjectives(quest: Quest): string {
  const count = quest.objectives.length
  return `${count} objective${count === 1 ? '' : 's'} (${quest.objectiveJoin.toUpperCase()})`
}

export const QUEST_TRIGGER_MODE_LABELS: Record<QuestTriggerMode, string> = {
  storyline: 'Storyline (script hook)',
  automatic_state: 'Automatic (gameplay state)',
  manual_dialog: 'Manual (conversation)',
  manual_map_event: 'Manual (map event)',
}

export const QUEST_OBJECTIVE_KIND_LABELS: Record<QuestObjectiveKind, string> = {
  collect_item: 'Collect item',
  kill_character: 'Defeat character',
  talk_to_character: 'Talk to character',
  trigger_state: 'Reach state value',
  reach_map_event: 'Reach map event',
}

export const QUEST_REWARD_KIND_LABELS: Record<QuestRewardKind, string> = {
  item: 'Receive item',
  state: 'Set state',
  experience: 'Experience',
  attribute: 'Attribute',
  ability: 'Ability',
}

export const QUEST_COMPLETION_ACTION_LABELS: Record<QuestCompletionActionKind, string> = {
  start_dialog: 'Start conversation',
  start_quest: 'Start quest',
  add_journal: 'Add journal entry',
  fire_storyline: 'Fire storyline hook',
}
