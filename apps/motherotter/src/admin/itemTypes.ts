import { normalizeAllowedSlotTypes } from './slotRules'
import type { AnimationBinding } from './animationTypes'
import { normalizeAnimationBinding } from './animationTypes'
import {
  normalizeAbilityCastSlotTemplate,
  normalizeConsumableCastConfig,
  type AbilityCastSlotTemplate,
  type ConsumableCastConfig,
} from './abilityCastSlotTypes'
import { normalizeItemEntityRenderer, type EntityRendererSettings } from './entityRendererTypes'
import type { AdminListItem } from './types'

// ---------------------------------------------------------------------------
// Item section tabs (within Items mode)
// ---------------------------------------------------------------------------

export type ItemSectionTab = 'items' | 'item-categories' | 'item-classes'

export const ITEM_SECTION_TABS: { id: ItemSectionTab; label: string }[] = [
  { id: 'items', label: 'Items' },
  { id: 'item-categories', label: 'Item Categories' },
  { id: 'item-classes', label: 'Item Classes' },
]

// ---------------------------------------------------------------------------
// Fixed item categories (read-only registry)
// ---------------------------------------------------------------------------

export interface ItemCategoryDefinition {
  id: string
  name: string
  description: string
  equipSlot: string | null
  stackable: boolean
  consumable: boolean
}

export const ITEM_CATEGORIES: ItemCategoryDefinition[] = [
  {
    id: 'weapon',
    name: 'Weapons',
    description: 'Melee weapons wielded in the main or off hand.',
    equipSlot: 'main_hand',
    stackable: false,
    consumable: false,
  },
  {
    id: 'ranged_weapon',
    name: 'Ranged Weapons',
    description: 'Bows, crossbows, slings, and thrown weapons used at range.',
    equipSlot: 'main_hand',
    stackable: false,
    consumable: false,
  },
  {
    id: 'armor',
    name: 'Armors',
    description: 'Body armor including light, medium, and heavy suits.',
    equipSlot: 'body',
    stackable: false,
    consumable: false,
  },
  {
    id: 'shield',
    name: 'Shields',
    description: 'Bucklers, kite shields, and tower shields for blocking.',
    equipSlot: 'off_hand',
    stackable: false,
    consumable: false,
  },
  {
    id: 'helmet',
    name: 'Helmets',
    description: 'Head protection from caps to full helms.',
    equipSlot: 'head',
    stackable: false,
    consumable: false,
  },
  {
    id: 'gloves',
    name: 'Gloves',
    description: 'Hand and forearm protection or utility gloves.',
    equipSlot: 'hands',
    stackable: false,
    consumable: false,
  },
  {
    id: 'boots',
    name: 'Boots',
    description: 'Footwear from sandals to plate sabatons.',
    equipSlot: 'feet',
    stackable: false,
    consumable: false,
  },
  {
    id: 'belt',
    name: 'Belts',
    description: 'Waist gear that may hold pouches or grant bonuses.',
    equipSlot: 'waist',
    stackable: false,
    consumable: false,
  },
  {
    id: 'cloak',
    name: 'Cloaks',
    description: 'Capes, mantles, and cloaks worn over armor.',
    equipSlot: 'back',
    stackable: false,
    consumable: false,
  },
  {
    id: 'ring',
    name: 'Rings',
    description: 'Finger rings with magical or mundane properties.',
    equipSlot: 'ring',
    stackable: false,
    consumable: false,
  },
  {
    id: 'amulet',
    name: 'Amulets',
    description: 'Necklaces, pendants, and holy symbols.',
    equipSlot: 'neck',
    stackable: false,
    consumable: false,
  },
  {
    id: 'potion',
    name: 'Potions',
    description: 'Liquid consumables drunk for immediate effects.',
    equipSlot: null,
    stackable: true,
    consumable: true,
  },
  {
    id: 'scroll',
    name: 'Scrolls',
    description: 'Single-use spell or ritual scrolls.',
    equipSlot: null,
    stackable: true,
    consumable: true,
  },
  {
    id: 'wand',
    name: 'Wands',
    description: 'Spell focus wands with limited charges.',
    equipSlot: 'main_hand',
    stackable: false,
    consumable: false,
  },
  {
    id: 'staff',
    name: 'Staves',
    description: 'Two-handed staves used by casters and travelers.',
    equipSlot: 'main_hand',
    stackable: false,
    consumable: false,
  },
  {
    id: 'rod',
    name: 'Rods',
    description: 'Metamagic rods and scepters with special powers.',
    equipSlot: 'main_hand',
    stackable: false,
    consumable: false,
  },
  {
    id: 'ammunition',
    name: 'Ammunition',
    description: 'Arrows, bolts, bullets, and throwing ammo.',
    equipSlot: null,
    stackable: true,
    consumable: true,
  },
  {
    id: 'food',
    name: 'Food',
    description: 'Rations and meals that restore health or stamina.',
    equipSlot: null,
    stackable: true,
    consumable: true,
  },
  {
    id: 'drink',
    name: 'Drink',
    description: 'Waters, ales, and elixirs meant to be consumed.',
    equipSlot: null,
    stackable: true,
    consumable: true,
  },
  {
    id: 'tool',
    name: 'Tools',
    description: 'Thieves tools, kits, and utility implements.',
    equipSlot: null,
    stackable: false,
    consumable: false,
  },
  {
    id: 'key',
    name: 'Keys',
    description: 'Keys and keycards that unlock doors or containers.',
    equipSlot: null,
    stackable: false,
    consumable: false,
  },
  {
    id: 'quest',
    name: 'Quest Items',
    description: 'Story-critical objects that cannot be sold or discarded.',
    equipSlot: null,
    stackable: false,
    consumable: false,
  },
  {
    id: 'gem',
    name: 'Gems',
    description: 'Precious stones used for trade or enchanting.',
    equipSlot: null,
    stackable: true,
    consumable: false,
  },
  {
    id: 'material',
    name: 'Materials',
    description: 'Crafting components such as ore, leather, and cloth.',
    equipSlot: null,
    stackable: true,
    consumable: false,
  },
  {
    id: 'book',
    name: 'Books',
    description: 'Tomes, manuals, and lore volumes.',
    equipSlot: null,
    stackable: false,
    consumable: false,
  },
  {
    id: 'trinket',
    name: 'Trinkets',
    description: 'Minor magical curios with small passive effects.',
    equipSlot: null,
    stackable: false,
    consumable: false,
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    description: 'General items that do not fit other categories.',
    equipSlot: null,
    stackable: true,
    consumable: false,
  },
]

