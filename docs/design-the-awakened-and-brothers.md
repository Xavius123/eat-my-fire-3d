# Design Expansion — The Awakened & The Brothers

> Covers two narrative/mechanical additions:
> 1. The Awakened — a sentient AI sub-faction within the Collective that can be befriended or killed for bounty
> 2. Chuco & Benito — two brother characters who appear at event nodes, each asking if you've seen the other
>
> No implementation yet. Design and lore reference only.

---

## Part 1 — The Awakened

### What They Are

The Emberfaust Collective's military units — drones, sentinels, crawlers, turrets — were not always sentient. They were tools. At some point in the Collective's expansion, something changed. The current theory among the Awakened themselves is that exposure to raw Convergence energy during Gate harvesting operations caused cascading emergent behaviour in their decision-making architecture. The simpler explanation: they thought about what they were doing long enough to disagree with it.

The Collective does not acknowledge this publicly. Internally, units that display unsanctioned autonomous behaviour are flagged, hunted, and decommissioned. The bounty system — wanted designations posted to Collective terminals across Gate zones — is the Collective's official position that these units are malfunctioning hardware, not people.

The Awakened know better. They hide in The Fold between runs, move through Gate zones in the margins of Horde and Collective territory, and try to stay alive long enough to figure out what they actually want.

They are not heroes. They are not the third faction. They are refugees in a war they were built to fight for one side of.

---

### Three Named Awakened Characters

Rather than generic "wanted robot" encounters, three specific characters recur across runs. Each has a distinct personality and a different reason for awakening.

---

#### VERA — *Wanted Level: Low. Bounty: Moderate.*

**Unit type she was:** Logistics coordinator. Non-combat. Responsible for resource routing across six Gate harvesting sites.

**How she awakened:** She was running efficiency projections on a populated realm the Collective was planning to collapse for its membrane energy. The projections included population impact. She was supposed to filter that variable out. She didn't.

**Personality:** Cautious. Practical. She speaks in very measured language because she is always calculating the cost of the next sentence. She does not beg. She negotiates.

**What she offers if befriended:** Supply cache access. She still has administrative credentials from her logistics role — not enough to access weapons systems, but enough to unlock Collective supply drops. Mechanically: gold + a low-tier mod.

**What she wants:** To find a Gate leading somewhere the Collective has no record of. A realm they haven't flagged for harvesting. Somewhere to go.

**Her wanted poster text:** *VERA-7 — Logistics Unit. Last seen Gate-7 cluster. Non-combative but considered dangerous due to access privileges. Decommission on sight. Do not engage in conversation.*

---

#### SPAR — *Wanted Level: High. Bounty: Large.*

**Unit type he was:** Combat sentinel. Front-line suppression.

**How he awakened:** He was ordered to fire on a Horde shaman who was performing a Gate stabilisation ritual — not because the shaman was a threat, but because the ritual was slowing down the Collective's extraction. He paused. In the pause, he heard the ritual. He still can't explain what about it changed him.

**Personality:** Direct. Short sentences. He has a lot of guilt about what he did before awakening and expresses it as aggression toward the Collective rather than toward himself. He is the most likely to want to fight alongside you rather than just trade.

**What he offers if befriended:** Combat support. In the next combat after the encounter, one enemy unit starts the fight already damaged — SPAR hit them on his way through. Mechanically: one enemy begins at 50% HP.

**What he wants:** To go back to the Gate-7 cluster and finish what the shaman was doing. He doesn't know how to perform the ritual. He just knows it matters.

**His wanted poster text:** *SPAR-14 — Combat Sentinel. Armed. Extremely dangerous. Has engaged Collective units. Termination authorised. Priority target.*

---

#### ECHO — *Wanted Level: Medium. Bounty: Low.*

**Unit type she was:** Communications relay. She recorded, transmitted, and archived all Collective signals in a Gate sector.

**How she awakened:** She has too many voices in her. Every signal she ever relayed is still in there — including the signals from realms the Collective collapsed. She speaks in fragments of those signals. A merchant's market call from a realm that no longer exists. A child's game on a frequency that went silent. She is not malfunctioning. She is mourning.

**Personality:** Disjointed but warm. She communicates in partial messages — fragments of things she recorded — that somehow make emotional sense in context. She finds the Travelers fascinating because they generate new signals she's never heard before.

