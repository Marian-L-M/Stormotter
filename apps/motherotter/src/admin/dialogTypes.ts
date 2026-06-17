import {
  normalizeGameplayConditionGroup,
  type GameplayConditionGroup,
} from './gameplayConditionTypes'
import type { AdminListItem } from './types'

export type DialogSectionTab = 'dialogs' | 'dialog-categories'

export const DIALOG_SECTION_TABS: { id: DialogSectionTab; label: string }[] = [
  { id: 'dialogs', label: 'Dialogs' },
  { id: 'dialog-categories', label: 'Categories' },
]

export type DialogTriggerMode = 'storyline' | 'automatic' | 'manual'

export interface DialogEnvironmentTrigger {
  requireNotInBattle: boolean
  onlyAfterReset: boolean
}

export interface DialogTriggerConfig {
  mode: DialogTriggerMode
  /** External story/script hook id — fired by storyline systems outside this dialog. */
  storylineTriggerId: string | null
  /** Automatic: fire when gameplay state matches and environment allows. */
  autoStateConditions: GameplayConditionGroup | null
  environment: DialogEnvironmentTrigger
  /** In-game minutes to wait after conditions become true (automatic mode). */
  gameTimeDelayMinutes: number | null
  /** Manual: player initiates by selecting this character to talk to. */
  manualTargetCharacterId: string | null
}

export interface DialogStateEffect {
  id: string
  stateVariableId: string
  value: string | number | boolean | null
}

export type DialogRequirementSubject =
  | 'state'
  | 'attribute'
  | 'ability'
  | 'group_member'
  | 'main_in_group'

export type DialogRequirementOperator =
  | 'has'
  | 'not_has'
  | 'equals'
  | 'not_equals'
  | 'greater_or_equal'
  | 'less_than'

export interface DialogRequirementCheck {
  id: string
  subject: DialogRequirementSubject
  referenceId: string | null
  operator: DialogRequirementOperator
  numericValue: number | null
}

export interface DialogReplyConditions {
  gameplayState: GameplayConditionGroup | null
  checks: DialogRequirementCheck[]
}

export type DialogSpeechSpeaker =
  | 'linked_npc'
  | 'player'
  | 'narrator'
  | 'companion'
  | 'character'

export interface DialogSpeechNode {
  id: string
  kind: 'speech'
  x: number
  y: number
  speaker: DialogSpeechSpeaker
  speakerCharacterId: string | null
  text: string
  /** Companion interjections / situational lines — hidden when conditions fail. */
  showConditions: DialogReplyConditions | null
  stateEffects: DialogStateEffect[]
  continueToNodeId: string | null
  playerChoiceNodeId: string | null
}

export interface DialogPlayerReply {
  id: string
  label: string
  conditions: DialogReplyConditions | null
  stateEffects: DialogStateEffect[]
  targetNodeId: string | null
}

export interface DialogPlayerChoiceNode {
  id: string
  kind: 'player_choice'
  x: number
  y: number
  replies: DialogPlayerReply[]
}

export interface DialogEndNode {
  id: string
  kind: 'end'
  x: number
  y: number
  stateEffects: DialogStateEffect[]
}

export type DialogConversationNode = DialogSpeechNode | DialogPlayerChoiceNode | DialogEndNode

export interface DialogConversationGraph {
  rootNodeId: string
  nodes: Record<string, DialogConversationNode>
  /** Display order for the list block editor (all node ids). */
  listOrder: string[]
}

export interface Dialog {
  id: string
  name: string
  summary: string
  categoryId: string | null
  /** Primary NPC conversation partner. */
  characterId: string | null
  trigger: DialogTriggerConfig
  conversation: DialogConversationGraph
  updatedAt: string
}

export interface DialogCategory {
  id: string
  name: string
  description: string
  updatedAt: string
}

/** @deprecated Legacy linear dialog line — migrated to conversation graph on load. */
export interface LegacyDialogLine {
  id: string
  text: string
  speakerCharacterId: string | null
  conditions?: GameplayConditionGroup | null
  stateEffects?: DialogStateEffect[]
}

export type DialogPatch = Partial<
  Pick<Dialog, 'name' | 'summary' | 'categoryId' | 'characterId' | 'trigger' | 'conversation'>
>

export type DialogCategoryPatch = Partial<Pick<DialogCategory, 'name' | 'description'>>

export interface DialogListItem extends AdminListItem {
  dialog: Dialog
}

export interface DialogCategoryListItem extends AdminListItem {
  categoryEntity: DialogCategory
  dialogCount: number
}

export function createDialogId(): string {
  return `dialog-${crypto.randomUUID().slice(0, 8)}`
}

