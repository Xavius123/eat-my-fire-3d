import type { Scene, SceneContext } from './Scene'

interface DisplayAPI {
  setResolution(width: number, height: number): Promise<void>
  setFullscreen(enabled: boolean): Promise<void>
  getDisplaySettings(): Promise<{ width: number; height: number; fullscreen: boolean }>
}

declare global {
  interface Window {
    display?: DisplayAPI
  }
}

const RESOLUTIONS = [
  { label: '1280 x 720', w: 1280, h: 720 },
  { label: '1366 x 768', w: 1366, h: 768 },
  { label: '1600 x 900', w: 1600, h: 900 },
  { label: '1920 x 1080', w: 1920, h: 1080 },
  { label: '2560 x 1440', w: 2560, h: 1440 },
]

export class SettingsScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext
  private returnScene: Scene

  private currentRes = { w: 1280, h: 720 }
  private isFullscreen = false

  constructor(returnScene: Scene) {
    this.returnScene = returnScene
  }

  async activate(ctx: SceneContext): Promise<void> {
    this.ctx = ctx

    // Load current settings from main process
    if (window.display) {
      const settings = await window.display.getDisplaySettings()
      this.currentRes = { w: settings.width, h: settings.height }
      this.isFullscreen = settings.fullscreen
    }

    this.root = document.createElement('div')
    this.root.id = 'settings-screen'
    this.buildUI()

    this.root.addEventListener('click', this.onClick)
    this.root.addEventListener('change', this.onChange)
    ctx.container.appendChild(this.root)
    ctx.ready()
  }

  deactivate(): void {
    this.root.removeEventListener('click', this.onClick)
    this.root.removeEventListener('change', this.onChange)
    this.root.remove()
  }

  private buildUI(): void {
    const resOptions = RESOLUTIONS.map((r) => {
      const selected = r.w === this.currentRes.w && r.h === this.currentRes.h ? 'selected' : ''
      return `<option value="${r.w}x${r.h}" ${selected}>${r.label}</option>`
    }).join('')

    this.root.innerHTML = `
      <div class="settings-panel">
        <h2 class="settings-title">SETTINGS</h2>

        <div class="settings-section">
          <h3 class="settings-section-title">Display</h3>

          <div class="settings-row">
            <label class="settings-label">Window Mode</label>
            <div class="settings-toggle-group">
              <button class="settings-toggle ${!this.isFullscreen ? 'active' : ''}" data-mode="windowed">Windowed</button>
              <button class="settings-toggle ${this.isFullscreen ? 'active' : ''}" data-mode="fullscreen">Fullscreen</button>
            </div>
          </div>

          <div class="settings-row" id="resolution-row" style="${this.isFullscreen ? 'opacity:0.35;pointer-events:none' : ''}">
            <label class="settings-label">Resolution</label>
            <select class="settings-select" id="resolution-select">
              ${resOptions}
            </select>
          </div>
        </div>

        <div class="settings-actions">
          <button class="settings-back-btn" id="settings-back">BACK</button>
        </div>
      </div>
    `
  }

  private onChange = (e: Event): void => {
    const target = e.target as HTMLSelectElement
    if (target.id === 'resolution-select') {
      const [w, h] = target.value.split('x').map(Number)
      this.currentRes = { w, h }
      console.log('display API available:', !!window.display)
      console.log('Setting resolution:', w, h)
      window.display?.setResolution(w, h).then(() => {
        console.log('Resolution set successfully')
      }).catch((err: unknown) => {
        console.error('Resolution set failed:', err)
      })
    }
  }

  private onClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement

    if (target.closest('#settings-back')) {
      this.ctx.switchTo(this.returnScene)
      return
    }

    const toggle = target.closest<HTMLButtonElement>('.settings-toggle')
    if (toggle) {
      const mode = toggle.dataset.mode
      this.isFullscreen = mode === 'fullscreen'
      window.display?.setFullscreen(this.isFullscreen)

      // Update toggle button states
      this.root.querySelectorAll('.settings-toggle').forEach((btn) => {
        btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === mode)
      })

      // Disable resolution picker in fullscreen
      const resRow = this.root.querySelector('#resolution-row') as HTMLElement
      resRow.style.opacity = this.isFullscreen ? '0.35' : ''
      resRow.style.pointerEvents = this.isFullscreen ? 'none' : ''
    }
  }
}
