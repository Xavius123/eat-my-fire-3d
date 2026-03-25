/**
 * DevToolbar — Persistent dev overlay. Always visible during pre-production.
 *
 * DEV (toggle)  |  MENU  |  GUIDE  |  H  |  C  |  KILL (combat only)
 *
 * DEV chip: click to toggle dev mode on/off. Green = on, gray = off.
 * H / C: when dev mode is on — quick battle large wave (Horde / Collective).
 * Not a Scene — persists across all scene transitions.
 */

import { DEV_MODE, setDevMode } from '../utils/devMode'
import type { Scene } from './Scene'
import { TitleScene } from './TitleScene'
import { LoadoutScene } from './LoadoutScene'
import { GuideScene } from './GuideScene'
import { QuickBattleScene } from './QuickBattleScene'

export class DevToolbar {
  private readonly el: HTMLElement
  private readonly devChip: HTMLElement
  private readonly qbHordeBtn: HTMLElement
  private readonly qbCollBtn: HTMLElement
  private readonly killBtn: HTMLElement
  private killFn: (() => void) | null = null
  private devOn: boolean = DEV_MODE

  constructor(
    private readonly container: HTMLElement,
    private readonly switchTo: (scene: Scene) => void,
  ) {
    this.el = document.createElement('div')
    this.el.id = 'dev-toolbar'
    this.el.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'z-index:9999',
      'display:flex', 'align-items:center', 'gap:3px',
      'padding:4px 6px', 'background:rgba(0,0,0,0.75)',
      'font-family:monospace', 'font-size:11px', 'pointer-events:auto',
    ].join(';')

    this.devChip = this.makeChip('DEV', '#00ff88', '#001a0a', true)
    const menuBtn  = this.makeChip('MENU',  '#ff5555', '#1a0000', true)
    const guideBtn = this.makeChip('GUIDE', '#7777ff', '#00001a', true)
    this.killBtn   = this.makeChip('KILL',  '#ffaa00', '#1a1a00', true)
    this.killBtn.style.display = 'none'

    this.qbHordeBtn = this.makeChip('H', '#cc88ff', '#14001a', true)
    this.qbCollBtn = this.makeChip('C', '#88ccff', '#000a1a', true)
    this.qbHordeBtn.title = 'Quick Battle — Horde, large wave'
    this.qbCollBtn.title = 'Quick Battle — Collective, large wave'
    this.qbHordeBtn.addEventListener('click', () => this.goQuickBattleHorde())
    this.qbCollBtn.addEventListener('click', () => this.goQuickBattleCollective())

    this.devChip.title = 'Toggle dev mode'
    this.devChip.addEventListener('click', () => this.toggleDev())
    menuBtn.addEventListener('click',  () => this.goToMenu())
    guideBtn.addEventListener('click', () => this.goToGuide())
    this.killBtn.addEventListener('click', () => this.killFn?.())

    this.el.append(this.devChip, menuBtn, guideBtn, this.qbHordeBtn, this.qbCollBtn, this.killBtn)
    this.syncDevChip()
    this.syncQuickBattleButtons()
    window.addEventListener('emf:devModeChanged', this.onDevModeChanged)

    document.body.appendChild(this.el)
  }

  /** Call from CombatScene.activate() with the kill fn, from deactivate() with null. */
  setCombatActive(killFn: (() => void) | null): void {
    this.killFn = killFn
    this.killBtn.style.display = killFn ? 'inline-block' : 'none'
  }

  dispose(): void {
    window.removeEventListener('emf:devModeChanged', this.onDevModeChanged)
    this.el.remove()
  }

  private toggleDev(): void {
    this.devOn = !this.devOn
    setDevMode(this.devOn)
    this.syncDevChip()
  }

  private syncDevChip(): void {
    if (this.devOn) {
      this.devChip.style.color = '#00ff88'
      this.devChip.style.background = '#001a0a'
      this.devChip.style.borderColor = '#00ff8844'
      this.devChip.textContent = 'DEV ✓'
    } else {
      this.devChip.style.color = '#666'
      this.devChip.style.background = '#111'
      this.devChip.style.borderColor = '#33333344'
      this.devChip.textContent = 'DEV ✗'
    }
  }

  private goToMenu(): void {
    this.setCombatActive(null)
    this.switchTo(new LoadoutScene())
  }

  private goToGuide(): void {
    this.setCombatActive(null)
    this.switchTo(new GuideScene(new TitleScene()))
  }

  private goQuickBattleHorde(): void {
    if (!DEV_MODE) return
    this.setCombatActive(null)
    this.switchTo(new QuickBattleScene({ faction: 'fantasy', depth: 6, nodeId: 'qb-dev-h' }))
  }

  private goQuickBattleCollective(): void {
    if (!DEV_MODE) return
    this.setCombatActive(null)
    this.switchTo(new QuickBattleScene({ faction: 'tech', depth: 6, nodeId: 'qb-dev-c' }))
  }

  private syncQuickBattleButtons(): void {
    const show = DEV_MODE ? 'inline-block' : 'none'
    this.qbHordeBtn.style.display = show
    this.qbCollBtn.style.display = show
  }

  private onDevModeChanged = (): void => {
    this.syncQuickBattleButtons()
  }

  private makeChip(text: string, color: string, bg: string, interactive: boolean): HTMLElement {
    const el = document.createElement('span')
    el.textContent = text
    el.style.cssText = [
      `color:${color}`, `background:${bg}`,
      `border:1px solid ${color}44`,
      'padding:2px 7px', 'border-radius:2px',
      interactive ? 'cursor:pointer' : '',
    ].join(';')
    if (interactive) {
      el.addEventListener('mouseenter', () => { el.style.opacity = '0.75' })
      el.addEventListener('mouseleave', () => { el.style.opacity = '1' })
    }
    return el
  }
}
