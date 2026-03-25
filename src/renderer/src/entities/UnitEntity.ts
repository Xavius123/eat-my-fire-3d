import * as THREE from 'three'
import { AssetLibrary, getFacingForwardOffsetRadians } from '../assets/AssetLibrary'
import { UnitData } from './UnitData'
import { PlaceholderMeshFactory } from './PlaceholderMeshFactory'

const PLAYER_COLOR = 0x4488ff
const HP_BAR_WIDTH = 64
const HP_BAR_HEIGHT = 8
/** Vertical gap between HP bar and status icon row (matches previous fixed layout). */
const HP_STATUS_GAP = 0.13
/** Padding above mesh top for HUD sprites (world units on unit root). */
const HUD_PAD_ABOVE_MESH = 0.06

interface FloatNumber {
  sprite: THREE.Sprite
  material: THREE.SpriteMaterial
  texture: THREE.CanvasTexture
  life: number     // 0 → 1 (expires at 1)
  duration: number // seconds
}

export class UnitEntity {
  readonly mesh: THREE.Group
  readonly data: UnitData
  private hpSprite: THREE.Sprite
  private hpCanvas: HTMLCanvasElement
  private hpCtx: CanvasRenderingContext2D
  private hpTexture: THREE.CanvasTexture

  // Status icons sprite (above HP bar)
  private statusCanvas: HTMLCanvasElement
  private statusCtx: CanvasRenderingContext2D
  private statusTexture: THREE.CanvasTexture
  private statusSprite: THREE.Sprite

  // Floating damage / heal numbers
  private floatNumbers: FloatNumber[] = []

  private assetLibrary: AssetLibrary | undefined
  private readonly tileSize: number
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
    this.tileSize = tileSize
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

    // Status icons sprite (above HP bar)
    this.statusCanvas = document.createElement('canvas')
    this.statusCanvas.width = HP_BAR_WIDTH
    this.statusCanvas.height = HP_BAR_HEIGHT
    this.statusCtx = this.statusCanvas.getContext('2d')!
    this.statusTexture = new THREE.CanvasTexture(this.statusCanvas)
    this.statusTexture.minFilter = THREE.NearestFilter
    this.statusTexture.magFilter = THREE.NearestFilter
    const statusMat = new THREE.SpriteMaterial({ map: this.statusTexture, depthTest: false })
    this.statusSprite = new THREE.Sprite(statusMat)
    this.statusSprite.scale.set(0.5, 0.0625, 1)
    this.statusSprite.position.y = 0.88
    this.statusSprite.visible = false
    this.mesh.add(this.statusSprite)

