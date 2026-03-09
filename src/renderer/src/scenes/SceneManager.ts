import { Engine } from '../engine/Engine'
import { AssetLibrary, registerPrototypeAssets } from '../assets/AssetLibrary'
import type { Scene, SceneContext } from './Scene'

export class SceneManager {
  private readonly engine: Engine
  private readonly overlay: HTMLElement
  private readonly assetsReady: Promise<AssetLibrary>
  private current: Scene | null = null

  constructor(private readonly container: HTMLElement) {
    this.engine = new Engine(container)

    this.overlay = document.createElement('div')
    this.overlay.id = 'scene-fade'
    this.overlay.style.cssText =
      'position:absolute;inset:0;background:#000;pointer-events:none;z-index:100;opacity:0;transition:opacity 0.4s ease'
    container.appendChild(this.overlay)

    // Begin loading assets immediately — by the time the player clicks a node
    // on the map, they'll already be in memory.
    const lib = new AssetLibrary()
    registerPrototypeAssets(lib)
    this.assetsReady = lib.loadAll().then(() => lib)
  }

  start(scene: Scene): void {
    this.current = scene
    // No fade for the initial scene; ready() is a no-op.
    scene.activate(this.makeCtx(() => {}))
  }

  private switchTo(next: Scene): void {
    this.overlay.style.pointerEvents = 'auto'
    this.overlay.style.opacity = '1'

    const onFaded = (): void => {
      this.overlay.removeEventListener('transitionend', onFaded)
      this.current?.deactivate()
      this.current = next

      let readyFired = false
      const doFadeIn = (): void => {
        if (readyFired) return
        readyFired = true
        requestAnimationFrame(() => {
          this.overlay.style.opacity = '0'
          this.overlay.style.pointerEvents = 'none'
        })
      }

      // Safety fallback: always reveal after 5 s even if ready() is never called.
      const fallback = setTimeout(doFadeIn, 5000)

      next.activate(
        this.makeCtx(() => {
          clearTimeout(fallback)
          doFadeIn()
        })
      )
    }
    this.overlay.addEventListener('transitionend', onFaded)
  }

  private makeCtx(ready: () => void): SceneContext {
    return {
      engine: this.engine,
      container: this.container,
      switchTo: (scene) => this.switchTo(scene),
      ready,
      assetsReady: this.assetsReady,
    }
  }
}
