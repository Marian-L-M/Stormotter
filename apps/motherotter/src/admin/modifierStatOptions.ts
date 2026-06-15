import { DEFAULT_STATS } from '@otter/mechanics-core'
import {
  DERIVED_STAT_DEFINITIONS,
  DERIVED_STAT_GROUP_LABELS,
  DERIVED_STAT_GROUP_ORDER,
  DERIVED_STAT_HANDLER_PREFIX,
  DERIVED_STAT_LABELS,
  type DerivedStatGroup,
  type DerivedStatKey,
} from './derivedStatTypes'

export interface ModifierStatOption {
  id: string
  name: string
  group: 'ability' | DerivedStatGroup
  groupLabel: string
}

export function getModifierStatOptions(): ModifierStatOption[] {
  const abilityOptions: ModifierStatOption[] = DEFAULT_STATS.map((entry) => ({
    id: entry.id,
    name: entry.name,
    group: 'ability',
    groupLabel: 'Ability scores',
  }))

  const derivedOptions: ModifierStatOption[] = DERIVED_STAT_DEFINITIONS.map((definition) => ({
    id: `${DERIVED_STAT_HANDLER_PREFIX}${definition.key}`,
    name: DERIVED_STAT_LABELS[definition.key],
    group: definition.group,
    groupLabel: DERIVED_STAT_GROUP_LABELS[definition.group],
  }))

  return [...abilityOptions, ...derivedOptions]
}

export function groupModifierStatOptions(options: ModifierStatOption[] = getModifierStatOptions()) {
  const groups: { id: string; label: string; options: ModifierStatOption[] }[] = [
    {
      id: 'ability',
      label: 'Ability scores',
      options: options.filter((entry) => entry.group === 'ability'),
    },
  ]

  for (const group of DERIVED_STAT_GROUP_ORDER) {
    const bucket = options.filter((entry) => entry.group === group)
    if (bucket.length === 0) continue
    groups.push({
      id: group,
      label: DERIVED_STAT_GROUP_LABELS[group],
      options: bucket,
    })
  }

  return groups
}

export function formatModifierStatOptionLabel(statId: string | null | undefined): string | null {
  if (!statId) return null
  const option = getModifierStatOptions().find((entry) => entry.id === statId)
  if (option) return option.name
  if (statId.startsWith(DERIVED_STAT_HANDLER_PREFIX)) {
    const key = statId.slice(DERIVED_STAT_HANDLER_PREFIX.length) as DerivedStatKey
    return DERIVED_STAT_LABELS[key] ?? key
  }
  return statId
}