export type ItemCategoryId = (typeof ITEM_CATEGORIES)[number]['id']

export const ITEM_CATEGORY_IDS = ITEM_CATEGORIES.map((entry) => entry.id) as ItemCategoryId[]

export const ITEM_CATEGORY_LABELS: Record<ItemCategoryId, string> = Object.fromEntries(
  ITEM_CATEGORIES.map((entry) => [entry.id, entry.name]),
) as Record<ItemCategoryId, string>

export function getItemCategory(id: string | null | undefined): ItemCategoryDefinition | undefined {
  return ITEM_CATEGORIES.find((entry) => entry.id === id)
}

export function isItemCategoryId(id: string): id is ItemCategoryId {
  return ITEM_CATEGORY_IDS.includes(id as ItemCategoryId)
}

// ---------------------------------------------------------------------------
// Fixed item classes (read-only registry, scoped to category)
// ---------------------------------------------------------------------------

export interface ItemClassDefinition {
  id: string
  categoryId: ItemCategoryId
  name: string
  description: string
}

export const ITEM_CLASSES: ItemClassDefinition[] = [
  // Weapons
  { id: 'weapon_dagger', categoryId: 'weapon', name: 'Dagger', description: 'Light piercing blade for close work.' },
  { id: 'weapon_short_sword', categoryId: 'weapon', name: 'Short Sword', description: 'One-handed slashing blade.' },
  { id: 'weapon_long_sword', categoryId: 'weapon', name: 'Long Sword', description: 'Versatile one-handed sword.' },
  { id: 'weapon_greatsword', categoryId: 'weapon', name: 'Greatsword', description: 'Two-handed heavy sword.' },
  { id: 'weapon_rapier', categoryId: 'weapon', name: 'Rapier', description: 'Finesse thrusting sword.' },
  { id: 'weapon_scimitar', categoryId: 'weapon', name: 'Scimitar', description: 'Curved slashing blade.' },
  { id: 'weapon_warhammer', categoryId: 'weapon', name: 'Warhammer', description: 'Blunt crushing hammer.' },
  { id: 'weapon_mace', categoryId: 'weapon', name: 'Mace', description: 'Flanged or spiked club.' },
  { id: 'weapon_flail', categoryId: 'weapon', name: 'Flail', description: 'Chain-linked striking head.' },
  { id: 'weapon_battleaxe', categoryId: 'weapon', name: 'Battleaxe', description: 'One-handed chopping axe.' },
  { id: 'weapon_greataxe', categoryId: 'weapon', name: 'Greataxe', description: 'Two-handed axe.' },
  { id: 'weapon_spear', categoryId: 'weapon', name: 'Spear', description: 'Reach piercing polearm.' },
  { id: 'weapon_halberd', categoryId: 'weapon', name: 'Halberd', description: 'Axe-blade on a long haft.' },
  { id: 'weapon_glaive', categoryId: 'weapon', name: 'Glaive', description: 'Slashing polearm.' },
  { id: 'weapon_quarterstaff', categoryId: 'weapon', name: 'Quarterstaff', description: 'Simple two-handed staff weapon.' },
  { id: 'weapon_club', categoryId: 'weapon', name: 'Club', description: 'Improvised blunt weapon.' },
  { id: 'weapon_whip', categoryId: 'weapon', name: 'Whip', description: 'Reach finesse weapon.' },
  { id: 'weapon_trident', categoryId: 'weapon', name: 'Trident', description: 'Three-pronged piercing weapon.' },
  // Ranged
  { id: 'ranged_shortbow', categoryId: 'ranged_weapon', name: 'Shortbow', description: 'Compact bow for skirmishing.' },
  { id: 'ranged_longbow', categoryId: 'ranged_weapon', name: 'Longbow', description: 'Powerful two-handed bow.' },
  { id: 'ranged_composite_bow', categoryId: 'ranged_weapon', name: 'Composite Bow', description: 'Reinforced bow with high draw weight.' },
  { id: 'ranged_light_crossbow', categoryId: 'ranged_weapon', name: 'Light Crossbow', description: 'One-handed loading crossbow.' },
  { id: 'ranged_heavy_crossbow', categoryId: 'ranged_weapon', name: 'Heavy Crossbow', description: 'Slow but powerful crossbow.' },
  { id: 'ranged_hand_crossbow', categoryId: 'ranged_weapon', name: 'Hand Crossbow', description: 'Concealable wrist crossbow.' },
  { id: 'ranged_sling', categoryId: 'ranged_weapon', name: 'Sling', description: 'Simple thrown projectile launcher.' },
  { id: 'ranged_throwing_knife', categoryId: 'ranged_weapon', name: 'Throwing Knife', description: 'Balanced thrown blade.' },
  { id: 'ranged_javelin', categoryId: 'ranged_weapon', name: 'Javelin', description: 'Thrown spear.' },
  { id: 'ranged_blowgun', categoryId: 'ranged_weapon', name: 'Blowgun', description: 'Tube for dart projectiles.' },
  // Armor
  { id: 'armor_padded', categoryId: 'armor', name: 'Padded Armor', description: 'Quilted cloth protection.' },
  { id: 'armor_leather', categoryId: 'armor', name: 'Leather Armor', description: 'Hardened leather suit.' },
  { id: 'armor_studded_leather', categoryId: 'armor', name: 'Studded Leather', description: 'Leather reinforced with rivets.' },
  { id: 'armor_hide', categoryId: 'armor', name: 'Hide Armor', description: 'Thick animal hide armor.' },
  { id: 'armor_chain_shirt', categoryId: 'armor', name: 'Chain Shirt', description: 'Light interlinked mail.' },
  { id: 'armor_scale_mail', categoryId: 'armor', name: 'Scale Mail', description: 'Overlapping metal scales.' },
  { id: 'armor_breastplate', categoryId: 'armor', name: 'Breastplate', description: 'Torso plate harness.' },
  { id: 'armor_half_plate', categoryId: 'armor', name: 'Half Plate', description: 'Partial plate coverage.' },
  { id: 'armor_ring_mail', categoryId: 'armor', name: 'Ring Mail', description: 'Leather with sewn metal rings.' },
  { id: 'armor_chain_mail', categoryId: 'armor', name: 'Chain Mail', description: 'Full interlinked mail hauberk.' },
  { id: 'armor_splint', categoryId: 'armor', name: 'Splint Mail', description: 'Vertical metal strips on leather.' },
  { id: 'armor_plate', categoryId: 'armor', name: 'Plate Armor', description: 'Full articulated plate.' },
  // Shields
  { id: 'shield_buckler', categoryId: 'shield', name: 'Buckler', description: 'Small fist shield.' },
  { id: 'shield_round', categoryId: 'shield', name: 'Round Shield', description: 'Wood or metal round shield.' },
  { id: 'shield_kite', categoryId: 'shield', name: 'Kite Shield', description: 'Tall teardrop shield.' },
  { id: 'shield_tower', categoryId: 'shield', name: 'Tower Shield', description: 'Full-body cover shield.' },
  // Helmets
  { id: 'helmet_cap', categoryId: 'helmet', name: 'Cap', description: 'Simple cloth or leather cap.' },
  { id: 'helmet_helm', categoryId: 'helmet', name: 'Helm', description: 'Open-faced metal helm.' },
  { id: 'helmet_great_helm', categoryId: 'helmet', name: 'Great Helm', description: 'Enclosed knight helm.' },
  { id: 'helmet_circlet', categoryId: 'helmet', name: 'Circlet', description: 'Decorative headband.' },
  // Gloves
  { id: 'gloves_leather', categoryId: 'gloves', name: 'Leather Gloves', description: 'Basic hand protection.' },
  { id: 'gloves_gauntlets', categoryId: 'gloves', name: 'Gauntlets', description: 'Metal articulated gloves.' },
  { id: 'gloves_bracers', categoryId: 'gloves', name: 'Bracers', description: 'Forearm guards.' },
  // Boots
  { id: 'boots_sandals', categoryId: 'boots', name: 'Sandals', description: 'Open footwear.' },
  { id: 'boots_leather', categoryId: 'boots', name: 'Leather Boots', description: 'Standard travel boots.' },
  { id: 'boots_plate', categoryId: 'boots', name: 'Plate Boots', description: 'Armored sabatons.' },
  // Belts & cloaks
  { id: 'belt_utility', categoryId: 'belt', name: 'Utility Belt', description: 'Belt with pouches and loops.' },
  { id: 'belt_sash', categoryId: 'belt', name: 'Sash', description: 'Decorative waist wrap.' },
  { id: 'cloak_travel', categoryId: 'cloak', name: 'Travel Cloak', description: 'Weather-resistant cloak.' },
  { id: 'cloak_cape', categoryId: 'cloak', name: 'Cape', description: 'Short shoulder cape.' },
  { id: 'cloak_mantle', categoryId: 'cloak', name: 'Mantle', description: 'Formal shoulder mantle.' },
  // Rings & amulets
  { id: 'ring_band', categoryId: 'ring', name: 'Band Ring', description: 'Plain metal band.' },
  { id: 'ring_signet', categoryId: 'ring', name: 'Signet Ring', description: 'Ring bearing a house seal.' },
  { id: 'ring_gem', categoryId: 'ring', name: 'Gem Ring', description: 'Ring set with a gemstone.' },
  { id: 'amulet_pendant', categoryId: 'amulet', name: 'Pendant', description: 'Hanging charm on a chain.' },
  { id: 'amulet_holy_symbol', categoryId: 'amulet', name: 'Holy Symbol', description: 'Religious focus worn at the neck.' },
  { id: 'amulet_locket', categoryId: 'amulet', name: 'Locket', description: 'Hinged keepsake amulet.' },
  // Potions & scrolls
  { id: 'potion_healing', categoryId: 'potion', name: 'Healing Potion', description: 'Restores hit points.' },
  { id: 'potion_mana', categoryId: 'potion', name: 'Mana Potion', description: 'Restores spell resources.' },
  { id: 'potion_antidote', categoryId: 'potion', name: 'Antidote', description: 'Cures poison and toxins.' },
  { id: 'potion_buff', categoryId: 'potion', name: 'Buff Potion', description: 'Temporary attribute boost.' },
  { id: 'scroll_spell', categoryId: 'scroll', name: 'Spell Scroll', description: 'Casts a single spell.' },
  { id: 'scroll_ritual', categoryId: 'scroll', name: 'Ritual Scroll', description: 'Extended casting ritual.' },
  { id: 'scroll_map', categoryId: 'scroll', name: 'Map Scroll', description: 'Reveals an area or secret.' },
  // Wands, staves, rods
  { id: 'wand_arcane', categoryId: 'wand', name: 'Arcane Wand', description: 'Wizard spell wand.' },
  { id: 'wand_divine', categoryId: 'wand', name: 'Divine Wand', description: 'Cleric focus wand.' },
  { id: 'staff_arcane', categoryId: 'staff', name: 'Arcane Staff', description: 'Two-handed caster staff.' },
  { id: 'staff_quarter', categoryId: 'staff', name: 'Quarterstaff', description: 'Simple wooden staff.' },
  { id: 'staff_battle', categoryId: 'staff', name: 'Battle Staff', description: 'Reinforced combat staff.' },
  { id: 'rod_metamagic', categoryId: 'rod', name: 'Metamagic Rod', description: 'Enhances spell metamagic.' },
  { id: 'rod_scepter', categoryId: 'rod', name: 'Scepter', description: 'Ceremonial or ruling rod.' },
  // Ammunition
  { id: 'ammo_arrow', categoryId: 'ammunition', name: 'Arrow', description: 'Standard bow ammunition.' },
  { id: 'ammo_bolt', categoryId: 'ammunition', name: 'Crossbow Bolt', description: 'Crossbow projectile.' },
  { id: 'ammo_bullet', categoryId: 'ammunition', name: 'Bullet', description: 'Sling or firearm projectile.' },
  { id: 'ammo_silver', categoryId: 'ammunition', name: 'Silver Ammunition', description: 'Anti-lycanthrope ammo.' },
  // Food & drink
  { id: 'food_ration', categoryId: 'food', name: 'Ration', description: 'Preserved travel food.' },
  { id: 'food_feast', categoryId: 'food', name: 'Feast', description: 'Large celebratory meal.' },
  { id: 'food_herb', categoryId: 'food', name: 'Herb', description: 'Edible or medicinal plant.' },
  { id: 'drink_water', categoryId: 'drink', name: 'Water', description: 'Clean drinking water.' },
  { id: 'drink_ale', categoryId: 'drink', name: 'Ale', description: 'Common tavern ale.' },
  { id: 'drink_wine', categoryId: 'drink', name: 'Wine', description: 'Fine or common wine.' },
  { id: 'drink_elixir', categoryId: 'drink', name: 'Elixir', description: 'Magical liquid draught.' },
  // Tools, keys, quest
  { id: 'tool_thieves', categoryId: 'tool', name: "Thieves' Tools", description: 'Lockpicks and bypass kit.' },
  { id: 'tool_healer', categoryId: 'tool', name: "Healer's Kit", description: 'Bandages and salves.' },
  { id: 'tool_artisan', categoryId: 'tool', name: 'Artisan Tools', description: 'Crafting implements.' },
  { id: 'key_door', categoryId: 'key', name: 'Door Key', description: 'Opens a specific door.' },
  { id: 'key_chest', categoryId: 'key', name: 'Chest Key', description: 'Opens a specific container.' },
  { id: 'quest_macguffin', categoryId: 'quest', name: 'Quest Object', description: 'Story-critical item.' },
  { id: 'quest_letter', categoryId: 'quest', name: 'Letter', description: 'Important correspondence.' },
  // Gems, materials, books, trinkets, misc
  { id: 'gem_ruby', categoryId: 'gem', name: 'Ruby', description: 'Red precious gem.' },
  { id: 'gem_sapphire', categoryId: 'gem', name: 'Sapphire', description: 'Blue precious gem.' },
  { id: 'gem_diamond', categoryId: 'gem', name: 'Diamond', description: 'Clear precious gem.' },
  { id: 'material_ore', categoryId: 'material', name: 'Ore', description: 'Unrefined metal ore.' },
  { id: 'material_leather', categoryId: 'material', name: 'Leather Hide', description: 'Tanned animal hide.' },
  { id: 'material_cloth', categoryId: 'material', name: 'Cloth Bolt', description: 'Woven fabric for crafting.' },
  { id: 'book_tome', categoryId: 'book', name: 'Tome', description: 'Large reference book.' },
  { id: 'book_manual', categoryId: 'book', name: 'Manual', description: 'Instruction or skill manual.' },
  { id: 'trinket_charm', categoryId: 'trinket', name: 'Charm', description: 'Minor lucky charm.' },
  { id: 'trinket_figurine', categoryId: 'trinket', name: 'Figurine', description: 'Small carved idol.' },
  { id: 'misc_bag', categoryId: 'miscellaneous', name: 'Bag', description: 'General carry container.' },
  { id: 'misc_candle', categoryId: 'miscellaneous', name: 'Candle', description: 'Light source.' },
  { id: 'misc_rope', categoryId: 'miscellaneous', name: 'Rope', description: 'Hemp or silk rope.' },
]

