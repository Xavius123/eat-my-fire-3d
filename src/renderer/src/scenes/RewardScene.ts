import { MapScene } from './MapScene'
import { CampScene } from './CampScene'
import { extendMapGraph } from '../map/MapGraph'
import type { MapGraph } from '../map/MapGraph'
import { getCampaign } from '../run/CampaignData'
import type { RunState } from '../run/RunState'
import type { Scene, SceneContext } from './Scene'
import { getCharacter } from '../entities/CharacterData'
import {
  getModsByRarities,
  attachMod,
  getMod,
  effectiveValue,
  type ModDefinition,
  type ModSlotType,
  type ModRarity,
} from '../run/ModData'
import { modRerollsRemaining, formatHeroPerkSummary } from '../run/HeroPerks'
import {
  getBossLegendaryOffers,
  getItem,
  getItemsByTypeAndRarity,
  type ItemDefinition,
  type ItemRarity,
} from '../run/ItemData'
import { shuffleArray } from '../utils/shuffle'
import { addItemStack } from '../run/ItemInventory'

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
  uncommon: '#4488ff',
  rare: '#aa44ff',
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
  private activeModRarities: ModRarity[] = ['common', 'uncommon']
  private minibossItemOffers: ItemDefinition[] = []
  private selectedMinibossItemIndex: number | null = null
  /** Which unit card is currently highlighted in any picker (mod/miniboss/boss). */
  private selectedPickerUnitIndex: number | null = null
  // ── Combat loot drop state ──
  private combatLootItems: ItemDefinition[] = []
  private lootPickerOpenIndex: number | null = null
  private lootPickerSelectedUnit: number | null = null

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
    const combatType = this.runState.lastCombatType
    let modSlotType: ModSlotType | null = null
    if (faction === 'fantasy') {
      modSlotType = 'weapon'
    } else if (faction === 'tech') {
      modSlotType = 'armor'
    }

    // Rarity pool scales with encounter difficulty
    // regular combat → common+uncommon; elite → uncommon+rare; miniboss/boss → rare+legendary
    let modRarities: ModRarity[]
    if (combatType === 'boss' || combatType === 'miniboss') {
      modRarities = ['rare', 'legendary']
    } else if (combatType === 'elite') {
      modRarities = ['uncommon', 'rare']
    } else {
      modRarities = ['common', 'uncommon']
    }

    this.root = document.createElement('div')
    this.root.id = 'reward-screen'

    if (modSlotType) {
      this.activeSlotType = modSlotType
      this.activeModRarities = modRarities
      const pool = getModsByRarities(modSlotType, modRarities)
      this.currentMods = pickRandomMods(pool.length > 0 ? pool : getModsByRarities(modSlotType, ['common', 'uncommon']), 3)
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

    const partyBonuses = formatPartyRunBonuses(this.runState)

    this.root.innerHTML = `
      <h2 class="reward-title">Victory spoils — pick a ${slotLabel} mod</h2>
      <p class="reward-sub">Three offers. Choose one, then attach it to a hero. Each button lists that hero’s party perk and mods already equipped.</p>
      <div class="reward-gold">${goldLine}</div>
      ${partyBonuses ? `<p class="reward-party-bonuses"><strong>Run bonuses:</strong> ${escReward(partyBonuses)}</p>` : ''}
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
        <h3 class="reward-section-title">Attach to which unit?</h3>
        <div class="uc-picker">
          <div class="uc-grid">${this.buildUnitPickerCardsHTML()}</div>
          <button type="button" class="uc-confirm-btn" id="reward-confirm-attach" disabled>Confirm Attachment</button>
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
      const fullPool = getModsByRarities(slotType, this.activeModRarities)
      const pool = fullPool.length > 0 ? fullPool : getModsByRarities(slotType, ['common', 'uncommon'])
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

    // Mini-boss item card selected
    const mbCard = target.closest<HTMLButtonElement>('.reward-miniboss-card')
    if (mbCard && this.selectedMinibossItemIndex === null) {
      const mbIdx = parseInt(mbCard.dataset.mbIndex ?? '0', 10)
      this.selectedMinibossItemIndex = mbIdx
      this.selectedPickerUnitIndex = null
      const unitSelect = this.root.querySelector('#miniboss-item-unit-select')
      if (unitSelect) unitSelect.classList.remove('hidden')
      this.root.querySelectorAll('.reward-miniboss-card').forEach((c, i) => {
        (c as HTMLElement).style.opacity = i === mbIdx ? '1' : '0.4'
      })
      return
    }

    // Boss legendary: pick item
    const legCard = target.closest<HTMLButtonElement>('.reward-boss-card')
    if (legCard && this.selectedLegendaryIndex === null) {
      const legIdx = parseInt(legCard.dataset.legIndex ?? '0', 10)
      this.selectedLegendaryIndex = legIdx
      this.selectedPickerUnitIndex = null
      const unitSelect = this.root.querySelector('#boss-legendary-unit-select')
      if (unitSelect) unitSelect.classList.remove('hidden')
      this.root.querySelectorAll('.reward-boss-card').forEach((c, i) => {
        (c as HTMLElement).style.opacity = i === legIdx ? '1' : '0.4'
      })
      return
    }

    // Unit card clicked in any picker — show preview + highlight
    const ucCard = target.closest<HTMLElement>('.uc-card')
    if (ucCard) {
      const unitIndex = parseInt(ucCard.dataset.ucUnit ?? '-1', 10)
      if (unitIndex < 0) return

      // Deselect all cards & clear previews in this picker
      const picker = ucCard.closest('.uc-picker')
      picker?.querySelectorAll<HTMLElement>('.uc-card').forEach((c) => c.classList.remove('uc-selected'))
      picker?.querySelectorAll<HTMLElement>('.uc-preview').forEach((p) => { p.innerHTML = '' })

      ucCard.classList.add('uc-selected')

      // Fill the preview based on which item/mod is selected
      const preview = ucCard.querySelector<HTMLElement>('.uc-preview')

      // Loot picker context: card is inside a .loot-picker-panel
      if (ucCard.closest('.loot-picker-panel')) {
        this.lootPickerSelectedUnit = unitIndex
        if (preview && this.lootPickerOpenIndex !== null) {
          const lootItem = this.combatLootItems[this.lootPickerOpenIndex]
          if (lootItem) preview.innerHTML = this.buildItemEquipPreviewHTML(lootItem, unitIndex)
        }
        const confirmBtn = picker?.querySelector<HTMLButtonElement>('.loot-confirm-equip-btn')
        if (confirmBtn) confirmBtn.disabled = false
        return
      }

      // Standard picker context (mod / miniboss / boss)
      this.selectedPickerUnitIndex = unitIndex
      if (preview) {
        if (this.selectedModIndex !== null) {
          const mod = this.currentMods[this.selectedModIndex]
          if (mod) preview.innerHTML = this.buildModPreviewHTML(mod, unitIndex)
        } else if (this.selectedMinibossItemIndex !== null) {
          const item = this.minibossItemOffers[this.selectedMinibossItemIndex]
          if (item) preview.innerHTML = this.buildItemEquipPreviewHTML(item, unitIndex)
        } else if (this.selectedLegendaryIndex !== null) {
          const item = this.bossLegendaryItems[this.selectedLegendaryIndex]
          if (item) preview.innerHTML = this.buildItemEquipPreviewHTML(item, unitIndex)
        }
      }

      // Enable the confirm button for this picker
      const confirmBtn = picker?.querySelector<HTMLButtonElement>('.uc-confirm-btn')
      if (confirmBtn) confirmBtn.disabled = false
      return
    }

    // Confirm mod attachment
    const confirmAttach = target.closest<HTMLButtonElement>('#reward-confirm-attach')
    if (confirmAttach && this.selectedModIndex !== null && this.selectedPickerUnitIndex !== null) {
      const unitIdx = this.selectedPickerUnitIndex
      const mod = this.currentMods[this.selectedModIndex]
      if (mod) {
        while (this.runState.unitWeaponMods.length <= unitIdx) this.runState.unitWeaponMods.push([])
        while (this.runState.unitArmorMods.length <= unitIdx) this.runState.unitArmorMods.push([])
        const modList = mod.slotType === 'weapon'
          ? this.runState.unitWeaponMods[unitIdx]
          : this.runState.unitArmorMods[unitIdx]
        attachMod(modList, mod.id, 2)
      }
      this.selectedModIndex = null
      this.selectedPickerUnitIndex = null
      this.finishRewardsOrBossLegendary()
      return
    }

    // Confirm miniboss item equip
    const confirmMb = target.closest<HTMLButtonElement>('#reward-confirm-mb')
    if (confirmMb && this.selectedMinibossItemIndex !== null && this.selectedPickerUnitIndex !== null) {
      const unitIdx = this.selectedPickerUnitIndex
      const item = this.minibossItemOffers[this.selectedMinibossItemIndex]
      if (item && this.runState.loadout[unitIdx]) {
        const slot = this.runState.loadout[unitIdx]
        if (item.type === 'weapon') slot.weaponId = item.id
        else if (item.type === 'armor') slot.armorId = item.id
      }
      this.selectedMinibossItemIndex = null
      this.selectedPickerUnitIndex = null
      this.clearBossCombatFlags()
      this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
      return
    }

    // Confirm boss legendary equip
    const confirmBoss = target.closest<HTMLButtonElement>('#reward-confirm-boss')
    if (confirmBoss && this.selectedLegendaryIndex !== null && this.selectedPickerUnitIndex !== null) {
      const unitIdx = this.selectedPickerUnitIndex
      const item = this.bossLegendaryItems[this.selectedLegendaryIndex]
      if (item && this.runState.loadout[unitIdx]) {
        const slot = this.runState.loadout[unitIdx]
        if (item.type === 'weapon' && !getCharacter(slot.characterId)?.equipRestrictions.includes('weapon')) {
          slot.weaponId = item.id
        } else if (item.type === 'armor' && !getCharacter(slot.characterId)?.equipRestrictions.includes('armor')) {
          slot.armorId = item.id
        }
        // Mark as dropped so it cannot appear again this run
        if (!this.runState.droppedLegendaryIds.includes(item.id)) {
          this.runState.droppedLegendaryIds.push(item.id)
        }
      }
      this.clearBossCombatFlags()
      this.selectedLegendaryIndex = null
      this.selectedPickerUnitIndex = null
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

    // Loot: equip button — open unit picker for this item
    const lootEquipBtn = target.closest<HTMLButtonElement>('.loot-equip-btn')
    if (lootEquipBtn) {
      const idx = parseInt(lootEquipBtn.dataset.lootIdx ?? '0', 10)
      this.lootPickerOpenIndex = idx
      this.lootPickerSelectedUnit = null
      this.root.querySelectorAll<HTMLElement>('.loot-picker-panel').forEach((p) => p.classList.add('hidden'))
      const panel = this.root.querySelector(`#loot-picker-${idx}`)
      if (panel) panel.classList.remove('hidden')
      return
    }

    // Loot: bag button — add to inventory
    const lootBagBtn = target.closest<HTMLButtonElement>('.loot-bag-btn')
    if (lootBagBtn) {
      const idx = parseInt(lootBagBtn.dataset.lootIdx ?? '0', 10)
      const item = this.combatLootItems[idx]
      if (item) addItemStack(this.runState, item.id, 1)
      this.resolveLootCard(idx, '🎒 Added to bag')
      return
    }

    // Loot: skip button
    const lootSkipBtn = target.closest<HTMLButtonElement>('.loot-skip-btn')
    if (lootSkipBtn) {
      const idx = parseInt(lootSkipBtn.dataset.lootIdx ?? '0', 10)
      this.resolveLootCard(idx, 'Skipped')
      return
    }

    // Loot: confirm equip
    const lootConfirmBtn = target.closest<HTMLButtonElement>('.loot-confirm-equip-btn')
    if (lootConfirmBtn && this.lootPickerOpenIndex !== null && this.lootPickerSelectedUnit !== null) {
      const lootIdx = this.lootPickerOpenIndex
      const unitIdx = this.lootPickerSelectedUnit
      const item = this.combatLootItems[lootIdx]
      if (item && this.runState.loadout[unitIdx]) {
        const slot = this.runState.loadout[unitIdx]
        if (item.type === 'weapon') {
          if (slot.weaponId) addItemStack(this.runState, slot.weaponId, 1) // old weapon → bag
          slot.weaponId = item.id
        } else if (item.type === 'armor') {
          if (slot.armorId) addItemStack(this.runState, slot.armorId, 1) // old armor → bag
          slot.armorId = item.id
        }
      }
      const charName = getCharacter(this.runState.loadout[unitIdx]?.characterId ?? '')?.name ?? 'hero'
      this.lootPickerOpenIndex = null
      this.lootPickerSelectedUnit = null
      this.resolveLootCard(lootIdx, `⚔ Equipped on ${escReward(charName)}`)
      return
    }

    // Loot done
    if (target.id === 'loot-done' || target.closest('#loot-done')) {
      this.clearBossCombatFlags()
      this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
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

  /** After normal mod/stat reward, show bonus drops or return to map. */
  private finishRewardsOrBossLegendary(): void {
    if (this.runState.lastCombatType === 'boss') {
      this.renderBossLegendary()
      return
    }
    if (this.runState.lastCombatType === 'miniboss') {
      this.renderMinibossItemDrop()
      return
    }
    if (this.runState.lastCombatType === 'combat' || this.runState.lastCombatType === 'elite') {
      this.renderCombatLootDrop()
      return
    }
    this.clearBossCombatFlags()
    this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
  }

  /** Mini-boss bonus: pick one rare item (weapon or armor). */
  private renderMinibossItemDrop(): void {
    const rarities: ItemRarity[] = ['rare']
    const weapons = getItemsByTypeAndRarity('weapon', rarities)
    const armors = getItemsByTypeAndRarity('armor', rarities)
    const combined = shuffleArray([...weapons, ...armors])
    this.minibossItemOffers = combined.slice(0, 3)
    this.selectedMinibossItemIndex = null

    if (this.minibossItemOffers.length === 0) {
      this.clearBossCombatFlags()
      this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
      return
    }

    const unitCount = this.runState.loadout.length || 3
    this.root.innerHTML = `
      <h2 class="reward-title">Mini-boss cache — pick one rare item</h2>
      <p class="reward-sub">Equip it to a hero. Rare drops only come from tough fights.</p>
      <div class="reward-gold">Total gold ${this.runState.gold}</div>
      <div class="reward-cards">
        ${this.minibossItemOffers.map((item, i) => {
          const rarity = item.rarity
          return `
          <button type="button" class="reward-card reward-miniboss-card" data-mb-index="${i}">
            <div class="reward-card-label" style="color:${RARITY_COLORS[rarity] ?? '#aa44ff'}">${item.name}</div>
            <div class="reward-card-rarity" style="color:${RARITY_COLORS[rarity] ?? '#aa44ff'}">${rarity.toUpperCase()} · ${item.type}</div>
            <div class="reward-card-desc">${item.description}</div>
          </button>`
        }).join('')}
      </div>
      <div class="reward-unit-select hidden" id="miniboss-item-unit-select">
        <h3 class="reward-section-title">Equip on which unit?</h3>
        <div class="uc-picker">
          <div class="uc-grid">${this.buildUnitPickerCardsHTML()}</div>
          <button type="button" class="uc-confirm-btn" id="reward-confirm-mb" disabled>Confirm Equip</button>
        </div>
      </div>
    `
  }

  /** After regular / elite combat: offer 1–2 items as loot. Player can equip or bag each one. */
  private renderCombatLootDrop(): void {
    const isElite = this.runState.lastCombatType === 'elite'
    const rarities: ItemRarity[] = isElite ? ['uncommon', 'rare'] : ['common', 'uncommon']
    const weapons = getItemsByTypeAndRarity('weapon', rarities)
    const armors = getItemsByTypeAndRarity('armor', rarities)
    const pool = shuffleArray([...weapons, ...armors])
    this.combatLootItems = pool.slice(0, 2)
    this.lootPickerOpenIndex = null
    this.lootPickerSelectedUnit = null

    if (this.combatLootItems.length === 0) {
      this.clearBossCombatFlags()
      this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
      return
    }

    this.root.innerHTML = `
      <h2 class="reward-title">Battle loot</h2>
      <p class="reward-sub">Equip gear to a hero now, or bag it for selling at a shop later.</p>
      <div class="reward-gold">Total gold ${this.runState.gold}</div>
      <div class="reward-loot-grid">
        ${this.combatLootItems.map((item, i) => this.buildLootCardHTML(item, i)).join('')}
      </div>
      <button type="button" class="reward-continue-btn" id="loot-done">Continue →</button>
    `
  }

  private buildLootCardHTML(item: ItemDefinition, index: number): string {
    const rColor = RARITY_COLORS[item.rarity] ?? '#aaa'
    return `
      <div class="loot-card" id="loot-card-${index}">
        <div class="loot-card-name" style="color:${rColor}">${escReward(item.name)}</div>
        <div class="loot-card-meta" style="color:${rColor}">${item.rarity.toUpperCase()} · ${item.type}</div>
        <div class="loot-card-desc">${escReward(item.description)}</div>
        <div class="loot-card-actions">
          <button type="button" class="loot-equip-btn" data-loot-idx="${index}">⚔ Equip on hero…</button>
          <button type="button" class="loot-bag-btn" data-loot-idx="${index}">🎒 Add to Bag</button>
          <button type="button" class="loot-skip-btn" data-loot-idx="${index}">Skip</button>
        </div>
        <div class="loot-picker-panel hidden" id="loot-picker-${index}">
          <div class="uc-picker">
            <div class="uc-grid">${this.buildUnitPickerCardsHTML()}</div>
            <button type="button" class="loot-confirm-equip-btn" data-loot-idx="${index}" disabled>Confirm Equip</button>
          </div>
        </div>
        <div class="loot-resolved-label hidden" id="loot-resolved-${index}"></div>
      </div>
    `
  }

  private resolveLootCard(index: number, label: string): void {
    const card = this.root.querySelector(`#loot-card-${index}`)
    if (!card) return
    ;(card.querySelector('.loot-card-actions') as HTMLElement | null)?.remove()
    ;(card.querySelector('.loot-picker-panel') as HTMLElement | null)?.remove()
    card.classList.add('loot-card-resolved')
    const lbl = card.querySelector(`#loot-resolved-${index}`) as HTMLElement | null
    if (lbl) { lbl.textContent = label; lbl.classList.remove('hidden') }
  }

  private renderBossLegendary(): void {
    const loadoutIds = this.runState.loadout.map((l) => l.characterId)
    this.bossLegendaryItems = getBossLegendaryOffers(loadoutIds, this.runState.droppedLegendaryIds)
    this.selectedLegendaryIndex = null
    if (this.bossLegendaryItems.length === 0) {
      this.clearBossCombatFlags()
      this.postBossActChoice()
      return
    }

    const unitCount = this.runState.loadout.length || 3
    const partyBonuses = formatPartyRunBonuses(this.runState)
    this.root.innerHTML = `
      <h2 class="reward-title">Boss cache — choose one legendary</h2>
      <p class="reward-sub">Equip to a hero. Each unit shows party perk and current mods so you can balance the drop.</p>
      <div class="reward-gold">Total gold ${this.runState.gold}</div>
      ${partyBonuses ? `<p class="reward-party-bonuses"><strong>Run bonuses:</strong> ${escReward(partyBonuses)}</p>` : ''}
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
        <h3 class="reward-section-title">Equip on which unit?</h3>
        <div class="uc-picker">
          <div class="uc-grid">${this.buildUnitPickerCardsHTML()}</div>
          <button type="button" class="uc-confirm-btn" id="reward-confirm-boss" disabled>Confirm Equip</button>
        </div>
      </div>
    `
  }

  // ── Unit picker helpers ──────────────────────────────────────────────────

  /** Build rich unit cards for the "attach/equip to which unit?" picker. */
  private buildUnitPickerCardsHTML(): string {
    const unitCount = this.runState.loadout.length || 3
    return Array.from({ length: unitCount }, (_, i) => {
      const loadout = this.runState.loadout[i]
      if (!loadout) return ''
      const char = getCharacter(loadout.characterId)
      const name = char?.name ?? loadout.characterId
      const cls = char?.class ?? ''
      const level = this.runState.heroLevel[loadout.characterId] ?? 1

      const weapon = loadout.weaponId ? getItem(loadout.weaponId) : null
      const armor = loadout.armorId ? getItem(loadout.armorId) : null
      const weaponMods = this.runState.unitWeaponMods[i] ?? []
      const armorMods = this.runState.unitArmorMods[i] ?? []

      const weaponChip = weapon
        ? `<span class="uc-item-chip" style="color:${RARITY_COLORS[weapon.rarity] ?? '#aaa'}">${escReward(weapon.name)}</span>`
        : `<span class="uc-item-chip uc-item-empty">${escReward(char?.weapon.name ?? 'Default weapon')}</span>`

      const armorChip = armor
        ? `<span class="uc-item-chip" style="color:${RARITY_COLORS[armor.rarity] ?? '#aaa'}">${escReward(armor.name)}</span>`
        : `<span class="uc-item-chip uc-item-empty">${escReward(char?.armor.name ?? 'Default armor')}</span>`

      const wModsHTML = weaponMods.map((m) => {
        const d = getMod(m.modId)
        if (!d) return ''
        const label = m.stacks > 1 ? `${d.name} ×${m.stacks}` : d.name
        return `<span class="uc-mod-chip" style="color:${RARITY_COLORS[d.rarity] ?? '#aaa'}" title="${escReward(d.description)}">${escReward(label)}</span>`
      }).join('')

      const aModsHTML = armorMods.map((m) => {
        const d = getMod(m.modId)
        if (!d) return ''
        const label = m.stacks > 1 ? `${d.name} ×${m.stacks}` : d.name
        return `<span class="uc-mod-chip" style="color:${RARITY_COLORS[d.rarity] ?? '#aaa'}" title="${escReward(d.description)}">${escReward(label)}</span>`
      }).join('')

      return `
        <div class="uc-card" data-uc-unit="${i}">
          <div class="uc-card-header">
            <span class="uc-name">${escReward(name)}</span>
            <span class="uc-meta">${escReward(cls)} · Lv.${level}</span>
          </div>
          <div class="uc-equip">
            <div class="uc-equip-row">
              <span class="uc-equip-icon">⚔</span>
              ${weaponChip}
            </div>
            ${wModsHTML ? `<div class="uc-mods">${wModsHTML}</div>` : ''}
            <div class="uc-equip-row">
              <span class="uc-equip-icon">🛡</span>
              ${armorChip}
            </div>
            ${aModsHTML ? `<div class="uc-mods">${aModsHTML}</div>` : ''}
          </div>
          <div class="uc-preview"></div>
        </div>`
    }).join('')
  }

  /** Build the stat-preview block shown on a unit card after clicking it (mod attach flow). */
  private buildModPreviewHTML(mod: ModDefinition, unitIndex: number): string {
    const existingMods = mod.slotType === 'weapon'
      ? (this.runState.unitWeaponMods[unitIndex] ?? [])
      : (this.runState.unitArmorMods[unitIndex] ?? [])
    const currentStacks = existingMods.find((m) => m.modId === mod.id)?.stacks ?? 0

    const statLines: string[] = []
    const effectLines: string[] = []

    for (const e of mod.effects) {
      const oldVal = effectiveValue(e, currentStacks)
      const newVal = effectiveValue(e, currentStacks + 1)
      const delta = newVal - oldVal
      switch (e.kind) {
        case 'flat_charges':   if (delta > 0) statLines.push(`+${delta} Charges`); break
        case 'flat_hp':        if (delta > 0) statLines.push(`+${delta} Max HP`); break
        case 'flat_defense':   if (delta > 0) statLines.push(`+${delta} Defense`); break
        case 'flat_movement':  if (delta > 0) statLines.push(`+${delta} Movement`); break
        case 'flat_range':     if (delta > 0) statLines.push(`+${delta} Attack Range`); break
        case 'recharge_boost': if (delta > 0) statLines.push(`+${delta} Recharge`); break
        case 'burn_on_hit':
          effectLines.push(currentStacks > 0 ? `Burn ${newVal} dmg (×${currentStacks + 1})` : `Burn on hit (${newVal} dmg)`)
          break
        case 'stun_chance':    effectLines.push(`${newVal}% stun on hit`); break
        case 'vampiric':       effectLines.push(`+${newVal} HP on kill`); break
        case 'negate_first_hit': if (currentStacks === 0) effectLines.push('Block first hit'); break
        case 'heal_once':      if (currentStacks === 0) effectLines.push('One-time heal'); break
        case 'infinite_charges': if (currentStacks === 0) effectLines.push('Infinite charges'); break
        case 'self_damage':    effectLines.push(`⚠ ${newVal} self dmg/hit`); break
        case 'no_status_procs': if (currentStacks === 0) effectLines.push('⚠ No status procs'); break
      }
    }

    const stackNote = currentStacks > 0
      ? `<div class="uc-stack-note">Stacking: ×${currentStacks} → ×${currentStacks + 1}</div>`
      : ''
    const allLines = [...statLines, ...effectLines]
    if (allLines.length === 0) {
      return `<div class="uc-preview-inner"><span class="uc-preview-label">Effect</span><span class="uc-stat-delta">${escReward(mod.description)}</span>${stackNote}</div>`
    }
    return `<div class="uc-preview-inner">
      <span class="uc-preview-label">Adds</span>
      ${allLines.map((l) => `<span class="uc-stat-delta${l.startsWith('⚠') ? ' uc-cursed-line' : ''}">${escReward(l)}</span>`).join('')}
      ${stackNote}
    </div>`
  }

  /** Build the preview shown when equipping an item (weapon/armor) to a hero — includes stat delta vs current. */
  private buildItemEquipPreviewHTML(item: ItemDefinition, unitIndex: number): string {
    const loadout = this.runState.loadout[unitIndex]
    if (!loadout) return ''
    const char = getCharacter(loadout.characterId)
    const currentItemId = item.type === 'weapon' ? loadout.weaponId : loadout.armorId
    const currentItem = currentItemId ? getItem(currentItemId) : null

    // Compute stat bonus maps
    const newBonus: Record<string, number> = {}
    for (const e of item.effects) {
      if (e.kind === 'stat_bonus' && e.stat && e.amount) {
        newBonus[e.stat] = (newBonus[e.stat] ?? 0) + e.amount
      }
    }
    const curBonus: Record<string, number> = {}
    if (currentItem) {
      for (const e of currentItem.effects) {
        if (e.kind === 'stat_bonus' && e.stat && e.amount) {
          curBonus[e.stat] = (curBonus[e.stat] ?? 0) + e.amount
        }
      }
    }

    const STAT_LABELS: Record<string, string> = { attack: 'ATK', defense: 'DEF', maxHp: 'HP', moveRange: 'MOV' }
    const allStatKeys = Array.from(new Set([...Object.keys(newBonus), ...Object.keys(curBonus)]))
    const statLines: string[] = []
    for (const stat of allStatKeys) {
      const nv = newBonus[stat] ?? 0
      const cv = curBonus[stat] ?? 0
      const delta = nv - cv
      const label = STAT_LABELS[stat] ?? stat
      const sign = nv >= 0 ? '+' : ''
      const deltaSign = delta > 0 ? '+' : ''
      const deltaStr = delta !== 0 ? ` <span class="uc-delta-change ${delta > 0 ? 'uc-better' : 'uc-worse'}">(${deltaSign}${delta})</span>` : ` <span class="uc-delta-same">(=)</span>`
      statLines.push(`<span class="uc-stat-delta">${sign}${nv} ${label}${deltaStr}</span>`)
    }

    // Weapon-specific: charges / attack type comparison
    if (item.type === 'weapon') {
      const curCharges = currentItem ? (currentItem.maxCharges ?? 1) : (char?.weapon.maxCharges ?? 1)
      const newCharges = item.maxCharges ?? 1
      const chargeDelta = newCharges - curCharges
      const chargeDeltaStr = chargeDelta !== 0
        ? ` <span class="uc-delta-change ${chargeDelta > 0 ? 'uc-better' : 'uc-worse'}">(${chargeDelta > 0 ? '+' : ''}${chargeDelta})</span>`
        : ` <span class="uc-delta-same">(=)</span>`
      const curType = currentItem?.attackType ?? char?.weapon.attackType ?? 'basic'
      const typeChange = item.attackType !== curType
        ? ` <span class="uc-delta-change">${curType} → ${item.attackType ?? 'basic'}</span>`
        : ''
      statLines.push(`<span class="uc-stat-delta">${newCharges} charges${chargeDeltaStr}${typeChange}</span>`)
    }

    const replaceLabel = currentItem
      ? `<span class="uc-replaced-item" style="color:${RARITY_COLORS[currentItem.rarity] ?? '#aaa'}">${escReward(currentItem.name)}</span>`
      : `<span class="uc-item-empty">${escReward(item.type === 'weapon' ? (char?.weapon.name ?? 'Default') : (char?.armor.name ?? 'Default'))}</span>`

    return `<div class="uc-preview-inner">
      <span class="uc-preview-label">Replaces</span>${replaceLabel}
      ${statLines.join('')}
    </div>`
  }

  /**
   * After the final boss of an act, extend the map so play can continue, then offer
   * map vs camp (loot-home flow can build on camp later).
   */
  private postBossActChoice(): void {
    const campaign = getCampaign(this.runState.campaignId)
    const segment = Math.max(7, Math.min(12, campaign.numCols ?? 7))
    this.runState.ringIndex += 1
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

// ─────────────────────────────────────────────────────────────────────────────
// Module-level helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Escape HTML special characters so template-literal strings are XSS-safe. */
function escReward(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Summarise party-wide run bonuses (ATK/DEF/HP) into a compact string. */
function formatPartyRunBonuses(state: RunState): string {
  const parts: string[] = []
  if (state.bonusAtk > 0) parts.push(`+${state.bonusAtk} ATK`)
  if (state.bonusDef > 0) parts.push(`+${state.bonusDef} DEF`)
  if (state.bonusMaxHp > 0) parts.push(`+${state.bonusMaxHp} HP`)
  return parts.join(' · ')
}

/**
 * Build a one-liner for a specific hero's slot in the reward unit-picker —
 * shows their primary perk and any mods already equipped.
 */
function formatUnitRewardContext(state: RunState, unitIndex: number): string {
  const loadout = state.loadout[unitIndex]
  if (!loadout) return ''
  const char = getCharacter(loadout.characterId)
  const parts: string[] = []
  if (char) {
    const perkLine = formatHeroPerkSummary(char, state)
    if (perkLine) parts.push(perkLine)
  }
  const wMods = state.unitWeaponMods[unitIndex] ?? []
  const aMods = state.unitArmorMods[unitIndex] ?? []
  const modNames = [...wMods, ...aMods]
    .map((m) => {
      const d = getMod(m.modId)
      return d ? (m.stacks > 1 ? `${d.name}×${m.stacks}` : d.name) : null
    })
    .filter((n): n is string => n !== null)
  if (modNames.length > 0) parts.push(modNames.join(', '))
  return parts.join(' | ')
}
