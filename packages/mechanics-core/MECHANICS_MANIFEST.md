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
| `condition` | Condition | Boolean |
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

| ID | Display name |
|----|--------------|
| `strength` | Strength |
| `dexterity` | Dexterity |
| `constitution` | Constitution |
| `intelligence` | Intelligence |
| `wisdom` | Wisdom |
| `charisma` | Charisma |
| `luck` | Luck |

---

## Saving throws

| ID | Display name |
|----|--------------|
| `spell` | Spell |
| `breath` | Breath weapon |
| `death` | Death magic |
| `petrification` | Petrification |
| `polymorph` | Polymorph |

---

## Conditions

Status attributes (boolean). Overlaps in naming with damage subtypes are intentional — different mechanic axes.

| ID | Display name | Status |
|----|--------------|--------|
| `stunned` | Stunned | Active |
| `poisoned` | Poisoned | Active |
| `bleeding` | Bleeding | Active |
| `feared` | Feared | Active |
| `charmed` | Charmed | Active |
| `invisible` | Invisible | Active |
| `paralyzed` | Paralyzed | Planned |
| `sleeping` | Sleeping | Planned |
| `petrified` | Petrified | Planned |
| `incapacitated` | Incapacitated | Planned |

---

## Magic effects

Used with the **Magic** attribute type (not magical damage subtypes).

| ID | Display name | Status |
|----|--------------|--------|
| `spell_power` | Spell power | Active |
| `magic_resistance` | Magic resistance | Active |
| `thorns_aura` | Thorns aura | Active |
| `regeneration` | Regeneration | Active |
| `spell_reflect` | Spell reflection | Active |
| `dispel` | Dispel magic | Active |
| `spell_slots` | Spell slots / uses | Planned |
| `cast_speed` | Casting speed | Planned |
| `summon_power` | Summoning strength | Planned |

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

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-07 | Initial manifest. Damage groups: Physical, Elemental, Magical. |
| 2026-06-07 | Physical: +ranged_piercing, ranged_crushing, ranged_slashing, finesse, bleeding. |
| 2026-06-07 | Elemental: +sonic, impact, vitality. |
| 2026-06-07 | Magical: +divine, demonic, necrotic, chaotic, heroic, void, pure. |
