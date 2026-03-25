# Map / run UI — build notes (overworld & between fights)

*Purpose: layout for **choosing the next node**, reviewing **battle spoils**, managing **inventory**, and opening a **character sheet** to spend points on skills. Start **basic**; iterate toward full chrome.*

**Related:** [GDD.md](GDD.md) §7 (Map & progression), [ui-battle-scene-build-notes.md](ui-battle-scene-build-notes.md) (combat), [hero-progression-design.md](../hero-progression-design.md) (paths / levels — when implemented), [lokr-inspired-patterns-emf3d.md](lokr-inspired-patterns-emf3d.md).

---

## Screen layout (reference pattern)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [cur A] [cur B] …                              [⚙] Settings          │
├────┬──────────────────────────────────────────────────────────┬──────┤
│ P  │                                                          │ Inv  │
│ a  │     [ Illustrated map — paths, node icons ]             │ 6    │
│ r  │     e.g. skull = fight, flag = story, locked = …          │ slot │
│ t  │                                                          │ grid │
│ y  │                                                          │      │
│    │                                                          │      │
│ 3  │                                                          │      │
│ +  │                                                          │      │
│ up │                                                          │      │
└────┴──────────────────────────────────────────────────────────┴──────┘
```

| Region | Role (MVP → full) |
|--------|-------------------|
| **Top bar** | **Run resources** — e.g. gold + secondary currency (or single pool at first). Always-visible **settings** (gear). |
| **Left — party strip** | **All squad members** in the current run: portrait, short **HP/resource** readout, **upgrade indicator** (chevron / dot) when **promotion or skill choice** is available. **Click portrait** → **Character modal**. |
| **Center — map** | **Node graph** on a painted backdrop. Player picks **where to go next** by selecting an eligible node (connected, not locked). Icons communicate type: combat, elite, event, boss, etc. (align with [GDD.md](GDD.md) §7). |
| **Right — inventory** | **Grid of slots** (e.g. 6): item icon + **stack count**. Consumables, quest items, dice-bypass items — whatever your economy uses. Empty slots read clearly. |

---

## Waypoints & story progression (keep simple at first)

The **center map** is a painted backdrop with **clickable waypoints** along paths. Advancing the run/story is: **move the party to the next node you choose** → resolve that node (combat, event text, reward, etc.).

### MVP (minimum)

| Piece | Behavior |
|-------|----------|
| **Nodes** | Discrete **flags or pins** on the path graph. Each has a **type** (drives what scene opens). |
| **Current position** | One node is **active** (party marker / sprites stand here). |
| **Clicks** | Only **reachable** next nodes are interactive (from current node, follow **edges** in your DAG data — see [GDD.md](GDD.md) §7). Grey out or hide locked nodes. |
| **On confirm** | Transition: `Event` / `Combat` / `Boss` / simple **story modal** with **Continue**. No need for cinematic pan at first. |

### Node types (reference pattern — stub what you need)

| Icon idea | Typical resolution |
|-----------|-------------------|
| **Skull / red** | Combat encounter. |
| **Person / blue** | Non-combat beat: NPC dialog, lore, branch choice, or light reward. |
| **Dice / green** | Random event, shop, or minigame — can **defer** and map to **Event** in code. |

Start with **one** type (e.g. all combats) if it ships faster; add icons and handlers later.

### Data (conceptual)

- `nodes[]`: id, position (screen or normalized), `type`, `storyId` optional.  
- `edges[]`: from → to (DAG).  
- `currentNodeId` updates after each resolved visit.  
- **Story** = ordered beats keyed off `storyId` or node id — can be a JSON table at first.

### Nice-to-have (not MVP)

- Hover tooltip (node name, “Fight”, “Event”).  
- Footstep / banner when moving the party token.  
- Clickable **decor** (castle banner) for **lore popups** — optional.

---

## Central overlays (modals)

### 1. Battle results (after a fight)

Shown when returning from combat with a **win** (chain: Victory → dismiss → optionally **map** with results open, or results first — pick one flow and keep it consistent).

| Element | MVP |
|--------|-----|
| Title | e.g. **BATTLE RESULTS** or **Loot** |
| Body | Line items: **+gold**, **+essence/orbs** (or your fiction), and later **item pickups** |
| Primary | **DONE** (center) — closes overlay and returns map input to **idle** |

**EMF3D:** Tie rewards to existing systems — faction-mod rewards may already appear in a dedicated **Reward** scene ([GDD.md](GDD.md) §7). If so, either **merge** into one screen or **sequence**: Reward pick → map + summary strip. Document the chosen pipeline in code comments.

### 2. Character modal (click portrait on left)

Full-screen or centered panel for **one** hero.

| Block | Contents |
|-------|----------|
| **Header** | Name, optional **flavor one-liner** (bio box). |
| **Portrait** | Large art + **segmented HP** (or run HP) bar. |
| **Stats** | Compact row: HP, DEF/armor, ATK, MOV — match [GDD.md](GDD.md) unit stats. |
| **Skills** | **Tier rows** (1★ / 2★ / 3★): hex or square slots. **Filled** = unlocked & chosen; **locked** = future tier; **choosable** = promote flow unlocked. |
| **Promote / spend** | Primary button: **PROMOTE** (or **Spend point**) with **cost** badge (e.g. `1` next to an XP orb icon). **Enabled only when** the player has **enough XP / promotion points** for this character to advance. On use: spend currency → open **pick 1 of N** skills for that tier (Companion vs Legend breadth per your design). |
| **Traits** | Small icons for passives / class hooks. |
| **Close** | **DONE** — returns to map without advancing game time. |

**Progression gating (your note: “when we have enough XP we can progress”)**

- **Earn:** XP (or **essence / orbs** — pick one name in fiction) flows from **battle results** and optionally other nodes. Track **per hero** or **one run pool** split on promote — decide once and keep UI consistent.
- **Spend:** **PROMOTE** deducts the displayed cost and unlocks the next **skill tier** choice (or raw stat bump if you prototype simpler).
- **Disabled state:** If `currentXP < cost`, grey the button and tooltip: **“Need X more to promote.”** Party strip **up** arrow only when **can afford** *and* tier unpicked (or your rule).

**Skill inspection (tooltip)**

- Hover or click a **filled** skill hex → **tooltip / detail card**: **name**, **cooldown** (if any), **short description**, optional **conditional line** (e.g. bonus vs status), **stat strip** (damage, range, duration icons).
- **Selected** slot: gold border + checkmark when confirming a build choice during promote flow.

**Upgrade indicators:** The **green “up”** on the party strip should mirror **same condition** as an enabled PROMOTE or unpicked skill — one source of truth.

---

## Interaction summary

| Action | Result |
|--------|--------|
| Click **waypoint / map node** | If **reachable** from current position: transition to **combat** / **event** / **boss** / **story** per node type. |
| Click **party portrait** | Open **Character modal** for that unit. |
| **Battle results DONE** | Close overlay; currencies / **XP** already applied — may enable **PROMOTE** on character modal. |
| **Character DONE** | Close modal; strip indicators refresh. |

---

## MVP build order (suggested)

1. **Map only** — **waypoints** on a path, **current position**, click **next** node → **one** node type (e.g. combat) to prove the loop.  
2. **Party strip** — portraits + HP bars (read-only).  
3. **Battle results** — simple text rewards + DONE.  
4. **Inventory** — N slots + item count (can be empty placeholders).  
5. **Character modal** — stats + placeholder skill grid.  
6. **Promote + skill choice** — wire to run currency and progression data ([hero-progression-design.md](../hero-progression-design.md)).

---

## Build checklist

- [ ] Top resource readout + settings  
- [ ] Left party strip: all run units, click → modal  
- [ ] Upgrade indicator when promotion/skill available  
- [ ] Map: **waypoints**, **current node**, DAG **edge** eligibility, click → resolve  
- [ ] Right inventory grid + quantity  
- [ ] Battle results modal (rewards + DONE)  
- [ ] Character modal (stats, skills tiers, traits, PROMOTE, DONE)  
- [ ] **XP / promotion points:** earn from results, spend on PROMOTE; button gated by `xp >= cost`  
- [ ] Skill **tooltips** (name, cooldown, description, key stats)  
- [ ] Single source of truth for “has upgrade” (strip + modal button)  

---

## Open decisions

| Topic | Question |
|-------|----------|
| Results timing | **Reward scene** (pick mod) vs **map modal** (summary only) — same session or separate? |
| Inventory | Shared stash vs per-character? |
| Co-op | Who opens character modal — host only or each client? |