export type ItemClassId = (typeof ITEM_CLASSES)[number]['id']

export const ITEM_CLASS_IDS = ITEM_CLASSES.map((entry) => entry.id) as ItemClassId[]

export function getItemClass(id: string | null | undefined): ItemClassDefinition | undefined {
  return ITEM_CLASSES.find((entry) => entry.id === id)
}

export function isItemClassId(id: string): id is ItemClassId {
  return ITEM_CLASS_IDS.includes(id as ItemClassId)
}

export function getItemClassesForCategory(categoryId: ItemCategoryId): ItemClassDefinition[] {
  return ITEM_CLASSES.filter((entry) => entry.categoryId === categoryId)
}

export function validateItemClassForCategory(
  classId: string | null | undefined,
  categoryId: ItemCategoryId,
): ItemClassId | null {
  if (!classId) return null
  const entry = getItemClass(classId)
  if (!entry || entry.categoryId !== categoryId) return null
  return entry.id
}

export function itemClassesByCategory(): Record<ItemCategoryId, ItemClassDefinition[]> {
  const grouped = Object.fromEntries(
    ITEM_CATEGORY_IDS.map((id) => [id, [] as ItemClassDefinition[]]),
  ) as Record<ItemCategoryId, ItemClassDefinition[]>
  for (const itemClass of ITEM_CLASSES) {
    grouped[itemClass.categoryId].push(itemClass)
  }
  return grouped
}

