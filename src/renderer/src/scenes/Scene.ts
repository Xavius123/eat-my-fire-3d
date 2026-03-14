import type { Engine } from '../engine/Engine'
import type { AssetLibrary } from '../assets/AssetLibrary'
import type { NetworkBridge } from '../network/NetworkBridge'

export interface SceneContext {
  engine: Engine
  container: HTMLElement
  switchTo: (scene: Scene) => void
  /**
   * Call when the scene is fully loaded and ready to display.
   * SceneManager holds the fade overlay black until this fires.
   * Must be called exactly once per activate(); safe to call synchronously.
   */
  ready: () => void
  /** Shared pre-loaded asset library — already resolved by the time combat starts. */
  assetsReady: Promise<AssetLibrary>
  /** Network bridge for multiplayer communication. OfflineNetworkBridge in single-player. */
  networkBridge?: NetworkBridge
}

export interface Scene {
  activate(ctx: SceneContext): void
  deactivate(): void
}
