# Magitek — Game Design Document

> Living document. Updated as design evolves.
> Last updated: 2026-03-14 (session 4)

---

## 1. High Concept

A tactical roguelike set in a world where an unknown threat — alien, dimensional, or corporate — has forced humanity to unite. Players assemble a squad of 3 units, equip them from an ever-expanding arsenal, and fight through a series of increasingly dangerous encounters toward a final boss.

Every run is about hunting better mods.

---

## 2. Core Loop

```
Pre-run loadout
  → select 3 units (3 per player in co-op — up to 12 total)
  → equip 1 weapon + 1 armor per unit (from unlocked pool)

Run
  → traverse DAG map (choose your path)
  → encounter nodes: combat, events
  → isometric grid combat — variable battlefield geometry
  → end-of-combat reward: choose 1 of 3 mods (weapon or armor, faction-dependent)
  → events: narrative choices, temptation events, heals, curses

Meta-progression
  → unlock new weapons, armors, and characters permanently across runs
  → boss clears unlock new content tiers
```

---

## 3. Unit System

### Structure

Each character has innate base stats (HP, DEF, MOV) that define their identity. **ATK is entirely weapon-driven** — characters have no meaningful base ATK of their own. A character's damage output is determined by what they equip, not who they are.

```
Character
  base stats   → HP, DEF, MOV (innate to the character)
  weapon slot  → defines attack type + ALL ATK
  armor slot   → defines DEF + MOV bonuses
```

Some characters have **equipment restrictions** — they cannot equip certain weapon or armor types.

### Starter Characters (implemented)

| Character | Title     | HP | ATK | DEF | MOV | Restrictions | Description                        |
| --------- | --------- | -- | --- | --- | --- | ------------ | ---------------------------------- |
| Kael      | Vanguard  | 12 | 4   | 1   | 3   | None         | Balanced frontliner                |
| Ryn       | Striker   | 8  | 5   | 0   | 4   | None         | Fast and fragile glass cannon      |
| Dorn      | Sentinel  | 16 | 3   | 2   | 2   | None         | Slow and tough, holds the line     |

### Unlockable Characters (not yet available in-game)

| Character | Title      | HP | ATK | DEF | MOV | Restrictions       | Description                                               |
| --------- | ---------- | -- | --- | --- | --- | ------------------ | --------------------------------------------------------- |
| Syl       | Channeler  | 10 | 6   | 0   | 3   | No weapon          | Pure magic, attacks with innate power. Naturally Lucky — rarity weights on mod rewards shift toward Rare/Legendary when she is in the squad. |
| Vex       | Juggernaut | 22 | 4   | 0   | 2   | No armor           | Unstoppable force, relies on raw HP                       |
| Mira      | Medic      | 10 | 2   | 1   | 3   | No weapon          | Heals an adjacent ally for 6 HP instead of attacking. Cannot attack. Occupies a squad slot — the cost of sustained survivability across a run. |

### Designed Characters (not yet implemented)

These follow the updated design philosophy: characters are stat bases only. ATK is not listed — it comes entirely from the equipped weapon.

| Character | Title    | HP | DEF | MOV | Restrictions          | Description |
| --------- | -------- | -- | --- | --- | --------------------- | ----------- |
| Torque    | The Tank | 24 | 2   | 2   | Melee only (Basic/Cleave) | Built for the front lines. Can only equip melee weapons, forcing close-range commitment every combat. |
| Zephyr    | The Ghost | 6 | 0   | 5   | None                  | Extreme high-risk flanker. Dangerously low HP — dies in two hits. Rewards players who can keep her out of the firing line. |
| Sybil     | The Siphoner | 12 | 0 | 2 | None                | **Free action** (once per turn): heal an ally within LOS for 6 HP. She is slow and fragile — keeping her alive and in position is the challenge. |

### Pre-Run Loadout

- Player selects **3 characters** from the unlocked roster in solo (click character name to swap)
- In **co-op** (2–4 players), each player fields their own squad of **3 units** (up to 12 total on the battlefield)
- Each character is assigned 1 weapon + 1 armor from the player's pool (respecting restrictions)
- Weapon determines the unit's **attack type** (melee, projectile, lobbed, cleave) and ATK bonus
- Armor determines the unit's **DEF** and **MOV** bonuses
- The loadout screen shows 3D rotating character previews with equipment slots below
- Clicking a slot opens a popup grid of item cards showing stat properties
- Live stat preview (HP, ATK, DEF, MOV, RNG) updates as equipment is changed
- Characters are unlocked across runs via meta-progression (milestones, boss clears, discoveries)
- Loadout is locked once the run begins

