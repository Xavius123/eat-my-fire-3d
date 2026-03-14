import { LoadoutScene } from './LoadoutScene'
import { SettingsScene } from './SettingsScene'
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
        <button class="title-btn" data-action="settings">Settings</button>
      </nav>
      <div id="steam-player-name" class="steam-name"></div>
    `

    this.root.addEventListener('click', this.onClick)
    ctx.container.appendChild(this.root)
    ctx.ready()

    this.showSteamName()
  }

  private async showSteamName(): Promise<void> {
    try {
      const steam = (window as any).steamAPI
      if (!steam) return
      const online = await steam.isOnline()
      if (!online) return
      const name = await steam.getPlayerName()
      if (!name) return
      const el = this.root.querySelector('#steam-player-name')
      if (el) el.textContent = `Signed in as ${name}`
    } catch {
      // Steam not available — silently ignore
    }
  }

  deactivate(): void {
    this.root.removeEventListener('click', this.onClick)
    this.root.remove()
  }

  private onClick = (e: MouseEvent): void => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.title-btn')
    if (!btn || btn.classList.contains('disabled')) return

    if (btn.dataset.action === 'singleplayer') {
      this.ctx.switchTo(new LoadoutScene())
    } else if (btn.dataset.action === 'settings') {
      this.ctx.switchTo(new SettingsScene(new TitleScene()))
    }
  }
}
