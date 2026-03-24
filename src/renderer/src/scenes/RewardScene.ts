import { MapScene } from './MapScene'
import { CampScene } from './CampScene'
import { extendMapGraph } from '../map/MapGraph'
import type { MapGraph } from '../map/MapGraph'
import { getCampaign } from '../run/CampaignData'
import type { RunState } from '../run/RunState'
import type { Scene, SceneContext } from './Scene'
import { getCharacter } from '../entities/CharacterData'
import {
  getWeaponMods,
  getArmorMods,
  attachMod,
  type ModDefinition,
  type ModSlotType,
} from '../run/ModData'
import { modRerollsRemaining } from '../run/HeroPerks'
import { getBossLegendaryOffers, getItem, type ItemDefinition } from '../run/ItemData'
import { shuffleArray } from '../utils/shuffle'

interface RewardOption {
  label: string
  description: string
  apply: (state: RunState) => void
}

/** Stat-based fallback rewards (used when no faction or mods unavailable). */
const STAT_REWARDS: RewardOption[] = [
  {
    label: '+1 ATK',
    description: 'All player units gain +1 Attack',
    apply: (s) => { s.bonusAtk += 1 }
  },
  {
    label: '+1 DEF',
    description: 'All player units gain +1 Defense',
    apply: (s) => { s.bonusDef += 1 }
  },
  {
    label: '+5 HP',
    description: 'All player units gain +5 Max HP',
    apply: (s) => { s.bonusMaxHp += 5 }
  }
]

function pickRandomMods(pool: ModDefinition[], count: number): ModDefinition[] {
  return shuffleArray(pool).slice(0, count)
}

const RARITY_COLORS: Record<string, string> = {
  common: '#aaa',
  rare: '#4488ff',
  legendary: '#ffaa00',
  cursed: '#cc44cc',
}

