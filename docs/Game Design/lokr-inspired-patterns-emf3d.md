# Eat My Fire 3D — design patterns inspired by tactical roguelites (e.g. LoKR-style)

*Original design language for this project. Not a clone of any commercial title — use this to align features with proven loops while keeping setting, characters, and numbers ours.*

**See also:** [GDD.md](GDD.md) (canonical), [reference-lokr-public-validation.md](reference-lokr-public-validation.md) (source drift notes), [ui-battle-scene-build-notes.md](ui-battle-scene-build-notes.md) (tactical HUD layout), [ui-map-run-build-notes.md](ui-map-run-build-notes.md) (map, party, inventory, character modal).

---

## 1. Core loop (ours)

**Run spine**

1. **Pre-run:** pick squad and loadout from unlocked meta pool.
2. **Macro map:** traverse a **DAG** of nodes (branching paths, player-chosen risk).
3. **Micro combat:** isometric **grid** tactics (square grid in EMF3D; hex is a reference pattern, not a requirement).
4. **Rewards:** combat and events feed **mods and events** — not a parallel “orb promotion” minigame unless we add one later.
5. **Success / fail:** squad wipe ends the run; boss clear completes it and feeds meta unlocks.

**Contrast with a LoKR-style fixed graph:** Some games use a **fixed node layout** per adventure with **randomized node contents** for replay. EMF3D uses a **generated DAG** each run — different structure, same “macro choices → micro fights” rhythm.

---

## 2. Progression currencies (ours)

| Layer | What persists | What resets each run |
|-------|----------------|----------------------|
| **Meta** | Unlocked weapons, armors, characters, codex, challenge flags | — |
| **Run** | HP pool, equipped mods, path through DAG, reroll tokens | Everything when run ends |

**Optional future hook (pattern only):** A **short-run promotion currency** (like “orbs”) that only levels characters during one run, plus a **long-run rank** that unlocks more options on promotion — classic roguelite split. EMF3D today emphasizes **equipment mods** and **hero path design** (see [hero-progression-design.md](../hero-progression-design.md)) instead of orb tiers; if we add orbs or badges, they should plug into that doc, not duplicate it.

---

## 3. Class roles (ours)

LoKR-style four families (mobility / tank / magic / AoE oddballs) map loosely to how we build **squads**:

| Pattern (inspiration) | EMF3D expression |
|----------------------|------------------|
| Frontline absorber | High HP/DEF units, melee loadouts, taunt-style paths (design target) |
| Skirmisher / mobility | High MOV, non-exhausting weapons, flanking |
| Glass cannon / magic | Channeler-style restrictions, lobbed/AoE, low DEF |
| Support / control | Heals, debuffs, positioning tools (Medic paths, future status focus) |

We do **not** copy shared “skip turn” passives from another game; if we add pass actions, they should emerge from EMF3D’s charge and weapon rules in [GDD.md](GDD.md) §8.

---

## 4. Node types (ours)

Canonical node taxonomy lives in [GDD.md](GDD.md) §7. Summary:

| Node | Role |
|------|------|
| Combat | Standard fight; faction-tied mod reward |
| Elite combat | Harder; Rare+ reward |
| Event | Narrative / gift / branch / blind bet / temptation |
| Boss | Finale; full heal on clear in baseline design |

**Dice-gated overworld checks** (green die icon in some games) are **not** a shipped EMF3D system; events instead use **explicit choices** and **temptation** escalations. If we add die checks later, gate them by **role tags** or **items** in our lore, not imported names.

---

## 5. Presentation (ours)

- **Camera:** Isometric tactical view, readable silhouettes, faction-readable enemies.
- **Tone:** Dimensional sci-fantasy, fractured worlds — not medieval Linirea pastiche.
- **Readability priority:** LOS, telegraphed elites, clear mod cards — aligns with “easy to learn, hard to master” without copying UI layout.

---

## 6. Modes roadmap (pattern reference)

Reference games often ship **daily/weekly challenges** and an **arena** with random loadouts. EMF3D Phase plan ([GDD.md](GDD.md) §12) prioritizes core loop and co-op before live-service schedules; treat challenge modes as **Phase 3+** unless scope shifts.

---

## 7. Takeaway for implementation

When adding a feature “like LoKR,” check:

1. Does it fit **DAG + combat reward** in §2–4 of [GDD.md](GDD.md)?
2. Does it duplicate **mod stacking / charges** rules already defined?
3. Is the fiction **ours** (Gates, Convergence, factions from story bible)?

If yes, implement; if it requires a second economy (orbs, dice), spec it in a short addendum and link from this file.