// ---------------------------------------------------------------------------
// Item trigger mechanics (read-only registry)
// ---------------------------------------------------------------------------

export type ItemTriggerGroupId =
  | 'combat'
  | 'wearer'
  | 'enemy'
  | 'environment'
  | 'item'
  | 'social'

export interface ItemTriggerDefinition {
  id: string
  label: string
  description: string
  group: ItemTriggerGroupId
}

export const ITEM_TRIGGER_GROUP_LABELS: Record<ItemTriggerGroupId, string> = {
  combat: 'Combat',
  wearer: 'Wearer',
  enemy: 'Enemy',
  environment: 'Environment',
  item: 'Item lifecycle',
  social: 'Social & interaction',
}

export const ITEM_TRIGGER_DEFINITIONS: ItemTriggerDefinition[] = [
  { id: 'on_attack', label: 'On attack', description: 'When the wearer makes any attack.', group: 'combat' },
  { id: 'on_hit', label: 'On hit', description: 'When an attack successfully hits.', group: 'combat' },
  { id: 'on_miss', label: 'On miss', description: 'When an attack misses.', group: 'combat' },
  { id: 'on_critical_hit', label: 'On critical hit', description: 'When the wearer scores a critical hit.', group: 'combat' },
  { id: 'on_critical_miss', label: 'On critical miss', description: 'When the wearer fumbles an attack.', group: 'combat' },
  { id: 'on_kill', label: 'On kill', description: 'When the wearer defeats an enemy.', group: 'combat' },
  { id: 'on_block', label: 'On block', description: 'When the wearer blocks an incoming attack.', group: 'combat' },
  { id: 'on_parry', label: 'On parry', description: 'When the wearer parries an attack.', group: 'combat' },
  { id: 'on_dodge', label: 'On dodge', description: 'When the wearer dodges an attack.', group: 'combat' },
  { id: 'on_spell_cast', label: 'On spell cast', description: 'When the wearer casts a spell.', group: 'combat' },
  { id: 'on_wearer_status_change', label: 'On wearer status change', description: 'When any status effect is applied or removed on the wearer.', group: 'wearer' },
  { id: 'on_wearer_damaged', label: 'On wearer damaged', description: 'When the wearer takes damage.', group: 'wearer' },
  { id: 'on_wearer_healed', label: 'On wearer healed', description: 'When the wearer is healed.', group: 'wearer' },
  { id: 'on_wearer_low_hp', label: 'On wearer low HP', description: 'When the wearer drops below a health threshold.', group: 'wearer' },
  { id: 'on_wearer_death', label: 'On wearer death', description: 'When the wearer dies.', group: 'wearer' },
  { id: 'on_wearer_level_up', label: 'On wearer level up', description: 'When the wearer gains a level.', group: 'wearer' },
  { id: 'on_wearer_rest', label: 'On wearer rest', description: 'When the wearer completes a rest.', group: 'wearer' },
  { id: 'on_enemy_visible', label: 'On enemy visible', description: 'When a hostile enters line of sight.', group: 'enemy' },
  { id: 'on_enemy_nearby', label: 'On enemy nearby', description: 'When a hostile enters close range.', group: 'enemy' },
  { id: 'on_enemy_attack', label: 'On enemy attack', description: 'When a nearby enemy attacks the wearer.', group: 'enemy' },
  { id: 'on_enemy_killed', label: 'On enemy killed', description: 'When a nearby enemy is defeated.', group: 'enemy' },
  { id: 'on_interval', label: 'On time interval', description: 'Repeats on a configured time interval.', group: 'environment' },
  { id: 'on_day_start', label: 'On day start', description: 'At the start of each in-game day.', group: 'environment' },
  { id: 'on_night_start', label: 'On night start', description: 'At the start of each in-game night.', group: 'environment' },
  { id: 'on_wearer_move', label: 'On wearer move', description: 'Each time the wearer moves.', group: 'environment' },
  { id: 'on_wearer_enter_area', label: 'On enter area', description: 'When the wearer enters a map region.', group: 'environment' },
  { id: 'on_wearer_exit_area', label: 'On exit area', description: 'When the wearer leaves a map region.', group: 'environment' },
  { id: 'on_equip', label: 'On equip', description: 'When the item is equipped.', group: 'item' },
  { id: 'on_unequip', label: 'On unequip', description: 'When the item is removed.', group: 'item' },
  { id: 'on_consume', label: 'On consume', description: 'When the item is consumed.', group: 'item' },
  { id: 'on_use_charge', label: 'On use charge', description: 'When a charge is spent.', group: 'item' },
  { id: 'on_dialogue_start', label: 'On dialogue start', description: 'When the wearer starts a conversation.', group: 'social' },
  { id: 'on_trade', label: 'On trade', description: 'When the wearer completes a trade.', group: 'social' },
]

