import {
  createDefaultHitDice,
  normalizeDiceRoll,
  type DiceRoll,
} from './diceTypes'
import {
  normalizeLevelAbilityGrants,
  type LevelAbilityGrant,
} from './levelGrantTypes'

export interface CharacterClass {
  id: string
  name: string
  description: string
  /** BG2-style per-level hit die (e.g. 1d10 for warrior) */
  hitDice: DiceRoll
  /** Role traits, proficiencies, or combat style notes */
  distinctFeatures: string[]
  /** Abilities granted at specific levels */
  levelAbilities: LevelAbilityGrant[]
  updatedAt: string
}

export interface CharacterClassListItem {
  id: string
  title: string
  category: string
  updatedAt: string
  subtitle?: string
  characterClass: CharacterClass
}

export type CharacterClassPatch = Partial<
  Pick<CharacterClass, 'name' | 'description' | 'hitDice' | 'distinctFeatures' | 'levelAbilities'>
>

export function normalizeCharacterClass(
  raw: Partial<CharacterClass> & { abilityIds?: string[] },
): CharacterClass {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    description: raw.description ?? '',
    hitDice: normalizeDiceRoll(raw.hitDice ?? createDefaultHitDice(8)),
    distinctFeatures: raw.distinctFeatures ?? [],
    levelAbilities: normalizeLevelAbilityGrants(raw.levelAbilities, raw.abilityIds),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function migrateLegacyCharacterClassId(id: string): string {
  if (id.startsWith('cclass-')) return id
  if (id.startsWith('class-')) return `cclass-${id.slice(6)}`
  return id
}
