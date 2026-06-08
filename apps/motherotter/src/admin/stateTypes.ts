/** Story and narrative state — not battle/combat runtime. */
export type StateVariableScope = 'global' | 'character'

export type StateVariableType = 'boolean' | 'number' | 'string'

export interface StateVariable {
  id: string
  /** Script key (slug), e.g. quest_stage */
  key: string
  /** Human-readable label in the editor */
  title: string
  scope: StateVariableScope
  varType: StateVariableType
  defaultValue: string | number | boolean
  description: string
  /** Character id when scope is character (links to Characters tab entry) */
  characterId: string | null
  updatedAt: string
}

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
