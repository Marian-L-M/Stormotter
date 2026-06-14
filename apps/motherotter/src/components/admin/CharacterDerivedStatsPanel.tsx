import { useMemo } from 'react'
import type { CharacterClass } from '../../admin/characterClassTypes'
import type { CharacterLineageType } from '../../admin/lineageTypes'
import {
  DERIVED_STAT_DEFINITION_BY_KEY,
  DERIVED_STAT_GROUP_LABELS,
  DERIVED_STAT_LABELS,
  DERIVED_STAT_SUGGESTIONS,
  formatDerivedStatLinkedStats,
  groupDerivedStatKeys,
  SAVING_THROW_SUGGESTIONS,
  type DerivedStatKey,
} from '../../admin/derivedStatTypes'
import { LINEAGE_STAT_LABELS } from '../../admin/lineageTypes'
import { resolveDerivedStats } from '../../admin/derivedStatResolver'
import type { CharacterMeta } from '../../store/characterMetaStore'
import { useAttributesStore } from '../../store/attributesStore'
import { useContainersStore } from '../../store/containersStore'
import { useItemsStore } from '../../store/itemsStore'
import { DerivedStatBaseEditor } from './DerivedStatBaseEditor'
import { DerivedStatModifierEditor } from './DerivedStatModifierEditor'

interface CharacterDerivedStatsPanelProps {
  characterId: string
  meta: CharacterMeta
  linkedLineageType: CharacterLineageType | undefined
  linkedCharacterClass: CharacterClass | undefined
  onChange: (patch: Partial<CharacterMeta>) => void
}

function formatModifier(value: number): string {
  if (value === 0) return '—'
  return value >= 0 ? `+${value}` : String(value)
}

function formatTotal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatLinkedStatHint(key: DerivedStatKey): string | null {
  const definition = DERIVED_STAT_DEFINITION_BY_KEY[key]
  const linked = formatDerivedStatLinkedStats(definition)
  if (!linked) return null
  if (definition.statCombination === 'sum_modifiers' && definition.linkedStats.length > 1) {
    return definition.linkedStats.map((stat) => LINEAGE_STAT_LABELS[stat]).join(' + ')
  }
  const statKey = definition.linkedStats[0]
  return statKey ? LINEAGE_STAT_LABELS[statKey] : null
}

function DerivedStatBreakdownRows({ characterId, meta, linkedLineageType, linkedCharacterClass }: {
  characterId: string
  meta: CharacterMeta
  linkedLineageType: CharacterLineageType | undefined
  linkedCharacterClass: CharacterClass | undefined
}) {
  const definitions = useAttributesStore((state) => state.definitions)
  const entityValues = useAttributesStore((state) => state.entityValues)
  const levelAttributeGrants = useAttributesStore((state) => state.levelAttributeGrants)
  const containers = useContainersStore((state) => state.containers)
  const items = useItemsStore((state) => state.items)

  const resolved = useMemo(
    () =>
      resolveDerivedStats({
        characterId,
        meta,
        lineageType: linkedLineageType,
        characterClass: linkedCharacterClass,
        attributeDefinitions: definitions,
        entityValues,
        levelAttributeGrants,
        containers,
        items,
      }),
    [
      characterId,
      meta,
      linkedLineageType,
      linkedCharacterClass,
      definitions,
      entityValues,
      levelAttributeGrants,
      containers,
      items,
    ],
  )

  const groups = groupDerivedStatKeys()

  return (
    <>
      {groups.map(({ group, keys }) => (
        <tbody key={group}>
          <tr className="derived-stat-group-row">
            <th colSpan={10}>{DERIVED_STAT_GROUP_LABELS[group]}</th>
          </tr>
          {keys.map((key) => {
            const row = resolved.stats[key]
            const linkedLabel = formatLinkedStatHint(key)

            return (
              <tr key={key}>
                <td>
                  <span className="derived-stat-label">{DERIVED_STAT_LABELS[key]}</span>
                  {linkedLabel ? (
                    <span className="field-hint derived-stat-hint">via {linkedLabel}</span>
                  ) : null}
                </td>
                <td>{row.base}</td>
                <td>{formatModifier(row.statModifier)}</td>
                <td>{formatModifier(row.typeModifier)}</td>
                <td>{formatModifier(row.classModifier)}</td>
                <td>{formatModifier(row.characterModifier)}</td>
                <td>{formatModifier(row.itemModifier)}</td>
                <td>{formatModifier(row.attributeModifier)}</td>
                <td>{formatModifier(row.abilityModifier)}</td>
                <td>
                  <strong>{formatTotal(row.total)}</strong>
                </td>
              </tr>
            )
          })}
        </tbody>
      ))}
    </>
  )
}

export function CharacterDerivedStatsPanel({
  characterId,
  meta,
  linkedLineageType,
  linkedCharacterClass,
  onChange,
}: CharacterDerivedStatsPanelProps) {
  return (
    <>
      <fieldset className="admin-fieldset">
        <legend>Derived stats &amp; saving throws</legend>
        <p className="field-hint admin-attribute-hint">
          Totals combine a resolved base (character → class → type → default), automatic ability
          score contributions, explicit type/class/character bonuses, equipped item attributes,
          stacked attributes, and active ability attributes. Special saves also stack attribute
          saving-throw bonuses (e.g. Spell save attributes add to the Spell row).
        </p>

        <div className="derived-stat-table-wrap">
          <table className="admin-table derived-stat-table derived-stat-breakdown-table">
            <thead>
              <tr>
                <th>Stat</th>
                <th>Base</th>
                <th>Stat mod</th>
                <th>Type</th>
                <th>Class</th>
                <th>Char</th>
                <th>Items</th>
                <th>Attrs</th>
                <th>Abils</th>
                <th>Total</th>
              </tr>
            </thead>
            <DerivedStatBreakdownRows
              characterId={characterId}
              meta={meta}
              linkedLineageType={linkedLineageType}
              linkedCharacterClass={linkedCharacterClass}
            />
          </table>
        </div>

        <details className="derived-stat-suggestions">
          <summary>Future stat &amp; save ideas</summary>
          <p className="field-hint">Additional derived stats:</p>
          <ul className="field-hint">
            {DERIVED_STAT_SUGGESTIONS.filter(
              (entry) => !SAVING_THROW_SUGGESTIONS.includes(entry as (typeof SAVING_THROW_SUGGESTIONS)[number]),
            ).map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
          <p className="field-hint">Additional saving throws:</p>
          <ul className="field-hint">
            {SAVING_THROW_SUGGESTIONS.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
          <p className="field-hint">
            Attribute bonuses use Magic handler <code>derived_stat:&lt;key&gt;</code> or Saving Throw
            attributes for spell/breath/death/stunning/polymorph/charisma/luck saves.
          </p>
        </details>
      </fieldset>

      <DerivedStatBaseEditor
        value={meta.derivedStatBases}
        onChange={(derivedStatBases) => onChange({ derivedStatBases })}
        inheritHint="Character base overrides class, which overrides type, which overrides the system default."
      />

      <DerivedStatModifierEditor
        value={meta.derivedStatModifiers}
        onChange={(derivedStatModifiers) => onChange({ derivedStatModifiers })}
        legend="Character derived stat modifiers"
        hint="Character-only flat bonuses stacked with type, class, items, attributes, and abilities."
      />
    </>
  )
}
