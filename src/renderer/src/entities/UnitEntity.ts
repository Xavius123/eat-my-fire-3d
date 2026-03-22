import * as THREE from 'three'
import { AssetLibrary } from '../assets/AssetLibrary'
import { UnitData } from './UnitData'
import { PlaceholderMeshFactory } from './PlaceholderMeshFactory'

const PLAYER_COLOR = 0x4488ff
const HP_BAR_WIDTH = 64
const HP_BAR_HEIGHT = 8

export class UnitEntity {
  readonly mesh: THREE.Group
  readonly data: UnitData
  private hpSprite: THREE.Sprite
  private hpCanvas: HTMLCanvasElement
  private hpCtx: CanvasRenderingContext2D
  private hpTexture: THREE.CanvasTexture

  private assetLibrary: AssetLibrary | undefined
  private bodyObject: THREE.Object3D | null = null
  private bodyUsesSharedAsset = false
  private hitFlashMaterials: THREE.MeshStandardMaterial[] = []

  // Animation state
  private animPath: THREE.Vector3[] = []
  private animProgress = 0
  private animFrom = new THREE.Vector3()
  private animTo = new THREE.Vector3()
  private animResolve: (() => void) | null = null
  private animSpeed = 5 // units per second

  // Hit effect
  private hitTimer = 0

  constructor(data: UnitData, tileSize: number, assetLibrary?: AssetLibrary) {
    this.data = data
    this.assetLibrary = assetLibrary
    this.mesh = new THREE.Group()

    // HP bar sprite
    this.hpCanvas = document.createElement('canvas')
    this.hpCanvas.width = HP_BAR_WIDTH
    this.hpCanvas.height = HP_BAR_HEIGHT
    this.hpCtx = this.hpCanvas.getContext('2d')!
    this.hpTexture = new THREE.CanvasTexture(this.hpCanvas)
    this.hpTexture.minFilter = THREE.NearestFilter
    this.hpTexture.magFilter = THREE.NearestFilter

    const spriteMat = new THREE.SpriteMaterial({
      map: this.hpTexture,
      depthTest: false
    })
    this.hpSprite = new THREE.Sprite(spriteMat)
    this.hpSprite.scale.set(0.5, 0.0625, 1)
    this.hpSprite.position.y = 0.75
    this.mesh.add(this.hpSprite)

    this.rebuildBodyVisual()
    this.refreshHPBar()
    this.syncPosition(tileSize)
  }

  setAssetLibrary(assetLibrary: AssetLibrary | undefined): void {
    this.assetLibrary = assetLibrary
    this.rebuildBodyVisual()
  }

  private rebuildBodyVisual(): void {
    if (this.bodyObject) {
      this.mesh.remove(this.bodyObject)
      if (!this.bodyUsesSharedAsset) {
        this.disposeObjectResources(this.bodyObject)
      }
      this.bodyObject = null
    }

    this.hitFlashMaterials = []

    const fallbackAssetId = this.data.team === 'player' ? 'unit.player' : 'unit.enemy'
    const assetId = this.data.assetId ?? fallbackAssetId
    const assetBody = this.assetLibrary?.instantiate(assetId) ?? null

    if (assetBody) {
      this.bodyObject = assetBody
      this.bodyUsesSharedAsset = true
      this.mesh.add(assetBody)
      this.collectHitFlashMaterials(assetBody)
      return
    }

    // No GLB: enemies use a simple red cylinder (original-game style); heroes keep per-id placeholders.
    const defId = this.data.enemyTemplateId ?? this.data.characterId
    const placeholder =
      this.data.team === 'enemy'
        ? PlaceholderMeshFactory.buildEnemyMissingAssetPlaceholder(defId)
        : PlaceholderMeshFactory.build(defId, PLAYER_COLOR)
    placeholder.position.y = 0.15

    this.bodyObject = placeholder
    this.bodyUsesSharedAsset = false
    this.mesh.add(placeholder)
    this.collectHitFlashMaterials(placeholder)
  }

  private collectHitFlashMaterials(root: THREE.Object3D): void {
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      for (const material of materials) {
        if (material instanceof THREE.MeshStandardMaterial) {
          this.hitFlashMaterials.push(material)
        }
      }
    })
  }

  private disposeObjectResources(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.geometry.dispose()
      if (Array.isArray(child.material)) {
        for (const material of child.material) {
          material.dispose()
        }
      } else {
        child.material.dispose()
      }
    })
  }

  syncPosition(tileSize: number): void {
    this.mesh.position.set(this.data.gridX * tileSize, 0, this.data.gridZ * tileSize)
  }

  animateMoveTo(path: Array<{ x: number; z: number }>, tileSize: number): Promise<void> {
    if (path.length === 0) return Promise.resolve()

    this.animPath = path.map((p) => new THREE.Vector3(p.x * tileSize, 0, p.z * tileSize))
    this.animFrom.copy(this.mesh.position)
    this.animTo.copy(this.animPath[0])
    this.animProgress = 0

    return new Promise((resolve) => {
      this.animResolve = resolve
    })
  }

  playHitEffect(): Promise<void> {
    this.hitTimer = 0.3
    return new Promise((resolve) => {
      const check = (): void => {
        if (this.hitTimer <= 0) {
          resolve()
        } else {
          requestAnimationFrame(check)
        }
      }
      requestAnimationFrame(check)
    })
  }

  update(dt: number): void {
    // Movement animation
    if (this.animPath.length > 0) {
      this.animProgress += dt * this.animSpeed
      if (this.animProgress >= 1) {
        this.mesh.position.copy(this.animTo)
        this.animPath.shift()
        if (this.animPath.length > 0) {
          this.animFrom.copy(this.mesh.position)
          this.animTo.copy(this.animPath[0])
          this.animProgress = 0
        } else {
          this.animProgress = 0
          if (this.animResolve) {
            this.animResolve()
            this.animResolve = null
          }
        }
      } else {
        this.mesh.position.lerpVectors(this.animFrom, this.animTo, this.animProgress)
      }
    }

    // Hit flash effect
    if (this.hitTimer > 0) {
      this.hitTimer -= dt
      const emissiveColor = this.hitTimer > 0 ? 0xff0000 : 0x000000
      for (const material of this.hitFlashMaterials) {
        material.emissive.setHex(emissiveColor)
      }
      if (this.hitTimer <= 0) {
        for (const material of this.hitFlashMaterials) {
          material.emissive.setHex(0x000000)
        }
      }
    }
  }

  refreshHPBar(): void {
    const ratio = this.data.stats.hp / this.data.stats.maxHp
    const ctx = this.hpCtx

    // Background
    ctx.fillStyle = '#333'
    ctx.fillRect(0, 0, HP_BAR_WIDTH, HP_BAR_HEIGHT)

    // HP fill
    if (ratio > 0.5) ctx.fillStyle = '#4c4'
    else if (ratio > 0.25) ctx.fillStyle = '#cc4'
    else ctx.fillStyle = '#c44'

    ctx.fillRect(0, 0, HP_BAR_WIDTH * ratio, HP_BAR_HEIGHT)

    // Border
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, HP_BAR_WIDTH, HP_BAR_HEIGHT)

    this.hpTexture.needsUpdate = true
  }

  dispose(): void {
    this.mesh.removeFromParent()
    if (this.bodyObject && !this.bodyUsesSharedAsset) {
      this.disposeObjectResources(this.bodyObject)
    }

    const spriteMaterial = this.hpSprite.material
    if (spriteMaterial instanceof THREE.SpriteMaterial) {
      spriteMaterial.dispose()
    }

    this.hpTexture.dispose()
  }
}

