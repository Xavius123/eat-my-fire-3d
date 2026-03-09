import { MapScene } from './MapScene'
import type { Scene, SceneContext } from './Scene'

export class TitleScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext

  activate(ctx: SceneContext): void {
    this.ctx = ctx

    this.root = document.createElement('div')
    this.root.id = 'title-screen'
    this.root.innerHTML = `
      <h1 class="title-logo">MAGITEK</h1>
      <nav class="title-menu">
        <button class="title-btn" data-action="singleplayer">Single Player</button>
        <button class="title-btn disabled" data-action="multiplayer">Multiplayer</button>
        <button class="title-btn disabled" data-action="compendium">Compendium</button>
        <button class="title-btn disabled" data-action="settings">Settings</button>
      </nav>
    `

    this.root.addEventListener('click', this.onClick)
    ctx.container.appendChild(this.root)
    ctx.ready()
  }

  deactivate(): void {
    this.root.removeEventListener('click', this.onClick)
    this.root.remove()
  }

  private onClick = (e: MouseEvent): void => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.title-btn')
    if (!btn || btn.classList.contains('disabled')) return

    if (btn.dataset.action === 'singleplayer') {
      this.ctx.switchTo(new MapScene())
    }
  }
}
