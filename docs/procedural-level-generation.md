# Procedural level generation (Eat My Fire 3D)

Portable reference for **another AI or developer** reviewing how combat arenas are built. Stack: **TypeScript**, **Three.js**, **Electron + Vite**.

---

## Pipeline overview

```text
LevelDefinition (data)
       ↓
composeLevel()  →  ComposedLevel (blocked tiles, tileAssetIds, props)
       ↓
Grid (floor meshes per cell)  +  EnvironmentRenderer (props)
```

| Step | File | Role |
|------|------|------|
| Define layout + rules | [`src/renderer/src/levels/LevelDefinition.ts`](../src/renderer/src/levels/LevelDefinition.ts) | `LevelDefinition`, `ProceduralSettings`, `createStarterLevelDefinition()` |
| Compose placement | [`src/renderer/src/levels/LevelComposer.ts`](../src/renderer/src/levels/LevelComposer.ts) | `composeLevel()` — RNG placement, path repair |
| Semantic defaults | [`src/renderer/src/levels/AssetSemantics.ts`](../src/renderer/src/levels/AssetSemantics.ts) | Per-asset `kind`, default tags, traversal |
| Combat entry | [`src/renderer/src/Game.ts`](../src/renderer/src/Game.ts) | `createStarterLevelDefinition()` → `composeLevel()` |

---

## What “procedural” means here

- **Not** voxel terrain or infinite worlds. It is **tactical grid**–based: fixed **width × height**, with **deterministic-ish randomness** for dressing.
- **Hand-authored anchor**: a **static** center set (column, wall segment, doorway, banner, stairs) plus **static player/enemy spawn** coordinates.
- **Randomized**: per-cell **floor** variant (two floor GLBs mixed by noise), plus **scattered props** (rocks, barrels, traps, loot, weapons, shields) according to **rules**.

---

## `LevelDefinition` (core types)

- **`width` / `height`**: Grid size in cells (starter uses **10×10**).
- **`playerSpawns` / `enemySpawns`**: Tile coordinates for units.
- **`staticBlockedTiles`**: Optional extra blocked cells (starter does not set this; blocking comes from props).
- **`staticTileAssets`**: Map `"{x},{z}"` → **environment `assetId`** for that cell’s floor mesh.
- **`staticProps`**: Fixed `LevelPropPlacement[]` (center dungeon piece).
- **`procedural`**: Optional `ProceduralSettings` (see below).
- **`ensureReachablePath`**: If true, composer **carves** blocked tiles so at least one path exists between **some** player and **some** enemy spawn (see `ensureReachablePath` in `LevelComposer.ts`).

---

## Procedural settings (`ProceduralSettings`)

| Field | Purpose |
|-------|---------|
| **`seed`** | Unsigned int fed to **`mulberry32`** (`src/renderer/src/utils/prng.ts`) for all procedural rolls for this level. |
| **`blockedTileChance`** | Probability per empty cell to become **globally blocked** before props (starter: **0**). |
| **`propRules`** | Weighted placement of **single-asset** props (rocks, barrel, trap, …). |
| **`prefabs` / `prefabRules`** | Multi-cell **prefab chunks** (wall runs, shrines). **Implemented** in composer; the **starter definition does not currently attach** `createStarterPrefabs()` — prefab data exists in `LevelDefinition.ts` but is unused by `createStarterLevelDefinition()`. |
| **`density`** | Supported on rules; starter relies on **min/max count** and **`perMapChance`**. |

### `ProceduralPropRule` (high level)

- **`assetId`**: Which environment GLB id to place.
- **`perMapChance`**: Roll once per rule — skip entire rule if failed.
- **`minCount` / `maxCount`**: How many instances to try to place (resolved with RNG).
- **`minDistanceFromSpawns`**: Keeps clutter away from spawn tiles.
- **`randomYaw` / `rotationChoices`**: Orientation.
- **`yJitter` / `scaleJitter`**: Visual variation.
- **`nearTags` / `nearRadius` / `nearWeight`**: Prefer placement near already placed props with those **tags** (e.g. barrel near `wall`).
- **`blocksTraversal` / `tag`**: Traversal and tagging for later rules.

