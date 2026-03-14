import { TurnManager } from '../combat/TurnManager'
import { InputManager } from '../input/InputManager'
import { UnitManager } from '../entities/UnitManager'
import { getCharacter } from '../entities/CharacterData'
import { getItem } from '../run/ItemData'
import { getMod } from '../run/ModData'
import { statusLabel } from '../combat/StatusEffects'
import type { UnitEntity } from '../entities/UnitEntity'

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
  private resizeHandler: (() => void) | null = null

  constructor(
    container: HTMLElement,
    private turnManager: TurnManager,
    private inputManager: InputManager,
    private unitManager: UnitManager,
    private readonly onVictory?: () => void
  ) {
    this.buildDOM(container)
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
      </div>
      <div id="party-panel"></div>
      <div id="unit-info" class="hidden">
        <div class="unit-name"></div>
        <div class="unit-hp"></div>
        <div class="unit-stats"></div>
        <div class="unit-charges"></div>
        <div class="unit-statuses"></div>
      </div>
      <button id="end-turn-btn">End Turn</button>
      <div id="game-over" class="hidden">
        <h1></h1>
        <button id="return-btn" class="hidden">Continue</button>
      </div>
    `
    container.appendChild(ui)

    this.phaseIndicator = document.getElementById('phase-indicator')!
    this.turnCounter = document.getElementById('turn-counter')!
    this.unitInfoPanel = document.getElementById('unit-info')!
    this.partyPanel = document.getElementById('party-panel')!
    this.endTurnButton = document.getElementById(
      'end-turn-btn'
    ) as HTMLButtonElement
    this.gameOverOverlay = document.getElementById('game-over')!
  }

  private bindEvents(): void {
    const returnBtn = document.getElementById('return-btn')
    if (returnBtn && this.onVictory) {
      returnBtn.addEventListener('click', this.onVictory)
    }

    // End Turn button
    this.endTurnButton.addEventListener('click', () => {
      if (this.turnManager.getPhase() === 'player') {
        this.inputManager.deselect()
        this.turnManager.endPlayerPhase(this.unitManager)
      }
    })

    // Turn events
    this.turnManager.on((event) => {
      if (event.type === 'phaseChange') {
        this.updatePhaseDisplay(event.phase!)
        this.refreshPartyPortraits()
      }
      if (event.type === 'turnStart') {
        this.turnCounter.textContent = `Turn ${this.turnManager.getTurnNumber()}`
      }
      if (event.type === 'gameOver') {
        this.showGameOver(event.winner!)
      }
    })

    // Input events — update unit info panel + highlight portrait
    this.inputManager.on((event) => {
      if (event.type === 'unitSelected' && event.unitId) {
        const unit = this.unitManager.getUnit(event.unitId)
        if (unit) this.showUnitInfo(unit)
        this.highlightPortrait(event.unitId)
      }
      if (event.type === 'unitDeselected') {
        this.hideUnitInfo()
        this.highlightPortrait(null)
      }
      if (event.type === 'unitMoved' || event.type === 'unitAttacked') {
        // Refresh displayed unit info
        const state = this.inputManager.getSelectionState()
        if (state.kind === 'unitSelected') {
          const unit = this.unitManager.getUnit(state.unitId)
          if (unit) this.showUnitInfo(unit)
        }
        this.refreshPartyPortraits()
      }
    })
  }

  // ── Party Portraits ──

  /** Call after units are spawned to populate the party portrait panel. */
  buildPartyPortraits(): void {
    const players = this.unitManager.getTeamUnits('player')
    this.partyPanel.innerHTML = players.map((unit) => this.buildPortraitHTML(unit)).join('')
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
    const weaponIcon = `<div class="pp-icon pp-weapon" data-tooltip="${weapon ? `${weapon.name}\n${weapon.description}` : 'Unarmed'}">
      <span class="pp-icon-symbol">${ATTACK_ICONS[weapon?.attackType ?? 'basic'] ?? '\u2694'}</span>
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
    const chargesText = `Charges: ${unit.data.charges}/${unit.data.maxCharges}`
    panel.querySelector('.unit-charges')!.textContent = chargesText

    // Status effects
    const statusesEl = panel.querySelector('.unit-statuses')!
    if (unit.data.statusEffects.length > 0) {
      statusesEl.textContent = unit.data.statusEffects.map(statusLabel).join(', ')
    } else {
      statusesEl.textContent = ''
    }
  }

  private hideUnitInfo(): void {
    this.unitInfoPanel.classList.add('hidden')
  }

  private showGameOver(winner: 'player' | 'enemy'): void {
    this.gameOverOverlay.classList.remove('hidden')
    const h1 = this.gameOverOverlay.querySelector('h1')!
    h1.textContent = winner === 'player' ? 'VICTORY' : 'GAME OVER'
    h1.style.color = winner === 'player' ? '#4c4' : '#c44'
    this.endTurnButton.disabled = true

    // Only show the continue button on victory
    if (winner === 'player') {
      document.getElementById('return-btn')?.classList.remove('hidden')
    }
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
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }
    const ui = document.getElementById('game-ui')
    ui?.parentElement?.removeChild(ui)
  }
}