### Healing Economy

Units do **not** heal between combats. HP is a resource that depletes across the entire run.

- **Full heal:** only after the final boss is defeated (run complete)
- **Sources of healing mid-run:**
  - Event nodes (medic events, gift events, certain Temptation Events)
  - Medkit armor mod (restores 15 HP once per combat)
  - Mira's active heal (6 HP per turn on an adjacent ally, replaces her attack action)
  - Sybil's free-action heal (6 HP per turn to any ally within LOS — no cost, but Sybil must survive to provide it)
  - Specific Legendary mods (e.g. "kills restore 5 HP")
- This makes path choices on the DAG meaningful — a bad fight has lasting consequences

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
| charges       | Current uses available this turn            |
| recharge rate | Charges regained at the start of each turn  |
| max charges   | Cap — charges stack up to this limit        |
| exhausting    | If true, attacking consumes all remaining movement |
| mod slots     | How many mods can be attached               |

**Charge system:** Every weapon uses charges. A unit can attack as many times per turn as it has charges — there is no separate "has attacked" flag. Charges recharge at the start of each turn (up to max). Units with higher max charges can save up charges across turns to attack multiple times in one turn.

**Exhausting weapons:** Exhausting weapons (default) consume all remaining movement when used, locking the unit in place. Non-exhausting weapons preserve remaining movement, enabling hit-and-run tactics.

**Charge & slot rules by rarity:**

- **Common weapons** — 1 charge / 1 max / recharges 1 per turn, **0 mod slots**. Reliable one-attack-per-turn, but can never be upgraded. Exhausting.
- **Rare/Legendary weapons** — higher charges + recharge rate, **1–3 mod slots**. Can stockpile charges for multi-attack turns. Non-exhausting (enables hit-and-run).

**Current starter weapons (implemented):**

| Weapon       | ATK | Attack Type | Range | Charges / Max | Recharge | Exhausting | Mod Slots | Rarity |
| ------------ | --- | ----------- | ----- | ------------- | -------- | ---------- | --------- | ------ |
| Iron Sword   | +2  | Basic       | 1     | 1 / 1         | 1        | Yes        | 0         | Common |
| Hunting Bow  | +1  | Projectile  | 4     | 1 / 1         | 1        | Yes        | 0         | Common |
| Rusty Dagger | +1  | Basic       | 1     | 1 / 1         | 1        | Yes        | 0         | Common |
| War Hammer   | +3  | Cleave      | 1     | 2 / 3         | 1        | No         | 1         | Rare   |
| Fire Staff   | +2  | Lobbed      | 3     | 2 / 2         | 1        | No         | 2         | Rare   |

**Designed weapons (not yet implemented):**

Charge format: Starting / Recharge per turn / Max

| Weapon | ATK | Attack Type | Charges (Start/Rech/Max) | Exhausting | Rarity | Special |
| ------ | --- | ----------- | ------------------------ | ---------- | ------ | ------- |
| Iron Wraps | +1 | Basic | 1 / 2 / 2 | Yes | Common | 2 max charges = can hit twice per turn. Scales strongly with damage mods and status effect applicators. |
| The Core | +6 | Projectile | 1 / 0 / 3 | No | Legendary | 0 recharge rate. Must rely on Autoloader mod or Recoil Harness armor to generate charges. Build-around weapon. |
| Graviton Singularity | +1 | Lobbed | 1 / 1 / 1 | Yes | Legendary | On impact: pulls all units (friend and foe) in a 3-tile radius exactly 1 tile toward the center. Low damage — the displacement is the weapon. |
| Tectonic Breaker | +3 | Cleave | 1 / 1 / 2 | Yes | Rare | Every attack pushes the target back 1 tile. If they collide with a wall or another unit: +2 unblockable collision damage. |
| Phase Blade | +6 | Basic | 1 / 1 / 1 | Yes | Legendary | Ignores enemy DEF entirely. Costs 1 HP per swing. |
| Ricochet Rifle | +2 | Projectile | 1 / 1 / 1 | No | Rare | On kill: projectile bounces to nearest enemy within 3 tiles for half damage. |
| Napalm Launcher | +2 | Lobbed | 1 / 1 / 1 | Yes | Rare | Impact tile becomes a hazard zone for 2 turns — applies Burn 1 to any unit that steps on it. |
| Wide Cleaver | +2 | Cleave | 1 / 1 / 1 | Yes | Rare | Hits a 3-tile arc in front of the user instead of a single target. |

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