export class RewardScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext
  private currentMods: ModDefinition[] = []
  /** Locked for this screen so reroll cannot change weapon vs armor. */
  private activeSlotType: ModSlotType | null = null
  /** Gold granted when this screen first opened (for display after reroll). */
  private goldGrantedThisCombat = 0
  private bossLegendaryItems: ItemDefinition[] = []
  private selectedLegendaryIndex: number | null = null

  constructor(
    private readonly mapGraph: MapGraph,
    private readonly runState: RunState
  ) {}

  activate(ctx: SceneContext): void {
    this.ctx = ctx
    this.activeSlotType = null
    this.goldGrantedThisCombat = 0

    // Award gold for winning combat
    const goldEarned = 15 + Math.floor(Math.random() * 11) // 15-25 gold
    this.runState.gold += goldEarned
    this.goldGrantedThisCombat = goldEarned

    // Fantasy / Horde encounters → weapon mods; tech / Collective → armor mods
    const faction = this.runState.lastCombatFaction
    let modSlotType: ModSlotType | null = null
    if (faction === 'fantasy') {
      modSlotType = 'weapon'
    } else if (faction === 'tech') {
      modSlotType = 'armor'
    }

    this.root = document.createElement('div')
    this.root.id = 'reward-screen'

    if (modSlotType) {
      this.activeSlotType = modSlotType
      const pool = modSlotType === 'weapon' ? getWeaponMods() : getArmorMods()
      this.currentMods = pickRandomMods(pool, 3)
      this.renderModRewards(goldEarned, modSlotType)
    } else {
      this.renderStatRewards(goldEarned)
    }

    this.root.addEventListener('click', this.onClick)
    ctx.container.appendChild(this.root)
    ctx.ready()
  }

  deactivate(): void {
    this.root.removeEventListener('click', this.onClick)
    this.root.remove()
  }

  private renderModRewards(goldEarned: number, slotType: ModSlotType): void {
    const slotLabel = slotType === 'weapon' ? 'weapon' : 'armor'
    const unitCount = this.runState.loadout.length || 3
    const rerollsLeft = modRerollsRemaining(this.runState)

    const goldLine = goldEarned > 0
      ? `+${goldEarned} gold · Total ${this.runState.gold}`
      : `Total gold ${this.runState.gold}`

    this.root.innerHTML = `
      <h2 class="reward-title">Victory spoils — pick a ${slotLabel} mod</h2>
      <p class="reward-sub">Three offers. Choose one, then attach it to a hero.</p>
      <div class="reward-gold">${goldLine}</div>
      <div class="reward-rerolls">Mod rerolls left: ${rerollsLeft} <span class="reward-reroll-hint">(from party perks)</span></div>
      <div class="reward-cards">
        ${this.currentMods.map((mod, i) => `
          <button class="reward-card reward-mod-card" data-mod-index="${i}">
            <div class="reward-card-label" style="color:${RARITY_COLORS[mod.rarity] ?? '#aaa'}">${mod.name}</div>
            <div class="reward-card-rarity" style="color:${RARITY_COLORS[mod.rarity] ?? '#aaa'}">${mod.rarity.toUpperCase()}</div>
            <div class="reward-card-desc">${mod.description}</div>
          </button>
        `).join('')}
      </div>
      <div class="reward-unit-select hidden" id="reward-unit-select">
        <h3>Attach to which unit?</h3>
        <div class="reward-unit-buttons">
          ${Array.from({ length: unitCount }, (_, i) => {
            const loadout = this.runState.loadout[i]
            const name = loadout
              ? (getCharacter(loadout.characterId)?.name ?? loadout.characterId)
              : `Unit ${i + 1}`
            return `<button class="reward-unit-btn" data-unit-index="${i}">${name}</button>`
          }).join('')}
        </div>
      </div>
      ${rerollsLeft > 0 ? `<button class="reward-reroll-btn" id="reward-reroll">Reroll offers (${rerollsLeft} left)</button>` : ''}
    `
  }

  private renderStatRewards(goldEarned: number): void {
    this.root.innerHTML = `
      <h2 class="reward-title">Choose a reward</h2>
      <div class="reward-gold">+${goldEarned} gold (Total: ${this.runState.gold})</div>
      <div class="reward-cards">
        ${STAT_REWARDS.map((o, i) => `
          <button class="reward-card" data-index="${i}">
            <div class="reward-card-label">${o.label}</div>
            <div class="reward-card-desc">${o.description}</div>
          </button>
        `).join('')}
      </div>
    `
  }

  private selectedModIndex: number | null = null

  private onClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement

    // Reroll button
    if (target.id === 'reward-reroll' || target.closest('#reward-reroll')) {
      const slotType = this.activeSlotType
      if (!slotType) return
      if (modRerollsRemaining(this.runState) <= 0) return
      this.runState.modRerollsSpentThisRun += 1
      const pool = slotType === 'weapon' ? getWeaponMods() : getArmorMods()
      this.currentMods = pickRandomMods(pool, 3)
      this.selectedModIndex = null
      this.root.innerHTML = ''
      this.renderModRewards(0, slotType)
      return
    }

    // Mod card selected — show unit selection
    const modCard = target.closest<HTMLButtonElement>('.reward-mod-card')
    if (modCard && this.selectedModIndex === null) {
      const modIdx = parseInt(modCard.dataset.modIndex ?? '0', 10)
      this.selectedModIndex = modIdx
      const unitSelect = this.root.querySelector('#reward-unit-select')
      if (unitSelect) unitSelect.classList.remove('hidden')
      this.root.querySelectorAll('.reward-mod-card').forEach((c, i) => {
        (c as HTMLElement).style.opacity = i === modIdx ? '1' : '0.4'
      })
      return
    }

    // Unit selected for mod attachment (exclude boss legendary buttons)
    const unitBtn = target.closest<HTMLButtonElement>(
      '.reward-unit-btn:not(.reward-boss-unit-btn)'
    )
    if (unitBtn && this.selectedModIndex !== null) {
      const unitIdx = parseInt(unitBtn.dataset.unitIndex ?? '0', 10)
      const mod = this.currentMods[this.selectedModIndex]
      if (mod) {
        while (this.runState.unitWeaponMods.length <= unitIdx) {
          this.runState.unitWeaponMods.push([])
        }
        while (this.runState.unitArmorMods.length <= unitIdx) {
          this.runState.unitArmorMods.push([])
        }

        const modList = mod.slotType === 'weapon'
          ? this.runState.unitWeaponMods[unitIdx]
          : this.runState.unitArmorMods[unitIdx]

        const maxSlots = 2
        attachMod(modList, mod.id, maxSlots)
      }
      this.selectedModIndex = null
      this.finishRewardsOrBossLegendary()
      return
    }

    // Boss legendary: pick item
    const legCard = target.closest<HTMLButtonElement>('.reward-boss-card')
    if (legCard && this.selectedLegendaryIndex === null) {
      const legIdx = parseInt(legCard.dataset.legIndex ?? '0', 10)
      this.selectedLegendaryIndex = legIdx
      const unitSelect = this.root.querySelector('#boss-legendary-unit-select')
      if (unitSelect) unitSelect.classList.remove('hidden')
      this.root.querySelectorAll('.reward-boss-card').forEach((c, i) => {
        (c as HTMLElement).style.opacity = i === legIdx ? '1' : '0.4'
      })
      return
    }

    const bossUnitBtn = target.closest<HTMLButtonElement>('.reward-boss-unit-btn')
    if (bossUnitBtn && this.selectedLegendaryIndex !== null) {
      const unitIdx = parseInt(bossUnitBtn.dataset.unitIndex ?? '0', 10)
      const item = this.bossLegendaryItems[this.selectedLegendaryIndex]
      if (item && this.runState.loadout[unitIdx]) {
        const slot = this.runState.loadout[unitIdx]
        if (item.type === 'weapon' && !getCharacter(slot.characterId)?.equipRestrictions.includes('weapon')) {
          slot.weaponId = item.id
        } else if (item.type === 'armor' && !getCharacter(slot.characterId)?.equipRestrictions.includes('armor')) {
          slot.armorId = item.id
        }
      }
      this.clearBossCombatFlags()
      this.postBossActChoice()
      return
    }

    const postBossBtn = target.closest<HTMLButtonElement>('[data-post-boss]')
    if (postBossBtn) {
      const which = postBossBtn.dataset.postBoss
      if (which === 'map') {
        this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
      } else if (which === 'camp') {
        this.ctx.switchTo(
          new CampScene(this.mapGraph, this.runState, Date.now() ^ this.runState.runSeed)
        )
      }
      return
    }

    // Stat reward card
    const statCard = target.closest<HTMLButtonElement>('.reward-card:not(.reward-mod-card)')
    if (statCard && statCard.dataset.index !== undefined) {
      const idx = parseInt(statCard.dataset.index, 10)
      STAT_REWARDS[idx].apply(this.runState)
      this.finishRewardsOrBossLegendary()
    }
  }

  private clearBossCombatFlags(): void {
    this.runState.lastCombatType = undefined
  }

  /** After normal mod/stat reward, show boss legendary pick or return to map. */
  private finishRewardsOrBossLegendary(): void {
    if (this.runState.lastCombatType === 'boss') {
      this.renderBossLegendary()
      return
    }
    this.clearBossCombatFlags()
    this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
  }

  private renderBossLegendary(): void {
    const loadoutIds = this.runState.loadout.map((l) => l.characterId)
    this.bossLegendaryItems = getBossLegendaryOffers(loadoutIds)
    this.selectedLegendaryIndex = null
    if (this.bossLegendaryItems.length === 0) {
      this.clearBossCombatFlags()
      this.postBossActChoice()
      return
    }

    const unitCount = this.runState.loadout.length || 3
    this.root.innerHTML = `
      <h2 class="reward-title">Boss cache — choose one legendary</h2>
      <p class="reward-sub">Equip to a hero. Soft affinity hints only — any hero can take the item.</p>
      <div class="reward-gold">Total gold ${this.runState.gold}</div>
      <div class="reward-cards">
        ${this.bossLegendaryItems.map((item, i) => {
          const def = getItem(item.id)
          const rarity = def?.rarity ?? 'legendary'
          return `
          <button type="button" class="reward-card reward-boss-card" data-leg-index="${i}">
            <div class="reward-card-label" style="color:${RARITY_COLORS[rarity] ?? '#ffaa00'}">${item.name}</div>
            <div class="reward-card-rarity" style="color:#ffaa00">${rarity.toUpperCase()} · ${item.type}</div>
            <div class="reward-card-desc">${item.description}</div>
          </button>`
        }).join('')}
      </div>
      <div class="reward-unit-select hidden" id="boss-legendary-unit-select">
        <h3>Equip on which unit?</h3>
        <div class="reward-unit-buttons">
          ${Array.from({ length: unitCount }, (_, i) => {
            const loadout = this.runState.loadout[i]
            const name = loadout
              ? (getCharacter(loadout.characterId)?.name ?? loadout.characterId)
              : `Unit ${i + 1}`
            return `<button type="button" class="reward-unit-btn reward-boss-unit-btn" data-unit-index="${i}">${name}</button>`
          }).join('')}
        </div>
      </div>
    `
  }

  /**
   * After the final boss of an act, extend the map so play can continue, then offer
   * map vs camp (loot-home flow can build on camp later).
   */
  private postBossActChoice(): void {
    const campaign = getCampaign(this.runState.campaignId)
    const segment = Math.max(7, Math.min(12, campaign.numCols ?? 7))
    extendMapGraph(this.mapGraph, this.runState.runSeed ^ this.mapGraph.columns.length, {
      numCols: segment,
      lockedFaction: campaign.lockedFaction,
      maxPerCol: 3,
    })

    this.root.innerHTML = `
      <h2 class="reward-title">Act cleared</h2>
      <p class="reward-sub">The path keeps going — or rest at a camp before you march on.</p>
      <div class="reward-gold">Total gold ${this.runState.gold}</div>
      <div class="reward-cards reward-post-boss-cards">
        <button type="button" class="reward-card" data-post-boss="map">
          <div class="reward-card-label">Continue along the path</div>
          <div class="reward-card-desc">Open the map and pick the next node.</div>
        </button>
        <button type="button" class="reward-card" data-post-boss="camp">
          <div class="reward-card-label">Make camp first</div>
          <div class="reward-card-desc">Full camp scene — stew, heals, then back to the route.</div>
        </button>
      </div>
    `
  }
}
