import type { ItemStack } from './ItemData'
import type { TraitId } from './TraitData'
import type { EquippedMod } from './ModData'
import type { Faction } from '../entities/EnemyData'
import type { CampaignId } from './CampaignData'

/** Last encounter type — used for boss legendary reward flow. */
export type LastCombatType = 'combat' | 'elite' | 'miniboss' | 'boss' | 'quickbattle'

/**
 * Per-unit equipment selections made at the loadout screen.
 */
export interface UnitLoadout {
  characterId: string
  weaponId: string | null
  armorId: string | null
}

/**
 * Snapshot of a single unit's persistent state between combats.
 * Used by partyRoster to carry HP (and later equipment) across encounters.
 */
export interface UnitSaveData {
  unitId: string
  hp: number
  maxHp: number
}

export interface RunState {
  // ── Stat bonuses (applied to all player units at combat start) ──
  bonusAtk: number
  bonusDef: number
  bonusMaxHp: number

  // ── Economy ──
  gold: number
  /** Crystals earned by freeing Awakened / good event choices. Spent at Brother Market. */
  crystals: number

  // ── Camp bonuses (applied once at next combat start, then cleared) ──
  campBonusCharges: number

  // ── Carried items (Phase 4+) ──
  /** Items in the player's inventory. Multiple copies tracked via quantity. */
  items: ItemStack[]

  // ── Traits / perks (Phase 4+) ──
  /** IDs of permanent run-wide traits the player has acquired. */
  traits: TraitId[]

  // ── Reproducibility ──
  runSeed: number

  // ── Party persistence (Phase 3+) ──
  partyRoster: UnitSaveData[]

  // ── Pre-run loadout ──
  /** Equipment selections for each of the 3 player units (index = unit slot). */
  loadout: UnitLoadout[]

  // ── Equipment mods (per-unit, per-slot) ──
  /** Weapon mods per unit slot (index matches loadout index). */
  unitWeaponMods: EquippedMod[][]
  /** Armor mods per unit slot (index matches loadout index). */
  unitArmorMods: EquippedMod[][]

  // ── Mod reward rerolls (from hero perks; see HeroPerks.computeModRerollBudget) ──
  /** Increments each time the player rerolls mod offers this run. */
  modRerollsSpentThisRun: number

  // ── Campaign ──
  campaignId: CampaignId

  // ── Last combat faction (for reward screen) ──
  lastCombatFaction?: Faction

  /** Set when a combat encounter ends (for reward branching). */
  lastCombatType?: LastCombatType

  /** Minor talent ids earned this run per hero (levels 3–9). */
  heroTalents: Record<string, string[]>

  // ── The Brothers (Chuco & Benito) — per-run ──
  metChuco: boolean
  metBenito: boolean
  chucoKnowsAboutBenito: boolean
  benitoKnowsAboutChuco: boolean
  brothersReunited: boolean

  // ── The Awakened — per-run encounter tracking ──
  metVera: boolean
  metSpar: boolean
  metEcho: boolean

  // ── The Awakened — befriend counts (meta, persists across runs) ──
  awakenedBefriended: { vera: number; spar: number; echo: number }

  // ── XP + in-run leveling (per hero) ──
  /** Cumulative XP earned per characterId during this run. */
  heroXp: Record<string, number>
  /** Current level per characterId (1–10). XP thresholds in HeroPerks.levelFromXp. */
  heroLevel: Record<string, number>

  // ── Path / subclass (per hero) ──
  /** Chosen path ID per characterId (e.g. 'berserker', 'guardian'). Set at level 2. */
  heroPath: Record<string, string>
}

export function createRunState(): RunState {
  return {
    bonusAtk: 0,
    bonusDef: 0,
    bonusMaxHp: 0,
    gold: 50,
    crystals: 0,
    campBonusCharges: 0,
    items: [],
    traits: [],
    runSeed: 0,
    partyRoster: [],
    loadout: [],
    unitWeaponMods: [],
    unitArmorMods: [],
    modRerollsSpentThisRun: 0,
    campaignId: 'ironclad',
    metChuco: false,
    metBenito: false,
    chucoKnowsAboutBenito: false,
    benitoKnowsAboutChuco: false,
    brothersReunited: false,
    metVera: false,
    metSpar: false,
    metEcho: false,
    awakenedBefriended: { vera: 0, spar: 0, echo: 0 },
    heroXp: {},
    heroLevel: {},
    heroPath: {},
    heroTalents: {},
  }
}
