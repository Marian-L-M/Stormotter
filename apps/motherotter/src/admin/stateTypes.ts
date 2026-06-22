import type { StateVariable } from '@otter/otterfile-core'

/**
 * Story and narrative state — not battle/combat runtime.
 *
 * The `StateVariable` shape is owned by `otterfile-core` (the cartridge schema
 * authority); re-exported here so editor code keeps its existing import path.
 */
export type { StateVariable }

export type StateVariableScope = StateVariable['scope']

export type StateVariableType = StateVariable['varType']

export interface StateVariableListItem {
  id: string
  title: string
  category: string
  updatedAt: string
  subtitle?: string
  scope: StateVariableScope
  variable: StateVariable
}

export const STATE_SCOPE_LABELS: Record<StateVariableScope, string> = {
  global: 'Global',
  character: 'Character',
}

export const STATE_TYPE_LABELS: Record<StateVariableType, string> = {
  boolean: 'Boolean',
  number: 'Number',
  string: 'String',
}

export function formatDefaultValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

export function isValidStateKey(key: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(key)
}
