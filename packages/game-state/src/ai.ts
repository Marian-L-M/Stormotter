/** Battle AI profile types — exported for Gameotter combat runtime. */

export type AiTargetPriority = 'nearest' | 'weakest' | 'strongest' | 'leader' | 'random'

export type AiAbilityUsage = 'aggressive' | 'balanced' | 'conservative' | 'support_first'

export type AiRetreatBehavior = 'never' | 'low_hp' | 'outnumbered'

export type AiWeaponPreference = 'melee' | 'ranged' | 'adaptive'

export interface AiBattlePhaseRule {
  id: string
  label: string
  hpThresholdMax: number
  targetPriority: AiTargetPriority
  abilityUsage: AiAbilityUsage
  retreatBehavior: AiRetreatBehavior
  weaponPreference: AiWeaponPreference
  retreatFromMelee: boolean
  prioritizeAbilities: boolean
}

export interface AiProfile {
  id: string
  name: string
  description: string
  aggression: number
  retreatThreshold: number
  targetPriority: AiTargetPriority
  abilityUsage: AiAbilityUsage
  retreatBehavior: AiRetreatBehavior
  weaponPreference: AiWeaponPreference
  retreatFromMelee: boolean
  prioritizeAbilities: boolean
  abilityPriorityIds: string[]
  phaseRules: AiBattlePhaseRule[]
}