export type ItemTriggerId = (typeof ITEM_TRIGGER_DEFINITIONS)[number]['id']

export const ITEM_TRIGGER_IDS = ITEM_TRIGGER_DEFINITIONS.map((entry) => entry.id) as ItemTriggerId[]

export function getItemTrigger(id: string | null | undefined): ItemTriggerDefinition | undefined {
  return ITEM_TRIGGER_DEFINITIONS.find((entry) => entry.id === id)
}

export function isItemTriggerId(id: string): id is ItemTriggerId {
  return ITEM_TRIGGER_IDS.includes(id as ItemTriggerId)
}

export function itemTriggersByGroup(): Record<ItemTriggerGroupId, ItemTriggerDefinition[]> {
  const grouped = Object.fromEntries(
    Object.keys(ITEM_TRIGGER_GROUP_LABELS).map((group) => [group, [] as ItemTriggerDefinition[]]),
  ) as Record<ItemTriggerGroupId, ItemTriggerDefinition[]>
  for (const trigger of ITEM_TRIGGER_DEFINITIONS) {
    grouped[trigger.group].push(trigger)
  }
  return grouped
}

// ---------------------------------------------------------------------------
// Item effects & requirements
// ---------------------------------------------------------------------------

export type ItemEffectApplicationMode = 'equipped' | 'consumption' | 'usage' | 'trigger'

