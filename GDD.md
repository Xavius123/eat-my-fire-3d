# Magitek — Game Design Document

> Living document. Updated as design evolves.
> Last updated: 2026-03-13

---

## 1. High Concept

A tactical roguelike set in a world where an unknown threat — alien, dimensional, or corporate — has forced humanity to unite. Players assemble a squad of 3 units, equip them from an ever-expanding arsenal, and fight through a series of increasingly dangerous encounters toward a final boss.

Every run is about hunting better mods.

---

## 2. Core Loop

```
Pre-run loadout
  → select 3 units
  → equip 1 weapon + 1 armor per unit (from unlocked pool)

Run
  → traverse DAG map (choose your path)
  → encounter nodes: combat, mod rewards, armor upgrades, events
  → isometric grid combat
  → end-of-level reward: new mods, new equipment options

Meta-progression
  → unlock new weapons and armors permanently across runs
  → boss clears unlock new content tiers
```

---

## 3. Unit System

### Structure

Each character has innate base stats (HP, ATK, DEF, MOV) that define their identity. Equipment stacks on top of those base stats.

```
Character
  base stats   → HP, ATK, DEF, MOV (innate to the character)
  weapon slot  → defines attack type + ATK bonus
  armor slot   → defines DEF + MOV bonuses
```

Some characters have **equipment restrictions** — they cannot equip certain slot types, relying instead on their innate stats (e.g., a Channeler cannot equip weapons but has high base ATK).

### Starter Characters (implemented)

| Character | Title     | HP | ATK | DEF | MOV | Restrictions | Description                        |
| --------- | --------- | -- | --- | --- | --- | ------------ | ---------------------------------- |
| Kael      | Vanguard  | 12 | 4   | 1   | 3   | None         | Balanced frontliner                |
| Ryn       | Striker   | 8  | 5   | 0   | 4   | None         | Fast and fragile glass cannon      |
| Dorn      | Sentinel  | 16 | 3   | 2   | 2   | None         | Slow and tough, holds the line     |

### Unlockable Characters (not yet available in-game)

| Character | Title      | HP | ATK | DEF | MOV | Restrictions | Description                        |
| --------- | ---------- | -- | --- | --- | --- | ------------ | ---------------------------------- |
| Syl       | Channeler  | 10 | 6   | 0   | 3   | No weapon    | Pure magic, attacks with innate power |
| Vex       | Juggernaut | 22 | 4   | 0   | 2   | No armor     | Unstoppable force, relies on raw HP |

### Pre-Run Loadout

- Player selects 3 characters from the unlocked roster (click character name to swap)
- Each character is assigned 1 weapon + 1 armor from the player's pool (respecting restrictions)
- Weapon determines the unit's **attack type** (melee, projectile, lobbed, cleave) and ATK bonus
- Armor determines the unit's **DEF** and **MOV** bonuses
- The loadout screen shows 3D rotating character previews with equipment slots below
- Clicking a slot opens a popup grid of item cards showing stat properties
- Live stat preview (HP, ATK, DEF, MOV, RNG) updates as equipment is changed
- Characters are unlocked across runs via meta-progression (milestones, boss clears, discoveries)
- Loadout is locked once the run begins

### Meta-Progression Unlocks

- New weapons and armors are unlocked permanently across all runs
- Unlocks triggered by: run milestones, boss clears, exploration discoveries
- Early runs have limited options — part of the difficulty curve

---

## 4. Equipment System

### Weapons

Define how a unit attacks.

| Property      | Description                                |
| ------------- | ------------------------------------------ |
| ATK bonus     | Flat attack stat bonus                     |
| attack type   | melee / projectile / lobbed / cleave       |
| range         | Derived from attack type                   |
| charges       | Uses per combat before needing to recharge |
| recharge rate | Charges regained per turn                  |
| max charges   | Cap — charges stack up to this limit       |
| mod slots     | How many mods can be attached              |

**Current starter weapons (implemented):**

| Weapon       | ATK | Attack Type | Range | Rarity |
| ------------ | --- | ----------- | ----- | ------ |
| Iron Sword   | +2  | Basic       | 1     | Common |
| Hunting Bow  | +1  | Projectile  | 4     | Common |
| Rusty Dagger | +1  | Basic       | 1     | Common |
| War Hammer   | +3  | Cleave      | 1     | Rare   |
| Fire Staff   | +2  | Lobbed      | 3     | Rare   |

**Future examples (not yet implemented):**

