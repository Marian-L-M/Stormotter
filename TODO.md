# Otter — To Do

## MVP milestone
> Motherotter places things on a map and saves it as a valid `.otterfile` → Gameotter uploads it, loads it, and `renderer-demo` renders the placed positions.

---

### Done
- [x] `otterfile-core`: Zod schemas, `pack` / `unpack`, format version, migration stub, full round-trip test suite
- [x] `game-state`: `WorldModel`, sparse cell storage, `getCellsInRect`, unit tests
- [x] `renderer-api`: `Renderer` interface, `WorldView`, `InputIntent`
- [x] `renderer-demo`: HTML/CSS grid renderer — mounts, renders, emits intents
- [x] Gameotter shell: renderer pipeline proven end-to-end (hardcoded world → demo renderer)

---

### Next: `game-state` — bridge to otterfile (small)
- [ ] `loadFromOtterfile(doc: OtterfileDocument, mapId?: string): WorldModel`
  - Converts a parsed `OtterfileDocument` into a `WorldModel` (map dimensions, layers, sparse cell map)
  - Falls back to `defaultMapId` when `mapId` is omitted
  - Add a unit test

---

### Next: Motherotter editor (main remaining work)
The whole editor needs to be built. Suggested order:

**1. Editor state (Zustand store)**
- [ ] `useEditorStore` — holds current map (dimensions, layers, cells as `Map<string, Cell>`), active layer, active content brush
- [ ] Actions: `placeCell`, `removeCell`, `setActiveLayer`, `setActiveBrush`, `setMapSize`
- [ ] Derive `WorldView` from store state to feed the renderer

**2. Map canvas**
- [ ] Mount `renderer-demo` in a React `useEffect`, feed it the derived `WorldView` on store changes
- [ ] Wire cell-click intents back → `placeCell` / `removeCell` depending on mode (place vs. erase toggle)

**3. Toolbar / controls**
- [ ] Layer selector (switch active layer)
- [ ] Content brush picker (a small hardcoded set: `character:hero`, `item:sword`, `container:chest`, `entrance:door`)
- [ ] Place / erase mode toggle
- [ ] Map size controls (width × height, capped at 1000)

**4. Export**
- [ ] "Save as .otterfile" button: reads store state → builds `OtterfileDocument` → `packOtterfile` → triggers browser download

---

### Next: Gameotter — real otterfile loading
Currently renders hardcoded data. Replace with the full install + load flow:

- [ ] `useInstalledGamesStore` (Dexie): installed-games registry (gameId → version, metadata, unpacked `OtterfileDocument`)
- [ ] File upload input: reads `.otterfile` bytes → `unpackOtterfile` → validates → stores in Dexie
- [ ] Game launcher: `loadFromOtterfile(doc)` → `WorldModel` → derive `WorldView` → pass to `renderer-demo`
- [ ] (Optional for MVP) Display installed games list and a "Play" button per game

---

## Backlog (post-MVP)
- [ ] **Otterfile schema update** — extend `.otterfile` format to export/import state variables, characters (with types), races, catalog stubs, and taxonomy (categories/tags). Deferred; data currently persists in Motherotter IndexedDB only.
- `renderer-r3f` — Three.js / R3F orthographic isometric renderer
- Dexie save index (multiple saves per installed game, manual export/import)
- Rules engine (turn-based, D&D-style)
- NPC / character editor
- Dialog / terminal system
- Encounter + battle AI
- Babyotter (React Native)
- Otterden (download platform)
- Cloud save sync
- AI content connectors
