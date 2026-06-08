export interface Race {
  id: string
  name: string
  description: string
  /** Distinct racial traits, resistances, or story hooks */
  distinctFeatures: string[]
  /** Ability ids from the Abilities tab granted by this race */
  abilityIds: string[]
  updatedAt: string
}

export interface RaceListItem {
  id: string
  title: string
  category: string
  updatedAt: string
  subtitle?: string
  race: Race
}

export type RacePatch = Partial<
  Pick<Race, 'name' | 'description' | 'distinctFeatures' | 'abilityIds'>
>
