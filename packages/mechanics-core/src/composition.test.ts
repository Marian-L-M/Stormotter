import { describe, expect, it } from 'vitest'
import { compileCombatStats } from './compile.js'
import {
  deriveMechanicKey,
  formatMechanicComposition,
  getMechanicBlocks,
  normalizeMechanicComposition,
  resolveCompositionToBinding,
} from './composition.js'

describe('MechanicComposition', () => {
  it('derives fire resistance key from resistance blocks', () => {
    const mechanic = normalizeMechanicComposition({
      effectTypeId: 'resistance',
      damageTypeId: 'fire',
      resistanceRoleId: 'resistance',
      valueKind: 'ratio',
      stacking: 'add',
    })

    expect(deriveMechanicKey(mechanic, 'Fire resistance')).toBe('fire_resistance')
    expect(formatMechanicComposition(mechanic)).toContain('Resistance')
    expect(formatMechanicComposition(mechanic)).toContain('Fire')
    expect(getMechanicBlocks(mechanic).map((block) => block.label)).toEqual([
      'Resistance',
      'Elemental',
      'Fire',
      'Resistance',
    ])
  })

  it('compiles composed fire resistance to engine ratio', () => {
    const mechanic = normalizeMechanicComposition({
      effectTypeId: 'resistance',
      damageTypeId: 'fire',
      resistanceRoleId: 'resistance',
      valueKind: 'ratio',
      stacking: 'add',
    })

    const stats = compileCombatStats(
      [{ id: 'a1', key: deriveMechanicKey(mechanic, 'x'), mechanic }],
      { a1: 25 },
    )

    expect(stats.resistances.fire).toBeCloseTo(0.25)
  })

  it('maps immunity resistance block to custom handler', () => {
    const mechanic = normalizeMechanicComposition({
      effectTypeId: 'resistance',
      damageTypeId: 'fire',
      resistanceRoleId: 'immunity',
    })
    const binding = resolveCompositionToBinding(mechanic)
    expect(binding?.handlerId).toBe('immunity:fire')
  })

  it('migrates legacy stat type to modifier', () => {
    const mechanic = normalizeMechanicComposition({
      effectTypeId: 'stat',
      statId: 'strength',
    })
    expect(mechanic.effectTypeId).toBe('modifier')
    expect(deriveMechanicKey(mechanic, 'x')).toBe('strength_modifier')
  })

  it('supports damage dice value kind with damage stacking rules', () => {
    const mechanic = normalizeMechanicComposition({
      effectTypeId: 'damage',
      damageTypeId: 'fire',
      valueKind: 'dice',
      stacking: 'subtract',
    })

    expect(mechanic.valueKind).toBe('dice')
    expect(mechanic.stacking).toBe('subtract')
    expect(resolveCompositionToBinding(mechanic)?.valueKind).toBe('dice')
  })
})
