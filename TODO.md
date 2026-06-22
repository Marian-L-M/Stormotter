# Otter — To Do

> Working task list. Strategy and rationale live in `roadmap.md`; target data shapes live in `database-schema.md`; this file is the ordered, actionable breakdown. Updated 2026-06-13.

## ✅ Done

**Core packages**
- [x] `otterfile-core`: Zod schemas (manifest + maps), `pack`/`unpack`, format version gate, migration stub, round-trip test suite
- [x] `game-state`: sparse `WorldModel`, `cellKey`, `getCellsInRect`, `loadGameFromBytes`, `mapFromWorld` export, unit tests
- [x] `renderer-api`: `Renderer` interface, `WorldView` + `toWorldView`, input intents
- [x] `renderer-demo`: HTML/CSS grid renderer (permanent debug "truth view")
- [x] `mechanics-core`: attribute mechanic compiler, registry, damage-type groups, composition, tests + `MECHANICS_MANIFEST.md`

**Motherotter (editor)**
- [x] Multi-project persistence in IndexedDB (Dexie): create/switch/delete, autosave toggle, boot/error states
- [x] Map editor: place/erase tools, layer switching, map backdrop image, export/import `.otterfile` (into current project or as new)
- [x] Admin suite: characters (with levels, stats, HP sources, ability grants), character types (lineages), character classes, attributes + mechanic builder, state variables, audio profiles, taxonomy (categories/tags), catalog stubs (stories/items/containers/abilities/rules)
- [x] Media library: blob storage in IndexedDB, object-URL cache, per-file and per-project budgets, picker/preview/modal components

**Gameotter (player shell)**
- [x] Upload `.otterfile` → unpack → validate → render through `renderer-demo`, layer tabs, error banner

**Original MVP milestone: complete.** Editor places things on a map, exports a valid cartridge, player loads and renders it.

---

## 🎯 Milestone 1 — Cartridge format v2 (close the schema gap)

> Goal: everything the editor authors travels inside the `.otterfile`. The schema authority moves from `apps/motherotter/src/admin/*` into `otterfile-core`. Do ONE domain end-to-end first to prove the pattern, then repeat.

### 1a. Prove the pattern with state variables (smallest domain) — ✅ done 2026-06-20
- [x] Add `stateVariableSchema` (Zod) to `otterfile-core/src/schemas.ts`; export inferred type
- [x] Extend `otterfileDocumentSchema` with `content.stateVariables` (`contentSchema`, defaults to `[]`); add `content/state-variables.json` to `pack.ts`/`unpack` (missing file ⇒ empty array, Zod-validated on read, so v1 files still parse)
- [x] Bump `FORMAT_VERSION` to 0.2.0; implement v0.1→v0.2 migration in `migrate.ts`; round-trip + missing-content migration + bad-shape rejection tests
- [x] Motherotter: `admin/stateTypes.ts` re-exports the inferred type; `buildDocument()` includes state variables; both `importOtterfile*` paths apply them
- [x] Gameotter: loaded state variables shown as a debug list (`LoadedGame.stateVariables`)

> Establishes the reusable `content/` plumbing every later slice repeats. NOTE: `otterfile-core` must be rebuilt (`pnpm --filter @otter/otterfile-core build`) when its types change — `game-state` typechecks against its `dist/`, not `src/`.

### 1b. Migrate the remaining domains (repeat the 1a pattern, one PR-sized change each)
- [ ] Taxonomy (categories/tags) — second smallest, no cross-references
- [ ] Attributes + mechanic compositions (schema should reuse `mechanics-core` IDs; decide whether `mechanics-core` types move into or get imported by `otterfile-core`)
- [ ] Character classes + lineage types (reference abilityIds, attribute ids)
- [ ] Characters (references lineage/class/audio/portrait ids) — add cross-reference validation in `superRefine` like the existing `defaultMapId` check
- [ ] Audio profiles
- [ ] Catalog stubs (stories/items/containers/abilities/rules) — ship as stubs now so ids are stable later
- [ ] Replace hand-rolled `normalize*`/`migrateLegacy*` in `projectContent.ts` with Zod parse + the `otterfile-core` migration pipeline; delete the legacy `races`/`classes` shape-sniffing once migrated
- [ ] Add `schemaVersion` to Motherotter's `ProjectRecord` so IndexedDB content migrates explicitly, same pipeline

### 1c. Media assets in the cartridge
- [ ] Define asset manifest schema: id, kind (image/audio/model), mime allowlist, byte size, path under `assets/`
- [ ] `pack.ts`: write media blobs into `assets/`; enforce per-file + total budget at pack time (hard error, not editor-only warning)
- [ ] `unpack`: extract blobs, validate against manifest (size, mime), reject path traversal (`../`) in asset paths
- [ ] Motherotter export: pull blobs from `mediaBlobRepository` into the pack; import: store incoming blobs back into IndexedDB
- [ ] Gameotter: resolve `portraitMediaId` etc. to object URLs from the unpacked assets