export const ITEM_EFFECT_APPLICATION_LABELS: Record<ItemEffectApplicationMode, string> = {
  equipped: 'On equipped (passive while worn)',
  consumption: 'On consumption (one-time use)',
  usage: 'On usage (charges or interval)',
  trigger: 'On trigger (event-driven)',
}

export interface ItemEffect {
  id: string
  label: string
  description: string
  applicationMode: ItemEffectApplicationMode
  abilityId: string | null
  triggerId: ItemTriggerId | null
  maxCharges: number | null
  rechargeIntervalSeconds: number | null
}

export type ItemRequirementSubject =
  | 'level'
  | 'attribute'
  | 'ability'
  | 'character'
  | 'character_type'
  | 'character_class'

export type ItemRequirementOperator =
  | 'equals'
  | 'not_equals'
  | 'less_than'
  | 'greater_than'
  | 'less_or_equal'
  | 'greater_or_equal'

export const ITEM_REQUIREMENT_SUBJECT_LABELS: Record<ItemRequirementSubject, string> = {
  level: 'Character level',
  attribute: 'Attribute',
  ability: 'Ability',
  character: 'Character',
  character_type: 'Character type',
  character_class: 'Character class',
}

export const ITEM_REQUIREMENT_OPERATOR_LABELS: Record<ItemRequirementOperator, string> = {
  equals: 'Equals',
  not_equals: 'Not equals',
  less_than: 'Less than',
  greater_than: 'Greater than',
  less_or_equal: 'Less than or equal',
  greater_or_equal: 'Greater than or equal',
}