```
Sniper Rifle — +4 ATK, projectile, range 6, charges 1/max 4, 3 mod slots
Hand Cannon  — +6 ATK, projectile, range 2, charges 2/max 2, 2 mod slots
Plasma Blade — +3 ATK, cleave, range 1, charges 1/max 1, 3 mod slots
```

### Armor

Defines a unit's survivability and mobility.

| Property  | Description                      |
| --------- | -------------------------------- |
| HP        | Starting hit points              |
| defense   | Damage reduction (flat or %)     |
| movement  | Tiles the unit can move per turn |
| mod slots | How many mods can be attached    |

**Current starter armors (implemented):**

| Armor        | DEF | MOV | HP  | Rarity |
| ------------ | --- | --- | --- | ------ |
| Leather Vest | +1  | —   | —   | Common |
| Scout Cloak  | —   | +1  | —   | Common |
| Chain Mail   | +2  | —   | —   | Rare   |
| Iron Plate   | +3  | -1  | —   | Rare   |
| Battle Robes | +1  | —   | +5  | Rare   |

**Future examples (not yet implemented):**

```
Light Frame   — HP 60, DEF 0, MOV 5, 3 mod slots
Combat Rig    — HP 100, DEF 2, MOV 3, 2 mod slots
Titan Shell   — HP 150, DEF 5, MOV 2, 1 mod slot
```

---

## 5. Mod System

Mods are the primary upgrade loop during a run. They attach to weapons or armor and modify their properties.

### Rules

- Each equipment piece has a fixed number of mod slots
- Once attached, mods are permanent for the run
- Multiple mods of the same type may or may not stack (TBD per mod)
- The strategic tension: do you concentrate mods on one unit or spread evenly?

### Weapon Mod Examples

```
.50 Cal Rounds      → +5 damage
Incendiary Rounds   → +3 burn on hit (damage over time)
Scope               → +3 range
Extended Mag        → +2 max charges
Fast Loader         → recharge rate: every turn (regardless of base)
Explosive Tip       → hit applies splash to adjacent tiles
Stun Round          → 20% chance to stun on hit
```

### Armor Mod Examples

```
Reinforced Plating  → +20 HP
Dampeners          → +1 defense
Sprint Boosters    → +2 movement
Reactive Shield    → first hit per combat negated
Medkit             → restore 15 HP once per combat
```

### Mod Rarity

```
Common    → single stat improvement
Rare      → two stats or a conditional effect
Legendary → unique mechanic (e.g. "kills restore 1 charge")
```

---

## 6. Status Effects

Start with one. Add more later.

**Phase 1:**

- **Burn** — deals X damage at start of affected unit's turn for N turns

**Phase 2+ (deferred):**

- Stun — skip next turn
- Electrocute — stacks; at 5 stacks triggers stun
- Slow — movement halved

---

## 7. Map & Progression

### DAG Structure

- Run is a directed acyclic graph of nodes
- Player sees 2-3 path options from current node
- Paths lead toward the boss
- Choosing paths is itself a strategy (risk vs. reward)

### Node Types

```
⚔️  Combat          → fight an enemy group, earn mods on clear
🔧  Weapon Node     → choose 1 of 3 weapon mods
🛡️  Armor Node      → choose 1 of 3 armor mods
🌟  Event Node      → narrative encounter with choices & consequences
💀  Elite Combat    → harder fight, better rewards
👑  Boss Node       → end of run
```

### Event Node Examples

```
"Your squad discovers an abandoned supply cache."
  → [Loot it]    gain 1 random rare mod
  → [Leave it]   +15 HP to all units (it wasn't trapped)

"A field medic offers to patch up your squad."
  → [Accept]     restore 30 HP to one unit
  → [Share]      restore 15 HP to all units

"Your squad stops to eat. A healthy meal."
  → All units +10 HP   (yes, this is in the GDD)
```

---

## 8. Combat

### Grid

- Isometric grid, fixed size per encounter (TBD: 8×8 or 10×10)
- Terrain: walls block projectiles and movement, cover TBD

### Turn Order

- Player units act first (or initiative-based — TBD)
- Each unit: move then attack (or attack then move — TBD)
- Enemy units follow same rules

### Player Win/Loss

- Win: all enemies defeated
- Loss: all player units defeated → run ends

### Co-op (planned)

- 2 players, each controls 2 of the 4 units
- Shared run state, separate unit control

---

## 9. Enemies

Enemies follow the same weapon/armor logic as player units. Groups of enemies share a theme/aesthetic.

### Phase 1 Enemy Factions (3 types)

**Faction A — Fire Tech**
Industrial units using incendiary weapons. Heavy armor, slow movement, high damage. Think military mechs running on fuel.

