import { TurnManager } from '../combat/TurnManager'
import { InputManager } from '../input/InputManager'
import { UnitManager } from '../entities/UnitManager'

export class GameUI {
  private phaseIndicator!: HTMLElement
  private turnCounter!: HTMLElement
  private unitInfoPanel!: HTMLElement
  private endTurnButton!: HTMLButtonElement
  private gameOverOverlay!: HTMLElement

  constructor(
    container: HTMLElement,
    private turnManager: TurnManager,
    private inputManager: InputManager,
    private unitManager: UnitManager,
    private readonly onVictory?: () => void
  ) {
    this.buildDOM(container)
    this.bindEvents()
  }

  private buildDOM(container: HTMLElement): void {
    const ui = document.createElement('div')
    ui.id = 'game-ui'
    ui.innerHTML = `
      <div id="phase-bar">
        <span id="turn-counter">Turn 1</span>
        <span id="phase-indicator">PLAYER PHASE</span>
      </div>
      <div id="unit-info" class="hidden">
        <div class="unit-name"></div>
        <div class="unit-hp"></div>
        <div class="unit-stats"></div>
        <div class="unit-ap"></div>
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
      }
      if (event.type === 'turnStart') {
        this.turnCounter.textContent = `Turn ${this.turnManager.getTurnNumber()}`
      }
      if (event.type === 'gameOver') {
        this.showGameOver(event.winner!)
      }
    })

    // Input events — update unit info panel
    this.inputManager.on((event) => {
      if (event.type === 'unitSelected' && event.unitId) {
        const unit = this.unitManager.getUnit(event.unitId)
        if (unit) this.showUnitInfo(unit)
      }
      if (event.type === 'unitDeselected') {
        this.hideUnitInfo()
      }
      if (event.type === 'unitMoved' || event.type === 'unitAttacked') {
        // Refresh displayed unit info
        const state = this.inputManager.getSelectionState()
        if (state.kind === 'unitSelected') {
          const unit = this.unitManager.getUnit(state.unitId)
          if (unit) this.showUnitInfo(unit)
        }
      }
    })
  }

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

  private showUnitInfo(unit: import('../entities/UnitEntity').UnitEntity): void {
    const s = unit.data.stats
    const panel = this.unitInfoPanel
    panel.classList.remove('hidden')

    panel.querySelector('.unit-name')!.textContent =
      `${unit.data.team === 'player' ? 'Soldier' : 'Enemy'} (${unit.data.id})`
    panel.querySelector('.unit-hp')!.textContent =
      `HP: ${s.hp}/${s.maxHp}`
    const atkType = unit.data.attackType
    panel.querySelector('.unit-stats')!.textContent =
      `ATK: ${s.attack}  DEF: ${s.defense}  Move: ${s.moveRange}  ${atkType.label} (Range: ${atkType.range})`
    panel.querySelector('.unit-ap')!.textContent =
      `AP: ${s.ap}/${s.maxAp}`
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

  dispose(): void {
    const ui = document.getElementById('game-ui')
    ui?.parentElement?.removeChild(ui)
  }
}