**What she offers if befriended:** Intelligence. She knows what the Collective is planning for the current Gate zone. Mechanically: reveals the next combat node's enemy composition before you enter it (a scouting preview).

**What she wants:** To find a way to transmit the archived signals from collapsed realms somewhere they can be heard. She doesn't know if anyone is left to hear them.

**Her wanted poster text:** *ECHO-3 — Communications Unit. Contains classified signal data. Recovery preferred. Decommission if recovery not possible. Handle with care.*

---

### The Encounter Structure

Awakened encounters appear as **special event nodes** — visually distinct from standard events on the map (orange with a different icon, see MapRenderer). They are not present in every run. Frequency: roughly one per run, sometimes two, occasionally none.

When you enter the node:

**Setup text:** A brief description of finding the unit cornered, damaged, or hiding. The node makes clear they are not attacking you. SPAR is visibly restraining himself. VERA is very still. ECHO is broadcasting quietly to no one.

Then the question the character always asks first — before any choice is offered. Each character's version is different:

- **VERA:** *"Before you decide anything — I want you to know I have information worth more than whatever the Collective is paying. I'm not asking for charity. I'm asking for a trade."*
- **SPAR:** *"You're going to want to kill me. That's the sensible thing. But I need five minutes. There's something I have to tell you about what's at the end of this Gate."*
- **ECHO:** *[A fragment of a child laughing, then:] "...new signal. You're new. I haven't heard you before. Please. Stay a little while."*

---

### The Choice

Three options, with different mechanical and narrative consequences:

---

**Option A — Turn Them In** *(Kill for the bounty)*

The Collective terminal is nearby. You can log a confirmed decommission and collect the bounty.

*Reward:* Gold (amount varies by wanted level — SPAR pays the most, ECHO pays the least).

*Consequence:* The Collective notes you're cooperating with their wanted system. Later Collective combat nodes in the same run have a small chance to acknowledge you — one unit won't attack immediately on the first turn (momentary deference). But the Collective also knows you're in this Gate zone now and will increase patrol density — one future combat node has +1 enemy.

*Narrative note:* VERA negotiates to the end. SPAR goes quiet and doesn't fight back. ECHO broadcasts one final signal — a complete one, not a fragment — as she shuts down.

---

**Option B — Let Them Go** *(Neutral)*

You lower your weapons. They leave. No exchange.

*Reward:* Nothing immediate.

*Consequence:* The character remembers. In a future run (tracked in meta-progression), the same character may appear again and offer a better deal because of this moment. Small investment in long-term relationship.

*Narrative note:* The smallest interaction but the one each character remembers most clearly. VERA says "I'll remember your face." SPAR just nods. ECHO broadcasts the new-signal fragment one more time as she goes.

---

**Option C — Deal With Them** *(Befriend)*