```
Grunt        → flamethrower, light armor, close range
Heavy        → rocket launcher, heavy armor, splash damage
Commander    → coordinates other units, buffs nearby allies
```

**Faction B — Alien Pigs with Laser Weapons**
_(yes this is in the GDD)_
Fast, lightly armored, swarm tactics. Low individual HP but dangerous in groups. Laser weapons pierce through units in a line.

```
Laser Scout  → laser pistol, light frame, high movement
Laser Brute  → heavy laser cannon, mid armor, slow
Squealer     → suicide unit, charges player and explodes
```

**Faction C — TBD**
Reserved for a third distinct faction with different mechanical identity. Options: aerial units, burrowing units, shielded/reactive units.

### Boss — The Threat

The final encounter. Origin varies per run (randomized):

| Roll | Threat Origin                                                      | Flavor                                             |
| ---- | ------------------------------------------------------------------ | -------------------------------------------------- |
| 1    | Dimensional entity accidentally summoned via experiment gone wrong | Lovecraftian, reality-warping abilities            |
| 2    | Alien invasion force, advance scout                                | Organized, escalating — this is just the beginning |
| 3    | Mega-corporation's weapon that gained sentience                    | Body horror, military aesthetic gone wrong         |

Boss has multiple phases. Phase 2 changes behavior significantly (new attack patterns, spawns adds, moves differently).

---

## 10. Meta-Progression

What persists across runs:

```
Unlocked weapons    → available in pre-run loadout
Unlocked armors     → available in pre-run loadout
Codex entries       → lore discovered through events
Challenge modes     → harder modifiers unlocked by clears
```

What resets each run:

```
Mods               → start fresh every run
Unit HP            → full HP at run start
Node choices       → new DAG generated each run
```

---

## 11. Threat Narrative (Story Skeleton)

The world has two dominant forces — those who use technology and those who use magic. They've been in cold (and sometimes hot) war for decades.

Something breaks through.

Whether it came through a portal ripped open by a reckless experiment, arrived on a ship from deep space, or was created in a lab and escaped — the threat doesn't care about the old conflict. It just wants to consume/destroy/conquer.

The player commands a squad assembled from whoever was available — former enemies, now allies. The tension of that alliance is the backdrop. The threat is the immediate problem.

The world name, faction names, and specific lore are TBD. The name "Magitek" is a placeholder that may stay or go depending on whether the final setting leans into the magic/tech fusion or something else entirely.

---

## 12. Phase Plan

```
Phase 1 (current)
  ✅ Isometric grid combat
  ✅ DAG map progression
  ✅ Reward/upgrade scene
  ✅ Basic unit movement + attack
  ✅ Attack types (melee, projectile, lobbed, cleave)
  ✅ Enemy AI skeleton
  ✅ Asset semantics + adjacency rules
  ✅ Pre-run loadout screen (3 units, weapon + armor selection)
  ✅ Character system with base stats (HP, ATK, DEF, MOV)
  ✅ Starter characters (3) + unlockable characters (2)
  ✅ Equipment restrictions per character
  ✅ Starter weapons (5) and armors (5) with stat effects
  ✅ Weapon → attack type binding
  ⬜ Character unlock triggers (meta-progression)
  ⬜ Weapon charges / recharge system
  ⬜ Mod system (3-4 mods per slot type to start)
  ⬜ 2 enemy factions (Fire Tech + Alien Pigs)
  ⬜ Boss encounter (1 threat type)
  ⬜ Meta-progression (unlock tracking)

Phase 2
  ⬜ Co-op multiplayer
  ⬜ Status effects expansion (stun, electrocute, slow)
  ⬜ 3rd enemy faction
  ⬜ Full threat randomization (all 3 boss origins)
  ⬜ Narrative events with branching consequences
  ⬜ Additional weapons + armors

Phase 3+
  ⬜ Unit customization at run start (appearance)
  ⬜ Challenge modes
  ⬜ Codex / lore system
  ⬜ Additional boss encounters
```

---

## 13. Open Questions

These are unresolved design decisions to revisit:

- Initiative system: does player always go first, or is there a speed/initiative stat?
- Grid size: 8×8 or 10×10 per combat encounter?
- Can the same weapon type appear on multiple units, or is each weapon unique in the loadout?
- Mod stacking: can you apply 2x Incendiary Rounds to the same weapon?
- Event nodes: do choices ever have negative outcomes the player can't see coming?
- Co-op unit ownership: each player owns specific units, or any player can move any unit?