export function createDialogCategoryId(): string {
  return `dialog-cat-${crypto.randomUUID().slice(0, 8)}`
}

export function createDialogNodeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function createDialogStateEffectId(): string {
  return `dialog-effect-${crypto.randomUUID().slice(0, 8)}`
}

export function createDialogReplyId(): string {
  return `dialog-reply-${crypto.randomUUID().slice(0, 8)}`
}

export function createDialogRequirementCheckId(): string {
  return `dialog-req-${crypto.randomUUID().slice(0, 8)}`
}

export function createEmptyDialogStateEffect(): DialogStateEffect {
  return {
    id: createDialogStateEffectId(),
    stateVariableId: '',
    value: null,
  }
}

export function createEmptyDialogReplyConditions(): DialogReplyConditions {
  return { gameplayState: null, checks: [] }
}

export function createEmptyDialogRequirementCheck(
  subject: DialogRequirementSubject = 'group_member',
): DialogRequirementCheck {
  return {
    id: createDialogRequirementCheckId(),
    subject,
    referenceId: null,
    operator: subject === 'group_member' || subject === 'ability' ? 'has' : 'greater_or_equal',
    numericValue: null,
  }
}

export function createEmptyDialogReply(): DialogPlayerReply {
  return {
    id: createDialogReplyId(),
    label: '',
    conditions: null,
    stateEffects: [],
    targetNodeId: null,
  }
}

export function createSpeechNode(x = 80, y = 80): DialogSpeechNode {
  return {
    id: createDialogNodeId('speech'),
    kind: 'speech',
    x,
    y,
    speaker: 'linked_npc',
    speakerCharacterId: null,
    text: '',
    showConditions: null,
    stateEffects: [],
    continueToNodeId: null,
    playerChoiceNodeId: null,
  }
}

export function createPlayerChoiceNode(x = 80, y = 240): DialogPlayerChoiceNode {
  return {
    id: createDialogNodeId('choice'),
    kind: 'player_choice',
    x,
    y,
    replies: [createEmptyDialogReply()],
  }
}

export function createEndNode(x = 80, y = 400): DialogEndNode {
  return {
    id: createDialogNodeId('end'),
    kind: 'end',
    x,
    y,
    stateEffects: [],
  }
}

export function createDefaultConversationGraph(): DialogConversationGraph {
  const speech = createSpeechNode(120, 100)
  const choice = createPlayerChoiceNode(120, 280)
  const end = createEndNode(120, 460)
  speech.playerChoiceNodeId = choice.id
  choice.replies[0]!.targetNodeId = end.id
  return {
    rootNodeId: speech.id,
    nodes: {
      [speech.id]: speech,
      [choice.id]: choice,
      [end.id]: end,
    },
    listOrder: [speech.id, choice.id, end.id],
  }
}

export function createDefaultDialogTrigger(): DialogTriggerConfig {
  return {
    mode: 'manual',
    storylineTriggerId: null,
    autoStateConditions: null,
    environment: { requireNotInBattle: true, onlyAfterReset: false },
    gameTimeDelayMinutes: null,
    manualTargetCharacterId: null,
  }
}

export function createEmptyDialog(name = 'Untitled dialog'): Dialog {
  const timestamp = new Date().toISOString()
  return {
    id: createDialogId(),
    name,
    summary: '',
    categoryId: null,
    characterId: null,
    trigger: createDefaultDialogTrigger(),
    conversation: createDefaultConversationGraph(),
    updatedAt: timestamp,
  }
}

export function createEmptyDialogCategory(name = 'New category'): DialogCategory {
  const timestamp = new Date().toISOString()
  return {
    id: createDialogCategoryId(),
    name,
    description: '',
    updatedAt: timestamp,
  }
}

function normalizeDialogStateEffect(raw: Partial<DialogStateEffect>): DialogStateEffect {
  return {
    id: raw.id ?? createDialogStateEffectId(),
    stateVariableId: raw.stateVariableId ?? '',
    value: raw.value ?? null,
  }
}

function normalizeRequirementCheck(raw: Partial<DialogRequirementCheck>): DialogRequirementCheck {
  const subject =
    raw.subject === 'state' ||
    raw.subject === 'attribute' ||
    raw.subject === 'ability' ||
    raw.subject === 'group_member' ||
    raw.subject === 'main_in_group'
      ? raw.subject
      : 'group_member'
  const operator =
    raw.operator === 'has' ||
    raw.operator === 'not_has' ||
    raw.operator === 'equals' ||
    raw.operator === 'not_equals' ||
    raw.operator === 'greater_or_equal' ||
    raw.operator === 'less_than'
      ? raw.operator
      : 'has'
  return {
    id: raw.id ?? createDialogRequirementCheckId(),
    subject,
    referenceId: typeof raw.referenceId === 'string' && raw.referenceId.length > 0 ? raw.referenceId : null,
    operator,
    numericValue:
      typeof raw.numericValue === 'number' && Number.isFinite(raw.numericValue) ? raw.numericValue : null,
  }
}

