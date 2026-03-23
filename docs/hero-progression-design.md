# Hero Progression Design — Paths, Subclasses & Replayability

*Written 2026-03-23. This is the target design. Not yet implemented.*

---

## The Problem

The current progression is flat: hero hits level 2, unlocks ability slot 2. Every run Kael does the same things, Syl does the same things. There's no reason to draft the same hero twice and expect a different experience.

We have 5 heroes. We need them to feel like 12+.

---

## The Solution: Paths

At **level 2** (after the first combat win), every hero chooses a **Path** — a subclass that locks in their playstyle for the rest of the run. The Path:

- Replaces or modifies their passive
- Grants a new ability at level 3 (path-specific)
- Grants a signature ability at level 4 (path-specific)
- Applies a small stat shift (+/- ATK, DEF, MOV, HP)

Mage gets **three** paths because her identity is the most generic right now. One of them (Arcanist) is gated behind an in-world condition.

The **path choice screen** replaces the normal Continue button on the level 2 post-combat card. Each path is shown as a card with: name, flavor line, stat change, modified passive, and the abilities it will unlock.

---

## Hero Path Designs

---

### KAEL — Vanguard

**Base (levels 1–2):**
- Level 1 ability: Shield Bash (melee, range 1, applies Stasis 1 turn on hit, costs 1 charge)
- Passive: none (currently)

**Level 2 Path Choice:**

#### Path A: BERSERKER
> *"Every kill makes the next one easier."*

- **Stat shift:** +2 ATK, –1 DEF
- **Passive overrides to:** On kill: gain +1 weapon charge (stacks each kill)
- **Level 3 ability:** Blood Frenzy — attack twice (1st hit full damage, 2nd hit at 50%). Both hits trigger kill passive.
- **Level 4 signature:** Rallying Cry — all allies gain +2 ATK for 2 turns. Resets on use.
- **Synergizes with:** Ryn's Battle Medic (sustain lets Berserker go full offense), Burn stacks from Pyromancer Syl (softens enemies for kill-trigger)

#### Path B: GUARDIAN
> *"He doesn't move. He doesn't have to."*

- **Stat shift:** –1 ATK, +3 DEF, +3 MaxHP
- **Passive overrides to:** Adjacent allies take 1 less damage from all sources.
- **Level 3 ability:** Taunt — force all enemies to target Kael only for 2 turns.
- **Level 4 signature:** Last Wall — negate all incoming damage to Kael AND adjacent allies for 1 full round.
- **Synergizes with:** Any ranged allies (Ryn, Syl) who benefit from being ignored, Frost Syl (freeze then taunt = enemies frozen AND taunted = free turns)

---

### SYL — Channeler

**Base (levels 1–2):**
- Level 1 ability: Arcane Bolt (lobbed, range 4, costs 1 charge — her basic becomes this; Focus is removed)
- Note: Arcane Overload replaces Focus as level 1 ability: spend 2 charges, deal 6 damage lobbed

**Level 2 Path Choice:**

#### Path A: PYROMANCER
> *"She stopped studying fire the day she became it."*

- **Stat shift:** +1 ATK, all attacks now apply **Burn 1** (1 turn) on hit as a passive
- **Passive:** Combustion — enemies adjacent to a Burning target take +1 damage from all sources
- **Level 3 ability:** Inferno — lobbed AoE (2×2 splash), deals 4 damage, applies Burn 3 for 2 turns. Costs 3 charges.
- **Level 4 signature:** Firestorm — hits ALL enemies on the board simultaneously, 3 damage each, Burn 2 for 1 turn. Costs 4 charges.
- **Synergizes with:** Any team with high single-target damage (Burn finishes low-HP enemies), Guardian Kael (Taunt bunches enemies for AoE)

#### Path B: FROSTWEAVER
> *"Patience. Let them come. They won't get far."*

- **Stat shift:** +1 attack range to ALL abilities, –1 ATK
- **Passive:** Brittle Ice — enemies with Stasis take +2 damage from next hit after thawing
- **Level 3 ability:** Ice Lance — projectile (not lobbed), range 6, applies Stasis 1 turn on hit. Costs 2 charges.
- **Level 4 signature:** Absolute Zero — apply Stasis to ALL enemies for 1 full turn. Costs all remaining charges (minimum 1).
- **Synergizes with:** Duelist Jin (Stasis + Mark = free double-damage setup), Shadow Jin (freeze enemies in place, then gap-close for kills)

