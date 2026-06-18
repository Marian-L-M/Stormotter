import type {
  AnimationBinding,
  AnimationDefinition,
  AnimationTrigger,
} from './animationTypes'
import {
  getAnimationDurationMs,
  groupBindingsByOrder,
  playBindingGroupsSequentially,
} from './animationPlaybackUtils'

export interface AnimationBindingSource {
  bindings: AnimationBinding[]
}

export function filterBindingsByTrigger(
  bindings: AnimationBinding[],
  trigger: AnimationTrigger,
): AnimationBinding[] {
  return bindings.filter((binding) => binding.trigger === trigger && binding.animationId.trim())
}

export function mergeBindingsForTrigger(
  trigger: AnimationTrigger,
  sources: AnimationBindingSource[],
): AnimationBinding[] {
  const merged: AnimationBinding[] = []
  for (const source of sources) {
    merged.push(...filterBindingsByTrigger(source.bindings, trigger))
  }
  return merged.sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
}

export function resolveAnimationDefinitions(
  bindings: AnimationBinding[],
  definitions: AnimationDefinition[],
): AnimationDefinition[] {
  const byId = new Map(definitions.map((entry) => [entry.id, entry]))
  const resolved: AnimationDefinition[] = []
  for (const binding of bindings) {
    const definition = byId.get(binding.animationId)
    if (definition && definition.steps.length > 0) {
      resolved.push(definition)
    }
  }
  return resolved
}

export function getLongestAnimationDurationMs(definitions: AnimationDefinition[]): number {
  if (definitions.length === 0) return 0
  return Math.max(...definitions.map((definition) => getAnimationDurationMs(definition)))
}

export async function playAnimationBindingGroups(
  bindings: AnimationBinding[],
  definitions: AnimationDefinition[],
  playDefinition: (definition: AnimationDefinition) => Promise<void>,
): Promise<void> {
  const byId = new Map(definitions.map((entry) => [entry.id, entry]))
  await playBindingGroupsSequentially(bindings, async (animationId) => {
    const definition = byId.get(animationId)
    if (!definition || definition.steps.length === 0) return
    await playDefinition(definition)
  })
}

export function describeBindingGroups(bindings: AnimationBinding[]): string {
  const groups = groupBindingsByOrder(bindings)
  if (groups.length === 0) return 'No animations'
  return groups
    .map((group, index) => {
      const ids = group.map((binding) => binding.animationId).join(', ')
      return `order ${index}: ${ids}`
    })
    .join(' · ')
}
