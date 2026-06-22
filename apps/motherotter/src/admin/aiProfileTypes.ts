export type AiTargetPriority = 'nearest' | 'weakest' | 'strongest' | 'leader' | 'random'

export type AiAbilityUsage = 'aggressive' | 'balanced' | 'conservative' | 'support_first'

export type AiRetreatBehavior = 'never' | 'low_hp' | 'outnumbered'

export type AiWeaponPreference = 'melee' | 'ranged' | 'adaptive'

export interface AiBattlePhaseRule {
  id: string
  label: string
  /** Rule applies while current HP is at or below this percent (1–100). */
  hpThresholdMax: number
  targetPriority: AiTargetPriority
  abilityUsage: AiAbilityUsage
  retreatBehavior: AiRetreatBehavior
  weaponPreference: AiWeaponPreference
  /** Disengage or flee when an enemy closes to melee range. */
  retreatFromMelee: boolean
  prioritizeAbilities: boolean
  /** @deprecated Migrated to weaponPreference */
  preferMelee?: boolean
}

export interface AiProfile {
  id: string
  name: string
  description: string
  /** 0 cautious — 100 reckless */
  aggression: number
  /** HP % below which retreat behavior may trigger */
  retreatThreshold: number
  targetPriority: AiTargetPriority
  abilityUsage: AiAbilityUsage
  retreatBehavior: AiRetreatBehavior
  weaponPreference: AiWeaponPreference
  retreatFromMelee: boolean
  prioritizeAbilities: boolean
  /** Ordered ability definition IDs — first available is tried first in combat. */
  abilityPriorityIds: string[]
  phaseRules: AiBattlePhaseRule[]
  updatedAt: string
  /** @deprecated Migrated to weaponPreference */
  preferMelee?: boolean
}

export type AiProfilePatch = Partial<
  Pick<
    AiProfile,
    | 'name'
    | 'description'
    | 'aggression'
    | 'retreatThreshold'
    | 'targetPriority'
    | 'abilityUsage'
    | 'retreatBehavior'
    | 'weaponPreference'
    | 'retreatFromMelee'
    | 'prioritizeAbilities'
    | 'abilityPriorityIds'
    | 'phaseRules'
  >
>

export type AiBattlePhaseRulePatch = Partial<
  Pick<
    AiBattlePhaseRule,
    | 'label'
    | 'hpThresholdMax'
    | 'targetPriority'
    | 'abilityUsage'
    | 'retreatBehavior'
    | 'weaponPreference'
    | 'retreatFromMelee'
    | 'prioritizeAbilities'
  >
>

export const AI_TARGET_PRIORITY_LABELS: Record<AiTargetPriority, string> = {
  nearest: 'Nearest threat',
  weakest: 'Weakest target',
  strongest: 'Strongest target',
  leader: 'Party leader',
  random: 'Random target',
}

export const AI_ABILITY_USAGE_LABELS: Record<AiAbilityUsage, string> = {
  aggressive: 'Aggressive — spend resources early',
  balanced: 'Balanced — mix attacks and abilities',
  conservative: 'Conservative — save abilities',
  support_first: 'Support first — buff/heal allies',
}

export const AI_RETREAT_BEHAVIOR_LABELS: Record<AiRetreatBehavior, string> = {
  never: 'Never retreat',
  low_hp: 'Retreat at low HP',
  outnumbered: 'Retreat when outnumbered',
}

export const AI_WEAPON_PREFERENCE_LABELS: Record<AiWeaponPreference, string> = {
  melee: 'Prefer melee weapons',
  ranged: 'Prefer ranged weapons',
  adaptive: 'Adaptive — use best available',
}

export function createAiProfileId(): string {
  return `ai-${crypto.randomUUID().slice(0, 8)}`
}

export function createAiPhaseRuleId(): string {
  return `ai-phase-${crypto.randomUUID().slice(0, 8)}`
}

function clampPercent(value: unknown, fallback = 50): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(0, Math.min(100, Math.round(value)))
}

function normalizeTargetPriority(raw: unknown): AiTargetPriority {
  if (raw === 'weakest' || raw === 'strongest' || raw === 'leader' || raw === 'random') return raw
  return 'nearest'
}

function normalizeAbilityUsage(raw: unknown): AiAbilityUsage {
  if (raw === 'aggressive' || raw === 'conservative' || raw === 'support_first') return raw
  return 'balanced'
}

function normalizeRetreatBehavior(raw: unknown): AiRetreatBehavior {
  if (raw === 'low_hp' || raw === 'outnumbered') return raw
  return 'never'
}

function normalizeWeaponPreference(
  raw: unknown,
  legacyPreferMelee: boolean | undefined,
): AiWeaponPreference {
  if (raw === 'melee' || raw === 'ranged' || raw === 'adaptive') return raw
  if (legacyPreferMelee === false) return 'ranged'
  if (legacyPreferMelee === true) return 'melee'
  return 'adaptive'
}

function normalizeAbilityPriorityIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const ids: string[] = []
  for (const entry of raw) {
    if (typeof entry !== 'string' || !entry.trim() || seen.has(entry)) continue
    seen.add(entry)
    ids.push(entry)
  }
  return ids
}

