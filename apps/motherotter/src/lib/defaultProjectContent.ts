import { DEFAULT_CHARACTER_CATEGORY } from '../admin/characterTypes'
import { createEmptyTaxonomyState } from '../admin/taxonomyTypes'
import type { Race } from '../admin/raceTypes'
import type { StateVariable } from '../admin/stateTypes'
import type { AdminListItem } from '../admin/types'
import type { ProjectContent, SerializedCatalogStubs, SerializedCharacter } from './projectRecord'

function createStateId(): string {
  return `state-${crypto.randomUUID().slice(0, 8)}`
}

function createRaceId(): string {
  return `race-${crypto.randomUUID().slice(0, 8)}`
}

function createCharacterId(): string {
  return `characters-${crypto.randomUUID().slice(0, 8)}`
}

function createStubId(type: string): string {
  return `${type}-${crypto.randomUUID().slice(0, 8)}`
}

function defaultStateVariables(): StateVariable[] {
  const timestamp = new Date().toISOString()
  return [
    {
      id: createStateId(),
      key: 'quest_stage',
      title: 'Quest stage',
      scope: 'global',
      varType: 'number',
      defaultValue: 0,
      description: 'Main storyline progression index.',
      characterId: null,
      updatedAt: timestamp,
    },
    {
      id: createStateId(),
      key: 'met_innkeeper',
      title: 'Met innkeeper',
      scope: 'global',
      varType: 'boolean',
      defaultValue: false,
      description: 'Whether the player has spoken to the innkeeper.',
      characterId: null,
      updatedAt: timestamp,
    },
    {
      id: createStateId(),
      key: 'trust_level',
      title: 'Trust level',
      scope: 'character',
      varType: 'number',
      defaultValue: 0,
      description: 'How much this character trusts the player.',
      characterId: null,
      updatedAt: timestamp,
    },
  ]
}

function defaultRaces(): Race[] {
  const timestamp = new Date().toISOString()
  return [
    {
      id: createRaceId(),
      name: 'Human',
      description: 'Versatile and widespread; no strong innate gifts or penalties.',
      distinctFeatures: ['Adaptable to any climate', 'No racial ability modifiers'],
      abilityIds: [],
      updatedAt: timestamp,
    },
    {
      id: createRaceId(),
      name: 'Elf',
      description: 'Long-lived forest dwellers with keen senses and arcane affinity.',
      distinctFeatures: ['Keen hearing and low-light vision', 'Natural affinity for magic'],
      abilityIds: [],
      updatedAt: timestamp,
    },
  ]
}

function defaultCharacters(): SerializedCharacter[] {
  const timestamp = new Date().toISOString()
  return [
    {
      id: createCharacterId(),
      title: 'New Character 1',
      characterType: DEFAULT_CHARACTER_CATEGORY,
      updatedAt: timestamp,
      raceId: null,
      summary: '',
    },
  ]
}

function createDefaultStub(type: string, title: string): AdminListItem {
  return {
    id: createStubId(type),
    title,
    category: 'Uncategorized',
    updatedAt: new Date().toISOString(),
  }
}

function defaultCatalogStubs(): SerializedCatalogStubs {
  return {
    stories: [createDefaultStub('stories', 'New Storie 1')],
    items: [createDefaultStub('items', 'New Item 1')],
    containers: [createDefaultStub('containers', 'New Container 1')],
    abilities: [createDefaultStub('abilities', 'New Abilitie 1')],
    rules: [createDefaultStub('rules', 'New Rule 1')],
  }
}

export function createDefaultProjectContent(): ProjectContent {
  return {
    stateVariables: defaultStateVariables(),
    races: defaultRaces(),
    characters: defaultCharacters(),
    catalogStubs: defaultCatalogStubs(),
    taxonomy: createEmptyTaxonomyState(),
  }
}
