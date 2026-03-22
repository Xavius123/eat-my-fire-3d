/**
 * Single-canvas multi-viewport strip for GuideScene — one WebGL context, many slots.
 */

import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { AssetLibrary } from '../assets/AssetLibrary'
import { PlaceholderMeshFactory } from '../entities/PlaceholderMeshFactory'

const PLAYER_PREVIEW = 0x4488ff

/** Canvas / label cell width per slot (px). */
export const GUIDE_STRIP_SLOT_PX = 128

export interface GuideStripEntry {
  label: string
  assetId: string
  /** characterId | enemyTemplateId | boss id — for placeholders */
  defId?: string
  team: 'player' | 'enemy'
}

export interface GuideModelStripResult {
  canvas: HTMLCanvasElement
  /** True when a real GLB was instantiated (not placeholder). */
  slotUsesGlb: boolean[]
  dispose: () => void
}

function disposeOwnedObject3D(root: THREE.Object3D): void {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    child.geometry.dispose()
    const mats = Array.isArray(child.material) ? child.material : [child.material]
    for (const m of mats) m.dispose()
  })
}

function buildFallback(entry: GuideStripEntry): THREE.Group {
  if (entry.team === 'player') {
    const g = PlaceholderMeshFactory.build(entry.defId, PLAYER_PREVIEW)
    g.position.y = 0.15
    return g
  }
  const g = PlaceholderMeshFactory.buildEnemyMissingAssetPlaceholder(entry.defId)
  g.position.y = 0.15
  return g
}

/**
 * Mount a horizontal strip of 3D previews into `container` (replaces contents).
 */
export function createGuideModelStrip(
  lib: AssetLibrary,
  entries: GuideStripEntry[],
  options?: { slotWidth?: number; slotHeight?: number; worldSpacing?: number }
): GuideModelStripResult {
  const slotW = options?.slotWidth ?? GUIDE_STRIP_SLOT_PX
  const slotH = options?.slotHeight ?? 160
  const spacing = options?.worldSpacing ?? 2.4
  const n = entries.length
  if (n === 0) {
    const canvas = document.createElement('canvas')
    return { canvas, slotUsesGlb: [], dispose: () => {} }
  }

  const scene = new THREE.Scene()
  const ambient = new THREE.AmbientLight(0xffffff, 0.75)
  scene.add(ambient)
  const hemi = new THREE.HemisphereLight(0xe6eeff, 0x2b2430, 0.5)
  scene.add(hemi)
  const key = new THREE.DirectionalLight(0xfff3dd, 1.0)
  key.position.set(4, 10, 6)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xc7dbff, 0.35)
  fill.position.set(-4, 6, -4)
  scene.add(fill)

  const canvas = document.createElement('canvas')
  canvas.width = slotW * n
  canvas.height = slotH
  canvas.style.cssText = `display:block;width:100%;max-width:${slotW * n}px;height:${slotH}px;background:#0a0a12;border:1px solid #2a2a3a;border-radius:4px;`

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setSize(slotW * n, slotH, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12
  renderer.setClearColor(0x0a0a12, 1)

  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()

  const roots: THREE.Group[] = []
  const slotUsesGlb: boolean[] = []
  const offsetX = -((n - 1) * spacing) / 2

  for (let i = 0; i < n; i++) {
    const entry = entries[i]!
    const root = new THREE.Group()
    const x = offsetX + i * spacing
    root.position.set(x, 0, 0)

    const inst = lib.instantiate(entry.assetId)
    const glb = inst !== null
    const body = inst ?? buildFallback(entry)
    root.add(body)
    scene.add(root)
    roots.push(root)
    slotUsesGlb.push(glb)
  }

  const cameras: THREE.PerspectiveCamera[] = []
  const fov = 32
  for (let i = 0; i < n; i++) {
    const cam = new THREE.PerspectiveCamera(fov, slotW / slotH, 0.1, 50)
    const cx = offsetX + i * spacing
    cam.position.set(cx + 0.05, 1.05, 2.85)
    cam.lookAt(cx, 0.35, 0)
    cameras.push(cam)
  }

  let animId = 0
  const tick = (): void => {
    animId = requestAnimationFrame(tick)
    for (const r of roots) {
      r.rotation.y += 0.006
    }
    const pw = canvas.width
    const ph = canvas.height
    const vw = pw / n
    for (let i = 0; i < n; i++) {
      const vx = i * vw
      renderer.setViewport(vx, 0, vw, ph)
      renderer.setScissor(vx, 0, vw, ph)
      renderer.setScissorTest(true)
      renderer.render(scene, cameras[i]!)
    }
    renderer.setScissorTest(false)
  }
  tick()

  const dispose = (): void => {
    cancelAnimationFrame(animId)
    for (let i = 0; i < roots.length; i++) {
      const root = roots[i]!
      const isGlb = slotUsesGlb[i]
      for (const child of [...root.children]) {
        root.remove(child)
        // GLB clones share Texture objects with AssetLibrary caches — never dispose their materials/maps.
        if (!isGlb) disposeOwnedObject3D(child)
      }
    }
    scene.environment?.dispose()
    renderer.dispose()
    if (canvas.parentElement) canvas.parentElement.removeChild(canvas)
  }

  return { canvas, slotUsesGlb, dispose }
}
