import {
  MAIN_HAND_SLOT_COUNT,
  OFF_HAND_SLOT_COUNT,
  getCharacterSlotDefinition,
} from '../../admin/characterSlotTypes'
import type { Item } from '../../admin/itemTypes'
import { CharacterBodySilhouette } from './CharacterBodySilhouette'

export interface EquipmentSlotCellProps {
  slotKey: string
  containerId: string | undefined
  items: Item[]
  enabled: boolean
  active: boolean
  supportsActiveSelection: boolean
  onOpen: (containerId: string, slotKey: string) => void
  onSetActive?: (slotKey: string, index: number) => void
}

function slotSummary(items: Item[]): string {
  if (items.length === 0) return 'Empty'
  if (items.length === 1) return items[0].name
  return `${items.length} items`
}

function EquipmentSlotCell({
  slotKey,
  containerId,
  items,
  enabled,
  active,
  supportsActiveSelection,
  onOpen,
  onSetActive,
  compact = false,
}: EquipmentSlotCellProps & { compact?: boolean }) {
  const definition = getCharacterSlotDefinition(slotKey)
  const slotItems = containerId
    ? items.filter((entry) => entry.scope === 'unique' && entry.containerId === containerId)
    : []
  const indexMatch = slotKey.match(/:(\d+)$/)
  const slotIndex = indexMatch ? Number(indexMatch[1]) : 0

  return (
    <div
      className={`character-equipment-slot${compact ? ' is-compact' : ''}${enabled ? '' : ' is-disabled'}${active ? ' is-active' : ''}`}
    >
      {supportsActiveSelection ? (
        <button
          type="button"
          className={`character-equipment-active-toggle${active ? ' is-active' : ''}`}
          title={active ? 'Active slot' : 'Set as active slot'}
          aria-pressed={active}
          disabled={!enabled || !containerId}
          onClick={() => onSetActive?.(slotKey, slotIndex)}
        >
          ●
        </button>
      ) : null}
      <button
        type="button"
        className="character-equipment-slot-button"
        disabled={!enabled || !containerId}
        onClick={() => containerId && onOpen(containerId, slotKey)}
      >
        <span className="character-inventory-slot-name">{definition?.name ?? slotKey}</span>
        <span className="character-inventory-slot-items">{slotSummary(slotItems)}</span>
      </button>
    </div>
  )
}

interface CharacterEquipmentLayoutProps {
  containersBySlot: Map<string, string>
  items: Item[]
  slotEnabled: (slotKey: string) => boolean
  activeMainHandSlot: number
  activeOffHandSlot: number
  onOpenSlot: (containerId: string, slotKey: string) => void
  onSetActiveMainHand: (index: number) => void
  onSetActiveOffHand: (index: number) => void
}

export function CharacterEquipmentLayout({
  containersBySlot,
  items,
  slotEnabled,
  activeMainHandSlot,
  activeOffHandSlot,
  onOpenSlot,
  onSetActiveMainHand,
  onSetActiveOffHand,
}: CharacterEquipmentLayoutProps) {
  function renderSlot(
    slotKey: string,
    options: {
      supportsActiveSelection?: boolean
      active?: boolean
      onSetActive?: (index: number) => void
      compact?: boolean
    } = {},
  ) {
    return (
      <EquipmentSlotCell
        key={slotKey}
        slotKey={slotKey}
        containerId={containersBySlot.get(slotKey)}
        items={items}
        enabled={slotEnabled(slotKey)}
        active={options.active ?? false}
        supportsActiveSelection={options.supportsActiveSelection ?? false}
        onOpen={onOpenSlot}
        onSetActive={
          options.onSetActive ? (_slotKey, index) => options.onSetActive!(index) : undefined
        }
        compact={options.compact}
      />
    )
  }

  return (
    <div className="character-equipment-layout">
      <div className="character-equipment-doll">
        {/* Head */}
        <div className="character-equipment-doll-slot doll-head">
          {renderSlot('equip:head', { compact: true })}
        </div>

        {/* Necklace */}
        <div className="character-equipment-doll-slot doll-neck">
          {renderSlot('equip:necklace', { compact: true })}
        </div>

        {/* Cape / back */}
        <div className="character-equipment-doll-slot doll-cape">
          {renderSlot('equip:cape', { compact: true })}
        </div>

        {/* Main hand slots — character's left column */}
        <div className="character-equipment-doll-slot doll-main-hand">
          {Array.from({ length: MAIN_HAND_SLOT_COUNT }, (_, index) =>
            renderSlot(`equip:main_hand:${index}`, {
              supportsActiveSelection: true,
              active: activeMainHandSlot === index,
              onSetActive: onSetActiveMainHand,
              compact: true,
            }),
          )}
        </div>

        {/* Off hand slots — character's right column */}
        <div className="character-equipment-doll-slot doll-off-hand">
          {Array.from({ length: OFF_HAND_SLOT_COUNT }, (_, index) =>
            renderSlot(`equip:off_hand:${index}`, {
              supportsActiveSelection: true,
              active: activeOffHandSlot === index,
              onSetActive: onSetActiveOffHand,
              compact: true,
            }),
          )}
        </div>

        {/* Center figure */}
        <div className="character-equipment-doll-figure">
          <CharacterBodySilhouette />
        </div>

        {/* Torso armor — overlaid on chest */}
        <div className="character-equipment-doll-slot doll-body">
          {renderSlot('equip:body', { compact: true })}
        </div>

        {/* Gloves — left arm */}
        <div className="character-equipment-doll-slot doll-hands">
          {renderSlot('equip:hands', { compact: true })}
        </div>

        {/* Belt — waist */}
        <div className="character-equipment-doll-slot doll-belt">
          {renderSlot('equip:belt', { compact: true })}
        </div>

        {/* Feet */}
        <div className="character-equipment-doll-slot doll-feet">
          {renderSlot('equip:feet', { compact: true })}
        </div>

        {/* Rings */}
        <div className="character-equipment-doll-slot doll-ring-left">
          {renderSlot('equip:ring_1', { compact: true })}
        </div>
        <div className="character-equipment-doll-slot doll-ring-right">
          {renderSlot('equip:ring_2', { compact: true })}
        </div>
      </div>
    </div>
  )
}
