# Otter Project — Prompt Template

> Paste this whole block at the start of a coding session to establish context, then add your specific task under **TASK FOR THIS SESSION** at the bottom. Keep it updated as decisions change — it is the single source of truth for the project's shape.

---

## PROJECT

Building **Otter**, a suite for authoring and playing isometric, turn-based RPGs in the spirit of Baldur's Gate 2 (isometric world, text-based dialog/feedback via a built-in terminal, D&D-style rules). Two PWAs share one file format.

- **Motherotter** — the editor. Authors content and writes `.otterfile`.
- **Gameotter** — the player. Reads an `.otterfile` and runs the game; writes save state to the browser.
- **`.otterfile`** — the portable "cartridge" containing all authored content + assets.
- *(Future, not now)* **Babyotter** — React Native otterfile player. **Otterden** — a platform to download otterfile templates. **AI connectors** — content generation / endless gameplay.

## BUILDER CONTEXT

- Solo developer, long-term hobby project. Optimize for **low maintenance burden, incremental progress, and not getting stuck in asset/tooling rabbit holes.** Prefer boring, well-documented choices over clever ones.
- Be critical. If a request is bad practice or there's a better approach, say so before writing code. Ask clarifying questions when the spec is ambiguous rather than guessing.

## CURRENT MILESTONE

**MVP: Motherotter can place things on a map and save it as a valid `.otterfile`; `otterfile-core` round-trips it (pack → unpack → Zod-validate); a minimal Gameotter loader installs the file and the `renderer-demo` top-down grid renders the placed positions, proving both the format and the state/render boundary.** Everything else (combat, dialog, AI, sync, Otterden, R3F renderer, server download) is out of scope until this works.

Suggested ordering within the MVP: (1) `otterfile-core` schema + headless round-trip, no UI; (2) `game-state` loads a parsed otterfile into a world model; (3) `renderer-api` + `renderer-demo` draw it; (4) wire into the app shells. Pressure-test the format before building UI on top of it.

## TECH STACK (decided)

- **Language:** TypeScript (strict mode).
- **Build:** Vite. **Monorepo:** pnpm workspaces (or Turborepo if task tooling is needed later).
- **UI:** React.
- **State:** Zustand (+ Immer for nested game/editor state).
- **3D rendering:** Three.js via React Three Fiber, with an **orthographic camera** for the isometric view. Drei only where it earns its place (camera controls, loaders, helpers) — do not reach for it reflexively.
- **Local persistence:** IndexedDB via Dexie.js (editor working state + game saves).
- **File format I/O:** JSZip for packing/unpacking the otterfile container.
- **Schema validation:** Zod — all otterfile parsing is validated at the boundary; treat loaded files as untrusted input.
- **PWA:** vite-plugin-pwa (service worker + offline shell).
- **No backend, no Postgres, no ORM right now.** Apps are fully client-side. Gameotter installs games via **manual otterfile upload** (server download deferred). Saves live in IndexedDB with **manual export/import** now; cloud sync + Google account are deferred but the data model stays sync-ready.

## MONOREPO LAYOUT

```
otter/
  packages/
    otterfile-core/      # Zod schemas, TS types, pack/unpack, formatVersion, migrations. Pure TS.
    game-state/          # runtime game/world state + rules logic. Pure TS. Imports NO renderer, NO Three.js, NO react-dom.
    renderer-api/        # the Renderer interface contract (mount/render/dispose + input intents)
    renderer-demo/       # HTML/SVG top-down "tic-tac-toe" grid renderer implementing renderer-api
    renderer-r3f/        # (LATER) Three.js / R3F renderer implementing the same interface
  apps/
    motherotter/         # editor PWA
    gameotter/           # player PWA
```

Both apps depend on `otterfile-core`. **The schema lives in exactly one place.** Editor-writes and player-reads must never drift.

## STATE / RENDER SEPARATION (hard architectural rule)

The whole point is that the renderer is swappable. Enforce it strictly:

- **`game-state`** owns truth: entities, positions, layers, rules. Pure TypeScript. It imports nothing from Three.js, R3F, or react-dom. Game logic must run headless (e.g. in a test, in Node).
- **`renderer-api`** defines a `Renderer` interface — roughly `mount(container)`, `render(worldView)`, `dispose()`, and an event channel emitting **input intents** back out (e.g. `{ type: 'cellClicked', x, y, layer }`). Renderers NEVER mutate game state directly; they emit intents, the app/state layer decides what happens.
- **`renderer-demo`** is the first concrete renderer: a top-down HTML/CSS/SVG grid (tic-tac-toe style) showing glyphs for characters, items, containers, entrances. It is **a permanent debugging tool**, not throwaway — keep it as the "truth view" for when the 3D view lies about positions.
- **`renderer-r3f`** is a later, separate implementation of the *same* interface (orthographic iso camera). If swapping demo ↔ r3f requires touching `game-state`, the boundary has leaked — fix the boundary, not the symptom.

