import type { StateVariableType } from './stateTypes'

export type GameplayConditionJoin = 'and' | 'or'

export type GameplayNumberOperator = 'equals' | 'greater_than' | 'less_than'
export type GameplayBooleanOperator = 'is_true' | 'is_false'
export type GameplayStringOperator = 'equals' | 'not_equals'

export type GameplayConditionOperator =
  | GameplayNumberOperator
  | GameplayBooleanOperator
  | GameplayStringOperator

export interface GameplayStateCheck {
  type: 'check'
  id: string
  stateVariableId: string
  operator: GameplayConditionOperator
  compareValue: string | number | boolean | null
}

export interface GameplayConditionGroup {
  type: 'group'
  id: string
  join: GameplayConditionJoin
  children: GameplayConditionNode[]
}

export type GameplayConditionNode = GameplayStateCheck | GameplayConditionGroup

export const GAMEPLAY_CONDITION_JOIN_LABELS: Record<GameplayConditionJoin, string> = {
  and: 'AND — all must pass',
  or: 'OR — any may pass',
}

export const GAMEPLAY_NUMBER_OPERATOR_LABELS: Record<GameplayNumberOperator, string> = {
  equals: 'Equals',
  greater_than: 'Greater than',
  less_than: 'Less than',
}

export const GAMEPLAY_BOOLEAN_OPERATOR_LABELS: Record<GameplayBooleanOperator, string> = {
  is_true: 'Is true',
  is_false: 'Is false',
}

export const GAMEPLAY_STRING_OPERATOR_LABELS: Record<GameplayStringOperator, string> = {
  equals: 'Equals',
  not_equals: 'Not equals',
}

export function createGameplayConditionId(prefix = 'gp-cond'): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function createGameplayStateCheck(): GameplayStateCheck {
  return {
    type: 'check',
    id: createGameplayConditionId('gp-check'),
    stateVariableId: '',
    operator: 'equals',
    compareValue: null,
  }
}

export function createGameplayConditionGroup(join: GameplayConditionJoin = 'and'): GameplayConditionGroup {
  return {
    type: 'group',
    id: createGameplayConditionId('gp-group'),
    join,
    children: [],
  }
}

export function operatorsForStateType(varType: StateVariableType): GameplayConditionOperator[] {
  if (varType === 'number') return ['equals', 'greater_than', 'less_than']
  if (varType === 'boolean') return ['is_true', 'is_false']
  return ['equals', 'not_equals']
}

export function operatorLabelsForStateType(
  varType: StateVariableType,
): Record<string, string> {
  if (varType === 'number') return GAMEPLAY_NUMBER_OPERATOR_LABELS
  if (varType === 'boolean') return GAMEPLAY_BOOLEAN_OPERATOR_LABELS
  return GAMEPLAY_STRING_OPERATOR_LABELS
}

export function operatorNeedsCompareValue(varType: StateVariableType): boolean {
  return varType !== 'boolean'
}

function normalizeCheck(raw: Partial<GameplayStateCheck>): GameplayStateCheck {
  return {
    type: 'check',
    id: raw.id ?? createGameplayConditionId('gp-check'),
    stateVariableId: raw.stateVariableId ?? '',
    operator: raw.operator ?? 'equals',
    compareValue: raw.compareValue ?? null,
  }
}

function normalizeGroup(raw: Partial<GameplayConditionGroup>): GameplayConditionGroup {
  const join = raw.join === 'or' ? 'or' : 'and'
  const children = Array.isArray(raw.children)
    ? raw.children.map((child) => normalizeGameplayConditionNode(child))
    : []
  return {
    type: 'group',
    id: raw.id ?? createGameplayConditionId('gp-group'),
    join,
    children,
  }
}

export function normalizeGameplayConditionNode(raw: unknown): GameplayConditionNode {
  if (!raw || typeof raw !== 'object') return createGameplayStateCheck()
  const node = raw as Partial<GameplayConditionNode>
  if (node.type === 'group') return normalizeGroup(node)
  return normalizeCheck(node as Partial<GameplayStateCheck>)
}

export function normalizeGameplayConditionGroup(raw: unknown): GameplayConditionGroup | null {
  if (!raw) return null
  const normalized = normalizeGameplayConditionNode(raw)
  return normalized.type === 'group' ? normalized : null
}

export function updateGameplayConditionTree(
  root: GameplayConditionGroup,
  nodeId: string,
  updater: (node: GameplayConditionNode) => GameplayConditionNode | null,
): GameplayConditionGroup {
  function walk(node: GameplayConditionNode): GameplayConditionNode | null {
    if (node.id === nodeId) {
      return updater(node)
    }
    if (node.type !== 'group') return node
    const children = node.children
      .map((child) => walk(child))
      .filter((child): child is GameplayConditionNode => child !== null)
    return { ...node, children }
  }

  const next = walk(root)
  return next?.type === 'group' ? next : root
}

export function addGameplayConditionChild(
  root: GameplayConditionGroup,
  parentId: string,
  child: GameplayConditionNode,
): GameplayConditionGroup {
  return updateGameplayConditionTree(root, parentId, (node) => {
    if (node.type !== 'group') return node
    return { ...node, children: [...node.children, child] }
  })
}

export function removeGameplayConditionNode(
  root: GameplayConditionGroup,
  nodeId: string,
): GameplayConditionGroup {
  if (root.id === nodeId) return root

  function prune(group: GameplayConditionGroup): GameplayConditionGroup {
    return {
      ...group,
      children: group.children
        .filter((child) => child.id !== nodeId)
        .map((child) => (child.type === 'group' ? prune(child) : child)),
    }
  }

  return prune(root)
}
