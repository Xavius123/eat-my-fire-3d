import * as THREE from 'three'
import { UnitManager } from '../entities/UnitManager'
import { ENV_OCCLUSION_LAYER } from './EnvLayers'

const FADE_OPACITY = 0.28
const UNIT_AIM_Y_OFFSET = 0.5
const DIST_EPS = 0.04

interface MatSnapshot {
  transparent: boolean
  opacity: number
  depthWrite: boolean | undefined
}

export class PropOcclusionFade {
  private readonly raycaster = new THREE.Raycaster()
  private readonly originals = new WeakMap<THREE.Material, MatSnapshot>()
  private readonly lastFaded = new Set<THREE.Material>()

  update(camera: THREE.PerspectiveCamera, envGroup: THREE.Object3D, unitManager: UnitManager): void {
    for (const m of this.lastFaded) {
      this.restoreMaterial(m)
    }
    this.lastFaded.clear()

    const units = unitManager.getAllAlive()
    if (units.length === 0) return

    this.raycaster.layers.set(ENV_OCCLUSION_LAYER)

    const origin = camera.position
    const target = new THREE.Vector3()
    const toUnit = new THREE.Vector3()

    for (const unit of units) {
      unit.mesh.getWorldPosition(target)
      target.y += UNIT_AIM_Y_OFFSET

      toUnit.subVectors(target, origin)
      const dist = toUnit.length()
      if (dist < 1e-5) continue

      const dir = toUnit.multiplyScalar(1 / dist)
      this.raycaster.set(origin, dir)
      this.raycaster.far = Math.max(dist - DIST_EPS, 0)

      const hits = this.raycaster.intersectObjects(envGroup.children, true)
      for (const hit of hits) {
        if (hit.distance >= dist - DIST_EPS) break
        const obj = hit.object
        if (!(obj instanceof THREE.Mesh)) continue
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const mat of materials) {
          if (!(mat instanceof THREE.Material)) continue
          this.applyFade(mat)
          this.lastFaded.add(mat)
        }
      }
    }
  }

  private restoreMaterial(mat: THREE.Material): void {
    const snap = this.originals.get(mat)
    if (!snap) return
    mat.transparent = snap.transparent
    mat.opacity = snap.opacity
    if ('depthWrite' in mat && snap.depthWrite !== undefined) {
      ;(mat as THREE.MeshStandardMaterial).depthWrite = snap.depthWrite
    }
    mat.needsUpdate = true
  }

  private applyFade(mat: THREE.Material): void {
    if (!this.originals.has(mat)) {
      const m = mat as THREE.MeshStandardMaterial
      this.originals.set(mat, {
        transparent: mat.transparent,
        opacity: mat.opacity,
        depthWrite: 'depthWrite' in m ? m.depthWrite : undefined
      })
    }
    mat.transparent = true
    mat.opacity = FADE_OPACITY
    if ('depthWrite' in mat) {
      ;(mat as THREE.MeshStandardMaterial).depthWrite = false
    }
    mat.needsUpdate = true
  }
}