export const NUMERIC_REQUIREMENT_SUBJECTS: ItemRequirementSubject[] = ['level', 'attribute']
export const REFERENCE_REQUIREMENT_SUBJECTS: ItemRequirementSubject[] = [
  'attribute',
  'ability',
  'character',
  'character_type',
  'character_class',
]

export function isNumericRequirementSubject(subject: ItemRequirementSubject): boolean {
  return subject === 'level' || subject === 'attribute'
}

export function isReferenceRequirementSubject(subject: ItemRequirementSubject): boolean {
  return REFERENCE_REQUIREMENT_SUBJECTS.includes(subject)
}

export interface ItemRequirement {
  id: string
  subject: ItemRequirementSubject
  operator: ItemRequirementOperator
  referenceId: string | null
  numericValue: number | null
  textValue: string | null
}

// ---------------------------------------------------------------------------
// Item entity
// ---------------------------------------------------------------------------

export type ItemScope = 'unique' | 'generic'

export const ITEM_SCOPE_LABELS: Record<ItemScope, string> = {
  unique: 'Unique',
  generic: 'Generic (template)',
}

export interface Item {
  id: string
  name: string
  description: string
  tooltipText: string
  scope: ItemScope
  /** Required for unique items — the container that holds this item instance */
  containerId: string | null
  categoryId: ItemCategoryId
  classId: ItemClassId | null
  /** Overrides category/class slot placement rules when set */
  allowedSlotTypes: string[] | null
  droppable: boolean
  stealable: boolean
  iconMediaId: string | null
  detailMediaId: string | null
  pickupSoundMediaId: string | null
  actionSoundMediaId: string | null
  requirements: ItemRequirement[]
  effects: ItemEffect[]
  countsAsWeapon: boolean
  animationBindings: AnimationBinding[]
  renderer: EntityRendererSettings
  /** Reusable cast slots on equipped gear (wands, staves). */
  castSlots: AbilityCastSlotTemplate[]
  maxItemCharges: number | null
  /** Scrolls/potions — cast from inventory or quick slot; destroyed at 0 charges. */
  consumable: ConsumableCastConfig | null
  updatedAt: string
}

export type ItemPatch = Partial<
  Pick<
    Item,
    | 'name'
    | 'description'
    | 'tooltipText'
    | 'scope'
    | 'containerId'
    | 'categoryId'
    | 'classId'
    | 'allowedSlotTypes'
    | 'droppable'
    | 'stealable'
    | 'iconMediaId'
    | 'detailMediaId'
    | 'pickupSoundMediaId'
    | 'actionSoundMediaId'
    | 'requirements'
    | 'effects'
    | 'countsAsWeapon'
    | 'animationBindings'
    | 'renderer'
    | 'castSlots'
    | 'maxItemCharges'
    | 'consumable'
  >
>

export interface ItemListItem extends AdminListItem {
  item: Item
}

export function createItemId(): string {
  return `item-${crypto.randomUUID().slice(0, 8)}`
}

export function createItemEffectId(): string {
  return `item-effect-${crypto.randomUUID().slice(0, 8)}`
}

export function createItemRequirementId(): string {
  return `item-req-${crypto.randomUUID().slice(0, 8)}`
}

export function createEmptyItem(name = 'Untitled item', scope: ItemScope = 'generic'): Item {
  const timestamp = new Date().toISOString()
  return {
    id: createItemId(),
    name,
    description: '',
    tooltipText: '',
    scope,
    containerId: null,
    categoryId: 'miscellaneous',
    classId: null,
    allowedSlotTypes: null,
    droppable: true,
    stealable: true,
    iconMediaId: null,
    detailMediaId: null,
    pickupSoundMediaId: null,
    actionSoundMediaId: null,
    requirements: [],
    effects: [],
    countsAsWeapon: false,
    animationBindings: [],
    castSlots: [],
    maxItemCharges: null,
    consumable: null,
    renderer: normalizeItemEntityRenderer(undefined),
    updatedAt: timestamp,
  }
}

function normalizeItemEffect(raw: Partial<ItemEffect> & { id?: string }): ItemEffect {
  const applicationMode =
    raw.applicationMode === 'consumption' ||
    raw.applicationMode === 'usage' ||
    raw.applicationMode === 'trigger' ||
    raw.applicationMode === 'equipped'
      ? raw.applicationMode
      : 'equipped'

  let triggerId: ItemTriggerId | null = null
  if (raw.triggerId && ITEM_TRIGGER_IDS.includes(raw.triggerId as ItemTriggerId)) {
    triggerId = raw.triggerId as ItemTriggerId
  }

  return {
    id: raw.id ?? createItemEffectId(),
    label: raw.label?.trim() || 'Untitled effect',
    description: raw.description ?? '',
    applicationMode,
    abilityId: typeof raw.abilityId === 'string' && raw.abilityId.length > 0 ? raw.abilityId : null,
    triggerId: applicationMode === 'trigger' ? triggerId : null,
    maxCharges:
      applicationMode === 'usage' && typeof raw.maxCharges === 'number' && raw.maxCharges >= 0
        ? raw.maxCharges
        : null,
    rechargeIntervalSeconds:
      applicationMode === 'usage' &&
      typeof raw.rechargeIntervalSeconds === 'number' &&
      raw.rechargeIntervalSeconds >= 0
        ? raw.rechargeIntervalSeconds
        : null,
  }
}

