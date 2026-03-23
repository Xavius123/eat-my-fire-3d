# World-building for faster development

> How to grow **Eat My Fire 3D** lore and [GDD.md](../GDD.md) without slowing the build. Pair with [story-bible.md](story-bible.md) (canon locks) and [lore/lore-and-campaigns-v1.md](lore/lore-and-campaigns-v1.md) (long-form prose).

## The goal

**Speed comes from fewer open questions at implementation time** — not from writing more paragraphs. Flesh out the world in **layers**: lock what code and art depend on first; keep exploration and flavor in annex docs until they attach to a ticket.

## Three layers (use this order)

| Layer | What | Where | When to update |
|-------|------|--------|----------------|
| **Lock** | Facts that change code, assets, or strings: faction names, campaign IDs, cosmology rules, tone taboos | [story-bible.md](story-bible.md) + decision log in [GDD.md](../GDD.md) | Before implementing that feature |
| **Sketch** | One paragraph + bullet list per region/act/campaign beat — enough to **brief art and level dressing** | [lore/](lore/) or short `docs/world/` notes | When you start that map or biome |
| **Optional** | History, poetry, character journals | Lore docs / companion fiction | When you have a milestone buffer |

If something is “Sketch” only, **do not** block implementation on it — use placeholders (`[GATE_ZONE_TBD]`) and lock the Lock layer first.

## Minimum viable world (before heavy content)

Answer these once in **story-bible** (or GDD §11) so everyone aligns:

1. **What does the player do in one sentence** (already in story bible).
2. **What are the two factions wrong about** (one line each) — drives enemy dialogue and events.
3. **What is the between-worlds space** — pick a final name or keep **“between Gates”** until art lands.
4. **What does each campaign *change* emotionally** (Ghost Protocol / Warden’s Path / Ironclad) — one line each; matches [CampaignData](../src/renderer/src/run/CampaignData.ts).
5. **Taboos** — what you will not say or show (audience, politics, gore).

Then stop until a feature needs more.

## GDD: what to add for “buildable” world

For each **major system** in [GDD.md](../GDD.md), add a **tiny block** (no essays):

- **Player sees:** one sentence.
- **Rule:** what must always be true.
- **Hook:** `MapGraph`, `CampaignData`, `EnemyData`, `EventScene`, etc. — or “TBD”.

Do this for **map**, **campaigns**, **faction rewards**, **events** once. You already have strong combat specs; extend the same clarity to **meta** and **narrative nodes** so scripting is not guessing.

## Lore: flesh out *only* what you will ship next

| Milestone focus | Flesh out in writing |
|-----------------|----------------------|
| Next combat biome | 5–10 bullet **visual keywords** + 1 paragraph mood (Horde ritual vs Collective industrial) |
| Next event batch | Event **archetype** + **mechanical outcome** + **one voice line** per choice (see Awakened/brothers designs) |
| Next campaign | **Act beats** (3 bullets per act) + **twist** — already drafted in lore-and-campaigns; trim to **what ships** vs “aspiration” |

Avoid writing **chapter-length** lore for a campaign that isn’t in the phase plan yet.

## One-page templates (copy/paste)

Use a single file per biome or act, e.g. `docs/world/biome-horde-outer.md`:

```markdown
# Biome: Horde outer patrols
- **Read:** (one sentence player fantasy)
- **Visual keywords:** (5 bullets for art)
- **Faction presence:** Horde only / mixed / TBD
- **Hazards:** (gameplay — choke, open, vertical)
- **Locked canon:** (bullet — must match story-bible)
- **Open questions:** (bullets)
```

```markdown
# Campaign beat: Ghost Protocol Act 2 twist
- **Player learns:** (one sentence)
- **Mechanical tie:** (reward change, flag, or elite spawn — or none)
- **Strings needed:** (event titles, not full script)
```

## Parallel tracks (so world doesn’t block code)

- **Code** uses `tech` / `fantasy` and campaign IDs — already stable.
- **Art** uses **keyword lists** from Sketch layer (same session as story-bible review).
- **Writing** attaches to **event IDs** and **RunState** flags when you implement events — not before.

## Anti-patterns

- **Writing lore before a mechanic exists** — you rewrite when the mechanic changes.
- **Two names for the same thing** in GDD vs code — fix in story-bible + decision log.
- **“Full” cosmology** before the first shippable campaign loop — scope the universe after vertical slice.

---

*Update this doc when you settle a workflow that works for your team size.*