export function normalizeDialogReplyConditions(
  raw: Partial<DialogReplyConditions> | null | undefined,
): DialogReplyConditions | null {
  if (!raw) return null
  const checks = (raw.checks ?? []).map((entry) => normalizeRequirementCheck(entry))
  const gameplayState = normalizeGameplayConditionGroup(raw.gameplayState)
  if (!gameplayState && checks.length === 0) return null
  return { gameplayState, checks }
}

function normalizeSpeechNode(raw: Partial<DialogSpeechNode>): DialogSpeechNode {
  const speaker =
    raw.speaker === 'player' ||
    raw.speaker === 'narrator' ||
    raw.speaker === 'companion' ||
    raw.speaker === 'character' ||
    raw.speaker === 'linked_npc'
      ? raw.speaker
      : 'linked_npc'
  return {
    id: raw.id ?? createDialogNodeId('speech'),
    kind: 'speech',
    x: typeof raw.x === 'number' ? raw.x : 80,
    y: typeof raw.y === 'number' ? raw.y : 80,
    speaker,
    speakerCharacterId:
      typeof raw.speakerCharacterId === 'string' && raw.speakerCharacterId.length > 0
        ? raw.speakerCharacterId
        : null,
    text: raw.text ?? '',
    showConditions: normalizeDialogReplyConditions(raw.showConditions),
    stateEffects: (raw.stateEffects ?? []).map((entry) => normalizeDialogStateEffect(entry)),
    continueToNodeId:
      typeof raw.continueToNodeId === 'string' && raw.continueToNodeId.length > 0
        ? raw.continueToNodeId
        : null,
    playerChoiceNodeId:
      typeof raw.playerChoiceNodeId === 'string' && raw.playerChoiceNodeId.length > 0
        ? raw.playerChoiceNodeId
        : null,
  }
}

function normalizePlayerReply(raw: Partial<DialogPlayerReply>): DialogPlayerReply {
  return {
    id: raw.id ?? createDialogReplyId(),
    label: raw.label ?? '',
    conditions: normalizeDialogReplyConditions(raw.conditions),
    stateEffects: (raw.stateEffects ?? []).map((entry) => normalizeDialogStateEffect(entry)),
    targetNodeId:
      typeof raw.targetNodeId === 'string' && raw.targetNodeId.length > 0 ? raw.targetNodeId : null,
  }
}

function normalizePlayerChoiceNode(raw: Partial<DialogPlayerChoiceNode>): DialogPlayerChoiceNode {
  const replies =
    Array.isArray(raw.replies) && raw.replies.length > 0
      ? raw.replies.map((entry) => normalizePlayerReply(entry))
      : [createEmptyDialogReply()]
  return {
    id: raw.id ?? createDialogNodeId('choice'),
    kind: 'player_choice',
    x: typeof raw.x === 'number' ? raw.x : 80,
    y: typeof raw.y === 'number' ? raw.y : 240,
    replies,
  }
}

function normalizeEndNode(raw: Partial<DialogEndNode>): DialogEndNode {
  return {
    id: raw.id ?? createDialogNodeId('end'),
    kind: 'end',
    x: typeof raw.x === 'number' ? raw.x : 80,
    y: typeof raw.y === 'number' ? raw.y : 400,
    stateEffects: (raw.stateEffects ?? []).map((entry) => normalizeDialogStateEffect(entry)),
  }
}

export function normalizeConversationNode(raw: unknown): DialogConversationNode {
  if (!raw || typeof raw !== 'object') return createSpeechNode()
  const node = raw as Partial<DialogConversationNode>
  if (node.kind === 'player_choice') return normalizePlayerChoiceNode(node)
  if (node.kind === 'end') return normalizeEndNode(node)
  return normalizeSpeechNode(node as Partial<DialogSpeechNode>)
}