**Designed armors (not yet implemented):**

| Armor | DEF | MOV | HP | Rarity | Special |
| ----- | --- | --- | -- | ------ | ------- |
| Collision Plate | +3 | -1 | — | Rare | Wearer ignores collision rules for non-elite enemies. Moving through an enemy tile costs +1 MOV and deals 1 unblockable damage to that enemy. |
| Thermo-Shell | +1 | 0 | — | Rare | Deals 1 Flame damage to all adjacent enemies at the end of the wearer's turn. |
| Ablative Mesh | 0 | +1 | — | Common | Grants a 10 HP Overshield at the start of every combat. Does not persist between fights. |
| Kinetic Dynamo | 0 | +2 | — | Rare | Moving 4+ tiles in a single turn grants +2 ATK on your next attack that turn. |
| Repulsor Field | +2 | 0 | — | Rare | Any enemy that ends their movement directly adjacent to this unit is immediately pushed 1 tile away. |
| Recoil Harness | +1 | -1 | — | Legendary | When this unit takes damage, immediately gain +1 Weapon Charge. Pairs with 0-recharge weapons like The Core. |
| Martyr's Blood | +3 | 0 | +20 | Cursed | This unit can no longer be healed by any mid-run source (events, Medkits, Mira, Sybil). Can only recover HP at boss-clear checkpoints. Non-stackable. |

---

## 5. Mod System

Mods are the primary upgrade loop during a run. They attach to weapons or armor and modify their properties.

### Rules

- Each equipment piece has a fixed number of mod slots
- Once attached, mods are permanent for the run
- **Duplicate mods do not fill a new slot** — they upgrade the existing copy to **×2, ×3**, etc., multiplying the effect
- Duplicate mods are displayed on the card as a stacked counter (×2 badge, ×3 badge, etc.)
- Some mods are marked **non-stackable** (binary effects like `Reactive Shield`): duplicates instead grant a reroll token
- Cursed mods are always non-stackable — you cannot double down on a deal with the devil
- The strategic tension: do you concentrate mods on one unit or spread evenly? And do you fish for duplicates to push a ×3 build, or diversify?

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

**Designed weapon mods (not yet implemented):**

```
Extended Magazine    → +1 Max Charge. Simple but crucial for multi-attack builds.
Autoloader           → +1 Recharge Rate per turn. Essential for 0-recharge weapons like The Core.
Vampiric Filament    → [Legendary] Dealing lethal damage heals the attacker for 3 HP.
```

### Armor Mod Examples

```
Reinforced Plating  → +20 HP
Dampeners          → +1 defense
Sprint Boosters    → +2 movement
Reactive Shield    → first hit per combat negated
Medkit             → restore 15 HP once per combat
```

**Designed armor mods (not yet implemented):**

```
Overclocked Actuators  → [Cursed] +2 MOV. Taking damage permanently reduces max MOV by 1 for the rest of combat (resets after). Non-stackable.
Reinforced Dampeners   → Target takes −1 damage from all Status Effects (Burn, Leeched, Corrosion, etc.).
```

### Mod Rarity

```
Common    → single stat improvement
Rare      → two stats or a conditional effect
Legendary → unique mechanic (e.g. "kills restore 1 charge")
Cursed    → powerful effect with a permanent negative trade-off
```

### Cursed Mods

Visually distinct — cracked border, dark glow. Always the strongest raw stat on the board. Always with a cost baked in. They appear rarely and feel like a dare. Some builds absorb the downside. Most can't.

```
Bloodthirst Rounds   → +6 ATK,  but attacker loses 3 HP per shot
Glass Edge           → +4 ATK,  unit's DEF becomes 0 permanently
Frenzy Plating       → +3 DEF, +20 HP, but unit must move full MOV every turn (cannot Hold)
Dead Man's Reload    → infinite charges, but weapon can never proc status effects
Marked for Death     → +5 ATK,  this unit is always targeted first by enemy AI
```

---

## 6. Status Effects

Status effects force immediate tactical changes. Each one demands a different response.

**Implemented:**

- **Burn** — deals X damage at the start of the affected unit's turn for N turns.

**Designed (not yet implemented):**

