# Legends of Kingdom Rush — public source validation notes

*Purpose: record how well third-party and marketing copy agree on LoKR numbers. Use for design research only; this is not an official spec.*

---

## Roster counts

| Source | Legends | Companions | Notes |
|--------|---------|------------|--------|
| Steam store (2025–2026) | 6 | 12 | Marketing copy under “About This Game” |
| Apple App Store listing | Aligns with 6 / 12 | Aligns | Third-party summaries echo store text |
| Kingdom Rush Fandom wiki | 5 | 11 | Older article; likely pre-update or rounding |

**Conclusion:** Treat **6 Legendary Heroes** and **12 Companion** heroes as current public marketing. Wiki counts are **stale** unless refreshed.

---

## In-run promotion (Experience Orbs)

| Claim | Source |
|-------|--------|
| Orbs from winning battles and passing nodes | Fandom wiki gameplay section |
| Start at level 1; **1 orb** to promote to level 2; **2 orbs** to promote to level 3 (3 orbs total to max tier) | Same |
| On promote: stats up, heal, pick skills (2 choices for Companion, 3 for Legend per tier) | Same |

**Conclusion:** Orb **cost curve** is documented on the wiki only among sources checked; Steam feature bullets do not repeat exact numbers. Treat orb math as **community-documented** until verified in-game.

---

## Achievements

| Source | Count |
|--------|-------|
| Steam store | 84 achievements |
| Older community guides | “80+” |

**Conclusion:** Prefer **84** for Steam PC.

---

## Modes (Steam)

Daily Challenges, weekly Leaderboards, Quick-Play Arena (random party + diversifiers), Elite units — all from Steam “About This Game”. Wiki gameplay section aligns on Arena and narrative event volume (~100+).

---

## Install folder (local Steam build)

The Windows install under `Legends of Kingdom Rush` is a Unity data layout (AssetBundles, `legends_Data`). It does **not** ship plaintext tuning tables suitable for extracting exact stats. Validation of numbers still requires **in-game observation** or **patch notes** from the developer.
