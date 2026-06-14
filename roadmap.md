# Otter — Roadmap

> Status assessment as of 2026-06-13. Task breakdown lives in `TODO.md`; persisted data shapes (current + target) live in `database-schema.md`.

## Where the project actually stands

**The original MVP loop is done.** Motherotter places cells on a layered sparse map, exports a valid `.otterfile`; Gameotter uploads it, unpacks/Zod-validates it, and `renderer-demo` renders it. The state/render boundary holds.

What exists per package:

| Package / app | State |
|---|---|
| `otterfile-core` | Solid. Zod schemas (manifest + maps only), pack/unpack, format version gate, migration stub, round-trip tests. |
| `game-state` | Solid for maps. Sparse `WorldModel`, `loadGameFromBytes`, `mapFromWorld` export, tests. No runtime gameplay (no party, movement, turns). |
| `mechanics-core` | Attribute mechanic compiler/registry/damage types, tests, manifest doc. Not yet consumed by any runtime. |
| `renderer-api` / `renderer-demo` | Done. Interface + intents + permanent debug grid renderer. |
| `renderer-r3f` | Empty stub (2 lines). |
| Motherotter | Far beyond MVP: multi-project IndexedDB persistence with autosave, map editor, and a large admin suite — characters, character types (lineages), classes, attributes + mechanic builder, state variables, media library (blob repo + budgets), audio profiles, taxonomy, catalog stubs (stories/items/containers/abilities/rules). |
| Gameotter | A viewer, not a player. Loads an otterfile into memory and renders it. No install registry, no saves, no gameplay. |

**The strategic problem:** the editor's content model has raced far ahead of the cartridge format. Everything listed above (characters, attributes, media, …) lives only in Motherotter's IndexedDB, typed in `apps/motherotter/src/admin/*`, and is *not* in the otterfile schema. The cartridge still only carries manifest + maps.

---

## Phase 1 — Cartridge format v2: close the schema gap (highest priority)

This is the load-bearing phase; nearly everything else depends on it, and every week of delay grows the migration surface.

- [ ] Move the content-domain schemas into `otterfile-core` as Zod schemas: state variables, characters, character types/classes, attributes, audio profiles, taxonomy, catalog stubs. The editor's `admin/*Types.ts` types should become `z.infer<>` re-exports, not parallel definitions.
- [ ] Replace the hand-rolled `normalize*` / `migrateLegacy*` functions in `projectContent.ts` with Zod `parse` + one versioned migration pipeline (reuse `migrate.ts` in `otterfile-core`). Right now app code *is* the schema authority — exactly the drift `CONCEPT.md` rule #2 forbids.
- [ ] Extend `pack.ts` to write the new content manifests + media blobs into `assets/` (the folder is already created but always empty). Enforce the media budget at pack time, not just in the editor.
- [ ] Bump `formatVersion`, write the v1→v2 migration so existing files keep loading.
- [ ] Give the Motherotter `ProjectRecord` an explicit `schemaVersion` too — IndexedDB content currently relies on implicit shape-sniffing migrations (`races` → `characterTypes` etc.).

## Phase 2 — Gameotter becomes a console

- [ ] `useInstalledGamesStore` (Dexie): installed-games registry — gameId → version, metadata, unpacked document. Upload installs; launcher lists installed games with a Play button.
- [ ] Save system: save index keyed by `gameId + version`, self-contained blobs (sync-ready per concept), multiple saves per game, manual export/import to local files (File System Access API with download fallback).
- [ ] Map/layer switching from cartridge data (multi-map already in the format; `LoadedGame` already holds all maps).

## Phase 3 — Gameplay runtime (this is where it becomes a game)

All in `game-state` / `mechanics-core`, headless and tested before any UI:

- [ ] Player/party entity, spawn point in the map schema, movement via input intents (`cellClicked` → pathing/step).
- [ ] Turn loop skeleton (turn-based by default, parameterizable later).
- [ ] Wire `mechanics-core` into the runtime: derive combat stats from authored attributes/classes — first real consumer of that package.
- [ ] Dialog/terminal system (text feedback channel is core to the BG2 vision and cheap relative to 3D).
- [ ] Encounters/battle AI presets (later in this phase).

## Phase 4 — Renderers

- [ ] Decide 2D-vs-3D ordering *after* Phase 1 settles what a cartridge carries. Options: `renderer-r3f` (orthographic iso, already the decided stack) or a Pixi.js 2D renderer (likely faster to something playable, lighter asset burden — the #1 project-killer risk). Recommendation: build **one**, not both; the `renderer-api` boundary keeps the other open forever.
- [ ] Asset conventions in the cartridge first: glTF/glb only, fixed material/lighting convention, per-file budget — already mandated by `CONCEPT.md`, must be enforced by `otterfile-core` schema.
- [ ] Keep `renderer-demo` as the permanent truth view.

## Phase 5 — Otterden hub + sync (deferred, by design)

- [ ] Cartridge download platform, cloud save sync, accounts. Do not start any backend before Phases 1–3 hold; the save-blob and registry shapes from Phase 2 are the sync contract.

---

## Structural improvements (independent of phases)

1. **Unify the character entity.** Character data is split across `contentCatalogStore` (title stubs as `AdminListItem`) and `characterMetaStore` (everything else), stitched back together in `getProjectContent()`. One `charactersStore` holding full entities would delete that stitching and a class of partial-update bugs. Falls out naturally from Phase 1 if characters get a real schema.
2. **`projectContentEquals` uses `JSON.stringify`** — key-order fragile and O(everything) on each autosave check. Acceptable for now; replace with a dirty flag from store actions (you already have `markDirty`) rather than deep comparison.
3. **Store count.** Ten Zustand stores for project content, each with `replaceAll`, serialized/rehydrated by hand in `projectContent.ts`. Consider one `projectContentStore` with slices — the per-domain files can stay, but a single hydration boundary would shrink `applyProjectContent`/`getProjectContent` to near nothing.
4. **App-level tests are zero.** The riskiest app code is exactly the untested part: `projectContent.ts` migrations and `projectRepository.ts`. A round-trip test (default content → serialize → normalize → equal) plus one legacy-shape migration test would catch the worst regressions. Vitest is already in the workspace.
5. **Tooling gaps:** no linter/formatter, no CI, no README. Lowest-overhead fix: Biome (one dep, one config) + a single GitHub Actions workflow running `pnpm typecheck && pnpm test && pnpm build`. A README matters once anything is shared.
6. **PWA manifests lack icons** — both apps' `VitePWA` manifests have no `icons` array, so neither is actually installable as a PWA yet. Add 192/512 px icons and verify offline shell behavior once, then move on.
7. **`TODO.md` is misleading** — fold what's still relevant into this roadmap and delete the rest, or future sessions (human or AI) will re-derive false context from it.
8. **Vite aliases point at package `src/`** — fine and fast for dev, but it means `tsc -p tsconfig.app.json` type-checks package sources under the app's compiler settings. Keep an eye on it; if package/app tsconfig settings ever diverge, switch to built outputs or project references.

## Suggested next session

Phase 1, first slice: pick **one** domain (state variables is the smallest), move its schema into `otterfile-core`, export/import it through the cartridge with a format-version bump and migration, and prove the pattern end-to-end before migrating the other nine domains.