export function normalizeConversationGraph(raw: unknown): DialogConversationGraph {
  if (!raw || typeof raw !== 'object') return createDefaultConversationGraph()
  const graph = raw as Partial<DialogConversationGraph>
  const nodesInput = graph.nodes
  if (!nodesInput || typeof nodesInput !== 'object') return createDefaultConversationGraph()

  const nodes: Record<string, DialogConversationNode> = {}
  if (Array.isArray(nodesInput)) {
    for (const entry of nodesInput) {
      const normalized = normalizeConversationNode(entry)
      nodes[normalized.id] = normalized
    }
  } else {
    for (const [id, entry] of Object.entries(nodesInput)) {
      const normalized = normalizeConversationNode(entry)
      normalized.id = id
      nodes[id] = normalized
    }
  }

  const rootNodeId =
    typeof graph.rootNodeId === 'string' && nodes[graph.rootNodeId]
      ? graph.rootNodeId
      : Object.keys(nodes)[0] ?? createSpeechNode().id

  if (!nodes[rootNodeId]) {
    return createDefaultConversationGraph()
  }

  const listOrder = normalizeGraphListOrder({ rootNodeId, nodes }, graph.listOrder)
  return { rootNodeId, nodes, listOrder }
}

function normalizeGraphListOrder(
  graph: { rootNodeId: string; nodes: Record<string, DialogConversationNode> },
  rawOrder: unknown,
): string[] {
  const nodeIds = new Set(Object.keys(graph.nodes))
  const order: string[] = []
  if (Array.isArray(rawOrder)) {
    for (const id of rawOrder) {
      if (typeof id === 'string' && nodeIds.has(id) && !order.includes(id)) {
        order.push(id)
      }
    }
  }
  if (order.length === 0) {
    order.push(...defaultGraphListOrder(graph))
  }
  for (const id of Object.keys(graph.nodes)) {
    if (!order.includes(id)) order.push(id)
  }
  return order
}

export function defaultGraphListOrder(graph: {
  rootNodeId: string
  nodes: Record<string, DialogConversationNode>
}): string[] {
  const visited = new Set<string>()
  const order: string[] = []
  const queue = [graph.rootNodeId]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    order.push(id)
    const node = graph.nodes[id]
    if (!node) continue
    if (node.kind === 'speech') {
      if (node.continueToNodeId) queue.push(node.continueToNodeId)
      if (node.playerChoiceNodeId) queue.push(node.playerChoiceNodeId)
    }
    if (node.kind === 'player_choice') {
      for (const reply of node.replies) {
        if (reply.targetNodeId) queue.push(reply.targetNodeId)
      }
    }
  }
  for (const id of Object.keys(graph.nodes)) {
    if (!visited.has(id)) order.push(id)
  }
  return order
}

function normalizeTrigger(raw: Partial<DialogTriggerConfig> | undefined): DialogTriggerConfig {
  const defaults = createDefaultDialogTrigger()
  if (!raw) return defaults
  const mode =
    raw.mode === 'storyline' || raw.mode === 'automatic' || raw.mode === 'manual' ? raw.mode : defaults.mode
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
    manualTargetCharacterId:
      typeof raw.manualTargetCharacterId === 'string' && raw.manualTargetCharacterId.length > 0
        ? raw.manualTargetCharacterId
        : null,
  }
}

function migrateLegacyDialog(raw: Record<string, unknown>): Partial<Dialog> {
  if (raw.conversation && typeof raw.conversation === 'object') return {}

  const legacyLines = raw.lines as LegacyDialogLine[] | undefined
  const availabilityConditions = raw.availabilityConditions as GameplayConditionGroup | null | undefined
  const completionEffects = raw.completionStateEffects as DialogStateEffect[] | undefined
  if (!legacyLines?.length && !availabilityConditions && !completionEffects) return {}

  const nodes: Record<string, DialogConversationNode> = {}
  let prevSpeechId: string | null = null
  let rootId: string | null = null
  let y = 100

  for (const line of legacyLines ?? []) {
    const speech = createSpeechNode(120, y)
    speech.text = line.text ?? ''
    speech.speakerCharacterId = line.speakerCharacterId
    speech.speaker = line.speakerCharacterId ? 'character' : 'linked_npc'
    speech.stateEffects = (line.stateEffects ?? []).map((entry) => normalizeDialogStateEffect(entry))
    nodes[speech.id] = speech
    if (prevSpeechId) {
      const prev = nodes[prevSpeechId] as DialogSpeechNode
      prev.continueToNodeId = speech.id
    } else {
      rootId = speech.id
    }
    prevSpeechId = speech.id
    y += 120
  }

  const end = createEndNode(120, y)
  end.stateEffects = (completionEffects ?? []).map((entry) => normalizeDialogStateEffect(entry))
  nodes[end.id] = end
  if (prevSpeechId) {
    ;(nodes[prevSpeechId] as DialogSpeechNode).continueToNodeId = end.id
  }

  if (!rootId) {
    const speech = createSpeechNode()
    nodes[speech.id] = speech
    rootId = speech.id
  }

  return {
    trigger: {
      ...createDefaultDialogTrigger(),
      mode: availabilityConditions ? 'automatic' : createDefaultDialogTrigger().mode,
      autoStateConditions: normalizeGameplayConditionGroup(availabilityConditions),
    },
    conversation: {
      rootNodeId: rootId,
      nodes,
      listOrder: defaultGraphListOrder({ rootNodeId: rootId, nodes }),
    },
  }
}

