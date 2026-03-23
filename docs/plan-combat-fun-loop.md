# Combat fun loop plan (summary)

Canonical living plan with full YAML todos and phases lives in Cursor: **`improve_combat_fun_loop_fbc13a5d.plan.md`** (`.cursor/plans/`).

This file is a **short mirror** for the repo so perks, paths, and execution phases stay visible in git.

## Overview

- **Character perks (planned):** `primaryPerk` + `level10Perk` on every hero in `CharacterData`; XP ladder to 10; mod reroll from perks (not global default).
- **Leveling paths (existing):** `HeroPathData.HERO_PATHS` covers all five catalog heroes (`warrior`, `mage`, `healer`, `samurai`, `ned`); level-2 pick in `LevelUpScene`. Path **combat** effects are mostly **not wired** yet.
- **Reward screen:** UX + reroll bugfixes (gold line, stable mod slot type, Fisher–Yates).
- **Direction 11 (broader):** Boss drops, item grades, runes/rings, need/greed-style rolls.
- **Run sheet (Direction 12, shipped):** [`RunSheetPanel`](src/renderer/src/ui/RunSheetPanel.ts) — **Map:** “Run / Squad” button + **Esc** opens overlay. **Combat:** **Run** in phase bar + **Esc** toggles. Shows gold, crystals, run bonuses, mod rerolls, `items[]`, per-hero XP/level/path/perks/gear/mods/roster HP.

## Character perks vs `HeroPath`

| Layer | Where | Notes |
|-------|--------|--------|
| **Path** | `HERO_PATHS`, `RunState.heroPath`, `LevelUpScene` | Chosen at **hero level 2**. All heroes have path entries; new heroes must add `HERO_PATHS[id]`. |
| **Perks** | Planned on `CharacterDefinition` | **Baseline** always on; **level-10** when `heroLevel >= 10`. Separate from path unless merged later. |

## Implementation sketch (perks)

| Piece | Ship |
|-------|------|
| Data | `primaryPerk` + `level10Perk` on every `CHARACTER_CATALOG` entry |
| XP | Phase C: levels reach **10** in a normal run |
| Apply | `Game.spawnInitialUnits`: primary always; level-10 when level ≥ 10 |
| Reroll | Charges from perks + loadout; retire default global rerolls (Phase E) |
| UI | Short perk line; reward tooltips for reroll source |
| Regression | New hero = `CharacterData` + `HERO_PATHS` + perks together |

## Phase D (character perks)

- **D0:** `HERO_PATHS` entry per shipped hero (5/5 today).
- **D1–D2:** Types + author perks for all heroes (include **ned** if he can appear in run).
- **D3–D4:** Apply at spawn.
- **D5:** UI: show **Path** vs **Perk** clearly.
- **D6 (backlog):** Wire path passives in combat — see todo **`hero-path-combat-wiring`**.

## Related code

- `src/renderer/src/data/HeroPathData.ts` — paths
- `src/renderer/src/scenes/LevelUpScene.ts` — path pick
- `src/renderer/src/entities/CharacterData.ts` — heroes (perks TBD)
- `src/renderer/src/scenes/CombatScene.ts` — XP / levels
- `src/renderer/src/scenes/RewardScene.ts` — mods + reroll
