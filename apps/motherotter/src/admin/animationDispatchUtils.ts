import { mergeBindingsForTrigger } from './animationBindingUtils'
import type { AnimationBinding, AnimationTrigger } from './animationTypes'
import type { AbilityDefinition } from './abilityTypes'
import type { Item } from './itemTypes'

export function collectCharacterAnimationBindings(
  trigger: AnimationTrigger,
  options: {
    abilityDefinitions: AbilityDefinition[]
    assignedAbilityIds: readonly string[]
    items: Item[]
    itemAnimationBindings?: AnimationBinding[]
  },
): AnimationBinding[] {
  const abilityBindings = options.assignedAbilityIds.flatMap((abilityId) => {
    const definition = options.abilityDefinitions.find((entry) => entry.id === abilityId)
    return definition?.animationBindings ?? []
  })

  return mergeBindingsForTrigger(trigger, [
    { bindings: abilityBindings },
    { bindings: options.itemAnimationBindings ?? [] },
  ])
}

export function collectItemAnimationBindings(item: Item, trigger: AnimationTrigger): AnimationBinding[] {
  return mergeBindingsForTrigger(trigger, [{ bindings: item.animationBindings }])
}

export function collectWeaponAttackBindings(items: Item[]): AnimationBinding[] {
  const weaponItems = items.filter((item) => item.countsAsWeapon)
  return mergeBindingsForTrigger(
    'on_attack',
    weaponItems.map((item) => ({ bindings: item.animationBindings })),
  )
}
