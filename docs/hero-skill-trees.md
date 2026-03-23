# Hero Skill Trees

*2026-03-23. Full 3-level branching trees for all 5 heroes.*
*New ability/passive types are tagged in brackets — see bottom of doc for implementation list.*

Each hero has:
- **Level 1** — one base ability, always unlocked
- **Level 2** — pick one of two branches (defines identity)
- **Level 3** — pick one of two within your branch (defines style)
- **Level 4** — pick one of two within your level-3 choice (defines signature)

8 builds per hero. 3-hero party = 512 combinations before gear or mods.

---

## KAEL — Vanguard

```
                    [Shield Bash]  L1
                    Melee, stuns target 1 turn. Cost 1.
                          │
             ┌────────────┴────────────┐
        [BERSERKER]               [GUARDIAN]          L2
        On kill: +1 ATK            Adjacent allies
        this combat (stacks)       take –1 damage
        [NEW: on_kill_atk]         [NEW: aura_ally_def]
             │                         │
      ┌──────┴──────┐           ┌──────┴──────┐
  [Blood Rush]  [Reckless    [Taunt]      [Cover]     L3
  On kill: move  Swing]       Force all    Reactive:
  2 free tiles   Whirlwind    enemies to   intercept
  after kill     costs 1c,    target Kael  a hit aimed
  [NEW:          Kael takes   for 2 turns  at adj ally
  on_kill_move]  1 dmg        [apply_taunt][NEW:
                              Cost 1       intercept]
      │              │           │             │
   ┌──┴──┐        ┌──┴──┐     ┌──┴──┐      ┌──┴──┐  L4
[Frenzy][Death  [Rampage][Battle  [Bulwark][Retaliat][Last [Iron
 Rush    March]  Remove   Cry]    While    ion]      Wall] Will]
 also    Rush    HP cost  After   taunted: Taunt:    Negate Cover
 gives   also    from     Reckless –2 dmg  each hit  ALL   also
 +1c     restores Reckless Swing,  taken   deals 1   ally  heals
 on kill full MOV Swing    allies  passive dmg back  dmg   ally
                  passive  +1 ATK          passive   1 rnd 2 HP
                           2 turns         Cost 0    Cost 3
```

### Kael tree — written out

**L1 — Shield Bash**
Melee range 1. Applies Stasis to target for 1 turn. Cost 1 charge. Exhausting.

---

**L2-A: BERSERKER** *(passive)*
On kill: +1 ATK this combat (stacks; resets between combats).
`[on_kill_atk_stack]`

**L2-B: GUARDIAN** *(passive)*
Adjacent allies take 1 less damage from all sources.
`[aura_ally_damage_reduction]`

---