- **Corrosion** — reduces the unit's DEF by 1 at the start of their turn (minimum 0). Lasts for the entire combat. Especially threatening on high-DEF tanks.
- **Marked** — the next instance of damage this unit takes is doubled, then the mark is consumed. Pairs with setup tools (Graviton Singularity pull, ally positioning) for burst combos.
- **Leeched** — at the start of the unit's turn, they take 2 damage and the unit that applied Leech heals 2 HP. Forces the target to break LOS or kill the leecher.
- **Stasis** — target cannot move, attack, **or take damage** for 1 turn. Pure control — cannot be used to set up burst damage. Forces the player to choose between locking a target down and killing it now.

---

## 7. Map & Progression

### DAG Structure

- Run is a directed acyclic graph of nodes
- Player sees 2-3 path options from current node
- Paths lead toward the boss
- Choosing paths is itself a strategy (risk vs. reward)

### Node Types

```
⚔️  Combat        → fight an enemy group; earn mods on clear (type depends on faction)
🌟  Event Node    → narrative encounter: gifts, branches, temptation events, or curses
💀  Elite Combat  → harder fight; always Rare+ mod reward
👑  Boss Node     → end of run; full squad heal on clear
```

Dedicated weapon/armor mod nodes **do not exist** — mods flow exclusively through combat rewards and events. Every node is a fight or a story beat.

### Combat Reward — Faction-Locked Mod Type

The mod type offered after a combat is determined by the enemy faction fought. Players learn the mapping over runs:

| Faction | Mod Reward Type | Logic |
|---|---|---|
| Fire Tech | Weapon mods | Industrial, tool-focused |
| Alien Pigs | Armor mods | Biological, adaptive — they change *you* |
| The Remnants | Either, always Rare+ | Fragments of both worlds |
| Elite (any faction) | Always Rare/Legendary | Risk justifies the reward |

