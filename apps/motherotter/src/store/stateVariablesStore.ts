import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { StateVariable, StateVariableScope, StateVariableType } from '../admin/stateTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

function createId(): string {
  return `state-${crypto.randomUUID().slice(0, 8)}`
}

function defaultValueForType(varType: StateVariableType): string | number | boolean {
  switch (varType) {
    case 'boolean':
      return false
    case 'number':
      return 0
    default:
      return ''
  }
}

function seedVariable(
  scope: StateVariableScope,
  key: string,
  title: string,
  varType: StateVariableType,
  defaultValue: string | number | boolean,
  description: string,
  characterId: string | null = null,
): StateVariable {
  const timestamp = new Date().toISOString()
  return {
    id: createId(),
    key,
    title,
    scope,
    varType,
    defaultValue,
    description,
    characterId,
    updatedAt: timestamp,
  }
}

export type StateVariablePatch = Partial<
  Pick<
    StateVariable,
    'key' | 'title' | 'varType' | 'defaultValue' | 'description' | 'characterId'
  >
>

interface StateVariablesState {
  variables: StateVariable[]
  addVariable: (scope: StateVariableScope) => string
  updateVariable: (id: string, patch: StateVariablePatch) => void
  removeVariable: (id: string) => void
  getVariable: (id: string) => StateVariable | undefined
  replaceAll: (variables: StateVariable[]) => void
}

export const useStateVariablesStore = create<StateVariablesState>()(
  immer((set, get) => ({
    variables: createDefaultProjectContent().stateVariables,

    addVariable: (scope) => {
      const index = get().variables.filter((v) => v.scope === scope).length + 1
      const key = scope === 'global' ? `global_var_${index}` : `char_var_${index}`
      const variable = seedVariable(
        scope,
        key,
        scope === 'global' ? `Global variable ${index}` : `Character variable ${index}`,
        'boolean',
        false,
        '',
        scope === 'character' ? null : null,
      )
      set((state) => {
        state.variables.unshift(variable)
      })
      return variable.id
    },

    updateVariable: (id, patch) => {
      set((state) => {
        const variable = state.variables.find((entry) => entry.id === id)
        if (!variable) return

        if (patch.key !== undefined) variable.key = patch.key
        if (patch.title !== undefined) variable.title = patch.title
        if (patch.varType !== undefined) {
          variable.varType = patch.varType
          variable.defaultValue = defaultValueForType(patch.varType)
        }
        if (patch.defaultValue !== undefined) variable.defaultValue = patch.defaultValue
        if (patch.description !== undefined) variable.description = patch.description
        if (patch.characterId !== undefined) variable.characterId = patch.characterId
        variable.updatedAt = new Date().toISOString()
      })
    },

    removeVariable: (id) => {
      set((state) => {
        state.variables = state.variables.filter((entry) => entry.id !== id)
      })
    },

    getVariable: (id) => get().variables.find((entry) => entry.id === id),

    replaceAll: (variables) => {
      set((state) => {
        state.variables = structuredClone(variables)
      })
    },
  })),
)