export function reorderAbilityPriorityIds(
  ids: string[],
  fromIndex: number,
  toIndex: number,
): string[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return ids
  if (fromIndex >= ids.length || toIndex >= ids.length) return ids
  const next = [...ids]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

export function normalizeAiBattlePhaseRule(
  raw: Partial<AiBattlePhaseRule> & { id: string },
): AiBattlePhaseRule {
  return {
    id: raw.id,
    label: raw.label?.trim() || 'Phase rule',
    hpThresholdMax: clampPercent(raw.hpThresholdMax, 50),
    targetPriority: normalizeTargetPriority(raw.targetPriority),
    abilityUsage: normalizeAbilityUsage(raw.abilityUsage),
    retreatBehavior: normalizeRetreatBehavior(raw.retreatBehavior),
    weaponPreference: normalizeWeaponPreference(raw.weaponPreference, raw.preferMelee),
    retreatFromMelee: raw.retreatFromMelee === true,
    prioritizeAbilities: raw.prioritizeAbilities === true,
  }
}

export function normalizeAiProfile(raw: Partial<AiProfile> & { id: string }): AiProfile {
  return {
    id: raw.id,
    name: raw.name?.trim() || 'Untitled AI profile',
    description: raw.description ?? '',
    aggression: clampPercent(raw.aggression, 50),
    retreatThreshold: clampPercent(raw.retreatThreshold, 25),
    targetPriority: normalizeTargetPriority(raw.targetPriority),
    abilityUsage: normalizeAbilityUsage(raw.abilityUsage),
    retreatBehavior: normalizeRetreatBehavior(raw.retreatBehavior),
    weaponPreference: normalizeWeaponPreference(raw.weaponPreference, raw.preferMelee),
    retreatFromMelee: raw.retreatFromMelee === true,
    prioritizeAbilities: raw.prioritizeAbilities === true,
    abilityPriorityIds: normalizeAbilityPriorityIds(raw.abilityPriorityIds),
    phaseRules: Array.isArray(raw.phaseRules)
      ? raw.phaseRules.map((entry) =>
          normalizeAiBattlePhaseRule(
            typeof entry === 'object' && entry !== null && 'id' in entry
              ? (entry as Partial<AiBattlePhaseRule> & { id: string })
              : { id: createAiPhaseRuleId(), ...(entry as Partial<AiBattlePhaseRule>) },
          ),
        )
      : [],
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export interface ResolvedAiBehavior {
  aggression: number
  retreatThreshold: number
  targetPriority: AiTargetPriority
  abilityUsage: AiAbilityUsage
  retreatBehavior: AiRetreatBehavior
  weaponPreference: AiWeaponPreference
  retreatFromMelee: boolean
  prioritizeAbilities: boolean
  abilityPriorityIds: string[]
}

/** Pick the most restrictive phase rule that applies at the given HP percent. */
export function resolveAiBehaviorAtHp(profile: AiProfile, hpPercent: number): ResolvedAiBehavior {
  const applicable = [...profile.phaseRules]
    .filter((rule) => hpPercent <= rule.hpThresholdMax)
    .sort((left, right) => left.hpThresholdMax - right.hpThresholdMax)

  const phase = applicable[0]
  if (!phase) {
    return {
      aggression: profile.aggression,
      retreatThreshold: profile.retreatThreshold,
      targetPriority: profile.targetPriority,
      abilityUsage: profile.abilityUsage,
      retreatBehavior: profile.retreatBehavior,
      weaponPreference: profile.weaponPreference,
      retreatFromMelee: profile.retreatFromMelee,
      prioritizeAbilities: profile.prioritizeAbilities,
      abilityPriorityIds: profile.abilityPriorityIds,
    }
  }

  return {
    aggression: profile.aggression,
    retreatThreshold: profile.retreatThreshold,
    targetPriority: phase.targetPriority,
    abilityUsage: phase.abilityUsage,
    retreatBehavior: phase.retreatBehavior,
    weaponPreference: phase.weaponPreference,
    retreatFromMelee: phase.retreatFromMelee,
    prioritizeAbilities: phase.prioritizeAbilities,
    abilityPriorityIds: profile.abilityPriorityIds,
  }
}

export function summarizeAiProfile(profile: AiProfile): string {
  const parts = [
    AI_WEAPON_PREFERENCE_LABELS[profile.weaponPreference],
    AI_TARGET_PRIORITY_LABELS[profile.targetPriority],
    `aggression ${profile.aggression}`,
  ]
  if (profile.retreatFromMelee) parts.push('retreats from melee')
  if (profile.abilityPriorityIds.length > 0) {
    parts.push(`${profile.abilityPriorityIds.length} prioritized ability(ies)`)
  }
  if (profile.phaseRules.length > 0) {
    parts.push(`${profile.phaseRules.length} phase rule(s)`)
  }
  return parts.join(' · ')
}

export function createDefaultAiProfiles(): AiProfile[] {
  const timestamp = new Date().toISOString()
  return [
    normalizeAiProfile({
      id: createAiProfileId(),
      name: 'Aggressive melee',
      description: 'Closes distance, spends abilities early, never retreats.',
      aggression: 85,
      retreatThreshold: 10,
      targetPriority: 'nearest',
      abilityUsage: 'aggressive',
      retreatBehavior: 'never',
      weaponPreference: 'melee',
      retreatFromMelee: false,
      prioritizeAbilities: true,
      abilityPriorityIds: [],
      phaseRules: [],
      updatedAt: timestamp,
    }),
    normalizeAiProfile({
      id: createAiProfileId(),
      name: 'Cautious skirmisher',
      description: 'Prefers ranged attacks, keeps distance, and disengages at low HP.',
      aggression: 35,
      retreatThreshold: 35,
      targetPriority: 'weakest',
      abilityUsage: 'conservative',
      retreatBehavior: 'low_hp',
      weaponPreference: 'ranged',
      retreatFromMelee: true,
      prioritizeAbilities: false,
      abilityPriorityIds: [],
      phaseRules: [],
      updatedAt: timestamp,
    }),
  ]
}
