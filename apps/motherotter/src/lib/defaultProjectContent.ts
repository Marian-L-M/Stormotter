import { DEFAULT_CHARACTER_CATEGORY } from '../admin/characterTypes'
import type { CharacterClass } from '../admin/characterClassTypes'
import type { CharacterLineageType } from '../admin/lineageTypes'
import { createDefaultStatRanges, createEmptyCharacterStats } from '../admin/lineageTypes'
import { createDefaultHitDice, createEmptyBonusDice } from '../admin/diceTypes'
import { DEFAULT_CHARACTER_LEVEL } from '../admin/characterLevelTypes'
import { createEmptyAttributesContent } from '../admin/attributeTypes'
import { createEmptyTaxonomyState } from '../admin/taxonomyTypes'
import type { StateVariable } from '../admin/stateTypes'
import type { AdminListItem } from '../admin/types'
import type { ProjectContent, SerializedCatalogStubs, SerializedCharacter } from './projectRecord'

function createStateId(): string {
  return `state-${crypto.randomUUID().slice(0, 8)}`
}

function createLineageId(): string {
  return `lineage-${crypto.randomUUID().slice(0, 8)}`
}

function createCharacterClassId(): string {
  return `cclass-${crypto.randomUUID().slice(0, 8)}`
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

function defaultCharacterTypes(): CharacterLineageType[] {
  const timestamp = new Date().toISOString()
  return [
    {
      id: createLineageId(),
      name: 'Human',
      description: 'Versatile and widespread; balanced stat potential across all attributes.',
      statRanges: createDefaultStatRanges(),
      hitPointBonusDice: createEmptyBonusDice(),
      levelAbilities: [],
      updatedAt: timestamp,
    },
    {
      id: createLineageId(),
      name: 'Elf',
      description: 'Long-lived forest dwellers with keen senses and arcane affinity.',
      statRanges: {
        ...createDefaultStatRanges(),
        strength: { min: 3, max: 16 },
        dexterity: { min: 5, max: 20 },
        constitution: { min: 3, max: 16 },
        intelligence: { min: 5, max: 20 },
      },
      hitPointBonusDice: createEmptyBonusDice(),
      levelAbilities: [],
      updatedAt: timestamp,
    },
  ]
}

function defaultCharacterClasses(): CharacterClass[] {
  const timestamp = new Date().toISOString()
  return [
    {
      id: createCharacterClassId(),
      name: 'Warrior',
      description: 'Front-line fighters trained for melee combat and endurance.',
      hitDice: createDefaultHitDice(10),
      distinctFeatures: ['Heavy armor proficiency', 'Bonus damage with two-handed weapons'],
      levelAbilities: [],
      updatedAt: timestamp,
    },
    {
      id: createCharacterClassId(),
      name: 'Mage',
      description: 'Arcane casters who channel elemental and utility spells.',
      hitDice: createDefaultHitDice(4),
      distinctFeatures: ['Spell focus bonus', 'Reduced mana cost for cantrips'],
      levelAbilities: [],
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
      lineageTypeId: null,
      classId: null,
      level: DEFAULT_CHARACTER_LEVEL,
      levelAbilities: [],
      portraitMediaId: null,
      audioProfileId: null,
      stats: createEmptyCharacterStats(),
      hitPointSource: 'derived',
      hitPointOverride: null,
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
    characterTypes: defaultCharacterTypes(),
    characterClasses: defaultCharacterClasses(),
    mediaAssets: [],
    audioProfiles: [],
    attributes: createEmptyAttributesContent(),
    characters: defaultCharacters(),
    catalogStubs: defaultCatalogStubs(),
    taxonomy: createEmptyTaxonomyState(),
  }
}
