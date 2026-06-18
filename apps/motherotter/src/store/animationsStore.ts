import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createEmptyAnimationDefinition,
  createEmptyAnimationStep,
  normalizeAnimationDefinition,
  normalizeAnimationStep,
  normalizeAnimationBinding,
  normalizeAnimationsContent,
  type AnimationBinding,
  type AnimationDefinition,
  type AnimationRenderEngine,
  type AnimationStep,
  type AnimationsContent,
} from '../admin/animationTypes'
import { createDefaultProjectContent } from '../lib/defaultProjectContent'

interface AnimationsState extends AnimationsContent {
  addDefinition: (renderEngine?: AnimationRenderEngine) => string
  updateDefinition: (id: string, patch: Partial<Pick<AnimationDefinition, 'name' | 'steps'>>) => void
  removeDefinition: (id: string) => void
  duplicateDefinition: (id: string) => string | null
  getDefinition: (id: string) => AnimationDefinition | undefined
  addStep: (definitionId: string) => string | null
  updateStep: (definitionId: string, stepId: string, patch: Partial<AnimationStep>) => void
  removeStep: (definitionId: string, stepId: string) => void
  duplicateStep: (definitionId: string, stepId: string) => string | null
  moveStep: (definitionId: string, stepId: string, direction: 'up' | 'down') => void
  setMapEventBindings: (eventId: string, bindings: AnimationBinding[]) => void
  setHookBindings: (hookId: string, bindings: AnimationBinding[]) => void
  getMapEventBindings: (eventId: string) => AnimationBinding[]
  getHookBindings: (hookId: string) => AnimationBinding[]
  replaceAll: (content: AnimationsContent) => void
  getSnapshot: () => AnimationsContent
}

export const useAnimationsStore = create<AnimationsState>()(
  immer((set, get) => ({
    ...createDefaultProjectContent().animations,

    addDefinition: (renderEngine = 'de-otterer') => {
      const index = get().definitions.filter((entry) => entry.renderEngine === renderEngine).length + 1
      const definition = createEmptyAnimationDefinition(renderEngine, `New animation ${index}`)
      set((state) => {
        state.definitions.unshift(definition)
      })
      return definition.id
    },

    updateDefinition: (id, patch) => {
      set((state) => {
        const definition = state.definitions.find((entry) => entry.id === id)
        if (!definition) return
        if (patch.name !== undefined) definition.name = patch.name
        if (patch.steps !== undefined) definition.steps = patch.steps.map((step) => ({ ...step }))
        definition.updatedAt = new Date().toISOString()
      })
    },

    removeDefinition: (id) => {
      set((state) => {
        state.definitions = state.definitions.filter((entry) => entry.id !== id)
      })
    },

    duplicateDefinition: (id) => {
      const source = get().definitions.find((entry) => entry.id === id)
      if (!source) return null
      const copy = normalizeAnimationDefinition({
        ...structuredClone(source),
        id: undefined,
        name: `${source.name.trim()} (copy)`,
        updatedAt: new Date().toISOString(),
      })
      set((state) => {
        state.definitions.unshift(copy)
      })
      return copy.id
    },

    getDefinition: (id) => get().definitions.find((entry) => entry.id === id),

    addStep: (definitionId) => {
      const definition = get().definitions.find((entry) => entry.id === definitionId)
      if (!definition) return null
      const step = createEmptyAnimationStep(definition.steps.length + 1)
      set((state) => {
        const target = state.definitions.find((entry) => entry.id === definitionId)
        if (!target) return
        target.steps.push(step)
        target.updatedAt = new Date().toISOString()
      })
      return step.id
    },

    updateStep: (definitionId, stepId, patch) => {
      set((state) => {
        const definition = state.definitions.find((entry) => entry.id === definitionId)
        if (!definition) return
        const step = definition.steps.find((entry) => entry.id === stepId)
        if (!step) return
        Object.assign(step, patch)
        definition.updatedAt = new Date().toISOString()
      })
    },

    removeStep: (definitionId, stepId) => {
      set((state) => {
        const definition = state.definitions.find((entry) => entry.id === definitionId)
        if (!definition) return
        definition.steps = definition.steps.filter((entry) => entry.id !== stepId)
        definition.updatedAt = new Date().toISOString()
      })
    },

    duplicateStep: (definitionId, stepId) => {
      const definition = get().definitions.find((entry) => entry.id === definitionId)
      const source = definition?.steps.find((entry) => entry.id === stepId)
      if (!definition || !source) return null

      const label = source.label.trim().endsWith('(copy)')
        ? source.label.trim()
        : `${source.label.trim()} (copy)`
      const copy = normalizeAnimationStep({
        ...structuredClone(source),
        id: undefined,
        label,
      })

      set((state) => {
        const target = state.definitions.find((entry) => entry.id === definitionId)
        if (!target) return
        const index = target.steps.findIndex((entry) => entry.id === stepId)
        if (index < 0) return
        target.steps.splice(index + 1, 0, copy)
        target.updatedAt = new Date().toISOString()
      })

      return copy.id
    },

    moveStep: (definitionId, stepId, direction) => {
      set((state) => {
        const definition = state.definitions.find((entry) => entry.id === definitionId)
        if (!definition) return
        const index = definition.steps.findIndex((entry) => entry.id === stepId)
        if (index < 0) return
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= definition.steps.length) return
        const [removed] = definition.steps.splice(index, 1)
        definition.steps.splice(targetIndex, 0, removed)
        definition.updatedAt = new Date().toISOString()
      })
    },

    setMapEventBindings: (eventId, bindings) => {
      const normalized = bindings.map((entry) => normalizeAnimationBinding(entry))
      set((state) => {
        if (normalized.length === 0) {
          delete state.mapEventBindings[eventId]
          return
        }
        state.mapEventBindings[eventId] = normalized
      })
    },

    setHookBindings: (hookId, bindings) => {
      const normalized = bindings.map((entry) => normalizeAnimationBinding(entry))
      set((state) => {
        if (normalized.length === 0) {
          delete state.hookBindings[hookId]
          return
        }
        state.hookBindings[hookId] = normalized
      })
    },

    getMapEventBindings: (eventId) =>
      structuredClone(get().mapEventBindings[eventId] ?? []),

    getHookBindings: (hookId) => structuredClone(get().hookBindings[hookId] ?? []),

    replaceAll: (content) => {
      const normalized = normalizeAnimationsContent(content)
      set((state) => {
        state.definitions = normalized.definitions
        state.mapEventBindings = normalized.mapEventBindings
        state.hookBindings = normalized.hookBindings
      })
    },

    getSnapshot: () => ({
      definitions: structuredClone(get().definitions),
      mapEventBindings: structuredClone(get().mapEventBindings),
      hookBindings: structuredClone(get().hookBindings),
    }),
  })),
)
