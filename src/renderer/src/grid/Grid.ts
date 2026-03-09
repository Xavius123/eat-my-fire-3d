import * as THREE from 'three'
import { AssetLibrary } from '../assets/AssetLibrary'

export interface GridOptions {
  width: number
  height: number
  tileSize?: number
  gap?: number
  blockedTiles?: Array<{ x: number; z: number }>
  tileAssetIds?: Record<string, string>
  assetLibrary?: AssetLibrary
}

function createTileMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  })
}

export class Grid {
  readonly group: THREE.Group
  readonly width: number
  readonly height: number
  private readonly tileSize: number
  private readonly gap: number

  private tileMap = new Map<string, THREE.Mesh>()
  private originalMaterials = new Map<string, THREE.Material>()
  private highlightedTiles = new Set<string>()
  private blockedTiles = new Set<string>()
  private tileAssetIds = new Map<string, string>()
  private assetLibrary: AssetLibrary | undefined

  private tileGeometry!: THREE.BoxGeometry
  private walkableMaterial!: THREE.MeshStandardMaterial
  private blockedMaterial!: THREE.MeshStandardMaterial

  private readonly hiddenTileMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false
  })

  private readonly moveHighlight = new THREE.MeshStandardMaterial({
    color: 0x4488ff,
    emissive: 0x224488,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  })
  private readonly attackHighlight = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    emissive: 0x882222,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  })

  private static readonly _scratchVec3 = new THREE.Vector3()

  constructor(options: GridOptions) {
    this.width = options.width
    this.height = options.height
    this.tileSize = options.tileSize ?? 1
    this.gap = options.gap ?? 0
    this.assetLibrary = options.assetLibrary
    this.group = new THREE.Group()

    for (const tile of options.blockedTiles ?? []) {
      if (this.isInBounds(tile.x, tile.z)) {
        this.blockedTiles.add(Grid.key(tile.x, tile.z))
      }
    }

    for (const [coord, assetId] of Object.entries(options.tileAssetIds ?? {})) {
      this.tileAssetIds.set(coord, assetId)
    }

    this.buildTiles()
  }

  private static key(x: number, z: number): string {
    return `${x},${z}`
  }

  private buildTiles(): void {
    const size = this.tileSize - this.gap
    this.tileGeometry = new THREE.BoxGeometry(size, 0.1, size)
    this.walkableMaterial = createTileMaterial(0x6f6f6f)
    this.blockedMaterial = createTileMaterial(0x4a3f37)

    for (let x = 0; x < this.width; x++) {
      for (let z = 0; z < this.height; z++) {
        const mesh = new THREE.Mesh<THREE.BoxGeometry, THREE.Material>(
          this.tileGeometry,
          this.isBlocked(x, z) ? this.blockedMaterial : this.walkableMaterial
        )
        mesh.position.set(x * this.tileSize, 0, z * this.tileSize)
        mesh.castShadow = false
        mesh.receiveShadow = true
        mesh.userData = { gridX: x, gridZ: z }

        const tileAssetId = this.tileAssetIds.get(Grid.key(x, z))
        if (tileAssetId && this.assetLibrary) {
          const tileAsset = this.assetLibrary.instantiate(tileAssetId)
          if (tileAsset) {
            // Keep tile art slightly above the logical tile to reduce z-fighting.
            tileAsset.position.y += 0.02
            this.applyGridUserData(tileAsset, x, z)
            mesh.add(tileAsset)

            // Hide logic tile rendering when we have authored floor visuals.
            mesh.material = this.hiddenTileMaterial
          }
        }

        this.group.add(mesh)
        this.tileMap.set(Grid.key(x, z), mesh)
      }
    }
  }

  private applyGridUserData(object: THREE.Object3D, gridX: number, gridZ: number): void {
    object.traverse((child) => {
      child.userData = {
        ...child.userData,
        gridX,
        gridZ
      }
    })
  }

  private rebuildTiles(): void {
    this.clearHighlights()
    this.tileMap.clear()

    for (const child of [...this.group.children]) {
      this.group.remove(child)
      // Only dispose cloned asset children — shared geometry/materials are class-owned.
      for (const assetChild of [...child.children]) {
        assetChild.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return
          node.geometry.dispose()
          const materials = Array.isArray(node.material) ? node.material : [node.material]
          for (const mat of materials) mat.dispose()
        })
      }
    }

    this.tileGeometry.dispose()
    this.walkableMaterial.dispose()
    this.blockedMaterial.dispose()
    this.buildTiles()
  }

  setAssetLibrary(assetLibrary: AssetLibrary | undefined): void {
    this.assetLibrary = assetLibrary
    this.rebuildTiles()
  }

  setBlockedTiles(coords: Array<{ x: number; z: number }>): void {
    this.blockedTiles.clear()
    for (const tile of coords) {
      if (this.isInBounds(tile.x, tile.z)) {
        this.blockedTiles.add(Grid.key(tile.x, tile.z))
      }
    }
    this.rebuildTiles()
  }

  setTileAssetIds(tileAssetIds: Record<string, string>): void {
    this.tileAssetIds = new Map(Object.entries(tileAssetIds))
    this.rebuildTiles()
  }

  getTile(gridX: number, gridZ: number): THREE.Mesh | undefined {
    return this.tileMap.get(Grid.key(gridX, gridZ))
  }

  isInBounds(gridX: number, gridZ: number): boolean {
    return gridX >= 0 && gridX < this.width && gridZ >= 0 && gridZ < this.height
  }

  isBlocked(gridX: number, gridZ: number): boolean {
    return this.blockedTiles.has(Grid.key(gridX, gridZ))
  }

  isWalkable(gridX: number, gridZ: number): boolean {
    return this.isInBounds(gridX, gridZ) && !this.isBlocked(gridX, gridZ)
  }

  gridToWorld(gridX: number, gridZ: number, out?: THREE.Vector3): THREE.Vector3 {
    const target = out ?? Grid._scratchVec3
    return target.set(gridX * this.tileSize, 0, gridZ * this.tileSize)
  }

  getTileSize(): number {
    return this.tileSize
  }

  highlightTiles(coords: Array<{ x: number; z: number }>, type: 'move' | 'attack'): void {
    const mat = type === 'move' ? this.moveHighlight : this.attackHighlight
    for (const { x, z } of coords) {
      const key = Grid.key(x, z)
      const tile = this.tileMap.get(key)
      if (tile && !this.highlightedTiles.has(key)) {
        this.originalMaterials.set(key, tile.material as THREE.Material)
        tile.material = mat
        this.highlightedTiles.add(key)
      }
    }
  }

  clearHighlights(): void {
    for (const key of this.highlightedTiles) {
      const tile = this.tileMap.get(key)
      const original = this.originalMaterials.get(key)
      if (tile && original) {
        tile.material = original
      }
    }
    this.highlightedTiles.clear()
    this.originalMaterials.clear()
  }

  isHighlighted(gridX: number, gridZ: number): boolean {
    return this.highlightedTiles.has(Grid.key(gridX, gridZ))
  }

  getCenter(): THREE.Vector3 {
    return new THREE.Vector3(
      ((this.width - 1) * this.tileSize) / 2,
      0,
      ((this.height - 1) * this.tileSize) / 2
    )
  }

  getViewSize(): number {
    return Math.max(this.width, this.height) * this.tileSize * 0.7
  }

  dispose(): void {
    this.clearHighlights()
    for (const child of [...this.group.children]) {
      this.group.remove(child)
      for (const assetChild of [...child.children]) {
        assetChild.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return
          node.geometry.dispose()
          const materials = Array.isArray(node.material) ? node.material : [node.material]
          for (const mat of materials) mat.dispose()
        })
      }
    }
    this.tileGeometry.dispose()
    this.walkableMaterial.dispose()
    this.blockedMaterial.dispose()
    this.hiddenTileMaterial.dispose()
    this.moveHighlight.dispose()
    this.attackHighlight.dispose()
    this.tileMap.clear()
    this.originalMaterials.clear()
  }
}

