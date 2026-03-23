import { MapScene } from './MapScene'
import type { MapGraph } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import type { Scene, SceneContext } from './Scene'
import {
  getWeaponMods,
  getArmorMods,
  getModsBySlot,
  attachMod,
  getMod,
  type ModDefinition,
  type ModSlotType,
} from '../run/ModData'

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
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
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

  constructor(
    private readonly mapGraph: MapGraph,
    private readonly runState: RunState
  ) {}

  activate(ctx: SceneContext): void {
    this.ctx = ctx

    // Award gold for winning combat
    const goldEarned = 15 + Math.floor(Math.random() * 11) // 15-25 gold
    this.runState.gold += goldEarned

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
      // Faction-locked mod rewards
      const pool = modSlotType === 'weapon' ? getWeaponMods() : getArmorMods()
      this.currentMods = pickRandomMods(pool, 3)
      this.renderModRewards(goldEarned, modSlotType)
    } else {
      // Stat-based fallback
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
    const slotLabel = slotType === 'weapon' ? 'Weapon' : 'Armor'
    const unitCount = this.runState.loadout.length || 3

    this.root.innerHTML = `
      <h2 class="reward-title">CHOOSE A ${slotLabel.toUpperCase()} MOD</h2>
      <div class="reward-gold">+${goldEarned} gold (Total: ${this.runState.gold})</div>
      <div class="reward-rerolls">Rerolls: ${this.runState.rerollsRemaining}</div>
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
            const name = loadout?.characterId ?? `Unit ${i + 1}`
            return `<button class="reward-unit-btn" data-unit-index="${i}">${name}</button>`
          }).join('')}
        </div>
      </div>
      ${this.runState.rerollsRemaining > 0 ? '<button class="reward-reroll-btn" id="reward-reroll">Reroll (${this.runState.rerollsRemaining} left)</button>' : ''}
    `
  }

  private renderStatRewards(goldEarned: number): void {
    this.root.innerHTML = `
      <h2 class="reward-title">CHOOSE A REWARD</h2>
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
      if (this.runState.rerollsRemaining > 0) {
        this.runState.rerollsRemaining -= 1
        const faction = this.runState.lastCombatFaction
        const slotType: ModSlotType = faction === 'fantasy' ? 'weapon' : 'armor'
        const pool = slotType === 'weapon' ? getWeaponMods() : getArmorMods()
        this.currentMods = pickRandomMods(pool, 3)
        // Deactivate and re-render
        this.root.innerHTML = ''
        const goldEarned = 0 // already awarded
        this.renderModRewards(goldEarned, slotType)
      }
      return
    }

    // Mod card selected — show unit selection
    const modCard = target.closest<HTMLButtonElement>('.reward-mod-card')
    if (modCard && this.selectedModIndex === null) {
      const modIdx = parseInt(modCard.dataset.modIndex ?? '0', 10)
      this.selectedModIndex = modIdx
      const unitSelect = this.root.querySelector('#reward-unit-select')
      if (unitSelect) unitSelect.classList.remove('hidden')
      // Highlight selected card
      this.root.querySelectorAll('.reward-mod-card').forEach((c, i) => {
        (c as HTMLElement).style.opacity = i === modIdx ? '1' : '0.4'
      })
      return
    }

    // Unit selected for mod attachment
    const unitBtn = target.closest<HTMLButtonElement>('.reward-unit-btn')
    if (unitBtn && this.selectedModIndex !== null) {
      const unitIdx = parseInt(unitBtn.dataset.unitIndex ?? '0', 10)
      const mod = this.currentMods[this.selectedModIndex]
      if (mod) {
        // Ensure mod arrays exist for this unit
        while (this.runState.unitWeaponMods.length <= unitIdx) {
          this.runState.unitWeaponMods.push([])
        }
        while (this.runState.unitArmorMods.length <= unitIdx) {
          this.runState.unitArmorMods.push([])
        }

        const modList = mod.slotType === 'weapon'
          ? this.runState.unitWeaponMods[unitIdx]
          : this.runState.unitArmorMods[unitIdx]

        // Max slots based on equipped item (default 2)
        const maxSlots = 2
        attachMod(modList, mod.id, maxSlots)
      }
      this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
      return
    }

    // Stat reward card
    const statCard = target.closest<HTMLButtonElement>('.reward-card:not(.reward-mod-card)')
    if (statCard && statCard.dataset.index !== undefined) {
      const idx = parseInt(statCard.dataset.index, 10)
      STAT_REWARDS[idx].apply(this.runState)
      this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
    }
  }
}
