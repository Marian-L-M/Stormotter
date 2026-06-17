export type CharacterCategory =
  | 'user-generated'
  | 'unique-npc-playable'
  | 'unique-npc-unplayable'
  | 'random'

export const CHARACTER_CATEGORY_LABELS: Record<CharacterCategory, string> = {
  'user-generated': 'User generated character',
  'unique-npc-playable': 'Unique NPC - Playable',
  'unique-npc-unplayable': 'Unique NPC - Unplayable',
  random: 'Random Characters',
}

export const CHARACTER_CATEGORY_ORDER: CharacterCategory[] = [
  'user-generated',
  'unique-npc-playable',
  'unique-npc-unplayable',
  'random',
]

export const DEFAULT_CHARACTER_CATEGORY: CharacterCategory = 'user-generated'

const LEGACY_CATEGORY_LABELS: Record<string, CharacterCategory> = {
  'User generated Character': 'user-generated',
  'User generated character': 'user-generated',
  'Unique NPC Playable': 'unique-npc-playable',
  'Unique NPC - Playable': 'unique-npc-playable',
  'Unique NPC Unplayable': 'unique-npc-unplayable',
  'Unique NPC - Unplayable': 'unique-npc-unplayable',
  'Random Character': 'random',
  'Random Characters': 'random',
}

export function isCharacterCategory(value: string): value is CharacterCategory {
  return value in CHARACTER_CATEGORY_LABELS
}

export function normalizeCharacterCategory(value: string): CharacterCategory {
  if (isCharacterCategory(value)) return value
  return LEGACY_CATEGORY_LABELS[value] ?? DEFAULT_CHARACTER_CATEGORY
}

export function getCharacterCategoryLabel(category: CharacterCategory): string {
  return CHARACTER_CATEGORY_LABELS[category]
}

export function characterHasMainFlag(category: CharacterCategory): boolean {
  return category === 'user-generated'
}

export function characterHasGroupFlags(category: CharacterCategory): boolean {
  return category === 'unique-npc-playable'
}

export function characterSupportsMapLocations(category: CharacterCategory): boolean {
  return (
    category === 'user-generated' ||
    category === 'unique-npc-playable' ||
    category === 'unique-npc-unplayable'
  )
}

export function isUniqueNpcCharacter(category: CharacterCategory): boolean {
  return category === 'unique-npc-playable' || category === 'unique-npc-unplayable'
}
