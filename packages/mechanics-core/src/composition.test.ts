import { describe, expect, it } from 'vitest'
import { compileCombatStats } from './compile.js'
import {
  deriveMechanicKey,
  formatMechanicComposition,
  getMechanicBlocks,
  isActiveAbilityMechanic,
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

  it('supports derived stat modifier ids', () => {
    const mechanic = normalizeMechanicComposition({
      effectTypeId: 'modifier',
      statId: 'derived_stat:armor_class',
    })
    expect(mechanic.statId).toBe('derived_stat:armor_class')
    expect(formatMechanicComposition(mechanic)).toContain('Armor Class')
  })

  it('migrates legacy petrification save id to stunning', () => {
    const mechanic = normalizeMechanicComposition({
      effectTypeId: 'saving_throw',
      saveTypeId: 'petrification',
    })
    expect(mechanic.saveTypeId).toBe('stunning')
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

  it('includes action and target blocks for ability mechanics', () => {
    const mechanic = normalizeMechanicComposition({
      effectTypeId: 'damage',
      damageTypeId: 'fire',
      actionTypeId: 'cause',
      targetId: 'target',
      valueKind: 'ratio',
      stacking: 'add',
    })

    expect(isActiveAbilityMechanic(mechanic)).toBe(true)
    expect(formatMechanicComposition(mechanic)).toBe('Cause · Damage · Elemental · Fire · On target')
    expect(deriveMechanicKey(mechanic, 'Fireball')).toBe('cause_fire_damage_target')
  })

  it('filters invalid action types when effect type changes', () => {
    const mechanic = normalizeMechanicComposition({
      effectTypeId: 'modifier',
      statId: 'strength',
      actionTypeId: 'cause',
      targetId: 'self',
    })

    expect(mechanic.actionTypeId).toBeNull()
    expect(isActiveAbilityMechanic(mechanic)).toBe(false)
  })
})
