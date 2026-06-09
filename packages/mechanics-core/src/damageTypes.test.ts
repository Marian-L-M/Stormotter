import { describe, expect, it } from 'vitest'
import {
  formatDamageTypeLabel,
  migrateLegacyDamageTypeId,
  validateDamageTypeId,
} from './damageTypes.js'
import { getMechanicBlocks, normalizeMechanicComposition } from './composition.js'

describe('damageTypes', () => {
  it('migrates legacy bludgeoning to blunt', () => {
    expect(migrateLegacyDamageTypeId('bludgeoning')).toBe('blunt')
    expect(validateDamageTypeId('bludgeoning')).toBe('blunt')
  })

  it('accepts group-level and subtype ids', () => {
    expect(validateDamageTypeId('physical')).toBe('physical')
    expect(validateDamageTypeId('fire')).toBe('fire')
    expect(validateDamageTypeId('magical_piercing')).toBe('magical_piercing')
  })

  it('accepts new physical, elemental, and magical subtype ids', () => {
    expect(validateDamageTypeId('finesse')).toBe('finesse')
    expect(validateDamageTypeId('sonic')).toBe('sonic')
    expect(validateDamageTypeId('divine')).toBe('divine')
    expect(validateDamageTypeId('necortic')).toBe('necrotic')
  })

  it('formats group and subtype labels', () => {
    expect(formatDamageTypeLabel('physical')).toBe('Physical')
    expect(formatDamageTypeLabel('fire')).toBe('Elemental · Fire')
    expect(formatDamageTypeLabel('magical_piercing')).toBe('Magical · Piercing')
  })

  it('shows group and subtype blocks for fire resistance', () => {
    const mechanic = normalizeMechanicComposition({
      effectTypeId: 'resistance',
      damageTypeId: 'fire',
      resistanceRoleId: 'resistance',
    })
    expect(getMechanicBlocks(mechanic).map((block) => block.label)).toEqual([
      'Resistance',
      'Elemental',
      'Fire',
      'Resistance',
    ])
  })
})
