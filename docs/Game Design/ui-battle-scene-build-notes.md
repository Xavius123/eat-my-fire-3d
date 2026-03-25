# Battle scene UI — build notes (reference layout)

*Purpose: dissect a **tactical battle HUD** layout for implementation planning. Patterns are genre-standard; art and branding must be original for Eat My Fire 3D.*

**Related:** [GDD.md](GDD.md) §8 (Combat), [ui-map-run-build-notes.md](ui-map-run-build-notes.md) (overworld between fights), [lokr-inspired-patterns-emf3d.md](lokr-inspired-patterns-emf3d.md).

---

## Reference image

If you saved a screenshot locally for the team, drop a copy under `docs/Game Design/reference/` (e.g. `battle-hud-reference.png`) and link it here so the doc stays portable in git. Cursor may store attachments outside the repo path.

---

## Screen regions (high level)

```
┌─────────────────────────────────────────────────────────────┐
│  [?] Help / codex                    [⚙] Settings           │
│              ┌── Turn order / initiative strip ──┐           │
│              │  ◀ current … upcoming … ▶        │           │
│              └───────────────────────────────────┘           │
│                                                              │
│                    [ 3D / isometric battlefield ]            │
│                    hex/square grid, highlights               │
│                                                              │
│  ┌─ Active unit panel ─┐                    ┌─ End turn ─┐  │
│  │ portrait, HP,       │                    │  [shield]  │  │
│  │ resource bar,       │                    │  key: E    │  │
│  │ skills [1][2]…      │                    └────────────┘  │
│  └─────────────────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Components to build

### 1. Initiative / turn order (top center)

| Element | Behavior |
|--------|----------|
| Strip | Horizontal list of **all combatants** (party + enemies) in **resolution order** for this round or full queue (product decision). |
| Current actor | First slot (or highlighted slot): **gold border**, distinct icon (e.g. “sun” / active pips), always mirrors **who is acting now**. |
| Faction read | **Color backdrop** per side (e.g. ally vs enemy) so scan is instant. |
| Interaction | Optional: **click portrait** to camera-focus or open **inspect** (see §5). |

**Implementation notes**

- Data: ordered list of `unitId` from `TurnManager` (or equivalent).
- Re-sorts when: turn advances, unit dies, rare effects reorder initiative (if you add them later).

### 2. Active unit panel (bottom left)

| Element | Behavior |
|--------|----------|
| Large portrait | **Currently selected** unit — usually same as current actor unless you allow “view other friendly” while enemy acts (often disabled). |
| HP | Segmented or continuous bar; show **numeric** optional (accessibility / elite players). |
| Secondary resource | Second bar (mana / stamina / “focus”) — map to **EMF3D weapon charges** or future ability costs; label in fiction. |
| Abilities | **Square buttons** with **hotkeys 1–N**; show **cooldown/charges** on the icon. |
| Disabled state | Grey + reason tooltip (“no LOS”, “no charges”, “wrong phase”). |

**Implementation notes**

- Bind panel to **single source of truth**: `activeUnitId` + `availableActions`.
- Skills: 2–4 visible is typical; overflow = “more” wheel or pagination.

### 3. End turn / Defend (bottom right)

| Element | Behavior |
|--------|----------|
| Primary | Large circular **End Turn** (or **Defend** if you merge “pass” into one verb). |
| Hotkey | e.g. **E** — must not conflict with movement. |
| States | Disabled while **mandatory** action unresolved (e.g. must place unit); pulse hint for new players. |

**EMF3D alignment**

- “End turn” clears remaining **movement** and advances phase; matches charge-based attacks in [GDD.md](GDD.md) §8.

### 4. Help / character details (top left)

| Element | Behavior |
|--------|----------|
| **?** button | Opens **modal** or **sidebar**: rules help, or **party inspect**, or both tabs. |
| Your note | On click: **details about all characters** — implement as **tabbed roster** (everyone’s HP, buffs, traits) + optional **per-unit drill-down** (stats, passives, equipment summary). |
| Hotkey | e.g. **Q** — document in settings / rebind screen. |

**Implementation notes**

- **Live data**: same stat pipeline as tooltips on hover over initiative portraits.
- **Pause**: optional pause game while modal open (single-player); in co-op, use non-blocking panel or host rule.

### 5. Settings (top right)

- **Gear** → audio, controls, **rebinds**, accessibility (UI scale, colorblind-friendly team colors).

---

## Battlefield layer (non-HUD but coupled)

| Element | Behavior |
|--------|----------|
| Grid | **Hex** (reference game) vs **square** (current EMF3D GDD); same UX: range rings, path preview. |
| Cursor | Glove / pointer on **active** unit tile — reinforces who owns the input. |
| World HP | Small bars **above units**; keep consistent with bottom-left panel totals. |
| Props | Fountain, stalls = **blockers** or **cover** per your rules — art vs gameplay collision aligned. |

### Movement tile highlights (two-step feedback)

Pattern to emulate: **reachable** tiles read differently from **chosen destination**.

| Phase | Visual | Meaning |
|-------|--------|---------|
| **1 — Range preview** | All tiles the unit **can legally enter** this turn use a **soft highlight** — e.g. **semi-transparent white / light grey outline** or faint fill. Impassable / occupied / out-of-range tiles stay normal. |
| **2 — Destination picked** | The **clicked** tile switches to a **strong fill** (e.g. **solid blue**) to show “I am moving here.” Active unit’s **current** tile can stay **blue** or a second accent so **origin vs destination** never confuse. |
| **3 — Resolve** | Play move animation along path; clear range highlights; update position. |

**Optional:** If you want a confirm step, keep phase 2 as “pending” until **second click** or **Enter**; for snappier feel, phase 2 **immediately** commits move (still keep the blue flash so the player sees the pick).

**EMF3D:** Same logic on a **square** grid — only the mesh changes.

---

## Targeting & attack confirmation (move → select → confirm icon)

Reference pattern: after **moving** into range, the player **chooses a target**, then commits the attack with an explicit **confirm** affordance (e.g. a **floating action chip** over the enemy) instead of a single click doing everything. This reduces mis-clicks and reads clearly on controller/touch later.

### Flow

| Step | Player action | Feedback |
|------|----------------|----------|
| **1 — Move** | Click a **highlighted** tile in range; that tile goes **solid blue** (destination); resolve path. | Active unit tile: **strong tint** (e.g. blue). **Range:** soft outline/fill on all movable tiles (**see “Movement tile highlights”** above). |
| **2 — Select** | Choose **basic attack** or a **skill** (hotkey / HUD button). Cursor / hover **highlights one valid target** (or tile for AoE). | Intended enemy gets a **hostile outline** (e.g. red stroke). Optional: target stand tile uses a **secondary tint** (e.g. yellow/orange) for “pending target.” |
| **3 — Confirm** | Click the **floating confirm control** above the target (icon = attack type or skill). | Glove cursor on the icon; on success, play attack animation and resolve. **Do not** resolve the attack on step 2 alone if you adopt this pattern — confirmation is deliberate. |

### Floating confirm control (world-space UI)

| Property | Notes |
|----------|--------|
| Placement | **Billboard** or screen-offset above target’s head/chest; clamp so it stays on-screen near edges. |
| Shape | Hex plate, circle, or branded chip — must read as **button**, not decoration. |
| Icon | Sword for basic attack; skill icon for abilities; greyed + tooltip if invalid. |
| Alternatives | **Enter** / **Space** = confirm current hover target; **Esc** = cancel targeting. Keeps keyboard parity with mouse. |

### Implementation sketch

- **States:** `Idle` → `Moving` → `ActionPending` (skill selected) → `Targeting` (hover valid) → `ConfirmAvailable` (show floating UI) → `Resolve` → back to `Idle` or next unit.
- **Single target:** one confirm widget instance, bound to `pendingTargetId`.
- **Multi-hit / cleave:** either confirm once for whole pattern, or cycle targets — pick one rule and stick to it in tutorials.

### EMF3D tie-in ([GDD.md](GDD.md) §8)

- **Exhausting weapons:** after confirm + resolve, consume **remaining movement** as today.
- **Charges:** disable confirm if `charges < cost`; floating icon shows **why** (empty pip, red slash).

---

## Input & flow (suggested state machine)

1. **SelectMove** — show **range preview** (soft highlights); click destination → **blue destination** tile; path executes; remaining MOV updates; active unit shows “ready” base on new tile.
2. **SelectSkill** — press 1–N or click icon → enter **Targeting** if the action needs a target or tile.
3. **Targeting** — hover highlights valid tiles/units; selected target gets outline + **floating confirm icon** (see section above).
4. **ConfirmAction** — click icon (or bound key) to **commit**; resolve damage/effects.
5. **EndTurn** — E or button → hand off to next initiative entry.

Edge cases: **cancel** returns to move or skill selection without spending charges; **skip / pass** for class passives (if you add later); **undo** last move only (optional casual mode).

---

## Victory & post-battle (MVP — keep simple)

When combat ends in a **win**, block input on the battlefield and show a lightweight overlay. Full loot/mod breakdown can come later ([GDD.md](GDD.md) reward flow); for now prioritize **clear state** + **one continue control**.

| Element | MVP behavior |
|--------|----------------|
| **Backdrop** | Dim or blur the frozen battle / map frame so the modal reads as “modal.” |
| **Title** | Large **VICTORY** (or your fiction: “Sector clear”, “Fracture sealed”) — plain text or simple banner art. |
| **Primary action** | **Continue** control anchored **bottom-right** (arrow chip, pill button, or text). Click advances to the **next scene** (reward pick, map, or run summary — whatever your pipeline already uses). |
| **Keyboard** | **Enter** / **Space** = same as Continue. |
| **Defeat** | Mirror with **DEFEAT** / **Run ended** + Continue or **Main menu** — same corner affordance for consistency. |

**Flow:** `CombatResolved(win)` → show overlay → `OnContinue` → transition (no duplicate clicks; disable button while loading next scene).

**Later (not MVP):** trumpets, shield crest, XP/orb splash, stat recap — add when reward UX is specced.

---

## Art direction (yours)

- **Camera**: Fixed isometric / 3/4 — consistent with readable tactics.
- **Style**: Hand-painted readability, thick silhouette, **faction color** language — do not replicate another game’s characters or UI chrome.

---

## Build checklist (engineering)

- [ ] Initiative strip bound to turn queue + death/removal updates  
- [ ] Active panel bound to `activeUnit` + charge/HP sync  
- [ ] Skill buttons + keyboard 1–N + disabled reasons  
- [ ] End turn + optional defend/pass  
- [ ] Help modal: roster stats / rules tab  
- [ ] Settings + rebinds  
- [ ] Grid highlights: **move range** (soft) → **selected tile** (solid blue) → path resolve  
- [ ] Skill range + blocked tiles  
- [ ] Floating HP bars + selection cursor  
- [ ] Targeting: hostile outline + optional tile tint on pending target  
- [ ] Floating **confirm** control over target (icon + click / keyboard confirm)  
- [ ] Cancel targeting without spending charges or movement incorrectly  
- [ ] Victory overlay: dim field + title + **Continue** bottom-right (+ keyboard)  
- [ ] Defeat / abandon overlay with same interaction pattern  

---

## Open decisions (fill in as you lock design)

| Topic | Question |
|-------|----------|
| Initiative | Show **this round only** vs **full round queue**? |
| Camera | Lock rotation vs slight tilt adjust? |
| Co-op | Which HUD is **per-player** vs **shared**? |
