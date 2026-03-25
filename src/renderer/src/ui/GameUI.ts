import { TurnManager } from '../combat/TurnManager'
import { InputManager } from '../input/InputManager'
import { UnitManager } from '../entities/UnitManager'
import { getCharacter } from '../entities/CharacterData'
import type { AttackProfile } from '../entities/CharacterData'
import { getItem, isCombatUsableConsumable, type ItemDefinition } from '../run/ItemData'
import { getMod } from '../run/ModData'
import { statusLabel } from '../combat/StatusEffects'
import type { UnitEntity } from '../entities/UnitEntity'
import type { RunState } from '../run/RunState'
import { formatHeroPerkSummary } from '../run/HeroPerks'
import { mountRunSheetOverlay } from './RunSheetPanel'
import { consumeFromInventory } from '../run/ItemInventory'

/** Emoji-style icons for attack types used in the equipment tooltip. */
const ATTACK_ICONS: Record<string, string> = {
  basic: '\u2694',      // crossed swords
  projectile: '\u27B3', // arrow
  lobbed: '\u2604',     // comet
  cleave: '\u2620',     // skull (wide hit)
}

export class GameUI {
  private phaseIndicator!: HTMLElement
  private turnCounter!: HTMLElement
  private unitInfoPanel!: HTMLElement
  private endTurnButton!: HTMLButtonElement
  private gameOverOverlay!: HTMLElement
  private partyPanel!: HTMLElement
  private actionBar!: HTMLElement
  private resizeHandler: (() => void) | null = null
  /** Non-null while run sheet overlay is visible. */
  private runSheetCloser: (() => void) | null = null
  private windowEscHandler: ((e: KeyboardEvent) => void) | null = null
  /** Non-null while the "Use Item" popup is open. */
  private itemPopupCloser: (() => void) | null = null
  /** Unit ID currently selected in the action bar (for border highlight). */
  private selectedActionBarUnitId: string | null = null

  constructor(
    private readonly hostContainer: HTMLElement,
    private turnManager: TurnManager,
    private inputManager: InputManager,
    private unitManager: UnitManager,
    private readonly onVictory?: () => void,
    private readonly onDefeat?: () => void,
    private readonly onAbilityUse?: (caster: UnitEntity, ability: AttackProfile, target?: UnitEntity) => Promise<void>,
    private readonly runState?: RunState
  ) {
    this.buildDOM(this.hostContainer)
    this.bindEvents()
    this.setupScaling()
  }

  private buildDOM(container: HTMLElement): void {
    const ui = document.createElement('div')
    ui.id = 'game-ui'
    ui.innerHTML = `
      <div id="phase-bar">
        <span id="turn-counter">Turn 1</span>
        <span id="phase-indicator">PLAYER PHASE</span>
        <button type="button" id="run-sheet-btn" class="run-sheet-open-btn" title="Run summary (Esc)">Run</button>
      </div>
      <div id="party-panel"></div>
      <div id="unit-info" class="hidden">
        <div class="unit-name"></div>
        <div class="unit-hp"></div>
        <div class="unit-stats"></div>
        <div class="unit-perks"></div>
        <div class="unit-charges"></div>
        <div class="unit-statuses"></div>
        <div class="unit-abilities"></div>
      </div>
      <div id="action-bar"></div>
      <div id="game-over" class="hidden">
        <h1></h1>
        <p id="game-over-sub" class="hidden"></p>
        <button id="return-btn" class="hidden">Continue</button>
        <button id="defeat-menu-btn" class="hidden">Main menu</button>
      </div>
    `
    container.appendChild(ui)

    this.phaseIndicator = document.getElementById('phase-indicator')!
    this.turnCounter = document.getElementById('turn-counter')!
    this.unitInfoPanel = document.getElementById('unit-info')!
    this.partyPanel = document.getElementById('party-panel')!
    this.actionBar = document.getElementById('action-bar')!
    // endTurnButton is wired once buildActionBar() creates it inside the action bar
    this.endTurnButton = document.createElement('button') // placeholder until action bar is built
    this.gameOverOverlay = document.getElementById('game-over')!
  }

