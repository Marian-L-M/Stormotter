import { describe, expect, it } from 'vitest'
import { normalizeMechanicComposition } from './composition.js'
import { compileCombatStats, stackValuesByRule } from './compile.js'

describe('compileCombatStats', () => {
  it('maps fire resistance percentile to engine ratio', () => {
    const mechanic = normalizeMechanicComposition({
      effectTypeId: 'resistance',
      damageTypeId: 'fire',
      resistanceRoleId: 'resistance',
      valueKind: 'ratio',
      stacking: 'add',
    })

    const stats = compileCombatStats(
      [
        {
          id: 'attr-1',
          key: 'fire_resistance',
          mechanic,
        },
      ],
      { 'attr-1': 25 },
    )

    expect(stats.resistances.fire).toBeCloseTo(0.25)
    expect(stats.narrative).toEqual({})
  })

  it('stores unbound attributes as narrative by key', () => {
    const stats = compileCombatStats(
      [{ id: 'attr-2', key: 'notes', mechanic: null }],
      { 'attr-2': 'Scarred veteran' },
    )

    expect(stats.narrative.notes).toBe('Scarred veteran')
  })
})

describe('stackValuesByRule', () => {
  it('subtracts numeric values', () => {
    expect(stackValuesByRule('subtract', 'integer', [10, 3, 2])).toBe(5)
  })

  it('uses last value when stacking is set', () => {
    expect(stackValuesByRule('set', 'integer', [10, 3, 7])).toBe(7)
  })
})