After clearing a combat, a modal overlays the victory celebration:
- 3 mods are presented (all weapon or all armor, per faction)
- Player chooses 1
- Player has **3 rerolls per run** (shared resource) to redraw all 3 options
- Rarity of offered mods scales with run depth (and Syl's Lucky trait shifts weights further)

### Event Node Archetypes

Every event fits one of three archetypes. Balance target: ~40% Branch, ~35% Gift, ~25% Blind Bet.

| Archetype | Feel | Design Rule |
|---|---|---|
| **Gift** | Pure delight, no decision | Rare — feels like the run is smiling at you |
| **Branch** | Visible tradeoff, player agency | Most common — clear choice with readable consequences |
| **Blind Bet** | Temptation, unknown outcome | Punishes recklessness, rewards intuition |

### Temptation Events

A special escalating subtype of event. The player can interact repeatedly, gaining something valuable each time — but the cost escalates with each click until the unit can no longer survive the next offering.

**Rules:**
- Player chooses which unit engages before interacting
- The reward type is shaped by that unit's equipped weapon (where applicable)
- Cost escalates each click (not linearly — faster each time)
- The next cost is always visible before committing
- When a unit cannot survive the next cost, the option grays out with the message: *"[Unit] cannot survive another offering."*
- No hard cap — runs until HP is exhausted or player walks away

---

**Temptation Event: "The Offering Stone"**
*An ancient altar carved from black rock. It pulses faintly.*

Choose which unit approaches. The stone reads what they carry:

| Weapon Type on Unit | What the Stone Offers Each Click |
|---|---|
| Melee / Cleave | +1 ATK |
| Projectile | +1 RNG |
| Lobbed | +1 splash radius |
| No weapon (Channeler / Medic) | +1 ATK (innate) |

HP cost per click: **5 → 12 → 20 → 30 → ...** (escalates fast after 3 clicks)

A high-HP tank like Dorn can feed the stone far deeper than Ryn. That's the balance.

---

**Temptation Event: "The Parasite"**
*Something small and glowing attaches itself to one of your units. It seems... friendly.*

Each click attaches one more parasite. Parasites **travel with the unit for the rest of the run.**

| Per Parasite Attached | Effect |
|---|---|
| Passive heal | +2 HP at start of that unit's turn |
| Cost | −5 max HP permanently |
| After 3+ parasites | Unit can no longer equip armor mods (the parasites are their armor layer now) |

The unit shrinks but becomes self-sustaining. Enough parasites and they're nearly unkillable in long fights, fragile against burst. A small parasite counter appears on the unit's HP bar.

---

**Temptation Event: "The Signal Tower"**
*Alien tech. Still broadcasting. You could interface with it.*

Does not depend on weapon type — the signal doesn't care what you're carrying.

| Click | Gain | Cost |
|---|---|---|
| 1st | +1 RNG on one weapon | −1 MOV on that unit (permanent) |
| 2nd | +1 RNG again | −1 MOV again |
| 3rd | Weapon gains a second attack type | Unit MOV becomes 0. Permanently rooted. |

A rooted melee unit with range 4 and two attack types is a legitimate build. Committing to it is the entire game.

---

### Standard Event Examples

**Gift:**
> *A strong wind carries your squad forward.*
> → All units may move 2 extra tiles on their next turn.

> *You pass through an aurora. Your team feels lighter.*
> → All units +1 MOV for the rest of the run.

**Branch:**
> *A crashed supply drone. Cargo intact — but the signal beacon is active. Someone knows it's here.*
> → [Loot quickly] gain 1 random weapon mod; next combat has +1 enemy unit
> → [Disable beacon first] skip this event node, then loot safely at the next one
> → [Leave it] nothing

> *A field medic offers to patch up your squad.*
> → [Focus on one] restore 30 HP to one unit
> → [Spread it] restore 15 HP to all units

**Blind Bet:**
> *A stranger offers you a flask. No label. No explanation. "Drink. It's medicine."*
> → [Drink] random: +10 HP to one unit OR −1 ATK to one unit (permanent)
> → [Refuse] nothing happens. Your squad looks vaguely suspicious for the rest of the day.

> *Your squad stumbles across an ancient mushroom forest.*
> → [Eat the mushrooms] your team awakes from slumber weakened. −5 HP to all units.
> → [Go deeper] you encounter the Guardian of the Forest. It does not look friendly. **Combat node — Rare mod reward on clear.**
> → [Leave] nothing happens.

---

## 8. Combat

### Grid

Battlefield geometry is **variable per encounter** — the shape tells a story before a unit moves.

| Example Layout | Dimensions | Feel |
|---|---|---|
| Open plaza | 10×10 | Positioning, flanking, projectiles shine |
| Narrow corridor | 4×12 | Melee dominates, lobbed attacks punishing |
| Chokepoint room | 6×6 + dividing wall | Cleave wrecks, everyone clusters |
| Cramped bunker | 6×8 | High chaos, no safe distance |

**Terrain & Line of Sight:**
- Walls block movement entirely.
- **Projectile** and **Cleave** attacks require line of sight — they hit the **first unit or wall tile** in the path and stop. No friendly fire unless the weapon explicitly states piercing.
- **Piercing** weapons (e.g. Alien Pig lasers) hit every unit in the line but are still **stopped by environment/walls**. The line ends at the first wall tile.
- **Lobbed** attacks ignore terrain and line of sight entirely — they arc over everything.
- **Basic** (melee) has no line of sight requirement — it's direct adjacency.

### Deployment

Before combat begins, the player places their units in a designated spawn zone. Enemy positions are visible.

**Zone of Control Initiative:** if any enemy unit is within range 3 of a player unit at deployment end → that single enemy acts first, then player takes their full turn. This simulates being caught mid-engagement. It punishes reckless path choices and makes dangerous rooms feel immediately threatening.

Otherwise: player goes first.

### Turn Actions

Each unit has a **movement budget** (`movementLeft`) equal to their `moveRange` stat, and **attacks limited by weapon charges**.

**Split Movement** — movement can be split across multiple actions:

```
Move 1 tile → Attack → Move remaining tiles   — hit-and-run (non-exhausting weapons)
Move full range                                — reposition
Attack → Move full range                       — strike then retreat (non-exhausting)
Attack only                                    — hold position and fire
Move → Attack                                  — standard with exhausting weapon (no more movement)
```

**Exhausting Weapons** — weapons have an `exhausting` property:
- **Exhausting (default)**: attacking consumes all remaining movement. The unit is locked in place after attacking. Common weapons (Iron Sword, Hunting Bow, Rusty Dagger) are exhausting.
- **Non-exhausting**: attacking preserves remaining movement, enabling hit-and-run tactics. Rare weapons (War Hammer, Fire Staff) are non-exhausting.

**Attacks** consume **weapon charges**:
- Every weapon uses charges. There is no separate "has attacked" flag — charges are the sole gate on attacking.
- A unit can attack as many times per turn as it has charges available.
- Charges recharge at the start of each turn (up to `maxCharges`).
- **Common weapons**: 1 charge / 1 max / recharges 1 — reliable one attack per turn.
- **Rare weapons**: higher charges and max charges — can stockpile charges across turns for multi-attack turns (e.g., War Hammer: 2/3/1 can save up to 3 attacks).

### Player Win/Loss

- Win: all enemies defeated
- Loss: all player units defeated → run ends

### Co-op (planned)

- **2–4 players**, each controls their own squad of 3 units (up to 12 units on the battlefield)
- Shared run state, fully separate unit control per player
- Turn structure: **player blocks** — each player takes their full 3-unit block in sequence, then the enemy phase runs. Turn order rotates each round so no one always holds the last-mover advantage.
- Enemy scaling: **base 3 enemies + 2 per additional player**

| Players | Player Units | Enemy Count |
|---|---|---|
| 1 (solo) | 3 | 3–4 |
| 2 | 6 | 5–6 |
| 3 | 9 | 7–8 |
| 4 | 12 | 9–10 |

- Enemy stat values stay the same across player counts — volume scales, not inflation
- Boss encounters gain +1 add spawned in phase 2 per additional player
- Battlefield always rolls larger grid variants for 3–4 player sessions

### 8.5 Multiplayer Architecture (Co-op)

#### Authority Model — Host-Authoritative P2P

All multiplayer uses Steam P2P networking — no dedicated servers.

- **Host** runs all game logic: `CombatActions`, `TurnManager`, `EnemyAI`, `DamageResolver`
- **Guest** sends action requests to host, receives validated results, replays them visually
- Host is the single source of truth for game state; guest never mutates state directly
- If the connection drops, the guest's run ends (no host migration in Phase 1)

#### Co-op Turn Flow

- Both players act during the same `player` phase on their assigned units
- **Unit ownership:** each player owns and controls their own squad of 3 units (up to 12 total)
- Each player submits `ActionRequest` messages for their units independently
- Host validates each request against game state, then broadcasts `ActionConfirm` or `ActionReject`
- Phase transitions occur when both players signal ready (or a timer expires)
- Enemy phase is executed entirely by the host and broadcast to the guest

#### Network Messages

| Message | Direction | Purpose |
|---------|-----------|---------|
| `ActionRequest` | Guest → Host | Player wants to move/attack with a unit |
| `ActionConfirm` | Host → Guest | Action validated, apply it (includes result data) |
| `ActionReject` | Host → Guest | Action invalid, unit state unchanged |
| `StateSync` | Host → Guest | Periodic full state snapshot for consistency |
| `PhaseChange` | Host → Guest | Turn phase transition (player → enemy → player) |
| `SceneTransition` | Host → Guest | Switch scenes (map → combat → reward) |
| `RunStateUpdate` | Host → Guest | Map graph state, current node, HP totals |
| `LoadoutSubmit` | Guest → Host | Guest's chosen unit + equipment |
| `UnitOwnership` | Host → Guest | Which units each player controls |
| `PlayerReady` | Both | Signal that player has finished their actions |

#### Scene Flow in Co-op

```
TitleScene → LobbyScene → CoopLoadoutScene → MapScene → CombatScene → RewardScene → loop
```

- Host drives map node selection and reward picks
- Guest follows scene transitions via `SceneTransition` messages
- `LobbyScene` handles Steam lobby creation/joining and ownership assignment
- `CoopLoadoutScene` lets each player configure their assigned units

#### ActionQueue Integration

The existing `ActionQueue` was designed with a network bridge injection point (see `ActionQueue.ts` header comment). In co-op:

- **Host:** `ActionQueue.processAction()` runs locally as normal; results are broadcast to guest
- **Guest:** Input produces `ActionRequest` messages instead of local `processAction()` calls; confirmed actions are replayed through `ActionQueue` for visual consistency

#### Future Considerations (not yet implemented)

- Disconnect/reconnect: save run state to allow rejoin within a timeout window
- Spectator mode: read-only guest that receives `StateSync` without sending actions
- Cloud saves: Steam Cloud for meta-progression persistence
- Achievements: Steam achievement integration for run milestones

---

## 9. Enemies

Enemies follow the same weapon/armor logic as player units. Groups of enemies share a theme/aesthetic.

### Phase 1 Enemy Factions (3 types)

Every faction has **regular units** (standard combat encounters) and **elite units** (appear in Elite nodes only — harder, unique mechanics, always Rare+ reward on clear).

---

**Faction A — Fire Tech**
Industrial military units. Incendiary weapons, heavy armor, slow movement, high damage. Think mechs running on fuel. Tactical support structure — Shielders and Commanders make every other unit around them more dangerous.

Reward type: **Weapon mods**

*Regular units:*

| Unit | HP | ATK | DEF | MOV | Attack Type | Special |
|---|---|---|---|---|---|---|
| Grunt | 10 | 4 | 1 | 3 | Basic (range 1) | Applies Burn 1 on hit |
| Heavy | 16 | 5 | 3 | 2 | Lobbed (range 3) | Splash damage |
| Commander | 12 | 3 | 1 | 2 | Basic (range 1) | Aura: adjacent allies +1 ATK |
| Shielder | 8 | 2 | 0 | 3 | Basic (range 1) | Aura: adjacent allies take −2 damage |
| Shield Tower | 12 | 3 | 3 | 0 | Projectile (range 3) | Immobile. Siege Launcher takes −50% damage while any Tower is adjacent |
| Siege Launcher | 10 | 5 | 0 | 0 | Projectile (∞ range) | Immobile. Fires once/turn at any visible player unit. Killing it ends the encounter |

*Elite units:*

| Unit | HP | ATK | DEF | MOV | Attack Type | Special |
|---|---|---|---|---|---|---|
| Incendiary Specialist | 14 | 5 | 2 | 3 | Cleave (range 1) | Applies Burn 2 on hit. Cleave arc hits all adjacent tiles |
| Titan | 24 | 6 | 4 | 1 | Lobbed (range 4) | Splash hits 3-tile radius |
| War Commander | 16 | 4 | 2 | 2 | Basic (range 1) | Aura: adjacent allies recharge +1 extra weapon charge per turn |

---

**Faction B — Alien Pigs with Laser Weapons**
*(yes this is in the GDD)*
Fast, lightly armored swarm fighters. Low individual HP but dangerous in packs. Laser weapons pierce through units in a line. Specialise in pressure, disruption, and making you deal with multiple problems at once.

Reward type: **Armor mods**

*Regular units:*

| Unit | HP | ATK | DEF | MOV | Attack Type | Special |
|---|---|---|---|---|---|---|
| Laser Scout | 6 | 3 | 0 | 5 | Projectile (range 4) | Piercing — hits all units in line |
| Laser Brute | 14 | 5 | 1 | 2 | Projectile (range 5) | Piercing |
| Squealer | 8 | 6 | 0 | 4 | — | On death OR when adjacent to player unit: explodes, 6 damage to all adjacent tiles |
| Berserker | 10 | 3 | 0 | 3 | Basic (range 1) | Gains +1 ATK permanently each time it takes damage |
| Spawner | 18 | 0 | 1 | 0 | — | Immobile. Spawns 1 Laser Scout adjacent at start of each enemy turn |
| Bruiser | 36 | 7 | 2 | 1 | Basic (range 1) | **Charge:** telegraphed turn before — locks onto a cardinal direction, then moves up to 4 tiles in a straight line. Any player unit in the path takes 3 collision damage and is knocked 1 tile sideways. **Throw:** also telegraphed one turn ahead. Hurls an adjacent unit `max(1, 4 − target MOV)` tiles. Wall collision: +3 damage. Charge → Throw across two turns is the nightmare combo. |

*Elite units:*

| Unit | HP | ATK | DEF | MOV | Attack Type | Special |
|---|---|---|---|---|---|---|
| Alpha Squealer | 14 | 8 | 0 | 3 | — | Explodes on command (uses attack action). Does NOT die from its own explosion. Can explode twice per combat |
| Devastator | 20 | 6 | 2 | 2 | Projectile (range 6) | Piercing + applies Burn 1 on every unit hit in the line |
| Brood Mother | 22 | 2 | 2 | 0 | — | Immobile. Spawns 1 Laser Scout + 1 Laser Brute every 2 turns |

---

**Faction C — The Remnants**
Former soldiers from the old tech/magic war, partially assimilated by the Threat. They carry fragments of both worlds.

Mechanical identity: **Echo Shields.** Every Remnant unit adapts to whatever just hit it — and the first wound never closes.

**Echo Shield rules:**
- The **first attack type** to land on a Remnant in a combat becomes a **permanent immunity** for that unit — that type can never damage it again for the rest of the fight.
- All subsequent attack types follow **per-turn echo shield** rules: immune to that type for the rest of the current turn, resets at the start of the next player turn.
- Once locked, the permanent immunity is **visible on the unit** — a cracked icon showing the blocked type.
- Each Remnant tracks its own immunities independently.

**Strategic implication:** your opening hit on each Remnant is a sacrifice. Choose carefully which attack type you burn permanently. In co-op, this forces explicit communication: *"I'm locking out Projectile on the left Wraith — everyone hit it with Basic only."* Wrong call order and you might permanently seal off your squad's primary damage type. The first hit matters.

**Status effects (Burn, etc.) do not trigger echo immunity** — only direct attack type hits do. Cross-faction interactions (e.g. a Fire Tech Grunt burning a Remnant) do not interfere with echo adaptation.

Reward type: **Weapon or armor (random), always Rare+**

*Regular units:*

| Unit | HP | ATK | DEF | MOV | Attack Type | Special |
|---|---|---|---|---|---|---|
| Wraith Soldier | 12 | 4 | 1 | 3 | Projectile (range 3) | Echo Shield |
| Echo Brute | 20 | 5 | 2 | 2 | Basic (range 1) | Echo Shield. First hit immunity lasts 2 turns instead of 1 |
| Shard Caller | 10 | 3 | 0 | 3 | Projectile (range 4) | Echo Shield. Spawns an Echo Fragment (HP 6, DEF 2, immobile) that also carries Echo Shield |
| Phantom | 8 | 4 | 0 | 4 | Basic (range 1) | Echo Shield. Also cloaks after moving — untargetable for 1 turn, uncloaks on attack |
| Revenant | 14 | 4 | 1 | 2 | Basic (range 1) | Echo Shield. On first death: resurrects at 50% HP next turn. Second death permanent |

*Elite units:*

| Unit | HP | ATK | DEF | MOV | Attack Type | Special |
|---|---|---|---|---|---|---|
| Phantom Commander | 12 | 5 | 1 | 4 | Basic (range 1) | Echo Shield. Personal cloak + grants cloak to one adjacent ally once per combat |
| Echo Titan | 28 | 6 | 3 | 1 | Cleave (range 1) | Echo Shield. The first **two** attack types to land become permanent immunities (vs one for normal Remnants). Third and fourth hits still follow per-turn rules. Forces squads to field 3–4 attack types and coordinate the burn order carefully. |
| Revenant Lord | 16 | 4 | 2 | 2 | Projectile (range 3) | Echo Shield. Personal resurrection once. On death: revives the last-killed Remnant at 50% HP |

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
  ✅ Weapon charges / recharge system (replaces AP)
  ⬜ Character unlock triggers (meta-progression)
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
  ⬜ Steam Deck compatibility (controller input, UI scaling)
  ⬜ Unit customization at run start (appearance)
  ⬜ Challenge modes
  ⬜ Codex / lore system
  ⬜ Additional boss encounters
```

---

## 13. Open Questions

All design decisions resolved. See table below.

**Resolved:**

| Question | Decision |
|---|---|
| Initiative system | Zone of Control: if enemy within range 3 at deployment, that enemy acts first |
| Grid size | Variable per encounter — shape communicates the fight before it starts |
| Action order per turn | Split movement + charge-based attacks. Movement budget (moveRange) spent across multiple moves. Attacks gated solely by weapon charges (no hasAttacked flag). Exhausting weapons consume all remaining movement on attack. Non-exhausting weapons preserve movement for hit-and-run. Multi-attack turns possible with high-charge weapons. |
| Event nodes with negative outcomes | Yes — Blind Bet archetype. Temptation Events also escalate to harmful territory |
| Co-op unit ownership | Each player owns and controls their own squad of 3. 2–4 players supported (cap at 3 if 4-player proves overwhelming). |
| Healing between fights | No passive healing. HP is a run-long resource. Sources: events, Medkit mod, Mira |
| Dedicated mod nodes on DAG | Removed. Mods flow from combat rewards and events only |
| Weapon charges for Common weapons | 1 charge / 1 max / recharges 1 per turn, 0 mod slots. Reliable one attack per turn, never upgradeable. All weapons use charges — no infinite/special-casing. |
| Mod stacking | Duplicates upgrade the existing mod in-place (×2, ×3, etc.) — no new slot consumed. Binary effect mods and Cursed mods are non-stackable; duplicates grant a reroll token instead. |
| Weapon uniqueness per loadout | No restriction — multiple units can equip the same weapon type. Enables archetype squads (all snipers, all melee, mixed). In co-op, players can specialize entire squads around one role. |
| Remnants echo shield | Per-unit. The **first** attack type to hit a Remnant becomes **permanently immune** for that unit for the rest of combat (visible cracked icon). All other attack types: per-turn immunity (resets next turn). Status effects never trigger it. Echo Titan: first **two** hits become permanent immunities instead of one. Forces co-op squads to communicate and coordinate burn order. |
| Cover system | No partial cover. Terrain is binary — walls fully block movement and line of sight. If you have LOS, you have a clear shot. |