## .OTTERFILE FORMAT (rules)

- A **zip container** (JSZip) with extension `.otterfile`, holding JSON manifests + an `assets/` directory (glTF/glb models, textures, audio).
- Top-level `manifest.json` MUST include `formatVersion` (semver). Write a migration path from day one; never silently break existing files.
- All content is validated with Zod on load. Reject/repair invalid files explicitly; never trust raw JSON.
- Distinguish clearly:
  - **otterfile** = the installable game cartridge: authored, read-only-at-play content + assets. A user can **install multiple games** in Gameotter, each from its own otterfile.
  - **save** = runtime game state, stored separately in IndexedDB, referencing an otterfile by id + version. A game can have **multiple saves**. Structure saves as self-contained blobs so a future sync service can upload/download them opaquely (sync-ready, not synced). Saves support **manual export/import** now; cloud sync + Google account deferred but kept in mind structurally.
- **Gameotter persistence model (IndexedDB / Dexie):** an **installed-games registry** (game id → version, metadata, unpacked assets) and a **save index** keyed by `gameId + version`. Player can manually upload an otterfile to install; server download deferred.
- Keep an explicit **asset budget / convention** per otterfile (allowed formats, max sizes) — see risks below.

## MAP / GRID MODEL (decided — do not deviate)

- Coordinate space: up to **1000×1000** in x/y. This is the **maximum bound**, not the default — most maps are far smaller; the editor canvas should default small and allow growth up to the cap.
- **Z is layers, not a dense third dimension.** A small fixed cap (≤16; ~10 expected) of named layers, each a sparse 2D plane. This covers elevation, bridges, multi-floor buildings.
- **Storage is SPARSE.** NEVER allocate a dense million-cell array, and NEVER a 1000³ volume (a billion cells — physically impossible in a browser, do not entertain it). Store only non-default cells in a `Map<string, Cell>` keyed by `"x,y,layer"`. Empty map ≈ zero cost; cost scales with what's placed. The otterfile serializes only occupied cells.
- The state layer must expose an efficient **"cells within rect"** query, so a future renderer can do viewport culling / chunking. The demo renderer only draws placed cells, so culling isn't needed yet — but the query shape must exist now.

## CONTENT DOMAINS the editor must eventually model

(Design schemas to be extensible; only build what the current milestone needs.)
Rules engine (turn-based by default, fully parameterizable, with presets + importable rule sets) · NPC/Character editor (stats, items, positions, conversation/behavior triggers) · Storyline editor · Battle AI presets · Ability editor + presets · Map editor · Objects/containers · Encounters (fixed/random) · NPC grouping (random/group/non-group).

## EXPLICIT RISKS to respect in every design decision

1. **3D asset pipeline is the #1 project-killer.** Solo + live 3D iso is heavy. Mitigations the architecture must support: **glTF/glb only**, a single fixed material + lighting convention, low-poly/stylized target (not photoreal), and a hard asset budget per otterfile. Flag any design that increases asset-authoring burden.
2. **Schema drift** between editor and player — prevented by the shared core package; reject changes that bypass it.
3. **Format versioning** — every breaking schema change needs a migration; otherwise existing otterfiles die.
4. **Premature backend** — do not introduce a server, auth, or DB unless the task explicitly is Otterden/sync. Push back if a task implies it prematurely.
5. **Untrusted file input** — otterfiles may be shared; validate and sandbox. No `eval`, no executing content from files.
6. **Dense grid memory blowup** — 1000×1000 dense = a million cells; 1000³ = a billion (impossible). Storage MUST be sparse; reject any design that allocates dense arrays over the coordinate space.
7. **Render-boundary leak** — if a renderer reads/writes `game-state` internals or `game-state` imports a renderer, the swap-out goal is dead. Renderers consume a `worldView` and emit intents; nothing more.

## CONVENTIONS

- TypeScript strict; no `any` without justification. Prefer discriminated unions for content node types.
- Pure, testable rules logic separated from React/render layers.
- Render layer (R3F) reads from Zustand state; game logic does not import Three.js.
- Small, reviewable changes. State assumptions before coding.