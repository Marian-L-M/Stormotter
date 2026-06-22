/** Runtime character progression — exported for Gameotter initialization. */

export type ProgressionMode = 'fixed' | 'upgradeable'

export interface DefinitionProgression {
  mode: ProgressionMode
  maxRank: number
  rankCosts: number[]
  valueByRank: Record<number, unknown>
}

export interface ClassProgressionAbilityGrant {
  definitionId: string
  value: unknown
  triggerId: string | null
}

export interface ClassProgressionAttributeGrant {
  definitionId: string
  value: unknown
}

export interface ClassProgressionRankGrant {
  definitionId: string
  rank: number
}

export interface ClassLevelProgressionEntry {
  level: number
  xpRequired: number
  abilityPointsGranted: number
  attributePointsGranted: number
  autoAbilityGrants: ClassProgressionAbilityGrant[]
  autoAttributeGrants: ClassProgressionAttributeGrant[]
  abilityRankGrants: ClassProgressionRankGrant[]
  attributeRankGrants: ClassProgressionRankGrant[]
}

export interface CharacterClassProgression {
  classId: string
  level: number
  experience: number
}

export interface CharacterProgression {
  classes: CharacterClassProgression[]
  unspentAbilityPoints: number
  unspentAttributePoints: number
  abilityRanks: Record<string, number>
  attributeRanks: Record<string, number>
}

export interface CharacterProgressionState {
  progression: CharacterProgression
  /** Sum of per-class levels (multi-class). */
  totalLevel: number
  /** Primary class track for legacy UI. */
  primaryClassId: string | null
}