    this.rebuildBodyVisual()
    this.refreshHPBar()
    this.syncPosition(tileSize)
  }

  private resolveAssetIdForFacing(): string {
    const fallback = this.data.team === 'player' ? 'unit.player' : 'unit.enemy'
    return this.data.assetId ?? fallback
  }

  private getFacingOffsetRadians(): number {
    return getFacingForwardOffsetRadians(this.resolveAssetIdForFacing())
  }

  /** Rotate unit root so the model faces world direction (dx, 0, dz); skips near-zero vectors. */
  faceWorldDir(dx: number, dz: number): void {
    const lenSq = dx * dx + dz * dz
    if (lenSq < 1e-8) return
    const inv = 1 / Math.sqrt(lenSq)
    const ndx = dx * inv
    const ndz = dz * inv
    this.mesh.rotation.y = Math.atan2(ndx, ndz) + this.getFacingOffsetRadians()
  }

  /** Face from current grid cell toward another cell (same tile = no-op). */
  faceGridCell(targetGridX: number, targetGridZ: number, tileSize: number): void {
    const dx = (targetGridX - this.data.gridX) * tileSize
    const dz = (targetGridZ - this.data.gridZ) * tileSize
    this.faceWorldDir(dx, dz)
  }

  /**
   * Idle spawn facing: look toward opponent team's centroid when any opponents exist.
   */
  applyDefaultIdleFacing(opponentCells: Array<{ gridX: number; gridZ: number }>): void {
    if (opponentCells.length === 0) return
    let sx = 0
    let sz = 0
    for (const c of opponentCells) {
      sx += c.gridX
      sz += c.gridZ
    }
    const n = opponentCells.length
    this.faceGridCell(sx / n, sz / n, this.tileSize)
  }

  private faceCurrentMovementSegment(): void {
    const dx = this.animTo.x - this.animFrom.x
    const dz = this.animTo.z - this.animFrom.z
    this.faceWorldDir(dx, dz)
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
      this.layoutHudOverhead()
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
    this.layoutHudOverhead()
  }

  /** Place HP/status sprites just above the body mesh so tall FBX models do not bury the bar. */
  private layoutHudOverhead(): void {
    const defaultHpY = 0.75
    const defaultStatusY = defaultHpY + HP_STATUS_GAP
    if (!this.bodyObject) {
      this.hpSprite.position.y = defaultHpY
      this.statusSprite.position.y = defaultStatusY
      return
    }
    this.bodyObject.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(this.bodyObject)
    if (!box.isEmpty()) {
      const topY = box.max.y
      this.hpSprite.position.y = topY + HUD_PAD_ABOVE_MESH
      this.statusSprite.position.y = this.hpSprite.position.y + HP_STATUS_GAP
    } else {
      this.hpSprite.position.y = defaultHpY
      this.statusSprite.position.y = defaultStatusY
    }
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
    this.faceCurrentMovementSegment()

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

  showDamageNumber(amount: number, isHeal: boolean): void {
    const canvas = document.createElement('canvas')
    canvas.width = 48
    canvas.height = 20
    const ctx = canvas.getContext('2d')!
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const text = isHeal ? `+${amount}` : `-${amount}`
    const color = isHeal ? '#66ff66' : '#ff5555'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 3
    ctx.strokeText(text, 24, 10)
    ctx.fillStyle = color
    ctx.fillText(text, 24, 10)

    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.NearestFilter
    texture.magFilter = THREE.NearestFilter
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(0.375, 0.15625, 1)
    sprite.position.set((Math.random() - 0.5) * 0.3, this.hpSprite.position.y + 0.35, 0)
    this.mesh.add(sprite)
    this.floatNumbers.push({ sprite, material, texture, life: 0, duration: 0.75 })
  }

  refreshStatusDisplay(): void {
    const effects = this.data.statusEffects
    if (effects.length === 0) {
      this.statusSprite.visible = false
      this.statusTexture.needsUpdate = true
      return
    }
    this.statusSprite.visible = true
    const ctx = this.statusCtx
    ctx.clearRect(0, 0, HP_BAR_WIDTH, HP_BAR_HEIGHT)
    const colors: Record<string, string> = { burn: '#ff8833', stasis: '#4488ff', marked: '#ffdd33' }
    const dotR = (HP_BAR_HEIGHT - 2) / 2
    effects.slice(0, 8).forEach((s, i) => {
      const cx = i * (HP_BAR_HEIGHT) + dotR + 1
      ctx.fillStyle = colors[s.type] ?? '#aaaaaa'
      ctx.beginPath()
      ctx.arc(cx, HP_BAR_HEIGHT / 2, dotR, 0, Math.PI * 2)
      ctx.fill()
    })
    this.statusTexture.needsUpdate = true
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
          this.faceCurrentMovementSegment()
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

    // Floating damage / heal numbers
    for (let i = this.floatNumbers.length - 1; i >= 0; i--) {
      const fn = this.floatNumbers[i]
      fn.life += dt / fn.duration
      fn.sprite.position.y += dt * 0.9
      fn.material.opacity = 1 - fn.life
      if (fn.life >= 1) {
        this.mesh.remove(fn.sprite)
        fn.material.dispose()
        fn.texture.dispose()
        this.floatNumbers.splice(i, 1)
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

    const statusMat = this.statusSprite.material
    if (statusMat instanceof THREE.SpriteMaterial) {
      statusMat.dispose()
    }
    this.statusTexture.dispose()

    for (const fn of this.floatNumbers) {
      this.mesh.remove(fn.sprite)
      fn.material.dispose()
      fn.texture.dispose()
    }
    this.floatNumbers.length = 0
  }
}

