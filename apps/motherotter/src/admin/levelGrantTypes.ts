import { normalizeCharacterLevel, MAX_CHARACTER_LEVEL } from './characterLevelTypes'

export interface LevelAbilityGrant {
  level: number
  abilityIds: string[]
}

export function normalizeLevelAbilityGrants(
  raw: Partial<LevelAbilityGrant>[] | undefined,
  legacyAbilityIds?: string[],
): LevelAbilityGrant[] {
  if (raw?.length) {
    const byLevel = new Map<number, Set<string>>()
    for (const entry of raw) {
      const level = normalizeCharacterLevel(entry.level)
      const bucket = byLevel.get(level) ?? new Set<string>()
      for (const abilityId of entry.abilityIds ?? []) {
        if (typeof abilityId === 'string' && abilityId.length > 0) {
          bucket.add(abilityId)
        }
      }
      byLevel.set(level, bucket)
    }
    return sortLevelAbilityGrants(
      [...byLevel.entries()].map(([level, abilityIds]) => ({
        level,
        abilityIds: [...abilityIds],
      })),
    )
  }

  if (legacyAbilityIds?.length) {
    return [{ level: 1, abilityIds: [...new Set(legacyAbilityIds)] }]
  }

  return []
}

export function sortLevelAbilityGrants(grants: LevelAbilityGrant[]): LevelAbilityGrant[] {
  return [...grants].sort((a, b) => a.level - b.level)
}

export function getActiveAbilityIds(grants: LevelAbilityGrant[], characterLevel: number): string[] {
  const level = normalizeCharacterLevel(characterLevel)
  const ids = new Set<string>()
  for (const grant of grants) {
    if (grant.level <= level) {
      for (const abilityId of grant.abilityIds) {
        ids.add(abilityId)
      }
    }
  }
  return [...ids]
}

export function getNextLevelGrantLevel(grants: LevelAbilityGrant[]): number {
  if (grants.length === 0) return 1
  const maxLevel = Math.max(...grants.map((entry) => entry.level))
  return Math.min(MAX_CHARACTER_LEVEL, maxLevel + 1)
}

export function addLevelAbilityGrant(
  grants: LevelAbilityGrant[],
  level = getNextLevelGrantLevel(grants),
): LevelAbilityGrant[] {
  const normalizedLevel = normalizeCharacterLevel(level)
  if (grants.some((entry) => entry.level === normalizedLevel)) {
    return grants
  }
  return sortLevelAbilityGrants([...grants, { level: normalizedLevel, abilityIds: [] }])
}

export function removeLevelAbilityGrant(
  grants: LevelAbilityGrant[],
  level: number,
): LevelAbilityGrant[] {
  return grants.filter((entry) => entry.level !== normalizeCharacterLevel(level))
}

export function updateLevelAbilityGrantLevel(
  grants: LevelAbilityGrant[],
  fromLevel: number,
  toLevel: number,
): LevelAbilityGrant[] {
  const sourceLevel = normalizeCharacterLevel(fromLevel)
  const targetLevel = normalizeCharacterLevel(toLevel)
  if (sourceLevel === targetLevel) return grants

  const source = grants.find((entry) => entry.level === sourceLevel)
  if (!source) return grants

  const withoutSource = grants.filter((entry) => entry.level !== sourceLevel)
  const existingTarget = withoutSource.find((entry) => entry.level === targetLevel)
  if (existingTarget) {
    existingTarget.abilityIds = [...new Set([...existingTarget.abilityIds, ...source.abilityIds])]
    return sortLevelAbilityGrants(withoutSource)
  }

  return sortLevelAbilityGrants([
    ...withoutSource,
    { level: targetLevel, abilityIds: [...source.abilityIds] },
  ])
}

export function toggleAbilityInLevelGrant(
  grants: LevelAbilityGrant[],
  level: number,
  abilityId: string,
): LevelAbilityGrant[] {
  const normalizedLevel = normalizeCharacterLevel(level)
  return sortLevelAbilityGrants(
    grants.map((entry) => {
      if (entry.level !== normalizedLevel) return entry
      const hasAbility = entry.abilityIds.includes(abilityId)
      return {
        ...entry,
        abilityIds: hasAbility
          ? entry.abilityIds.filter((id) => id !== abilityId)
          : [...entry.abilityIds, abilityId],
      }
    }),
  )
}

export function summarizeLevelAbilityGrants(grants: LevelAbilityGrant[]): string {
  if (grants.length === 0) return '—'
  return grants
    .map((entry) => `Lv ${entry.level}: ${entry.abilityIds.length}`)
    .join(', ')
}