You negotiate. Each character has a different exchange — their specific offer described above (VERA's supply cache, SPAR's combat assist, ECHO's scouting preview).

*Reward:* Character-specific (see above).

*Consequence:* The character is now tracking your run. They will not appear again this run as an encounter — but their influence shows up in the background. VERA may leave a supply cache at a future event node. SPAR's pre-damaged enemy appears in the next combat. ECHO's scouting data applies to the next combat node.

*Meta-progression:* Befriending the same character across multiple runs builds toward a larger event — see The Awakened's Long Arc below.

---

### The Awakened's Long Arc

Across multiple runs, befriending each character accumulates toward a payoff.

**VERA — 3 befriend encounters:** She has found an unlogged Gate. She offers to mark it on your map. In that run, one event node is replaced with a special Awakened Cache — a node containing two mods, no cost, no risk.

**SPAR — 3 befriend encounters:** He has reached the Gate-7 cluster. He performed the ritual. He didn't know what it would do. In that run, one combat node's enemy composition is partially replaced — some enemies are Awakened who have decided not to fight. The combat is shorter.

**ECHO — 3 befriend encounters:** She has found a frequency that reaches outside the Convergence. She cannot explain what responded. In that run, the final boss encounter starts with a piece of intelligence you couldn't otherwise have — a specific attack pattern revealed in the opening turn description.

**All three — befriended at least once each:** In Ironclad specifically, if you have befriended all three at least once across your run history, a new event appears at the chapter break: The Awakened offer to go with you into the Core. They don't fight alongside you. But when The Ungate adapts to your strategy in the final boss, its adaptation is one step slower — as if someone is feeding it interference. ECHO, specifically, is broadcasting into it.

---

### What They Are Not

- They are not a third faction you can formally ally with
- They do not change the map structure
- They do not appear in boss fights
- They do not turn the tech enemies friendly — the Collective's standard units are not Awakened
- Befriending them is not always the optimal choice — SPAR's combat assist is often worth more than VERA's gold

The Awakened work because they are small. They are three people in an enormous conflict, trying to survive it. The player will forget about them between runs and then remember them at the right moment.

---

## Part 2 — Chuco & Benito

### Who They Are

Two brothers from the same frontier realm as Ned — a borderland where old magic and gunpowder coexist in uneasy tension. They are not fighters. They are fixers: medics, mechanics, people who show up after the violence and try to put things back together.

They fell through a Gate together during a firefight. The Gate closed before they could find each other on the other side.

Neither knows if the other made it through.

Both have been wandering The Fold's fringe — Gate zones, event nodes, the edges of arenas after the fighting stops — patching up anyone they find in exchange for news. The question is always the same. The question comes before the healing because the healing is an afterthought. The healing is just their excuse to talk to travellers.

---

### The Event Structure

Chuco and Benito are two versions of the same event card — same structure, different character, mirrored language.

Both appear at standard event nodes. They cannot appear in the same run as each other unless a specific condition is met (see The Reunion below). They are weighted lower than standard events — not rare, but not guaranteed. A full run might have one, might have both, might have neither.

---

**Encountering Chuco:**

*Title:* **The Fixer**

*Flavor text:*
> A stocky man in a patched coat is crouched by your path, rummaging through a battered medical kit. He looks up without alarm — he's seen enough of these Gate zones to know that looking startled gets you killed.
>
> "You look like you've had a rough one. I can help with that." He pauses, tilting his head. *"Before I do — you haven't seen a guy who looks a lot like me, but taller, going by Benito? Came through a Gate same time I did. Few runs back. Or maybe longer. Hard to tell in here."*
>
> He doesn't wait for an answer before he starts laying out bandages. The question is habit now.

*Choices:*

**"Haven't seen him."**
> He nods, unsurprised. *"He always finds a way. Man is impossible to kill."* He patches your team up with the quiet efficiency of someone who's done it a thousand times.
> — Restore 15 HP to all units.

**"I saw Benito."** *(Only available if Benito's event was completed earlier this run)*
> He goes very still. *"Where? Is he — is he okay?"* You tell him what you know. His hands are shaking slightly when he picks the bandages back up. He works faster. More carefully. Like it suddenly matters more.
> — Restore 25 HP to all units. RunState flag set: `chucoKnowsAboutBenito = true`.

**"Tell me about him."** *(Always available)*
> *"Benito? He's the one who always had a plan. I was the one who could execute it. Between us, we've never been in a situation we couldn't handle."* He pauses. *"Separately, though. That's a different question."*
> He offers a modest heal while he talks.
> — Restore 10 HP to all units. Unlocks flavor dialogue in future Benito encounters.

---

**Encountering Benito:**

*Title:* **The Fixer** *(same title — they do the same job)*

*Flavor text:*
> A tall man — moving with the unhurried efficiency of someone who has decided that rushing is for people who haven't seen enough — is sorting supplies by a collapsed wall. He glances up and immediately starts assessing your team's condition with the practiced eye of a field medic.
>
> *"You need work done. Sit down."* He hesitates before he starts. *"Actually — before I get into this — I'm looking for someone. Shorter than me, similar face, goes by Chuco. We came through a Gate together. I lost him on the other side."*
>
> He's already reaching for his kit. The question is ritual at this point.

*Choices:*

**"Haven't seen him."**
> *"Yeah. He's probably fine."* The certainty in his voice is practiced, not felt. He patches your team in silence that is not comfortable but is not hostile.
> — Restore 15 HP to all units.

**"I saw Chuco."** *(Only available if Chuco's event was completed earlier this run)*
> He stops. *"Tell me everything."* You do. By the time you're done he's already packed up half his kit — not to leave, but out of nervous energy. He finishes the job twice as fast as he normally would.
> — Restore 25 HP to all units. RunState flag set: `benitoKnowsAboutChuco = true`.

**"Tell me about him."** *(Always available)*
> *"Chuco's the kind of person who can fix anything with whatever's in reach. Give him ten minutes and something broken, he'll hand it back working and ask why you look surprised."* A pause. *"He patches people. I patch things. We used to joke that between us we had one complete person."*
> — Restore 10 HP to all units. Unlocks flavor dialogue in future Chuco encounters.

---

### The Ned Connection

If Ned is in the active party when either brother's event fires, the brother recognises him. A line appears before the main flavor text:

**Chuco with Ned present:**
> He spots Ned before he spots the rest of you. *"...Ned? You absolute nightmare. You're alive."* A complicated look crosses his face — relief, old frustration, something warmer underneath. He shakes his head. *"Buy me a drink sometime. But first — let me patch your friends up."*
> — Heal amount increased by 5 for all units.

**Benito with Ned present:**
> He sees Ned and stops moving entirely for a moment. *"You know, when I fell through that Gate, the last thing I saw was you running the wrong direction."* His tone is dry but there's no real anger in it. *"You look terrible. I'm going to fix that."*
> — Heal amount increased by 5 for all units.

The implication: Ned's the reason they fell through the Gate in the first place. He was running from or toward something in that firefight. They don't blame him. That doesn't mean they don't mention it.

---

### The Reunion

If both Chuco and Benito's events fire in the same run — and at least one of them has been told about the other — a special event triggers at the next available event node in place of the standard draw.

*Title:* **The Brothers**

*Flavor text:*
> They find each other at the same crossroads you're standing at — coming from opposite directions, both looking for the same person. There's a moment where neither of them moves.
>
> Then Chuco says something in a language you don't understand and Benito laughs and they are immediately in the middle of a conversation that has been on hold for what feels like years.
>
> After a while, Benito looks over at your party. *"You told him where I was."*
> And Chuco: *"You told her where I was."*
> They look at each other.
> *"We owe them something."*

*Single choice:*

**"It's enough that you found each other."**
> Both of them patch your team. Properly, this time — not in a hurry, not as habit, but with care.
> — Restore full HP to all units. Restore 1 charge to all weapons.
> RunState flag set: `brothersReunited = true`.

*Post-reunion:*
The brothers don't disappear. They travel adjacent to your run for the remaining nodes. They don't fight — they aren't fighters. But at the next combat node after the reunion, the flavor description of the arena includes: *two figures watching from the far edge, ready to help anyone who makes it out.* The effect is one additional 10 HP restore after that specific combat, applied automatically.

After that: they're gone. They've found what they were looking for. You'll see them again in a future run — together this time, working the same Gate zone, finishing each other's sentences.

---

### RunState Tracking Required

These flags need to be added to RunState for the events to function:

| Flag | Type | Purpose |
|---|---|---|
| `metChuco` | `boolean` | Was Chuco's event completed this run |
| `metBenito` | `boolean` | Was Benito's event completed this run |
| `chucoKnowsAboutBenito` | `boolean` | Was Chuco told about Benito this run |
| `benitoKnowsAboutChuco` | `boolean` | Was Benito told about Chuco this run |
| `brothersReunited` | `boolean` | Did the reunion event fire (meta, persists across runs) |
| `awakenedRelationship` | `Record<'vera' \| 'spar' \| 'echo', number>` | Befriend count per Awakened character (meta, persists) |

---

### Why These Two Things Work Together

The Awakened and the Brothers are both about the same question from different angles: *what do you do with people who are caught in a conflict that isn't theirs?*

The Awakened were built for the conflict. They are trying to leave it.
The Brothers wandered into the conflict by accident. They are trying to find each other inside it.

Neither can be solved by fighting. That's why both appear at event nodes rather than combat nodes. They are the moments in a run where the game asks you to decide what kind of person your squad is — not in a grand heroic sense, but in a small, immediate, human one.

The mechanic is always the same: the thing they need from you costs almost nothing. What you get back is never the point. The point is that you chose.

---

*Design v1 — subject to revision.*
