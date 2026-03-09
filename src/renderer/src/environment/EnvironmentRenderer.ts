import * as THREE from 'three'
import { AssetLibrary } from '../assets/AssetLibrary'
import { Grid } from '../grid/Grid'
import { LevelPropPlacement } from '../levels/LevelDefinition'

export class EnvironmentRenderer {
  readonly group = new THREE.Group()
  private grid: Grid
  private assetLibrary: AssetLibrary
  private props: LevelPropPlacement[]

  constructor(grid: Grid, assetLibrary: AssetLibrary, props: LevelPropPlacement[]) {
    this.grid = grid
    this.assetLibrary = assetLibrary
    this.props = props
  }

  rebuild(): void {
    this.disposeChildren()

    const fallbackGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6)
    const fallbackBlockingMat = new THREE.MeshStandardMaterial({ color: 0x6b5b4d })
    const fallbackPassableMat = new THREE.MeshStandardMaterial({ color: 0x4d6b5b })
    const origin = new THREE.Vector3()

    for (const prop of this.props) {
      this.grid.gridToWorld(prop.x, prop.z, origin)
      const root = new THREE.Group()
      root.position.set(
        origin.x + (prop.offsetX ?? 0),
        prop.y ?? 0,
        origin.z + (prop.offsetZ ?? 0)
      )
      root.rotation.y = prop.rotationY ?? 0
      if (prop.scale !== undefined) {
        root.scale.setScalar(prop.scale)
      }

      const asset = this.assetLibrary.instantiate(prop.assetId)
      if (asset) {
        root.add(asset)
      } else {
        const fallback = new THREE.Mesh(
          fallbackGeometry,
          prop.blocksTraversal ? fallbackBlockingMat : fallbackPassableMat
        )
        fallback.position.y = 0.3
        fallback.castShadow = true
        fallback.receiveShadow = true
        root.add(fallback)
      }

      root.traverse((node) => {
        node.userData = {
          ...node.userData,
          gridX: prop.x,
          gridZ: prop.z
        }
      })

      this.group.add(root)
    }
  }

  dispose(): void {
    this.disposeChildren()
  }

  private disposeChildren(): void {
    for (const child of [...this.group.children]) {
      this.group.remove(child)
      child.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        node.geometry.dispose()
        const materials = Array.isArray(node.material) ? node.material : [node.material]
        for (const mat of materials) mat.dispose()
      })
    }
  }
}
