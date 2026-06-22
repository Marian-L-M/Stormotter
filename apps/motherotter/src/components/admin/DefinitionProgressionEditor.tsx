import type { AbilityValue } from '../../admin/abilityTypes'
import type { AttributeValue } from '../../admin/attributeTypes'
import type { DefinitionProgression, ProgressionMode } from '../../admin/progressionTypes'
import { AttributeValueInput } from './AttributeValueInput'

type ProgressionValue = AbilityValue | AttributeValue

interface DefinitionProgressionEditorProps {
  progression: DefinitionProgression
  inputType: 'number' | 'percentile' | 'dice' | 'boolean' | 'text'
  onChange: (progression: DefinitionProgression) => void
}

export function DefinitionProgressionEditor({
  progression,
  inputType,
  onChange,
}: DefinitionProgressionEditorProps) {
  function setMode(mode: ProgressionMode) {
    const maxRank = mode === 'upgradeable' ? Math.max(progression.maxRank, 2) : 1
    onChange({
      ...progression,
      mode,
      maxRank,
      rankCosts:
        progression.rankCosts.length >= maxRank
          ? progression.rankCosts.slice(0, maxRank)
          : [
              ...progression.rankCosts,
              ...Array.from({ length: maxRank - progression.rankCosts.length }, () => 1),
            ],
    })
  }

  function setMaxRank(raw: string) {
    const next = Math.max(1, Math.min(99, Math.round(Number(raw) || 1)))
    const rankCosts = Array.from({ length: next }, (_, index) => progression.rankCosts[index] ?? 1)
    onChange({ ...progression, maxRank: next, rankCosts })
  }

  function setRankCost(rank: number, raw: string) {
    const cost = Math.max(0, Math.round(Number(raw) || 0))
    const rankCosts = [...progression.rankCosts]
    rankCosts[rank - 1] = cost
    onChange({ ...progression, rankCosts })
  }

  function setRankValue(rank: number, value: ProgressionValue) {
    onChange({
      ...progression,
      valueByRank: { ...progression.valueByRank, [rank]: value },
    })
  }

  return (
    <fieldset className="admin-fieldset">
      <legend>Progression</legend>
      <p className="field-hint admin-attribute-hint">
        Fixed definitions grant one value via level assignments. Upgradeable definitions use explicit
        ranks — each rank replaces the previous value (no stacking).
      </p>

      <label className="field">
        <span>Mode</span>
        <select
          value={progression.mode}
          onChange={(event) => setMode(event.target.value as ProgressionMode)}
        >
          <option value="fixed">Fixed (single rank)</option>
          <option value="upgradeable">Upgradeable (multi-rank)</option>
        </select>
      </label>

      {progression.mode === 'upgradeable' ? (
        <>
          <label className="field">
            <span>Max rank</span>
            <input
              type="number"
              min={2}
              max={99}
              value={progression.maxRank}
              onChange={(event) => setMaxRank(event.target.value)}
            />
          </label>

          <div className="admin-progression-rank-grid">
            {Array.from({ length: progression.maxRank }, (_, index) => {
              const rank = index + 1
              return (
                <div key={rank} className="admin-progression-rank-row">
                  <span className="admin-progression-rank-label">Rank {rank}</span>
                  <label className="admin-progression-rank-cost">
                    <span>Point cost</span>
                    <input
                      type="number"
                      min={0}
                      value={progression.rankCosts[index] ?? 1}
                      onChange={(event) => setRankCost(rank, event.target.value)}
                    />
                  </label>
                  <AttributeValueInput
                    inputType={inputType}
                    value={(progression.valueByRank[rank] ?? null) as AttributeValue}
                    onChange={(value) => setRankValue(rank, value as ProgressionValue)}
                  />
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="admin-progression-rank-row">
          <span className="admin-progression-rank-label">Value at rank 1</span>
          <AttributeValueInput
            inputType={inputType}
            value={(progression.valueByRank[1] ?? null) as AttributeValue}
            onChange={(value) => setRankValue(1, value as ProgressionValue)}
          />
        </div>
      )}
    </fieldset>
  )
}