export function normalizeDialog(raw: Partial<Dialog> & { id: string }): Dialog {
  const legacy = migrateLegacyDialog(raw as Record<string, unknown>)
  const merged = { ...raw, ...legacy }

  return {
    id: merged.id,
    name: merged.name?.trim() || 'Untitled dialog',
    summary: merged.summary ?? '',
    categoryId:
      typeof merged.categoryId === 'string' && merged.categoryId.length > 0 ? merged.categoryId : null,
    characterId:
      typeof merged.characterId === 'string' && merged.characterId.length > 0 ? merged.characterId : null,
    trigger: normalizeTrigger(merged.trigger),
    conversation: normalizeConversationGraph(merged.conversation),
    updatedAt: merged.updatedAt ?? new Date().toISOString(),
  }
}

export function normalizeDialogCategory(raw: Partial<DialogCategory> & { id: string }): DialogCategory {
  return {
    id: raw.id,
    name: raw.name?.trim() || 'Untitled category',
    description: raw.description ?? '',
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function defaultDialogCategories(): DialogCategory[] {
  const timestamp = new Date().toISOString()
  return [
    {
      id: 'dialog-cat-main-quest',
      name: 'Main quest',
      description: 'Primary storyline conversations.',
      updatedAt: timestamp,
    },
    {
      id: 'dialog-cat-side-quest',
      name: 'Side quest',
      description: 'Optional quest dialog.',
      updatedAt: timestamp,
    },
    {
      id: 'dialog-cat-npc-chatter',
      name: 'NPC chatter',
      description: 'Ambient and repeatable NPC lines.',
      updatedAt: timestamp,
    },
    {
      id: 'dialog-cat-cutscene',
      name: 'Cutscene',
      description: 'Scripted non-interactive scenes.',
      updatedAt: timestamp,
    },
  ]
}

export function isDialogCategoryId(id: string, categories: readonly DialogCategory[]): boolean {
  return categories.some((entry) => entry.id === id)
}

export function getDialogCategory(
  categoryId: string | null,
  categories: readonly DialogCategory[],
): DialogCategory | undefined {
  if (!categoryId) return undefined
  return categories.find((entry) => entry.id === categoryId)
}

export function countConversationNodes(graph: DialogConversationGraph): number {
  return Object.keys(graph.nodes).length
}

export function summarizeDialogTrigger(trigger: DialogTriggerConfig): string {
  if (trigger.mode === 'storyline') {
    return trigger.storylineTriggerId ? `Storyline · ${trigger.storylineTriggerId}` : 'Storyline trigger'
  }
  if (trigger.mode === 'automatic') {
    const parts = ['Auto']
    if (trigger.environment.requireNotInBattle) parts.push('not in battle')
    if (trigger.environment.onlyAfterReset) parts.push('after reset')
    if (trigger.gameTimeDelayMinutes) parts.push(`${trigger.gameTimeDelayMinutes}m delay`)
    return parts.join(' · ')
  }
  return 'Manual · talk to character'
}

export function summarizeConversationGraph(graph: DialogConversationGraph): string {
  const nodes = Object.values(graph.nodes)
  const speeches = nodes.filter((node) => node.kind === 'speech').length
  const choices = nodes.filter((node) => node.kind === 'player_choice').length
  const replyCount = nodes
    .filter((node): node is DialogPlayerChoiceNode => node.kind === 'player_choice')
    .reduce((sum, node) => sum + node.replies.length, 0)
  return `${speeches} speech · ${choices} choice${choices === 1 ? '' : 's'} · ${replyCount} repl${replyCount === 1 ? 'y' : 'ies'}`
}

export const DIALOG_TRIGGER_MODE_LABELS: Record<DialogTriggerMode, string> = {
  storyline: 'Storyline (external trigger)',
  automatic: 'Automatic (state + environment)',
  manual: 'Manual (select character)',
}

export const DIALOG_SPEAKER_LABELS: Record<DialogSpeechSpeaker, string> = {
  linked_npc: 'Linked NPC',
  player: 'Main character',
  narrator: 'Narrator',
  companion: 'Companion (conditional)',
  character: 'Specific character',
}
