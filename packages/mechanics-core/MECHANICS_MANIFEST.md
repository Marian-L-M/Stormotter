# Mechanics manifest

Human-readable registry of attribute mechanic categories used by **Mother Otter** and **`@otter/mechanics-core`**.

**Source of truth in code:** `src/registry.ts`, `src/damageTypes.ts`  
**When adding or renaming entries:** update those files, this manifest, and run `pnpm --filter @otter/mechanics-core test`.

Engine keys are derived from composed blocks — never parsed from display names at runtime.

---

## Attribute types

Top-level blocks in the attribute builder. Each maps to an auto-assigned **category** in the editor.

| ID | Display name | Typical input type |
|----|--------------|-------------------|
| `damage` | Damage | Percentile |
| `resistance` | Resistance | Percentile |
| `modifier` | Modifier | Number |
| `condition` | Trait | Boolean |
| `saving_throw` | Saving Throw | Number |
| `magic` | Magic | Number |

---

## Damage type groups

Damage and Resistance attributes pick a **group** (whole category) and/or a **subtype**.

Groups are selectable on their own (e.g. all Physical) or via subtype tabs.

### Physical (`physical`)

| ID | Display name | Status |
|----|--------------|--------|
| `slashing` | Slashing | Active |
| `piercing` | Piercing | Active |
| `blunt` | Blunt | Active |
| `unarmed` | Unarmed | Active |
| `ranged_piercing` | Range-piercing | Active |
| `ranged_crushing` | Ranged crushing | Active |
| `ranged_slashing` | Ranged slashing | Active |
| `finesse` | Finesse | Active |
| `bleeding` | Bleeding | Active |
| `thrown` | Thrown | Planned |
| `missile` | Missile / ranged (generic) | Planned |

### Elemental (`elemental`)

| ID | Display name | Status |
|----|--------------|--------|
| `fire` | Fire | Active |
| `cold` | Cold | Active |
| `lightning` | Lightning | Active |
| `acid` | Acid | Active |
| `poison` | Poison | Active |
| `sonic` | Sonic | Active |
| `impact` | Impact | Active |
| `vitality` | Vitality | Active |
| `radiant` | Radiant / holy | Planned |
| `water` | Water | Planned |
| `thunder` | Thunder (distinct from sonic) | Planned |

### Magical (`magical`)

Magical **damage** subtypes — distinct from the **Magic** attribute type (spell power, auras, etc.).

| ID | Display name | Status |
|----|--------------|--------|
| `burning` | Burning | Active |
| `crushing` | Crushing | Active |
| `magical_piercing` | Piercing | Active |
| `mental` | Mental | Active |
| `draining` | Draining | Active |
| `divine` | Divine | Active |
| `demonic` | Demonic | Active |
| `necrotic` | Necrotic | Active |
| `chaotic` | Chaotic | Active |
| `heroic` | Heroic | Active |
| `void` | Void | Active |
| `pure` | Pure | Active |
| `wounding` | Wounding | Planned |
| `stunning` | Stunning (magical) | Planned |
| `antimagic` | Antimagic / dispel channel | Planned |

### Cross-cutting damage (planned)

| ID | Display name | Notes |
|----|--------------|-------|
| `universal` | Universal / raw | Bypasses typed resistances |
| `non_lethal` | Non-lethal | Knockout / pacify channel |
| `healing` | Healing | Often negative damage or separate pipeline |

---

## Resistance roles

Used with Damage / Resistance attribute types.

| ID | Display name |
|----|--------------|
| `resistance` | Resistance |
| `vulnerability` | Vulnerability |
| `immunity` | Immunity |
| `absorption` | Absorption |

---

## Stats (modifiers)

Ability scores:

| ID | Display name |
|----|--------------|
| `strength` | Strength |
| `dexterity` | Dexterity |
| `constitution` | Constitution |
| `intelligence` | Intelligence |
| `wisdom` | Wisdom |
| `perception` | Perception |
| `charisma` | Charisma |
| `luck` | Luck |

Derived stats use the prefix `derived_stat:` on the modifier axis (e.g. `derived_stat:armor_class`).

---

## Saving throws

| ID | Display name |
|----|--------------|
| `fortitude` | Fortitude |
| `reflex` | Reflex |
| `will` | Will |
| `spell` | Spell |
| `breath` | Breath weapon |
| `death` | Death magic |
| `stunning` | Stunning |
| `polymorph` | Polymorph |
| `charisma` | Charisma |
| `luck` | Luck |

Legacy `petrification` migrates to `stunning`.

---

## Traits (condition axis)

Permanent passive traits — not temporary combat states.

| ID | Display name | Notes |
|----|--------------|-------|
| `regeneration` | Regeneration | Trait only — use attribute value for HP/round rate |
| `lifesteal` | Lifesteal | |
| `damage_reflection` | Damage reflection | |
| `spell_immunity` | Spell immunity | |
| `disease_immunity` | Disease immunity | |
| `poison_immunity` | Poison immunity | |
| `undead` | Undead | |
| `incorporeal` | Incorporeal | |
| `darkvision` | Darkvision | |
| `water_breathing` | Water breathing | |
| `silent_casting` | Silent casting | |
| `silent_movement` | Silent movement | |

Samples: `apps/motherotter/src/admin/sampleAttributeTemplates.ts`

---

## Magic effects

| ID | Display name | Derived stat |
|----|--------------|--------------|
| `spell_power` | Spell power | `spell_power` |
| `divine_power` | Divine power | `divine_power` |
| `magic_resistance` | Magic resistance | `magic_resistance` |
| `magic_spell` | Magic spell | — |
| `magic_spell_slots` | Arcane spell slots | `magic_spell_slots` |
| `divine_spell_slots` | Divine spell slots | `divine_spell_slots` |
| `restore_magic_slots` | Restore arcane spell slots | — |
| `restore_divine_spell_slots` | Restore divine spell slots | — |
| `casting_time_mod` | Casting time modifier | `casting_time_mod` |
| `casting_interval` | Casting interval | `casting_interval` |
| `thorns_aura` | Thorns aura | — |
| `healing_aura` | Healing aura | — |
| `protection_aura` | Protection aura | — |
| `fear_aura` | Fear aura | — |
| `fire_aura` | Fire aura | — |
| `frost_aura` | Frost aura | — |
| `holy_aura` | Holy aura | — |
| `poison_aura` | Poison aura | — |
| `antimagic_aura` | Antimagic aura | — |
| `spell_reflect` | Spell reflection | — |
| `dispel` | Dispel magic | — |

Casting rework notes: `CASTING_SYSTEM_NOTES` in `apps/motherotter/src/admin/derivedStatTypes.ts`.

---

## Legacy ID migrations

| Legacy ID | Maps to |
|-----------|---------|
| `bludgeoning` | `blunt` |
| `magic` (damage) | `magical` (group) |
| `necortic` | `necrotic` |
| `stat` (attribute type) | `modifier` |
| `save` (attribute type) | `saving_throw` |
| `custom` (attribute type) | `magic` |
| `petrification` (save) | `stunning` |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-07 | Initial manifest. Damage groups: Physical, Elemental, Magical. |
| 2026-06-07 | Physical: +ranged_piercing, ranged_crushing, ranged_slashing, finesse, bleeding. |
| 2026-06-07 | Elemental: +sonic, impact, vitality. |
| 2026-06-07 | Magical: +divine, demonic, necrotic, chaotic, heroic, void, pure. |
| 2026-06-07 | Traits replace combat conditions; saves aligned with derived stats; modifier supports `derived_stat:*`; casting magic effects added. |
