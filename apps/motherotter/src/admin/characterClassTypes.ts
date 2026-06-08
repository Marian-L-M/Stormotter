export interface CharacterClass {
  id: string
  name: string
  description: string
  /** Role traits, proficiencies, or combat style notes */
  distinctFeatures: string[]
  /** Ability ids from the Abilities tab granted by this class */
  abilityIds: string[]
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
  Pick<CharacterClass, 'name' | 'description' | 'distinctFeatures' | 'abilityIds'>
>

export function migrateLegacyCharacterClassId(id: string): string {
  if (id.startsWith('cclass-')) return id
  if (id.startsWith('class-')) return `cclass-${id.slice(6)}`
  return id
}
