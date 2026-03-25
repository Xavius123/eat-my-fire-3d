# Eat My Fire 3D — codebase audit results

This document records the balanced audit (architecture, security, performance, gameplay, hygiene) and concrete changes applied in-repo.

## 1. Architecture

| Topic | Finding |
|-------|---------|
| **SceneManager** | Fades between scenes; `ready()` clears overlay with a 5s fallback if `ready()` never fires. Scenes should call `ready()` when assets are usable. |
| **Game.ts** | Large orchestrator (combat, spawning, environment, run hooks). Further growth should move toward an encounter/session helper. |
| **RunState vs Game** | `RunState` ([`RunState.ts`](../src/renderer/src/run/RunState.ts)) holds persistent run data (`runSeed`, economy, loadout, `ringIndex`, depth bonuses). `Game` consumes it for scaling and applies one-shot bonuses (e.g. `nextCombatEnemyDepthBonus`). |
| **Shuffle / RNG** | Encounter enemy visual order uses [`shuffleArray`](../src/renderer/src/utils/shuffle.ts) (unseeded `Math.random`). Seeded combat/map logic should keep using [`mulberry32`](../src/renderer/src/utils/prng.ts) / `shuffleInPlace` in [`EnemyData.ts`](../src/renderer/src/entities/EnemyData.ts) where a PRNG is passed. |
| **@2d sibling repo** | Vite alias `@2d` → `../eat-my-fire/...` ([`electron.vite.config.ts`](../electron.vite.config.ts)). [`GuideSprites.ts`](../src/renderer/src/guide/GuideSprites.ts) imports many `@2d` PNGs — **production builds require that sibling path** (or CI must stub/copy those assets). |

## 2. Security

| Topic | Finding / mitigation |
|-------|------------------------|
| **Sandbox** | `sandbox: false` is required for `steamworks.js` overlay hooks; **`contextIsolation: true`** and **`nodeIntegration: false`** are set explicitly in [`main/index.ts`](../src/main/index.ts). |
| **IPC** | `display:setResolution`, `display:setFullscreen`, `steam:createLobby`, `steam:joinLobby`, `steam:sendP2P` validate types and ranges (window size caps, lobby player count, numeric Steam IDs, P2P payload size). |
| **P2P messages** | [`validateNetworkMessage.ts`](../src/renderer/src/network/validateNetworkMessage.ts) rejects malformed JSON shapes before handlers run on both [`NetworkHost`](../src/renderer/src/network/NetworkHost.ts) and [`NetworkGuest`](../src/renderer/src/network/NetworkGuest.ts). |
| **Authority** | Design intent: **host** runs combat; guest sends `actionRequest` and applies **confirmed** results. [`ActionQueue`](../src/renderer/src/combat/ActionQueue.ts) documents that only the host should call `processAction` for remote actions after validation. Full co-op wiring (guest sends request → host validates + simulates → broadcast confirm) is still integration work when combat subscribes to the bridge. |

## 3. Performance

| Topic | Finding |
|-------|---------|
| **Pixel ratio** | [`Engine`](../src/renderer/src/engine/Engine.ts) caps `devicePixelRatio` at **2** to reduce fill cost on high-DPI displays. |
| **PropOcclusionFade** | Per alive unit, raycasts along camera→unit against env occlusion layer ([`PropOcclusionFade.ts`](../src/renderer/src/environment/PropOcclusionFade.ts)). Cost scales with unit count × raycasts; profile if many allies + dense props. |
| **AssetLibrary** | Preloads all registered GLBs at startup ([`AssetLibrary.ts`](../src/renderer/src/assets/AssetLibrary.ts)). KayKit paths live under `assets/test/` but are **explicitly imported** — they ship in the bundle; this is intentional for current hero/enemy rigs, not accidental loose files. |
| **Profiling** | Use Electron Performance + Memory after title → combat for real numbers on target hardware. |

## 4. Gameplay and data integrity

### Damage pipeline order

Modifiers run in the order defined by `DAMAGE_CHAIN` in [`DamageResolver.ts`](../src/renderer/src/combat/DamageResolver.ts):

1. Base damage (ATK − DEF, min 1)  
2. Stationary bonus, Duelist armor pen, Dead Eye, First Blood  
3. Mod damage (weapons)  
4. Fan the Flames, Shatter, Hunter’s Eye  
5. Mod defense (armor), Armor of Kelly  
6. **Reactive shield** (zeros damage last)

### Scaling / depth

- `Game` computes `effectiveCombatDepth` from `ringIndex`, column `depth`, and `nextCombatEnemyDepthBonus` ([`Game.ts`](../src/renderer/src/Game.ts)).
- Enemies use [`scaleEnemyForDepth`](../src/renderer/src/entities/EnemyData.ts) — spot-check tuning against `effectiveCombatDepth` when changing acts or rings.

### RNG matrix (summary)

| System | RNG source |
|--------|------------|
| `RunState.runSeed` | Stored for reproducibility; not all subsystems consume it yet — extend when you need full run replay. |
| `rollLootTable` | Defaults to `Math.random`; accepts injectable `rng` ([`LootTable.ts`](../src/renderer/src/run/LootTable.ts)). |
| `shuffleArray` / encounter cosmetics | `Math.random` (non-deterministic). |
| Seeded flows | `mulberry32` / `shuffleInPlace` where a PRNG is threaded (e.g. enemy waves). |

## 5. Repo hygiene

| Topic | Status |
|-------|--------|
| **`out/`** | Listed in [`.gitignore`](../.gitignore) — do not commit build output. |
| **Tests** | No `npm test` script yet; good first tests: `rollLootTable`, grid/path helpers, `validateGameAction`. |
| **Lint** | No ESLint in `package.json`; optional later. |

---

*Generated as part of the game codebase audit implementation.*