### 1d. Cleanup that falls out of 1a–1c
- [ ] Unify character entity: merge `characterMetaStore` + `contentCatalogStore` character stubs into one `charactersStore` holding full schema entities (deletes the stitching in `projectContent.ts`)
- [ ] Replace `projectContentEquals` (JSON.stringify) with dirty-flagging from store actions
- [ ] App-level tests for the new boundary: default content → serialize → parse → equal; one legacy-shape migration test; one budget-violation pack test

---

## 🎯 Milestone 2 — Gameotter becomes a console

> Goal: install cartridges, keep saves, launch games — the "browser console" loop.

### 2a. Install registry
- [ ] `lib/db.ts` (Dexie) in Gameotter: `installedGames` table — `gameId`, `version`, `formatVersion`, title, installedAt, packed bytes (or unpacked doc + blobs; pick one, document why)
- [ ] Upload flow becomes "install": validate → store → list; re-installing same gameId+version overwrites after confirm
- [ ] Library screen: installed games with title/meta, Play and Uninstall buttons
- [ ] Play: load from Dexie → `loadGameFromBytes`/document → renderer (current viewer becomes the "game screen")

### 2b. Save system (sync-ready shape, local-only behavior)
- [ ] `saves` table keyed by `gameId + version + saveId`: opaque self-contained blob `{ savedAt, name, state }` — no foreign keys into other tables
- [ ] Save/Load UI on the game screen: named manual saves, list per game, delete
- [ ] Export save to local file / import from file (download + file-input fallback first; File System Access API as enhancement)
- [ ] Define `SaveState` schema in `game-state` (Zod, versioned like the cartridge) — starts as `{ mapId, partyPositions }` and grows with the runtime
- [ ] Decide and document save-compatibility policy when a newer cartridge version is installed (refuse / best-effort migrate)

### 2c. Multi-map + polish
- [ ] Map switcher when a cartridge has multiple maps (`LoadedGame.maps` already holds them)
- [ ] PWA icons (192/512) for BOTH apps — manifests currently have no `icons`, so neither installs as a PWA
- [ ] Verify offline: install PWA, kill network, confirm shell + installed games still load

---

## 🎯 Milestone 3 — Gameplay runtime (it becomes a game)

> All logic headless in `game-state`/`mechanics-core` with tests BEFORE any UI. Renderer only ever sees `WorldView` + intents.

- [ ] Map schema: spawn point (and later entrances/exits); editor tool to place it
- [ ] `game-state`: party/player entity with position; `GameSession` = loaded cartridge + mutable runtime state (the thing a save serializes)
- [ ] Movement: `cellClicked` intent → adjacency/path step → position update → new `WorldView` (walkability = "cell not occupied by blocking content" to start)
- [ ] Turn loop skeleton: ordered actors, current-actor marker, end-turn action — parameterizable, default turn-based
- [ ] First `mechanics-core` consumer: derive a character's combat stats from authored attributes/class/lineage at session start (pure function + test)
- [ ] Terminal/dialog channel: `game-state` emits text events, Gameotter renders a scrolling terminal panel (core to the BG2 feel, cheap to build)
- [ ] Wire saves to `GameSession` serialize/restore (replaces the stub `SaveState`)
- [ ] Later in milestone: NPC behaviors, encounters (fixed first, random later), basic battle AI preset

---

## 🎯 Milestone 4 — Renderers

> Prereq: Milestone 1 settles what a cartridge carries. Build ONE new renderer; `renderer-api` keeps the other option open.

- [ ] Decide: Pixi.js 2D (faster to playable, lighter asset burden) vs `renderer-r3f` ortho-iso 3D (the decided stack, higher asset risk). Record the decision + revisit criteria in `roadmap.md`
- [ ] Asset conventions enforced in schema before renderer work: glTF/glb only (3D) or sprite sheet convention (2D), fixed material/lighting convention, budgets
- [ ] Implement chosen renderer against `renderer-api`; swap test: demo ↔ new renderer with zero `game-state` changes (if it needs any, fix the boundary)
- [ ] Viewport culling using the existing `getCellsInRect` query
- [ ] Keep `renderer-demo` working forever (truth view); add a renderer toggle in Gameotter

---

## 🔧 Housekeeping (do alongside, small bites)

- [ ] Biome (lint + format, one config at repo root) + `pnpm lint` script
- [ ] GitHub Actions: `pnpm install && pnpm typecheck && pnpm test && pnpm build` on push
- [ ] Root `README.md`: what/why, package map, how to run both apps
- [ ] Watch the vite `src/`-alias setup: if package/app tsconfig settings diverge, switch to built outputs or project references

## 📦 Backlog (post-milestones, unchanged)

- Storyline editor, ability editor presets, importable rule sets
- Dexie save cloud sync + accounts (save blobs from 2b are the sync contract)
- Otterden (cartridge download platform)
- Babyotter (React Native player)
- AI content connectors
