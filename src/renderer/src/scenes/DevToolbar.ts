/**
 * DevToolbar — Persistent dev overlay shown when DEV_MODE is active.
 *
 * Mounts a fixed-position bar at the top-left of the screen with:
 *   DEV  |  MENU  |  GUIDE  |  KILL (combat only)
 *
 * Not a Scene — lives outside the SceneManager lifecycle so it persists
 * across scene transitions.
 */

import type { Scene } from './Scene'
import { TitleScene } from './TitleScene'
import { LoadoutScene } from './LoadoutScene'
import { GuideScene } from './GuideScene'

export class DevToolbar {
  private readonly el: HTMLElement
  private readonly killBtn: HTMLElement
  private killFn: (() => void) | null = null

  constructor(
    private readonly container: HTMLElement,
    private readonly switchTo: (scene: Scene) => void,
  ) {
    this.el = document.createElement('div')
    this.el.id = 'dev-toolbar'
    this.el.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'z-index:9999',
      'display:flex',
      'align-items:center',
      'gap:3px',
      'padding:4px 6px',
      'background:rgba(0,0,0,0.75)',
      'font-family:monospace',
      'font-size:11px',
      'pointer-events:auto',
    ].join(';')

    const label = this.makeChip('DEV', '#00ff88', '#001a0a', false)
    const menuBtn = this.makeChip('MENU', '#ff5555', '#1a0000', true)
    const guideBtn = this.makeChip('GUIDE', '#7777ff', '#00001a', true)
    this.killBtn = this.makeChip('KILL', '#ffaa00', '#1a1a00', true)
    this.killBtn.style.display = 'none'

    menuBtn.addEventListener('click', () => this.goToMenu())
    guideBtn.addEventListener('click', () => this.goToGuide())
    this.killBtn.addEventListener('click', () => this.killFn?.())

    this.el.append(label, menuBtn, guideBtn, this.killBtn)

    document.body.appendChild(this.el)
  }

  /** Call from CombatScene.activate() with the kill function, and from deactivate() with null. */
  setCombatActive(killFn: (() => void) | null): void {
    this.killFn = killFn
    this.killBtn.style.display = killFn ? 'inline-block' : 'none'
  }

  dispose(): void {
    this.el.remove()
  }

  private goToMenu(): void {
    this.setCombatActive(null)
    this.switchTo(new LoadoutScene())
  }

  private goToGuide(): void {
    this.setCombatActive(null)
    this.switchTo(new GuideScene(new TitleScene()))
  }

  private makeChip(text: string, color: string, bg: string, interactive: boolean): HTMLElement {
    const el = document.createElement('span')
    el.textContent = text
    el.style.cssText = [
      `color:${color}`,
      `background:${bg}`,
      'border:1px solid ' + color + '44',
      'padding:2px 7px',
      'border-radius:2px',
      interactive ? 'cursor:pointer' : '',
    ].join(';')
    if (interactive) {
      el.addEventListener('mouseenter', () => { el.style.opacity = '0.8' })
      el.addEventListener('mouseleave', () => { el.style.opacity = '1' })
    }
    return el
  }
}
