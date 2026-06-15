import type { MechanicComposition } from '@otter/mechanics-core'

/** Example attribute templates for permanent traits, modifiers, and magic effects. */
export const SAMPLE_ATTRIBUTE_TEMPLATES: {
  name: string
  description: string
  inputType: 'boolean' | 'number'
  mechanic: MechanicComposition
}[] = [
  {
    name: 'Regeneration',
    description: 'Permanent trait — entity passively regenerates hit points each round (rate set as attribute value).',
    inputType: 'boolean',
    mechanic: {
      effectTypeId: 'condition',
      damageTypeId: null,
      resistanceRoleId: null,
      statId: null,
      saveTypeId: null,
      conditionId: 'regeneration',
      customHandlerId: null,
      actionTypeId: null,
      targetId: null,
      valueKind: 'boolean',
      stacking: 'or',
    },
  },
  {
    name: 'Armor Class bonus',
    description: 'Flat modifier to derived Armor Class from equipment or abilities.',
    inputType: 'number',
    mechanic: {
      effectTypeId: 'modifier',
      damageTypeId: null,
      resistanceRoleId: null,
      statId: 'derived_stat:armor_class',
      saveTypeId: null,
      conditionId: null,
      customHandlerId: null,
      actionTypeId: null,
      targetId: null,
      valueKind: 'integer',
      stacking: 'add',
    },
  },
  {
    name: 'Spell save bonus',
    description: 'Bonus to the Spell saving throw derived stat.',
    inputType: 'number',
    mechanic: {
      effectTypeId: 'saving_throw',
      damageTypeId: null,
      resistanceRoleId: null,
      statId: null,
      saveTypeId: 'spell',
      conditionId: null,
      customHandlerId: null,
      actionTypeId: null,
      targetId: null,
      valueKind: 'integer',
      stacking: 'add',
    },
  },
  {
    name: 'Arcane spell slots',
    description: 'Additional prepared arcane spell slots from class features or items.',
    inputType: 'number',
    mechanic: {
      effectTypeId: 'magic',
      damageTypeId: null,
      resistanceRoleId: null,
      statId: null,
      saveTypeId: null,
      conditionId: null,
      customHandlerId: 'magic_spell_slots',
      actionTypeId: null,
      targetId: null,
      valueKind: 'integer',
      stacking: 'add',
    },
  },
]