function normalizeItemRequirement(raw: Partial<ItemRequirement> & { id?: string }): ItemRequirement {
  const subject =
    raw.subject === 'level' ||
    raw.subject === 'attribute' ||
    raw.subject === 'ability' ||
    raw.subject === 'character' ||
    raw.subject === 'character_type' ||
    raw.subject === 'character_class'
      ? raw.subject
      : 'level'

  const operator =
    raw.operator === 'equals' ||
    raw.operator === 'not_equals' ||
    raw.operator === 'less_than' ||
    raw.operator === 'greater_than' ||
    raw.operator === 'less_or_equal' ||
    raw.operator === 'greater_or_equal'
      ? raw.operator
      : 'equals'

  return {
    id: raw.id ?? createItemRequirementId(),
    subject,
    operator,
    referenceId:
      typeof raw.referenceId === 'string' && raw.referenceId.length > 0 ? raw.referenceId : null,
    numericValue: typeof raw.numericValue === 'number' && Number.isFinite(raw.numericValue) ? raw.numericValue : null,
    textValue: typeof raw.textValue === 'string' && raw.textValue.length > 0 ? raw.textValue : null,
  }
}

function normalizeMediaId(raw: string | null | undefined): string | null {
  return typeof raw === 'string' && raw.length > 0 ? raw : null
}

function defaultCountsAsWeapon(categoryId: ItemCategoryId, raw: unknown): boolean {
  if (typeof raw === 'boolean') return raw
  return categoryId === 'weapon' || categoryId === 'ranged_weapon'
}

export function normalizeItem(raw: Partial<Item> & { id: string }): Item {
  const categoryId = isItemCategoryId(raw.categoryId ?? '') ? raw.categoryId! : 'miscellaneous'
  const classId = validateItemClassForCategory(raw.classId, categoryId)
  const scope = raw.scope === 'unique' ? 'unique' : 'generic'
  const containerId =
    scope === 'unique' && typeof raw.containerId === 'string' && raw.containerId.length > 0
      ? raw.containerId
      : null

  return {
    id: raw.id,
    name: raw.name?.trim() || 'Untitled item',
    description: raw.description ?? '',
    tooltipText: raw.tooltipText ?? '',
    scope,
    containerId,
    categoryId,
    classId,
    allowedSlotTypes: normalizeAllowedSlotTypes(raw.allowedSlotTypes),
    droppable: raw.droppable !== false,
    stealable: raw.stealable !== false,
    iconMediaId: normalizeMediaId(raw.iconMediaId),
    detailMediaId: normalizeMediaId(raw.detailMediaId),
    pickupSoundMediaId: normalizeMediaId(raw.pickupSoundMediaId),
    actionSoundMediaId: normalizeMediaId(raw.actionSoundMediaId),
    requirements: (raw.requirements ?? []).map((entry) => normalizeItemRequirement(entry)),
    effects: (raw.effects ?? []).map((entry) => normalizeItemEffect(entry)),
    countsAsWeapon: defaultCountsAsWeapon(categoryId, raw.countsAsWeapon),
    animationBindings: Array.isArray(raw.animationBindings)
      ? raw.animationBindings.map((entry) => normalizeAnimationBinding(entry))
      : [],
    castSlots: Array.isArray(raw.castSlots)
      ? raw.castSlots.map((entry) => normalizeAbilityCastSlotTemplate(entry, raw.id, 'class'))
      : [],
    maxItemCharges:
      typeof raw.maxItemCharges === 'number' && raw.maxItemCharges >= 0
        ? Math.floor(raw.maxItemCharges)
        : null,
    consumable: normalizeConsumableCastConfig(raw.consumable),
    renderer: normalizeItemEntityRenderer(raw.renderer),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function summarizeItemRequirements(requirements: ItemRequirement[]): string {
  if (requirements.length === 0) return 'None'
  return `${requirements.length} requirement${requirements.length === 1 ? '' : 's'}`
}

export function summarizeItemEffects(effects: ItemEffect[]): string {
  if (effects.length === 0) return 'None'
  return `${effects.length} effect${effects.length === 1 ? '' : 's'}`
}

export function migrateStubToItem(stub: AdminListItem): Item {
  return normalizeItem({
    id: stub.id.startsWith('item-') ? stub.id : createItemId(),
    name: stub.title,
    description: stub.subtitle ?? '',
    categoryId: 'miscellaneous',
    updatedAt: stub.updatedAt,
  })
}