#### Path C: ARCANIST *(gated — requires meeting Echo the Awakened)*
> *"She understood then: it wasn't magic. It was math. And she was very good at math."*

- **Unlock condition:** Echo (the Awakened robot) must have been encountered at least once in a previous run. Once that flag is set, Arcanist appears as an option.
- **Stat shift:** +3 ATK, –5 MaxHP, abilities have no charge cost but cost **3 HP each**
- **Passive:** Resonant Stack — each ability use this combat increases next ability's damage by +1 (resets on new combat)
- **Level 3 ability:** Singularity — pull all enemies 1 tile toward a target point, then deal 4 damage to all pulled units. Costs 6 HP.
- **Level 4 signature:** Reality Tear — single-target, deals damage equal to Syl's **missing HP** × 2. A near-dead Syl is at her most dangerous.
- **Synergizes with:** Battle Medic Ryn (keeps Syl alive at low HP for Reality Tear), Guardian Kael (Syl can freely burn HP knowing she's protected)
- **Anti-synergy warning:** Burn self-damage mods make Arcanist risky. Rewarded.

---

### RYN — Arcane Archer

**Base (levels 1–2):**
- Level 1 ability: Heal Individual (targeted, range 3, heal 4, costs 1)
- Passive: Lifesteal 1 (heals 1HP on each successful hit)

**Level 2 Path Choice:**

#### Path A: BATTLE MEDIC
> *"She'll shoot you and then patch you up. In that order."*

- **Stat shift:** +4 MaxHP, lifesteal increases to 2
- **Passive overrides to:** Lifesteal 2 + whenever Ryn heals any unit, her next attack deals +2 damage
- **Level 3 ability:** Mending Field — all allies begin regenerating 2HP per turn for 3 turns. Costs 2 charges.
- **Level 4 signature:** Last Breath — revive one fallen ally with 5HP. 1× per run. Costs all charges.
- **Synergizes with:** Berserker Kael (sustain lets Berserker chain kills), Arcanist Syl (keep Syl alive near death for max Reality Tear)

#### Path B: ARCANE HUNTER
> *"She stopped aiming for center mass. She started aiming for the one behind him."*

- **Stat shift:** +2 attack range, –2 MaxHP
- **Passive overrides to:** Pierce — projectile attacks pass through 1 enemy unit (hitting both)
- **Level 3 ability:** Storm Arrow — fire at ALL enemies in range simultaneously, 1 shot each. Costs 3 charges.
- **Level 4 signature:** Arcane Barrage — fire 5 shots that can target any enemy (player chooses split per shot). 3 damage each. Costs all charges (min 2).
- **Synergizes with:** Stasis effects (frozen enemies can't dodge pierce), Duelist Jin (Jin marks → Ryn's pierce triggers the double-damage mark on first hit)

---

### JIN — Samurai

**Base (levels 1–2):**
- Level 1 ability: Deflect (thorns_buff, absorb next hit, costs 1)
- Passive: Stationary Bonus (+1 ATK when unmoved this turn)

**Level 2 Path Choice:**

#### Path A: DUELIST
> *"He picks one. Just one. And that's enough."*

- **Stat shift:** Stationary bonus increases to +2 ATK (was +1), –1 MOV
- **Passive overrides to:** Stationary Bonus +2 ATK + Mark Bonus — if target is Marked, damage is tripled instead of doubled
- **Level 3 ability:** Precision Strike — single melee attack that ignores DEF entirely. Costs 2 charges.
- **Level 4 signature:** Decisive Blow — next attack deals a flat 12 damage regardless of DEF, status, or buffs. Costs all charges.
- **Synergizes with:** Any Mark application (Ryn's Arcane Hunter pierce applies Marked), Stasis from Frostweaver (frozen = stationary = Jin's bonus applies)

#### Path B: SHADOW
> *"He was there. Then he wasn't. Then someone fell over."*

- **Stat shift:** +1 MOV, Stationary Bonus passive removed
- **Passive overrides to:** First Strike — first attack each combat deals double damage
- **Level 3 ability:** Shadow Step — teleport to any unoccupied tile within range 4, then immediately attack an adjacent enemy. Counts as moved (no stationary bonus, but First Strike still applies turn 1).
- **Level 4 signature:** Thousand Cuts — attack every living enemy on the board once for (ATK–1) damage each. Cannot be blocked by Stasis.
- **Synergizes with:** Berserker Kael (split the enemies: Jin kills isolated ones, Kael charges the group), Pyromancer Syl (Syl burns, Jin picks off weakened stragglers)

---

### NED — Crusader (Legendary)

*Ned only gets path choice if he reaches level 2 in-run. Since he joins late via event, this is intentionally rare and rewarding.*

**Base:** Already a strong kit (Revolver, Quick Draw, Stationary Bonus +2 ATK). Paths make him extraordinary.

#### Path A: OUTLAW
> *"One rule: shoot first."*

- **Stat shift:** +1 MaxCharges, –1 DEF
- **Passive:** On kill, gain 1 charge (stacks). Stationary bonus remains.
- **Level 3 ability:** Double Tap — fire twice at same target in one action. 2nd shot at 75% damage. Costs 2 charges.
- **Level 4 signature:** Wanted Dead — apply Marked to all enemies simultaneously. Costs 1 charge.

#### Path B: IRON TIDE
> *"He's been shot at his whole life. It doesn't really do much anymore."*

- **Stat shift:** +2 DEF, –1 MOV (already slow), +5 MaxHP
- **Passive:** Armor Piercing — all ranged attacks ignore 1 DEF. Stationary bonus remains.
- **Level 3 ability:** Suppressing Fire — applies Stasis to target for 1 turn AND one tile behind target (projectile passes through). Costs 2 charges.
- **Level 4 signature:** Last Stand — Ned's next hit that would kill him instead leaves him at 1HP. For the next 2 turns his ATK doubles.

---

## Path Choice UX

The level 2 post-combat screen transforms: instead of the XP card showing "Continue," it expands into a **path selection panel**.

```
┌────────────────────────────────────────────────┐
│  SYL — Choose Your Path                        │
│  This choice defines the rest of this run.     │
│                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌────────┐ │
│  │ PYROMANCER   │ │ FROSTWEAVER  │ │ARCANE  │ │
│  │ +1 ATK       │ │ +1 Range     │ │(locked)│ │
│  │ Burns on hit │ │ –1 ATK       │ │Need    │ │
│  │              │ │              │ │Echo    │ │
│  │ Lvl 3:       │ │ Lvl 3:       │ └────────┘ │
│  │ Inferno      │ │ Ice Lance    │            │
│  │ (AoE + Burn) │ │ (Stasis)     │            │
│  └──────────────┘ └──────────────┘            │
└────────────────────────────────────────────────┘
```

- Locked paths (Arcanist without Echo) are shown greyed with the unlock condition
- Each path card is clickable — confirms immediately (no undo)
- If all heroes that leveled up are at a non-path level (3 or 4), normal Continue button

---

## Data Structure Changes

### RunState additions
```typescript
// Chosen path per hero for this run
heroPath: Record<string, string>  // characterId → pathId (e.g. 'pyromancer', 'shadow')
```

### CharacterData additions
```typescript
export interface HeroPath {
  id: string
  name: string
  flavor: string
  /** Shown in path choice card. */
  statLabel: string
  statModifiers: {
    atkMod?: number
    defMod?: number
    hpMod?: number
    movMod?: number
    rangeMod?: number  // applies to all attack ranges
  }
  /** Replaces the base passive while this path is active. */
  passiveOverride?: Passive
  /** Ability unlocked at level 3. */
  level3Ability: AttackProfile
  /** Signature ability unlocked at level 4. */
  level4Ability: AttackProfile
  /** Optional: meta-condition that must be met for this path to appear. */
  unlockCondition?: (meta: MetaState) => boolean
}

// CharacterDefinition gets:
paths?: Record<string, HeroPath>
```

### Ability resolution in GameUI
With paths, ability filtering becomes:
- Level 1: show `attacks[0]` (base attack / level 1 ability)
- Level 2: show `attacks[0]` + path choice happened → show `attacks[1]` (path entry ability)
- Level 3: show `attacks[0..1]` + `path.level3Ability`
- Level 4: show all + `path.level4Ability`

Base `attacks` array for path heroes shrinks to 2 entries (level 1 + path-entry ability), with levels 3–4 coming from the chosen path.

---

## How This Changes the Game Loop

### Current loop (flat):
```
Fight → Mod → Fight → Mod → Rest → Fight → Boss
```
Every fight feels similar. Mods differentiate builds but heroes themselves are static.

### New loop (path):
```
Fight → [PATH CHOICE: WHO IS SYL THIS RUN?] → fight Pyromancer-style →
Camp → [POWER SPIKE: level 3 unlocked] → Mini-boss →
[SIGNATURE UNLOCKED: level 4] → Boss with full kit
```

The **path choice moment** is a micro-decision that echoes through the entire run. Choosing Pyromancer Syl but then camping with Benito (spiced meat bonus) means next fight your ignited enemies melt faster. Everything starts to connect.

### Meaningful squad composition
Currently you pick 3 heroes and it doesn't really matter who. With paths:

- **Burst Squad:** Berserker Kael + Shadow Jin + Pyromancer Syl — pure glass cannon. Kill everything before it kills you.
- **Control Squad:** Frostweaver Syl + Duelist Jin + Guardian Kael — freeze, mark, burst one at a time. Safe and methodical.
- **Sustain Squad:** Guardian Kael + Battle Medic Ryn + Arcanist Syl — Syl deliberately stays near-death, Ryn keeps her there, Kael absorbs damage. Wild but viable.
- **Outlaw Squad:** Ned (Outlaw) + Shadow Jin + Arcane Hunter Ryn — all charge generation, all kills.

Different squads want different map routes. Guardian comp benefits from rest nodes; Burst comp wants to skip rest and rush.

---

## Replayability Multiplier

| Hero | Paths | Effective variants |
|------|-------|--------------------|
| Kael | 2 | 2 |
| Syl | 3 (1 gated) | 2–3 per run |
| Ryn | 2 | 2 |
| Jin | 2 | 2 |
| Ned | 2 | 2 (rare — Ned is legendary) |

3-hero party: 6×6×6 theoretical combinations, ~40+ meaningfully different squad feelings in practice due to synergies.

---

## Implementation Order

**Phase 1 — Foundation** *(~1 session)*
1. Add `HeroPath` type to CharacterData, `heroPath: Record<string, string>` to RunState
2. Define all 10 paths' static data in CharacterData (ability profiles, stat shifts)
3. Update `xpProgress()` in LevelUpScene to detect level-2 moments and show path choice
4. Path choice screen: expand the hero's XP card into a side-by-side path picker
5. Save chosen path to `runState.heroPath[charId]`

**Phase 2 — Ability resolution** *(~1 session)*
1. Update GameUI's ability filtering to pull from `path.level3Ability` and `path.level4Ability` instead of base `attacks` array at levels 3–4
2. Apply `path.passiveOverride` in DamageResolver when path is set
3. Apply `path.statModifiers` in Game.ts `spawnInitialUnits()` on top of base stats

**Phase 3 — New ability types** *(2–3 sessions)*
New AbilityTypes needed: `aoe_lobbed`, `pierce_projectile`, `teleport_attack`, `mass_mark`, `recharge_on_kill`, `revive`, `mass_stasis`
Implement each in CombatActions.useAbility()

**Phase 4 — Echo gating + meta flags** *(~1 session)*
Check meta-progression (awakenedBefriended.echo > 0) before displaying Arcanist path
Update EventScene / Awakened encounter to set the flag

**Phase 5 — Synergy hints** *(~0.5 session)*
Add a `synergies` string to HeroPath displayed on the path card
Minor UI: highlight compatible ally paths on the choice screen

---

## Open Questions

1. **Stat shift timing:** Path stats applied at choice moment or at combat start? Recommendation: at the next combat spawn (Game.ts reads heroPath and applies modifiers then). Means no immediate stat bump mid-run — it takes effect from the next fight.

2. **Arcanist HP-cost abilities:** Does this interact with Ryn's heal? Yes and intentionally — Arcanist + Battle Medic is a designed combo. Need to make sure HP cost doesn't trigger death; cap at leaving 1HP.

3. **Path reset between runs:** heroPath is per-run (in RunState, not meta). Every run you re-pick. Correct and intended.

4. **Ned joining mid-run:** If Ned joins at column 3 with `heroXp.ned = 0`, he starts at level 1 like everyone else but will level faster (fewer combats left). His path choice may never trigger. That's fine — Ned at level 1 is already strong. Getting his path is a bonus.

5. **What if you never fight?** Possible on a run heavy with events/rest. Heroes might stay at level 1 the whole time. The system degrades gracefully — base kit still works, no path choice needed.

---

## Respec & Attribute Reset System

*Addendum 2026-03-23.*

### The problem this solves

You pick Berserker Kael after your first fight. Two fights later the reward screen hands you a Frost Rune weapon — high range, applies Stasis, perfect for a Guardian who hangs back. Right now you're stuck. The weapon goes on Kael but fights against everything his path wants to do.

The respec system gives you **three natural moments** where you can revisit that choice, each with its own cost and narrative logic. Together they make gear and path feel genuinely reactive to each other.

---

### Architecture: why resets are clean

Path stat modifiers are **not stored persistently in RunState**. They are applied fresh at combat spawn in `Game.ts` by reading `runState.heroPath[charId]` and adding that path's `statModifiers`. This means:

- Resetting a path = `delete runState.heroPath[charId]`
- Next combat spawn: path modifiers are not applied, base stats used instead
- No reversal tracking, no diff state, no corruption risk

When a hero re-picks a path, the new path's modifiers apply at the start of the next fight. The player feels it immediately, same session.

---

### Respec Moment 1: The Crossroads (new map node)

**Placement:** Column 2 becomes a guaranteed single Crossroads node. Same pattern as rest at column 3 — one node, always there, player always passes through it.

**Updated map rhythm:**

```
Col 0  Combat (entry)
Col 1  Early mix: combat / event / camp
Col 2  CROSSROADS  (guaranteed)
Col 3  Rest        (guaranteed)
Col 4  Miniboss
Col 5  Elite
Col 6  Boss
```

Players learn this rhythm. After a few runs: "I'll take Berserker now and reassess at the Crossroads if I find a good ranged weapon." That planning layer is new and meaningful.

**Visual:** Larger octahedron geometry, amber-gold color `#ddaa44`. Pulses same as other selectable nodes.

**What the Crossroads offers — pick ONE action per visit:**

| Action | Cost | Effect |
|--------|------|--------|
| Path Reset | 30 gold | Hero immediately re-picks path within this screen |
| Mod Transfer | 15 gold | Move one equipped mod to a different hero (same slot type) |
| Stat Reallocation | 10 gold | Convert one run-wide bonus stat point: e.g. +1 ATK becomes +1 DEF |
| Leave | free | Continue with no changes |

One action total. You are making a trade, not editing a spreadsheet.

**Path re-pick UX:** When a path is reset, the hero's card expands inline to show the path choice options — same screen, no transition. Pick a path, card collapses, continue. The player leaves the Crossroads knowing exactly what they committed to.

---

### Respec Moment 2: Spar the Awakened (free, earned)

Spar is the combat-trained Awakened robot. It makes narrative sense that it offers training resets.

**First encounter:** freeing Spar offers one free Path Reset for any hero — no gold cost.

**Second encounter:** offers either another free reset OR reduces all future Crossroads costs by 10 gold for this run.

**Meta carry-forward:** `awakenedBefriended.spar` count in RunState gates a permanent Crossroads cost discount purchasable at the Brother Market after meeting Spar twice across runs.

---

### Respec Moment 3: The Quiet Room (elite event variant)

Roughly one-in-four elite nodes can roll as a Quiet Room instead of combat. Narrative: someone was training here alone, hard, for a long time. The space still feels charged.

**Options:**

```
"Train here"  Reset one hero's path. The whole party takes 3 damage from the effort.
"Leave it"    Continue to the map unchanged.
```

The damage cost makes it a real trade. Skip it if the party is already low. Take it if you desperately need Syl off Pyromancer before the boss. Implemented as an EventScene variant — no new node type needed.

---

### Gear awareness (soft signal)

Items and mods get an optional `preferredPaths` field in their data definition. This is purely informational — it does not change how the item works.

When a player picks a reward or buys from the shop, the system checks:
1. Does the selected item have `preferredPaths`?
2. Is the receiving hero on a different path?
3. If yes: show a small note below the item description.

Example note: *"Frost Rune synergizes with Frostweaver. Crossroads ahead."*

This turns item selection into map navigation. The player sees a great item, reads the note, knows there is a Crossroads coming, grabs the item, and plans to switch paths there. That sequence — find item, read hint, plan route, reach respec, commit — is a full loop that feels intelligent and earned.

Example annotations in item/mod data:

```
frost_rune:       preferredPaths: ['frostweaver']
berserker_chain:  preferredPaths: ['berserker']
ghost_cloak:      preferredPaths: ['shadow']
healing_sigil:    preferredPaths: ['battle_medic']
arcane_shard:     preferredPaths: ['arcanist', 'pyromancer']
```

---

### What can be reset — full table

| Reset | Clears | Cost | Available |
|-------|--------|------|-----------|
| Path Reset | heroPath[charId], immediate re-pick | 30g or free (Spar / Quiet Room) | Crossroads, Spar, Quiet Room |
| Mod Transfer | Moves a mod between heroes (same slot) | 15g | Crossroads |
| Stat Reallocation | Converts 1 bonus stat to another | 10g | Crossroads |
| Level or XP Reset | — | Never offered | — |

Heroes keep their level and XP regardless of path resets. Level tracks how much they have fought. Path tracks what they have chosen. The experience is permanent; the choice is revisable.

---

### How the full loop reads now

```
Fight 1  Heroes at level 1. Baseline kit only.
Reward   You find a Frost Rune. Hint: "synergizes with Frostweaver."
         Kael is Berserker. Jin has no path yet. Syl has no path yet.

Fight 2  First win. Syl hits level 2. PATH CHOICE: you pick Pyromancer
         because you haven't thought about the Frost Rune yet.
Reward   Another good item — this one fits Pyromancer.

Crossroads  You have 45 gold. You pay 30 to reset Syl to Frostweaver
            instead. The Frost Rune now makes sense.
            You also transfer a mod from Kael to Syl for 15g.
            You leave with 0 gold but a coherent build.

Rest     Recover HP. The team is set.

Fight 3  Syl hits level 3. Ice Lance unlocked.

Miniboss  Syl freezes the boss. Jin marks it. It dies in two hits.

Fight 4  Jin hits level 3. Shadow Step unlocked.

Elite    Jin teleports into the backline and kills the support unit
         before it can act.

Boss     Syl at level 4: Absolute Zero. Every enemy frozen for one turn.
         The whole party unloads.
```

The gear you found in fight 1 directly caused the boss kill. That throughline — item to hint to respec to build to payoff — is the replayability spine.

---

### Implementation order (Phase 3A–3C, after Paths Phase 1–2)

**Phase 3A — Crossroads node**
1. Add `'crossroads'` to `NodeType` in MapGraph
2. Update `generateMapGraph()`: col 2 becomes single crossroads node (same pattern as restCol)
3. Add crossroads geometry and color to MapRenderer (octahedron, `#ddaa44`)
4. Add route in MapScene for crossroads node type
5. Create `CrossroadsScene`: three action panels, gold cost check, inline path re-pick

**Phase 3B — Gear awareness hints**
1. Add `preferredPaths?: string[]` to `ItemDefinition` and `ModDefinition`
2. In `RewardScene` after mod/stat selection: check hero's current path against item's preferredPaths, render hint line if mismatch

**Phase 3C — Quiet Room and Spar**
1. Add quiet_room variant to the event pool for elite-column events
2. Wire Spar's encounter dialogue to offer free path reset

---

### Open questions

1. **What if you cannot afford anything at the Crossroads?** You pass through. Possible on a bad gold run. Future mitigation: Crossroads gives 10 gold just for visiting if you take no action — a small consolation that keeps it from feeling like a dead node.

2. **Mod Transfer validity:** Mods are slot-typed. You can only transfer weapon mods to heroes who have a weapon slot occupied. The Crossroads scene must show only valid transfer targets. If none exist, the action is greyed out.

3. **Stat Reallocation scope:** Only run-wide bonuses from rewards (`bonusAtk`, `bonusDef`, `bonusMaxHp`) are reallocatable. Path stat modifiers are not in scope — those are handled by path reset. Keeps the two systems cleanly separated.

4. **Does resetting a path mid-run affect the XP bar display?** No. Level and XP are untouched. The XP bar on the post-combat screen still shows correct level. The path badge on the bar changes to "Undecided" until re-picked, then updates.