**L3-A1: Blood Rush** *(from Berserker)*
On kill, immediately move up to 2 tiles for free (bonus movement, doesn't consume movementLeft).
`[on_kill_move]`

**L3-A2: Reckless Swing** *(from Berserker)*
Whirlwind costs 1 charge instead of 2, but Kael takes 1 damage when he uses it.
Passive upgrade to existing cleave — modifies cost/self-damage.

**L3-B1: Taunt** *(from Guardian)*
Force all enemies to target only Kael for 2 turns. Cost 1 charge.
`[apply_status: taunt]`

**L3-B2: Cover** *(from Guardian)*
Reactive passive: when an adjacent ally would take damage, Kael intercepts it instead (takes the hit).
`[intercept_for_ally]`

---

**L4-A1a: Frenzy** *(from Blood Rush)*
Blood Rush also grants +1 weapon charge on kill (in addition to free movement). Passive stacks with base.

**L4-A1b: Death March** *(from Blood Rush)*
Blood Rush now fully restores Kael's movement on kill instead of granting only 2 free tiles.

**L4-A2a: Rampage** *(from Reckless Swing)*
Removes the self-damage cost from Reckless Swing. Pure cost reduction.

**L4-A2b: Battle Cry** *(from Reckless Swing)*
After Reckless Swing, all living allies gain +1 ATK for 2 turns.
`[on_ability_buff_allies]`

**L4-B1a: Bulwark** *(from Taunt)*
While Taunt is active, Kael takes 2 less damage from all incoming hits.
`[conditional_damage_reduction: while_taunt]`

**L4-B1b: Retaliation** *(from Taunt)*
While Taunt is active, each hit Kael takes deals 1 damage back to the attacker automatically.
`[thorns_while_taunted]`

**L4-B2a: Last Wall** *(from Cover)*
Once per combat: negate all damage to ALL allies for 1 full round. Cost 3 charges.
`[mass_damage_negate]`

**L4-B2b: Iron Will** *(from Cover)*
Cover also heals the intercepted ally for 2 HP when it triggers.
Passive upgrade to Cover.

---

## SYL — Channeler

```
                 [Arcane Overload]  L1
                 Lobbed, 6 dmg. Cost 2 charges.
                         │
          ┌──────────────┼──────────────┐
     [PYROMANCER]   [FROSTWEAVER]  [ARCANIST]       L2
     All attacks     +1 range all   Abilities cost
     apply Burn 1    attacks        HP not charges
     on hit          passive        –5 MaxHP, +3 ATK
     [burn_on_all]   [range_all+1]  [NEW: hp_cost_caster]
     *Requires Echo encounter in prior run for ARCANIST
          │               │               │
     ┌────┴────┐      ┌───┴────┐      ┌───┴────┐
  [Inferno] [Combustion] [Ice Lance][Frost Nova][Singularity][Arcane Echo] L3
  2x2 AoE   Burning     Proj rng 6  AoE Syl   Pull all     Next ability
  lobbed 4  enemies     Stasis 1t   r2, Stasis foes 1 tile, this turn
  dmg Burn2 adj take    Cost 2      1t Cost 2  deal 4 dmg   costs 0 HP
  Cost 3    +1 dmg                  [aoe_melee] Cost 6 HP   [passive]
  [aoe_lob] passive                            [pull_aoe]   [reactive]
       │         │          │           │          │            │
   ┌───┴───┐ ┌───┴───┐  ┌───┴───┐  ┌───┴───┐  ┌───┴───┐  ┌───┴───┐ L4
[Fire  [Back- [Chain  [Melt] [Shatter][Perma- [Reality[Event
storm] draft] Reaction]      ]        frost]  Tear]   Horizon]
All    Inferno On burn Burn   Double   Stasis  Deal Syl Singularity
enemies AoE  death:  also   dmg on   lasts   missing  pulls from
3 dmg  3x3  adj     -1 DEF  Stasis   2 turns HP x2   range 6,
Burn 1 passive chain  while  target   passive to 1    Stasis
Cost 4        fire 2t burning passive  Cost 3HP target  all pulled
```

### Syl tree — written out

**L1 — Arcane Overload**
Lobbed, range 3, deals 6 damage. Cost 2 charges. Not exhausting.

---

**L2-A: PYROMANCER** *(passive)*
All attacks (both basic and abilities) apply Burn 1 (1 turn) to targets on hit.
`[burn_on_all_attacks]`

**L2-B: FROSTWEAVER** *(passive)*
+1 range added to all of Syl's attacks permanently (stacks with items/mods).
`[flat_range_all: +1]`

**L2-C: ARCANIST** *(passive — GATED: requires awakenedBefriended.echo > 0)*
Abilities cost HP instead of charges. –5 MaxHP, +3 ATK applied on path selection.
`[hp_cost_abilities]`

---

**L3-A1: Inferno** *(from Pyromancer)*
Lobbed, 2×2 AoE centered on target. Deals 4 damage to each unit in radius. Applies Burn 2 for 2 turns. Cost 3 charges.
`[aoe_lobbed, radius: 1]`

**L3-A2: Combustion** *(from Pyromancer)*
Passive: enemies adjacent to a Burning target take +1 damage from all sources.
`[proximity_burn_amplify]`

**L3-B1: Ice Lance** *(from Frostweaver)*
Projectile (not lobbed), range 6. Applies Stasis 1 turn on hit. Cost 2 charges.
`[projectile_stasis]`

**L3-B2: Frost Nova** *(from Frostweaver)*
AoE centered on Syl, hits all units within range 2. Deals 2 damage and applies Stasis 1 turn to each. Cost 2 charges.
`[aoe_self_centered, radius: 2]`

**L3-C1: Singularity** *(from Arcanist)*
Pull all enemies 1 tile toward a target point, then deal 4 damage to all pulled units. Costs 6 HP.
`[pull_aoe]`

**L3-C2: Arcane Echo** *(from Arcanist)*
Passive: once per turn, the next ability Syl uses costs 0 HP.
`[free_ability_once_per_turn]`

---

**L4-A1a: Firestorm** *(from Inferno)*
Hit ALL enemies on the board simultaneously, 3 damage each, Burn 1 for 1 turn. Cost 4 charges.
`[mass_aoe_attack]`

**L4-A1b: Backdraft** *(from Inferno)*
Inferno's radius expands to 3×3. Passive upgrade.

**L4-A2a: Chain Reaction** *(from Combustion)*
When a Burning enemy dies, adjacent enemies catch Burn 2 for 1 turn automatically.
`[on_kill_spread_burn]`

**L4-A2b: Melt** *(from Combustion)*
Burn also reduces DEF by 1 per stack while the target is burning.
`[burn_corrosion_combo]`

**L4-B1a: Absolute Zero** *(from Ice Lance)*
Apply Stasis to ALL enemies simultaneously for 1 full turn. Cost all remaining charges (minimum 1).
`[mass_stasis]`

**L4-B1b: Shatter** *(from Ice Lance)*
Attacking a unit that is currently in Stasis with any attack deals double damage.
`[stasis_damage_amplify]`

**L4-B2a: Permafrost** *(from Frost Nova)*
Stasis from Frost Nova and Ice Lance lasts 2 turns instead of 1. Passive upgrade.

**L4-B2b: Ice Armor** *(from Frost Nova)*
While Frost Nova is available (not used yet this combat), Syl takes 1 less damage from all hits.
`[conditional_damage_reduction: ability_available]`

**L4-C1a: Reality Tear** *(from Singularity)*
Single target. Deals damage equal to Syl's missing HP × 2. Costs 3 HP.
`[missing_hp_damage]`

**L4-C1b: Event Horizon** *(from Singularity)*
Singularity pulls from range 6 instead of 1 tile, and applies Stasis to all pulled units after impact. Passive upgrade.

**L4-C2a: Resonance** *(from Arcane Echo)*
Each ability use increases the next ability's damage by +1 (stacks; resets between combats).
`[ability_use_stack_dmg]`

**L4-C2b: Overload** *(from Arcane Echo)*
When Arcane Echo's free-cost triggers, the free ability deals +3 bonus damage.
Passive upgrade to Arcane Echo.

---

## RYN — Arcane Archer

```
               [Heal Individual]  L1
               Targeted heal +4. Cost 1.
                       │
            ┌──────────┴──────────┐
         [MEDIC]              [HUNTER]               L2
         Heal All now          +1 attack range
         costs 1c              to all ranged
         (was 2c)              attacks
         passive               passive
            │                      │
      ┌─────┴─────┐          ┌─────┴─────┐
  [Mending   [Purge]     [Storm     [Mark
   Field]             Arrow]     Target]             L3
  All allies  Remove    One shot   Apply
  regen 2 HP  all neg   at every   Marked
  per turn    statuses  enemy in   to one
  for 3 turns from ally range      target
  Cost 2      Cost 1    Cost 3     next hit
  [regen_all] [cleanse] [multi_proj]doubled
                                   Cost 1
                                   [apply_marked]
      │          │          │          │
  ┌───┴───┐ ┌───┴───┐  ┌───┴───┐  ┌───┴───┐      L4
[Last  [Surge] [Mass  [Retrib-[Arcane [Volley][Death [Hunter's
Breath]        Cleanse]ution]  Barrage]       Mark]  Instinct]
Revive Mending Purge   After   5 shots Storm  Mark   On Marked
1 ally Regen   hits all purge,  player  fires  ALL    kill: next
5 HP   also    allies  +2 dmg  chooses twice  enemies shot
1x/run +1 DEF  at once per     split   Cost 3 Cost 2  pierces
Cost   while           effect  Cost    total          1 enemy
all c  active  passive removed all c           [mass_mark]
[revive]                        [barrage]
```

### Ryn tree — written out

**L1 — Heal Individual**
Targeted heal: restore 4 HP to one ally. Range 3. Cost 1 charge.

---

**L2-A: MEDIC** *(passive)*
Heal All now costs 1 charge instead of 2. Passive cost reduction.

**L2-B: HUNTER** *(passive)*
+1 to attack range on all of Ryn's ranged attacks (stacks with mods).
`[flat_range_all: +1]`

---

**L3-A1: Mending Field** *(from Medic)*
All living allies gain Regen 2 (restore 2 HP at start of each player turn) for 3 turns. Cost 2 charges.
`[regen_all_buff]`

**L3-A2: Purge** *(from Medic)*
Remove all negative status effects from one targeted ally. Cost 1 charge.
`[cleanse_single]`

**L3-B1: Storm Arrow** *(from Hunter)*
Fire one shot at every enemy currently in range simultaneously (uses Ryn's ATK, not modified). Cost 3 charges.
`[multi_target_all_in_range]`

**L3-B2: Mark Target** *(from Hunter)*
Apply Marked status to one enemy: their next incoming hit deals double damage, then Marked is consumed. Cost 1 charge.
`[apply_status: marked]`

---

**L4-A1a: Last Breath** *(from Mending Field)*
Revive one fallen ally with 5 HP. 1× per run. Cost all charges.
`[revive_ally]`

**L4-A1b: Surge** *(from Mending Field)*
Mending Field also grants +1 DEF to all affected allies while the regen is active.
Passive upgrade.

**L4-A2a: Mass Cleanse** *(from Purge)*
Purge now hits all allies simultaneously instead of one. Passive upgrade.

**L4-A2b: Retribution** *(from Purge)*
After Purge removes any status effects, Ryn's next attack deals +2 damage per effect removed.
`[on_cleanse_atk_buff]`

**L4-B1a: Arcane Barrage** *(from Storm Arrow)*
Fire 5 shots. Player assigns each shot to any visible enemy (can stack on one target). 3 damage each. Cost all charges (min 2).
`[player_split_barrage]`

**L4-B1b: Volley** *(from Storm Arrow)*
Storm Arrow fires a second wave immediately after the first at no extra charge cost.
Passive upgrade — doubles the hits.

**L4-B2a: Death Mark** *(from Mark Target)*
Mark Target now applies Marked to ALL enemies simultaneously. Cost 2 charges.
`[mass_mark]`

**L4-B2b: Hunter's Instinct** *(from Mark Target)*
When a Marked enemy is killed by any source, Ryn's next projectile attack pierces through 1 enemy.
`[on_marked_kill_pierce]`

---

## JIN — Samurai

```
                  [Deflect]  L1
                  Absorb next incoming hit. Cost 1.
                        │
           ┌────────────┴────────────┐
       [DUELIST]                [SHADOW]             L2
       Stationary bonus         First attack each
       doubles: +2 ATK          combat deals
       when unmoved             double damage
       (was +1)                 [first_strike]
           │                         │
     ┌─────┴─────┐             ┌─────┴─────┐
 [Precision  [Counter]   [Shadow     [Vanish]        L3
  Strike]                Step]
  Melee, ignores  After    Teleport    Untargetable
  DEF entirely.   Deflect  range 4,    for 1 turn.
  Cost 2.         counter  attack adj  Enemies can't
  Exhausting.     for ATKx2 enemy.     select Jin.
  [ignore_def]    Cost 0   Cost 2      Cost 1
                  reactive [teleport_  [untargetable]
                  [counter_attack]      attack]
     │               │          │           │
 ┌───┴───┐       ┌───┴───┐  ┌───┴───┐  ┌───┴───┐   L4
[Decisive[Blade [Perfect [Riposte] [Thousand[Phase [Assassin-[Death
Blow]    Mastery]Parry]            Cuts]    Strike]ate]       from
Flat 12  Precision Deflect Counter  Attack   Shadow Tripleshot Shadows]
damage  Strike   reflects also     every    Step   after     While
ignore  no longer dmg back applies  enemy   lands  Vanish    vanished
all     exhausts  to     Marked    once     adj,   ends      free
Cost    passive   attacker passive  ATKminus1 double passive   move
all c             passive          Cost all dmg               passive
[flat_dmg]                         [multi_all][phase_teleport]
```

### Jin tree — written out

**L1 — Deflect**
Absorb the next incoming hit completely (reactiveShieldActive). Cost 1 charge.

---

**L2-A: DUELIST** *(passive)*
Jin's stationary ATK bonus doubles from +1 to +2 ATK when he has not moved this turn.
Passive upgrade — modifies existing stationary_bonus value.

**L2-B: SHADOW** *(passive)*
Jin's first attack each combat deals double damage.
`[first_strike_passive]`

---

**L3-A1: Precision Strike** *(from Duelist)*
Single melee attack, range 1. Ignores DEF entirely — damage is unmodified by defender's defense stat. Cost 2 charges. Exhausting.
`[ignore_def_attack]`

**L3-A2: Counter** *(from Duelist)*
Reactive passive: after a successful Deflect absorbs a hit, immediately counter-attack the attacker for ATK×2 damage.
`[reactive_counter_attack]`

**L3-B1: Shadow Step** *(from Shadow)*
Teleport to any unoccupied tile within range 4, then immediately attack one adjacent enemy. Cost 2 charges.
`[teleport_then_attack]`

**L3-B2: Vanish** *(from Shadow)*
Jin becomes untargetable for 1 full turn — enemies cannot select him as a target. Cost 1 charge.
`[untargetable_buff]`

---

**L4-A1a: Decisive Blow** *(from Precision Strike)*
Jin's next single attack deals flat 12 damage, bypassing all DEF, status effects, and modifiers. Cost all charges.
`[flat_damage_nuke]`

**L4-A1b: Blade Mastery** *(from Precision Strike)*
Precision Strike no longer exhausts Jin. He retains remaining movement after using it.
Passive upgrade.

**L4-A2a: Perfect Parry** *(from Counter)*
Deflect now reflects the full incoming damage back to the attacker rather than just absorbing it.
Passive upgrade to Deflect + Counter interaction.

**L4-A2b: Riposte** *(from Counter)*
Counter-attack also applies Marked to the target (next hit on them is doubled).
`[counter_applies_marked]`

**L4-B1a: Thousand Cuts** *(from Shadow Step)*
Attack every living enemy on the board once for ATK–1 damage each. Cannot miss stasis targets. Cost all charges.
`[multi_target_all_enemies]`

**L4-B1b: Phase Strike** *(from Shadow Step)*
Shadow Step's attack deals double damage on arrival. No extra cost — passive upgrade.

**L4-B2a: Assassinate** *(from Vanish)*
First attack after Vanish ends deals triple damage instead of Jin's normal double (first_strike).
Passive upgrade that extends/replaces first_strike after Vanish.

**L4-B2b: Death from Shadows** *(from Vanish)*
While Vanished, Jin can move freely without spending movementLeft.
`[free_movement_while_vanished]`

---

## NED — Crusader *(Legendary)*

```
                 [Quick Draw]  L1
                 Two shots, 2nd at 75% dmg. Cost 2.
                       │
            ┌──────────┴──────────┐
        [OUTLAW]              [IRON TIDE]            L2
        On kill: +1 weapon     All shots ignore
        charge (stacks)        1 DEF permanently
        [on_kill_charge]       [armor_pierce_passive]
            │                       │
      ┌─────┴─────┐           ┌─────┴─────┐
  [Fan the    [Deadeye]   [Dig In]   [Suppress-
   Hammer]               ing Fire]              L3
  3 shots at  Next attack  Can't move: Shoot:
  3 different ATKx2 dmg.   +3 DEF     Stasis to
  enemies in  Single shot. +2 ATK     target AND
  range.      Cost 1.      this turn. tile behind
  Cost 2.     [atk_double] Cost 0.    them. Cost 2.
  [spread_3]               [self_fort][pierce_stasis]
      │           │            │           │
  ┌───┴───┐   ┌───┴───┐   ┌───┴───┐   ┌───┴───┐   L4
[Hail of [Stagger][Wanted[Execution][Last  [Fortify][Fusi-  [Lock-
Lead]     ]        Dead]           Stand]          llade]  down]
5 shots  Each     Mark   Killing   Survive  While  All     Stasis
not 3    Fan hit  ALL    Marked    killing  Dug In enemies  from
passive  Stasis  enemies with      blow at  adj     in line Suppress
upgrade  1t each Cost 1  Deadeye:  1 HP,   allies  not just lasts
         passive [mass   reset     ATKx2   +1 DEF  behind  2 turns
                 _mark]  charges   2 turns  passive [pierce] passive
                         passive   1x/cmbt
```

### Ned tree — written out

**L1 — Quick Draw**
Fire twice at the same target. First shot at full ATK, second at 75% ATK. Cost 2 charges. Not exhausting.

---

**L2-A: OUTLAW** *(passive)*
On kill: gain 1 weapon charge. Stacks — each kill in a combat gives another charge.
`[on_kill_charge]`

**L2-B: IRON TIDE** *(passive)*
All of Ned's ranged attacks permanently ignore 1 point of the target's DEF.
`[flat_armor_pierce_passive]`

---

**L3-A1: Fan the Hammer** *(from Outlaw)*
Fire 3 shots at 3 different enemies in range (no double-targeting). Cost 2 charges.
`[multi_target_spread: 3]`

**L3-A2: Deadeye** *(from Outlaw)*
Next attack this turn deals ATK×2 damage. Single shot. Cost 1 charge.
`[atk_double_next_shot]`

**L3-B1: Dig In** *(from Iron Tide)*
Ned cannot move this turn but gains +3 DEF and +2 ATK until end of turn. Synergizes with stationary_bonus passive. Cost 0.
`[self_fortify_no_move]`

**L3-B2: Suppressing Fire** *(from Iron Tide)*
Shot applies Stasis to the target AND to the enemy directly behind them in the firing line. Cost 2 charges.
`[pierce_stasis_shot]`

---

**L4-A1a: Hail of Lead** *(from Fan the Hammer)*
Fan the Hammer fires 5 shots instead of 3. Passive upgrade.

**L4-A1b: Stagger** *(from Fan the Hammer)*
Each hit from Fan the Hammer applies Stasis 1 turn to that target.
`[on_hit_stasis: per_shot]`

**L4-A2a: Wanted Dead** *(from Deadeye)*
Apply Marked to ALL enemies simultaneously. Cost 1 charge.
`[mass_mark]`

**L4-A2b: Execution** *(from Deadeye)*
Killing a Marked enemy with any attack resets Ned's charges to max immediately.
`[on_marked_kill_recharge]`

**L4-B1a: Last Stand** *(from Dig In)*
Once per combat: survive a killing blow at 1 HP. For the next 2 turns, Ned's ATK doubles.
`[death_survive_atk_boost]`

**L4-B1b: Fortify** *(from Dig In)*
While Dug In is active, adjacent allies gain +1 DEF.
`[aura_while_ability_active]`

**L4-B2a: Fusillade** *(from Suppressing Fire)*
Suppressing Fire now pierces through ALL enemies in the firing line (true pierce, not just the one behind).
`[full_pierce_projectile]`

**L4-B2b: Lockdown** *(from Suppressing Fire)*
Stasis from Suppressing Fire lasts 2 turns instead of 1. Passive upgrade.

---

## New Types Required for Implementation

### New AttackKinds
| Tag | Behavior |
|-----|----------|
| `aoe_lobbed` | Lobbed that hits all units within radius of impact point. AttackProfile needs `radius: number`. |
| `pierce` | Projectile that continues through all units in its line. |
| `multi_spread` | Fires N shots at N different enemies in range. AttackProfile needs `shotCount: number`. |

### New AbilityTypes
| Tag | Behavior |
|-----|----------|
| `apply_status` | Applies a specific StatusType to target(s). AttackProfile needs `statusType: StatusType`, `statusValue: number`, `statusDuration: number`. |
| `aoe_self_centered` | Hits all units within radius of caster. AttackProfile needs `radius: number`. |
| `pull_aoe` | Pull all enemies 1 tile toward a target point, then deal damage. |
| `regen_buff` | Grant regen X HP/turn for N turns to target(s). `healAmount` per tick, `duration`. |
| `cleanse` | Remove all negative statuses from target. |
| `untargetable_buff` | Caster cannot be selected by enemy AI for N turns. |
| `teleport_attack` | Teleport to tile in range, then attack adjacent enemy. AttackProfile needs `teleportRange: number`. |
| `revive` | Revive a dead ally with X HP. 1× per run flag needed in RunState. |
| `mass_mark` | Apply Marked to all enemies simultaneously. |
| `multi_barrage` | Player assigns N shots among visible enemies. |
| `self_fortify` | Grant self +X DEF and +Y ATK for rest of turn, disables movement. |
| `mass_aoe` | Hit all enemies on board simultaneously. |

### New PassiveTypes
| Tag | Behavior |
|-----|----------|
| `on_kill_atk_stack` | +X ATK on each kill this combat. |
| `on_kill_charge` | +1 weapon charge on each kill. |
| `on_kill_move` | Free movement bonus after kill. |
| `aura_ally_damage_reduction` | Adjacent allies take –X damage. |
| `first_strike` | First attack each combat deals double damage. |
| `reactive_counter` | After absorbing a hit via Deflect: counter-attack. |
| `intercept_for_ally` | Redirect incoming ally hit to self. |
| `on_cleanse_atk_buff` | After Purge: next attack +X dmg per effect removed. |
| `on_marked_kill_pierce` | After killing a Marked target: next shot pierces. |
| `on_marked_kill_recharge` | After killing a Marked target: recharge to full. |
| `armor_pierce_passive` | All attacks ignore X DEF. |
| `missing_hp_damage` | Damage scales with caster's missing HP. |
| `hp_cost_abilities` | Abilities cost HP instead of charges. |
| `conditional_damage_reduction` | –X damage taken while condition is active (taunting, ability available, etc.). |
| `free_ability_once_per_turn` | Once per turn, next ability costs 0 HP/charges. |
| `ability_use_stack_dmg` | Each ability use +1 damage to next ability (stacks). |
| `burn_on_all_attacks` | Every attack applies Burn 1 on hit. |
| `range_all_plus` | +X range to all attacks. |
| `death_survive_atk_boost` | Survive lethal hit at 1 HP; ATK doubles for N turns. |
| `aura_while_ability_active` | Grant ally buff while a specific condition holds. |
| `stasis_damage_amplify` | Attacks on Stasis targets deal double damage. |
| `proximity_burn_amplify` | Enemies adjacent to Burning targets take +X damage. |
| `on_kill_spread_burn` | On kill of Burning enemy: spread Burn to adjacent. |
| `free_movement_while_vanished` | No movement cost while untargetable. |

### AttackProfile fields to add
```typescript
radius?: number          // for aoe abilities
teleportRange?: number   // for teleport_attack
shotCount?: number       // for multi_spread
statusType?: StatusType  // for apply_status
statusValue?: number
statusDuration?: number
hpCost?: number          // for Arcanist hp-cost abilities
flatDamage?: number      // for abilities with fixed damage (Decisive Blow)
```

### RunState fields to add
```typescript
heroPath: Record<string, string>           // already planned
usedReviveThisRun: Record<string, boolean> // tracks Last Breath 1x/run
```