  private bindEvents(): void {
    const returnBtn = document.getElementById('return-btn')
    if (returnBtn && this.onVictory) {
      returnBtn.addEventListener('click', this.onVictory)
    }
    const defeatBtn = document.getElementById('defeat-menu-btn')
    if (defeatBtn && this.onDefeat) {
      defeatBtn.addEventListener('click', this.onDefeat)
    }

    // End Turn button is wired in buildActionBar() after the action bar DOM is built

    document.getElementById('run-sheet-btn')?.addEventListener('click', () => {
      this.toggleRunSheet()
    })

    this.windowEscHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !this.runState) return
      if (!this.gameOverOverlay.classList.contains('hidden')) return
      if (this.runSheetCloser) {
        e.preventDefault()
        this.runSheetCloser()
        return
      }
      e.preventDefault()
      this.openRunSheet()
    }
    window.addEventListener('keydown', this.windowEscHandler)

    // Turn events
    this.turnManager.on((event) => {
      if (event.type === 'phaseChange') {
        this.updatePhaseDisplay(event.phase!)
        this.refreshPartyPortraits()
        this.refreshActionBar()
      }
      if (event.type === 'turnStart') {
        this.turnCounter.textContent = `Turn ${this.turnManager.getTurnNumber()}`
        this.refreshActionBar()
      }
      if (event.type === 'gameOver') {
        this.showGameOver(event.winner!)
      }
    })

    // Ability buttons (delegated from unit-info panel)
    this.unitInfoPanel.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('.ability-btn')
      if (!btn) return
      const unitId = btn.dataset.unitId
      const abilityId = btn.dataset.abilityId
      if (!unitId || !abilityId) return
      this.handleAbilityClick(unitId, abilityId)
    })

    // Action bar clicks (attack, ability, use-item)
    this.actionBar.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-ac-action]')
      if (!btn) return
      const action = btn.dataset.acAction
      const unitId = btn.dataset.unitId
      const abilityId = btn.dataset.abilityId
      if (!unitId) return
      if (action === 'attack') {
        this.inputManager.selectUnitById(unitId)
      } else if (action === 'ability' && abilityId) {
        this.handleAbilityClick(unitId, abilityId)
      } else if (action === 'item') {
        this.openItemPopup(unitId, btn)
      }
    })

    // Input events — update unit info panel + highlight portrait
    this.inputManager.on((event) => {
      if (event.type === 'unitSelected' && event.unitId) {
        const unit = this.unitManager.getUnit(event.unitId)
        if (unit) this.showUnitInfo(unit)
        this.highlightPortrait(event.unitId)
        this.selectedActionBarUnitId = event.unitId
        this.updateActionBarSelection()
      }
      if (event.type === 'unitDeselected') {
        this.hideUnitInfo()
        this.highlightPortrait(null)
        this.selectedActionBarUnitId = null
        this.updateActionBarSelection()
      }
      if (event.type === 'unitMoved' || event.type === 'unitAttacked') {
        // Refresh displayed unit info
        const state = this.inputManager.getSelectionState()
        if (state.kind === 'unitSelected') {
          const unit = this.unitManager.getUnit(state.unitId)
          if (unit) this.showUnitInfo(unit)
        }
        this.refreshPartyPortraits()
        this.refreshActionBar()
      }
    })
  }

  // ── Party Portraits ──

  /** Call after units are spawned to populate the party portrait panel and action bar. */
  buildPartyPortraits(): void {
    const players = this.unitManager.getTeamUnits('player')
    this.partyPanel.innerHTML = players.map((unit) => this.buildPortraitHTML(unit)).join('')
    this.buildActionBar(players)
  }

  // ── Action Bar ──

  private buildActionBar(players: UnitEntity[]): void {
    this.actionBar.innerHTML = players.map((unit) => this.buildActionColHTML(unit)).join('')
      + `<button type="button" id="end-turn-btn" class="ac-end-turn-btn">End Turn</button>`

    // Wire up end-turn button now that it's in the action bar DOM
    const etBtn = this.actionBar.querySelector('#end-turn-btn') as HTMLButtonElement | null
    if (etBtn) {
      this.endTurnButton = etBtn
      etBtn.addEventListener('click', () => {
        if (this.turnManager.getPhase() === 'player') {
          this.inputManager.deselect()
          this.turnManager.endPlayerPhase(this.unitManager)
        }
      })
    }
  }

  private updateActionBarSelection(): void {
    const players = this.unitManager.getTeamUnits('player')
    for (const unit of players) {
      const col = this.actionBar.querySelector<HTMLElement>(`[data-unit-id="${unit.data.id}"].ac-hero-col`)
      if (col) col.classList.toggle('ac-selected', unit.data.id === this.selectedActionBarUnitId)
    }
  }

  private buildActionColHTML(unit: UnitEntity): string {
    const d = unit.data
    const char = d.characterId ? getCharacter(d.characterId) : undefined
    const name = char?.name ?? d.id
    const weapon = d.weaponId ? getItem(d.weaponId) : undefined
    const deadClass = d.alive ? '' : ' ac-dead'
    const isPlayer = d.team === 'player'
    const canAct = d.alive && isPlayer

    const hpPct = Math.round((d.stats.hp / d.stats.maxHp) * 100)
    const hpColor = hpPct > 60 ? '#4c4' : hpPct > 30 ? '#ca4' : '#c44'

    // Turn status dot: ready (has charges) / moved (no charges, has movement) / done / dead
    const statusDotClass = !d.alive ? 'ac-dot-dead'
      : d.charges > 0 ? 'ac-dot-ready'
      : d.movementLeft > 0 ? 'ac-dot-moved'
      : 'ac-dot-done'

    // Attack button
    const weaponIcon = ATTACK_ICONS[weapon?.attackType ?? char?.weapon.attackType ?? 'basic'] ?? '⚔'
    const weaponName = weapon?.name ?? char?.weapon.name ?? 'Unarmed'
    const chargesText = `${d.charges}/${d.maxCharges}`
    const attackDisabled = !canAct || d.charges <= 0 ? 'disabled' : ''
    const attackBtn = `<button class="ac-btn ac-attack-btn" data-ac-action="attack" data-unit-id="${d.id}" ${attackDisabled} title="${weaponName}">
      <span class="ac-btn-icon">${weaponIcon}</span>
      <span class="ac-btn-label">${weaponName}</span>
      <span class="ac-charges ${d.charges <= 0 ? 'ac-charges-empty' : ''}">${chargesText}</span>
    </button>`

    // Ability buttons
    let abilityBtns = ''
    if (char && isPlayer) {
      const heroLevel = this.runState?.heroLevel[d.characterId ?? ''] ?? 1
      const abilities = char.attacks.filter((a) => a.abilityType).slice(0, heroLevel)
      abilityBtns = abilities.map((a) => {
        const canAfford = d.charges >= a.cost && canAct
        const label = a.cost > 0 ? `${a.name} (${a.cost})` : a.name
        return `<button class="ac-btn ac-ability-btn${canAfford ? '' : ' ac-btn-dim'}" data-ac-action="ability" data-unit-id="${d.id}" data-ability-id="${a.id}" ${canAfford ? '' : 'disabled'} title="${a.name}">
          <span class="ac-btn-icon">✦</span>
          <span class="ac-btn-label">${label}</span>
        </button>`
      }).join('')
    }

    // Use Item button (only if there are consumables and unit is alive)
    const hasConsumables = this.runState && this.runState.items.length > 0
    const itemBtn = hasConsumables && canAct
      ? `<button class="ac-btn ac-item-btn" data-ac-action="item" data-unit-id="${d.id}" title="Use a consumable item">
          <span class="ac-btn-icon">🧪</span>
          <span class="ac-btn-label">Use Item</span>
          <span class="ac-charges">${this.runState!.items.reduce((sum, s) => sum + s.quantity, 0)}</span>
        </button>`
      : ''

    return `<div class="ac-hero-col${deadClass}" data-unit-id="${d.id}">
      <div class="ac-hero-header">
        <span class="ac-turn-dot ${statusDotClass}" title="${statusDotClass === 'ac-dot-ready' ? 'Ready' : statusDotClass === 'ac-dot-moved' ? 'Moved — no attacks' : statusDotClass === 'ac-dot-done' ? 'Done' : 'Fallen'}">●</span>
        <span class="ac-hero-name">${name}</span>
        <div class="ac-hp-bar"><div class="ac-hp-fill" style="width:${hpPct}%;background:${hpColor}"></div></div>
        <span class="ac-hp-text">${d.stats.hp}/${d.stats.maxHp}</span>
      </div>
      <div class="ac-actions">
        ${attackBtn}
        ${abilityBtns}
        ${itemBtn}
      </div>
    </div>`
  }

  private refreshActionBar(): void {
    const players = this.unitManager.getTeamUnits('player')
    for (const unit of players) {
      const col = this.actionBar.querySelector<HTMLElement>(`[data-unit-id="${unit.data.id}"].ac-hero-col`)
      if (!col) continue
      const d = unit.data
      const hpPct = Math.round((d.stats.hp / d.stats.maxHp) * 100)
      const hpColor = hpPct > 60 ? '#4c4' : hpPct > 30 ? '#ca4' : '#c44'

      const hpFill = col.querySelector<HTMLElement>('.ac-hp-fill')
      if (hpFill) { hpFill.style.width = `${hpPct}%`; hpFill.style.background = hpColor }
      const hpText = col.querySelector('.ac-hp-text')
      if (hpText) hpText.textContent = `${d.stats.hp}/${d.stats.maxHp}`

      const attackBtn = col.querySelector<HTMLButtonElement>('.ac-attack-btn')
      if (attackBtn) {
        const chargesSpan = attackBtn.querySelector('.ac-charges')
        if (chargesSpan) chargesSpan.textContent = `${d.charges}/${d.maxCharges}`
        chargesSpan?.classList.toggle('ac-charges-empty', d.charges <= 0)
        attackBtn.disabled = !d.alive || d.charges <= 0 || this.turnManager.getPhase() !== 'player'
      }

      const abilityBtns = col.querySelectorAll<HTMLButtonElement>('.ac-ability-btn')
      abilityBtns.forEach((btn) => {
        const abilityId = btn.dataset.abilityId
        const char = d.characterId ? getCharacter(d.characterId) : undefined
        const ability = char?.attacks.find((a) => a.id === abilityId)
        const canAfford = ability ? d.charges >= ability.cost && d.alive && this.turnManager.getPhase() === 'player' : false
        btn.disabled = !canAfford
        btn.classList.toggle('ac-btn-dim', !canAfford)
      })

      const itemBtn = col.querySelector<HTMLButtonElement>('.ac-item-btn')
      if (itemBtn) {
        const total = this.runState?.items.reduce((sum, s) => sum + s.quantity, 0) ?? 0
        const chargesSpan = itemBtn.querySelector('.ac-charges')
        if (chargesSpan) chargesSpan.textContent = `${total}`
        itemBtn.disabled = !d.alive || total === 0 || this.turnManager.getPhase() !== 'player'
        itemBtn.classList.toggle('hidden', total === 0)
      }

      col.classList.toggle('ac-dead', !d.alive)
      col.classList.toggle('ac-selected', d.id === this.selectedActionBarUnitId)

      // Update turn status dot
      const dot = col.querySelector<HTMLElement>('.ac-turn-dot')
      if (dot) {
        const cls = !d.alive ? 'ac-dot-dead'
          : d.charges > 0 ? 'ac-dot-ready'
          : d.movementLeft > 0 ? 'ac-dot-moved'
          : 'ac-dot-done'
        dot.className = `ac-turn-dot ${cls}`
      }
    }

    // Update end-turn button state
    const etBtn = this.actionBar.querySelector<HTMLButtonElement>('#end-turn-btn')
    if (etBtn) etBtn.disabled = this.turnManager.getPhase() !== 'player'
  }

  /** Open the "Use Item" popup anchored near the clicked button. */
  private openItemPopup(unitId: string, anchor: HTMLElement): void {
    this.closeItemPopup()
    if (!this.runState) return

    const popup = document.createElement('div')
    popup.id = 'item-popup'

    const combatItems = this.runState.items.filter((s) => {
      const def = getItem(s.itemId)
      return def && isCombatUsableConsumable(def)
    })
    const restItems = this.runState.items.filter((s) => {
      const def = getItem(s.itemId)
      return def && !isCombatUsableConsumable(def)
    })

    const renderRow = (s: { itemId: string; quantity: number }, usable: boolean): string => {
      const def = getItem(s.itemId)!
      return `<button class="item-popup-row${usable ? '' : ' item-popup-rest-only'}"
        data-item-id="${s.itemId}" data-unit-id="${unitId}" ${usable ? '' : 'disabled'}
        title="${usable ? def.description : 'Rest only: ' + def.description}">
        <span class="item-popup-name">${def.name} ×${s.quantity}</span>
        <span class="item-popup-tag">${usable ? 'Combat' : 'Rest only'}</span>
      </button>`
    }

    popup.innerHTML = `
      <div class="item-popup-header">Use Item</div>
      ${combatItems.length === 0 && restItems.length === 0 ? '<div class="item-popup-empty">No items</div>' : ''}
      ${combatItems.map((s) => renderRow(s, true)).join('')}
      ${restItems.length > 0 ? `<div class="item-popup-divider">Rest only</div>${restItems.map((s) => renderRow(s, false)).join('')}` : ''}
    `

    // Position popup above the button
    const rect = anchor.getBoundingClientRect()
    popup.style.position = 'fixed'
    popup.style.bottom = `${window.innerHeight - rect.top + 4}px`
    popup.style.left = `${rect.left}px`

    popup.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.item-popup-row:not(:disabled)')
      if (!btn) return
      const itemId = btn.dataset.itemId
      const targetUnitId = btn.dataset.unitId
      if (itemId && targetUnitId) this.handleCombatItemUse(itemId, targetUnitId)
      this.closeItemPopup()
    })

    document.body.appendChild(popup)

    // Close on outside click
    const outsideHandler = (e: MouseEvent): void => {
      if (!popup.contains(e.target as Node) && e.target !== anchor) {
        this.closeItemPopup()
      }
    }
    setTimeout(() => document.addEventListener('click', outsideHandler), 0)
    this.itemPopupCloser = () => {
      document.removeEventListener('click', outsideHandler)
      popup.remove()
      this.itemPopupCloser = null
    }
  }

  private closeItemPopup(): void {
    this.itemPopupCloser?.()
  }

  private handleCombatItemUse(itemId: string, heroUnitId: string): void {
    if (!this.runState) return
    const def = getItem(itemId)
    if (!def) return

    for (const effect of def.effects) {
      if (effect.kind === 'consumable_combat_heal_single') {
        const heroUnit = this.unitManager.getUnit(heroUnitId)
        if (!heroUnit) return
        const healAmt = effect.amount ?? 0
        // Enter ally target mode so the player picks which hero to heal
        this.inputManager.enterAllyTargetMode(heroUnit, (target) => {
          target.data.stats.hp = Math.min(target.data.stats.maxHp, target.data.stats.hp + healAmt)
          consumeFromInventory(this.runState!, itemId)
          this.refreshUI()
          this.refreshActionBar()
        })
        return
      }
      if (effect.kind === 'consumable_revive') {
        const heroUnit = this.unitManager.getUnit(heroUnitId)
        if (!heroUnit) return
        // Check there's actually a dead ally to target
        const deadAllies = this.unitManager.getTeamUnits('player').filter((u) => !u.data.alive)
        if (deadAllies.length === 0) return
        this.inputManager.enterAllyTargetMode(heroUnit, (target) => {
          target.data.stats.hp = Math.ceil(target.data.stats.maxHp * ((effect.amount ?? 50) / 100))
          target.data.alive = true
          target.data.charges = 0
          target.data.movementLeft = 0
          consumeFromInventory(this.runState!, itemId)
          this.refreshUI()
          this.refreshActionBar()
        }, { allowDead: true })
        return
      }
      if (effect.kind === 'consumable_combat_atk_buff') {
        const unit = this.unitManager.getUnit(heroUnitId)
        if (!unit) return
        unit.data.stats.attack += effect.amount ?? 0
        consumeFromInventory(this.runState, itemId)
        this.refreshUI()
        this.refreshActionBar()
        return
      }
    }
  }

  private buildPortraitHTML(unit: UnitEntity): string {
    const d = unit.data
    const char = d.characterId ? getCharacter(d.characterId) : undefined
    const name = char?.name ?? d.id
    const hpPct = Math.round((d.stats.hp / d.stats.maxHp) * 100)
    // Scale bar width by maxHp: 5px per point of maxHp, min 50px
    const hpBarWidth = Math.max(50, d.stats.maxHp * 5)

    const weapon = d.weaponId ? getItem(d.weaponId) : undefined
    const armor = d.armorId ? getItem(d.armorId) : undefined

    const deadClass = d.alive ? '' : ' pp-dead'

    // Weapon icon with charge indicator
    const defaultWeaponName = char?.weapon.name ?? 'Unarmed'
    const weaponIcon = `<div class="pp-icon pp-weapon" data-tooltip="${weapon ? `${weapon.name}\n${weapon.description}` : defaultWeaponName}">
      <span class="pp-icon-symbol">${ATTACK_ICONS[weapon?.attackType ?? char?.weapon.attackType ?? 'basic'] ?? '\u2694'}</span>
      <span class="pp-icon-badge pp-charges-badge">${d.charges}</span>
    </div>`

    // Armor icon
    const armorIcon = armor
      ? `<div class="pp-icon pp-armor" data-tooltip="${armor.name}\n${armor.description}">
          <span class="pp-icon-symbol">\u{1F6E1}</span>
        </div>`
      : `<div class="pp-icon pp-empty" data-tooltip="No armor">
          <span class="pp-icon-symbol pp-icon-empty">\u{1F6E1}</span>
        </div>`

    // Mod icons
    const weaponMods = d.weaponMods.length > 0
      ? d.weaponMods.map((m) => {
          const def = getMod(m.modId)
          const label = def ? `${def.name}${m.stacks > 1 ? ` x${m.stacks}` : ''}` : m.modId
          return `<span class="pp-mod" title="${label}">+</span>`
        }).join('')
      : ''
    const armorMods = d.armorMods.length > 0
      ? d.armorMods.map((m) => {
          const def = getMod(m.modId)
          const label = def ? `${def.name}${m.stacks > 1 ? ` x${m.stacks}` : ''}` : m.modId
          return `<span class="pp-mod" title="${label}">+</span>`
        }).join('')
      : ''

    return `
      <div class="pp-card${deadClass}" data-unit-id="${d.id}">
        <span class="pp-name">${name}</span>
        <div class="pp-body">
          <div class="pp-avatar"></div>
          <div class="pp-equip-col">
            <div class="pp-equip-row">${weaponIcon}${weaponMods}</div>
            <div class="pp-equip-row">${armorIcon}${armorMods}</div>
          </div>
        </div>
        <div class="pp-hp-bar" style="width:${hpBarWidth}px">
          <div class="pp-hp-fill" style="width:${hpPct}%"></div>
          <span class="pp-hp-text">${d.stats.hp}/${d.stats.maxHp}</span>
        </div>
      </div>
    `
  }

  private refreshPartyPortraits(): void {
    const rows = this.partyPanel.querySelectorAll('.pp-card')

    for (const row of rows) {
      const unitId = (row as HTMLElement).dataset.unitId
      const unit = unitId ? this.unitManager.getUnit(unitId) : undefined

      if (!unit || !unit.data.alive) {
        row.classList.add('pp-dead')
        const hpFill = row.querySelector('.pp-hp-fill') as HTMLElement
        if (hpFill) hpFill.style.width = '0%'
        const hpText = row.querySelector('.pp-hp-text')
        if (hpText) hpText.textContent = 'DEAD'
        const badge = row.querySelector('.pp-charges-badge')
        if (badge) badge.textContent = ''
        continue
      }

      const d = unit.data
      const hpPct = Math.round((d.stats.hp / d.stats.maxHp) * 100)
      const hpFill = row.querySelector('.pp-hp-fill') as HTMLElement
      if (hpFill) hpFill.style.width = `${hpPct}%`
      const hpText = row.querySelector('.pp-hp-text')
      if (hpText) hpText.textContent = `${d.stats.hp}/${d.stats.maxHp}`
      const badge = row.querySelector('.pp-charges-badge')
      if (badge) badge.textContent = `${d.charges}`
    }
  }

  private highlightPortrait(unitId: string | null): void {
    const rows = this.partyPanel.querySelectorAll('.pp-card')
    for (const r of rows) {
      r.classList.toggle('pp-selected', (r as HTMLElement).dataset.unitId === unitId)
    }
  }

  // ── Phase Display ──

  private updatePhaseDisplay(phase: string): void {
    if (phase === 'player') {
      this.phaseIndicator.textContent = 'PLAYER PHASE'
      this.phaseIndicator.className = 'phase-player'
      this.endTurnButton.disabled = false
    } else if (phase === 'enemy') {
      this.phaseIndicator.textContent = 'ENEMY PHASE'
      this.phaseIndicator.className = 'phase-enemy'
      this.endTurnButton.disabled = true
    }
  }

  private showUnitInfo(unit: UnitEntity): void {
    const s = unit.data.stats
    const panel = this.unitInfoPanel
    panel.classList.remove('hidden')

    const char = unit.data.characterId ? getCharacter(unit.data.characterId) : undefined
    const displayName = char?.name ?? (unit.data.team === 'player' ? 'Soldier' : 'Enemy')

    panel.querySelector('.unit-name')!.textContent = `${displayName} (${unit.data.id})`
    panel.querySelector('.unit-hp')!.textContent =
      `HP: ${s.hp}/${s.maxHp}`
    const atkType = unit.data.attackType
    panel.querySelector('.unit-stats')!.textContent =
      `ATK: ${s.attack}  DEF: ${s.defense}  Move: ${unit.data.movementLeft}/${s.moveRange}  ${atkType.label} (Range: ${atkType.range})`
    const perksEl = panel.querySelector('.unit-perks')!
    if (unit.data.team === 'player' && char && this.runState) {
      const perkLine = formatHeroPerkSummary(char, this.runState)
      perksEl.textContent = perkLine ? `Perks: ${perkLine}` : ''
    } else {
      perksEl.textContent = ''
    }
    const chargesText = `Charges: ${unit.data.charges}/${unit.data.maxCharges}`
    panel.querySelector('.unit-charges')!.textContent = chargesText

    // Status effects
    const statusesEl = panel.querySelector('.unit-statuses')!
    if (unit.data.statusEffects.length > 0) {
      statusesEl.textContent = unit.data.statusEffects.map(statusLabel).join(', ')
    } else {
      statusesEl.textContent = ''
    }

    // Ability buttons (only for player units with abilities, filtered by hero level)
    const abilitiesEl = panel.querySelector('.unit-abilities')!
    if (unit.data.team === 'player' && char) {
      const allAbilities = char.attacks.filter((a) => a.abilityType)
      const heroLevel = this.runState?.heroLevel[unit.data.characterId ?? ''] ?? 1
      const abilities = allAbilities.slice(0, heroLevel)
      if (abilities.length > 0) {
        abilitiesEl.innerHTML = abilities.map((a) => {
          const canAfford = unit.data.charges >= a.cost
          const label = a.cost > 0 ? `${a.name} (${a.cost})` : a.name
          return `<button class="ability-btn${canAfford ? '' : ' ability-disabled'}" data-unit-id="${unit.data.id}" data-ability-id="${a.id}" ${canAfford ? '' : 'disabled'}>${label}</button>`
        }).join('')
      } else {
        abilitiesEl.innerHTML = heroLevel < 2 && allAbilities.length > 0
          ? `<span class="ability-locked">Abilities unlock at level 2</span>`
          : ''
      }
    } else {
      abilitiesEl.innerHTML = ''
    }
  }

  private hideUnitInfo(): void {
    this.unitInfoPanel.classList.add('hidden')
  }

  /** Refresh portraits, action bar, and unit-info after an ability or item use resolves. */
  refreshUI(): void {
    this.refreshPartyPortraits()
    this.refreshActionBar()
    const state = this.inputManager.getSelectionState()
    if (state.kind === 'unitSelected') {
      const unit = this.unitManager.getUnit(state.unitId)
      if (unit) this.showUnitInfo(unit)
    }
  }

  private handleAbilityClick(unitId: string, abilityId: string): void {
    const unit = this.unitManager.getUnit(unitId)
    if (!unit || !unit.data.alive || !this.onAbilityUse) return
    const char = unit.data.characterId ? getCharacter(unit.data.characterId) : undefined
    if (!char) return
    const ability = char.attacks.find((a) => a.id === abilityId)
    if (!ability?.abilityType) return
    if (unit.data.charges < ability.cost) return

    if (ability.abilityType === 'heal_single') {
      this.inputManager.enterAllyTargetMode(unit, (target) => {
        void this.onAbilityUse!(unit, ability, target).then(() => this.refreshUI())
      })
    } else {
      void this.onAbilityUse(unit, ability).then(() => this.refreshUI())
    }
  }

  private showGameOver(winner: 'player' | 'enemy'): void {
    this.closeRunSheetIfOpen()
    this.gameOverOverlay.classList.remove('hidden')
    const h1 = this.gameOverOverlay.querySelector('h1')!
    const sub = this.gameOverOverlay.querySelector('#game-over-sub')!
    const returnBtn = document.getElementById('return-btn')
    const defeatBtn = document.getElementById('defeat-menu-btn')

    h1.textContent = winner === 'player' ? 'VICTORY' : 'GAME OVER'
    h1.style.color = winner === 'player' ? '#4c4' : '#c44'
    this.endTurnButton.disabled = true

    if (winner === 'player') {
      sub.classList.add('hidden')
      sub.textContent = ''
      returnBtn?.classList.remove('hidden')
      defeatBtn?.classList.add('hidden')

      // Post-battle revive: show if any heroes fell and player has revive draughts
      this.gameOverOverlay.querySelector('#revive-section')?.remove()
      if (this.runState) {
        const deadHeroes = this.unitManager.getTeamUnits('player').filter((u) => !u.data.alive)
        const reviveStack = this.runState.items.find((s) => s.itemId === 'revive_draught')
        if (deadHeroes.length > 0 && reviveStack && reviveStack.quantity > 0) {
          const reviveDiv = document.createElement('div')
          reviveDiv.id = 'revive-section'
          let revivesLeft = reviveStack.quantity
          reviveDiv.innerHTML = `
            <p class="revive-label">Revive Draught ×${revivesLeft} — revive a fallen hero?</p>
            <div class="revive-hero-btns">
              ${deadHeroes.map((u) => {
                const char = u.data.characterId ? getCharacter(u.data.characterId) : undefined
                return `<button class="revive-hero-btn" data-unit-id="${u.data.id}">${char?.name ?? u.data.id}</button>`
              }).join('')}
            </div>
          `
          reviveDiv.addEventListener('click', (e) => {
            const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.revive-hero-btn:not([disabled])')
            if (!btn || !this.runState) return
            const unit = this.unitManager.getUnit(btn.dataset.unitId ?? '')
            if (!unit) return
            const stack = this.runState.items.find((s) => s.itemId === 'revive_draught')
            if (!stack || stack.quantity < 1) return
            unit.data.stats.hp = Math.ceil(unit.data.stats.maxHp * 0.5)
            unit.data.alive = true
            stack.quantity -= 1
            if (stack.quantity <= 0) {
              this.runState.items = this.runState.items.filter((s) => s.itemId !== 'revive_draught')
            }
            revivesLeft--
            btn.textContent += ' ✓'
            btn.disabled = true
            const label = reviveDiv.querySelector('.revive-label')
            if (label) {
              label.textContent = revivesLeft > 0
                ? `Revive Draught ×${revivesLeft} — revive another fallen hero?`
                : 'All revive draughts used.'
            }
          })
          returnBtn?.parentNode?.insertBefore(reviveDiv, returnBtn)
        }
      }
    } else {
      sub.textContent = 'The run is over. Return to the title to start again.'
      sub.classList.remove('hidden')
      returnBtn?.classList.add('hidden')
      if (this.onDefeat) {
        defeatBtn?.classList.remove('hidden')
      } else {
        defeatBtn?.classList.add('hidden')
      }
    }
  }

  private closeRunSheetIfOpen(): void {
    if (this.runSheetCloser) {
      this.runSheetCloser()
    }
  }

  private toggleRunSheet(): void {
    if (!this.runState) return
    if (!this.gameOverOverlay.classList.contains('hidden')) return
    if (this.runSheetCloser) {
      this.runSheetCloser()
      return
    }
    this.openRunSheet()
  }

  private openRunSheet(): void {
    if (!this.runState) return
    const { close } = mountRunSheetOverlay(this.hostContainer, this.runState, {
      hint: 'Squad overview — close to continue fighting.',
      onClose: () => {
        this.runSheetCloser = null
      },
    })
    this.runSheetCloser = close
  }

  private setupScaling(): void {
    const update = (): void => {
      const scale = Math.max(0.8, Math.min(2.5, window.innerWidth / 1280))
      this.partyPanel.style.transform = `scale(${scale})`
    }
    update()
    this.resizeHandler = update
    window.addEventListener('resize', update)
  }

  dispose(): void {
    this.closeItemPopup()
    this.closeRunSheetIfOpen()
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }
    if (this.windowEscHandler) {
      window.removeEventListener('keydown', this.windowEscHandler)
      this.windowEscHandler = null
    }
    const ui = document.getElementById('game-ui')
    ui?.parentElement?.removeChild(ui)
  }
}