---

## Starter level: `createStarterLevelDefinition(levelIndex?)`

- **ID**: `starter-mini-dungeon-{levelIndex}` (default `levelIndex === 1` when called as `createStarterLevelDefinition()` from `Game.ts`).
- **Seed**: `createRuntimeSeed(levelIndex)` — **`Date.now()` XOR mixed with `levelIndex`** (not purely deterministic per run; **not** wired to roguelike map node id today).
- **Floor**: `createStarterTileAssets(width, height, seed)` — noise ~22% “detail” tiles vs base floor, with a **smoothing pass** so clusters read less noisy.
- **Static props**: Center column, wall, opening, banner, stairs (mini-dungeon asset IDs).
- **`blockedTileChance`**: **0** (no random void tiles before props).
- **`propRules`**: Rocks, barrels, traps, coins, chest, sword, spear, shield — each with tags like `clutter`, `hazard`, `loot`, `treasure`, `decor`.

---

## `composeLevel()` behavior (`LevelComposer.ts`)

1. Copy **static tile** asset map; initialize **occupied** / **blocked** sets; mark **spawn** cells occupied.
2. Apply **static blocked** tiles, then **static props** (with footprint, overlap, optional adjacency checks).
3. If **`procedural`** present:
   - Optional **random blocked** cells from `blockedTileChance`.
   - **Prefab rules** (if any) — place multi-piece prefabs with rotation and weights.
   - **Prop rules** — for each rule, build weighted candidate tiles, pick placements, apply jitter/rotation.
4. If **`ensureReachablePath`**: If no path player↔enemy through walkable tiles, **unblock** cells along **short paths** between spawn pairs until a path exists (or best effort).

### Composer flags (read the source for truth)

- **`PROP_STACKING_ENABLED`**: `false` — multi-prop stacking on one tile is off.
- **`ENABLE_ADJACENCY_RULES`**: `false` — cardinal **adjacency** asset rules in `AdjacencyRules.ts` are not enforced at runtime.

---

## Asset semantics

[`AssetSemantics.ts`](../src/renderer/src/levels/AssetSemantics.ts) registers **mini-dungeon** props with **`kind`** (`floor`, `wall`, `doorway`, …), default **tags**, and **traversal** hints. `LevelComposer` uses this via **`getAssetSemantics`** when resolving placement defaults for rules that omit explicit `blocksTraversal` / `tag`.

---

## Output: `ComposedLevel`

- **`blockedTiles`**: Cells units cannot enter.
- **`tileAssetIds`**: Per-cell floor asset id string.
- **`props`**: Final list of prop placements (static + procedural) for `EnvironmentRenderer`.

---

## Integration in `Game`

- `Game` constructs **`createStarterLevelDefinition()`** (default args) then **`composeLevel(levelDef)`**.
- **`Grid`** consumes `blockedTiles` + `tileAssetIds`.
- **`EnvironmentRenderer`** instantiates prop meshes from the library using **`props`**.

---

## Extension points (for design / review)

1. **Deterministic runs**: Pass **run seed + map node id** into `createStarterLevelDefinition` (or a new factory) instead of only `Date.now()`-based `createRuntimeSeed`.
2. **Biomes**: Second asset catalog (e.g. forest / BlockBits) + alternate `staticTileAssets` / `propRules` presets selected by faction or node type.
3. **Prefabs**: Wire `createStarterPrefabs()` (or new prefabs) into `procedural.prefabs` + `prefabRules` on a level preset.
4. **Elite/boss arenas**: Different `width`/`height`, higher `blockedTileChance`, or stricter rules — same composer.

---

## File index

| File | Responsibility |
|------|------------------|
| `LevelDefinition.ts` | Types, starter factory, tile noise, unused prefab definitions |
| `LevelComposer.ts` | `composeLevel`, placement, path repair, RNG |
| `AssetSemantics.ts` | Default semantics for mini-dungeon asset ids |
| `AdjacencyRules.ts` | Optional rules (currently disabled by flag) |
| `Game.ts` | Wires level into grid + environment |

---

*Last updated to match the codebase structure; behavior may change as features land.*
