# Eat My Fire 3D — Story bible (canon summary)

> Short, build-facing canon. Voice, backstory, and campaign prose live in [lore/lore-and-campaigns-v1.md](lore/lore-and-campaigns-v1.md) and [lore-characters-v1.md](lore-characters-v1.md). Event designs: [design-the-awakened-and-brothers.md](design-the-awakened-and-brothers.md).
>
> **Develop faster:** [world-development.md](world-development.md) — layers (Lock / Sketch / Optional), MVW checklist, GDD hooks, and what to write per milestone.

## Identity

- **Market title:** Eat My Fire 3D (see repo `package.json`, `index.html`).
- **Pitch:** Tactical squad roguelike across fractured dimensions. Misfit warriors from dying worlds fight through **Gates** toward the **Convergence Core**. Two great powers — the **Emberfaust Collective** (tech) and the **Primordial Horde** (fantasy) — have warred over dimensional energy for ages; neither is purely right. A deeper pressure (**The Ungate**) appears in the prestige campaign **Ironclad**.

## Cosmology (high level)

- **Gates:** Tears between realms where layers of reality press together; violence and energy widen them.
- **Between worlds:** Lore previously used *The Fold*; **final in-world name TBD** (candidates: The Drift, The Interstice, The Gyre, The Hollow, The Veil, The Murk, The Unway, etc.). Until locked, use **between-worlds** or **the space between Gates** in new copy.
- **Convergence Core:** Origin point of the Gate network — the campaign’s ultimate destination.

## Factions (player-facing)

| Lore name | Code / GDD axis | Moral read |
|-----------|-----------------|------------|
| **Emberfaust Collective** | `tech` — *legacy GDD label “Fire Tech”* | Efficient empire burning membrane for fuel; not sadistic, catastrophically wrong about the Core |
| **Primordial Horde** | `fantasy` — *legacy GDD “Alien Pigs” swarm / line mechanics* | Territorial confederation stabilizing Gates; desperate, not monolithic “evil” |
| **Remnants** (echo-shield units) | Third combat pool / Rare+ rewards | Assimilated / between-tech-and-magic — **full lore rename may follow**; mechanic: echo shields |
| **The Ungate** | Ironclad / third pressure | Not a faction — dimensional immune response; **Ironclad** campaign |

**Design stance:** Factions are **symmetrically flawed** (no single hero faction).

## Campaigns (mechanical ↔ narrative)

Authoritative IDs: [src/renderer/src/run/CampaignData.ts](../src/renderer/src/run/CampaignData.ts).

| ID | Name | Premise (short) | Flags |
|----|------|-----------------|-------|
| `the-run` | The Run | Intro run; both factions on the map | default columns |
| `ghost-protocol` | Ghost Protocol | Collective angle; Horde-only combat pool | `lockedFaction: fantasy` |
| `wardens-path` | Warden's Path | Horde angle; Collective-only combat pool | `lockedFaction: tech` |
| `ironclad` | Ironclad | Convergence endgame; third threat | `numCols: 14`, `noHpRestore: true` |

**Scope:** Aim to ship **full campaign set** including Ironclad/Ungate; cut scope via [GDD.md](../GDD.md) phase tiers if schedule requires.

## Heroes (direction)

- **Roster:** New **proper names** in lore over time; **Knight / Mage / Ranger** (and similar) are **class or role tags**, not final character names.
- **Implementation:** Current build may still use internal names (e.g. Kael, Ryn, Dorn) until a content pass renames for release.

## Co-op and story

- **Steam** multiplayer; players assemble teams; each player controls **units not taken by others** (ownership / loadout).
- **Same narrative** for solo and co-op — no branching story per player count unless optional barks are added later.

## Supporting cast (1.0 intent)

When event content ships: **Awakened** (VERA, SPAR, ECHO) and **Chuco & Benito** are **core** emotional/event pillars per design docs.

## Decision log (story)

| Date | Decision |
|------|----------|
| 2026-03-22 | Market title: Eat My Fire 3D |
| 2026-03-22 | Full faction/name **remap** in docs: Emberfaust / Horde / Remnants + Ungate; retire “Magitek” as product title |
| 2026-03-22 | Story docs split: [GDD.md](../GDD.md) (systems) + this story bible (canon summary) |
| 2026-03-22 | Between-worlds name: **not** locked — replace “Fold” when chosen |
| 2026-03-22 | Heroes: new proper names + Knight/Mage/Ranger-style tags |
| 2026-03-22 | Co-op: shared script; team/unit assignment via Steam |

---

*Update this file when canon changes; deep lore stays in `docs/lore/`.*
