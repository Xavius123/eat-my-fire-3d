/**
 * PlaceholderMeshFactory
 *
 * Generates distinctive Three.js primitive meshes for each enemy and hero
 * until real 3D models are commissioned. Each unit type gets a unique:
 *  - Shape  (capsule, box, sphere, octahedron, cylinder)
 *  - Color  (unique per enemy id)
 *  - Scale  (standard < elite < boss)
 *  - Glow   (emissive for elites; strong emissive + crown ring for bosses)
 *
 * Boss units also receive a floating torus crown so they stand out immediately.
 *
 * Usage:
 *   const mesh = PlaceholderMeshFactory.build('boss_warlord')
 *   unitGroup.add(mesh)
 */

import * as THREE from 'three'
import type { PlaceholderConfig, PlaceholderShape } from './EnemyData'
import {
  getEnemyTemplate,
  BOSS_TEMPLATES,
} from './EnemyData'

// ─────────────────────────────────────────────────────────────────────────────
// Fallback configs for hero placeholders (used if GLB is missing)
// ─────────────────────────────────────────────────────────────────────────────

const HERO_PLACEHOLDER: Record<string, PlaceholderConfig> = {
  warrior: { color: 0x4488ff, shape: 'capsule', scale: 1.0 },
  mage:    { color: 0xaa44ff, shape: 'capsule', scale: 0.9 },
  healer:  { color: 0x44ffaa, shape: 'capsule', scale: 0.9 },
  samurai: { color: 0xffcc00, shape: 'capsule', scale: 1.0 },
  ned:     { color: 0xff8844, shape: 'capsule', scale: 1.1, emissive: 0xff4400, emissiveIntensity: 0.3 },
  death:   { color: 0x8844ff, shape: 'capsule', scale: 1.0, emissive: 0x4400aa, emissiveIntensity: 0.4 },
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

export class PlaceholderMeshFactory {
  /**
   * Build a placeholder mesh Group for the given unit definition ID.
   * Works for both enemy IDs (from EnemyData) and hero IDs (from CharacterData).
   */
  static build(defId: string | undefined, teamColor?: number): THREE.Group {
    const config = PlaceholderMeshFactory.resolveConfig(defId, teamColor)
    return PlaceholderMeshFactory.buildFromConfig(config, PlaceholderMeshFactory.isBoss(defId))
  }

  /** Resolve the placeholder config for a definition id. */
  static resolveConfig(defId: string | undefined, teamColor?: number): PlaceholderConfig {
    if (!defId) {
      return { color: teamColor ?? 0x888888, shape: 'capsule', scale: 1.0 }
    }

    // Check enemy templates first
    const enemy = getEnemyTemplate(defId)
    if (enemy) return enemy.placeholder

    // Check boss templates
    const boss = BOSS_TEMPLATES.find((b) => b.id === defId)
    if (boss) return boss.placeholder

    // Check hero placeholders
    if (HERO_PLACEHOLDER[defId]) return HERO_PLACEHOLDER[defId]!

    // Final fallback — use team color if provided
    return { color: teamColor ?? 0x888888, shape: 'capsule', scale: 1.0 }
  }

  static isBoss(defId: string | undefined): boolean {
    if (!defId) return false
    return BOSS_TEMPLATES.some((b) => b.id === defId)
  }

  static buildFromConfig(config: PlaceholderConfig, isBoss = false): THREE.Group {
    const group = new THREE.Group()

    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.emissive !== undefined ? new THREE.Color(config.emissive) : new THREE.Color(0x000000),
      emissiveIntensity: config.emissiveIntensity ?? 0,
      roughness: 0.6,
      metalness: 0.2,
    })

    const body = PlaceholderMeshFactory.buildShape(config.shape, config.scale, material)
    body.castShadow = true
    body.receiveShadow = true
    group.add(body)

    // Boss crown — a torus ring floating above the body
    if (isBoss) {
      group.add(PlaceholderMeshFactory.buildBossCrown(config.scale, config.emissive ?? config.color))
    }

    return group
  }

  /** Classic red cylinder when no enemy GLB is available (original-game style). */
  static buildEnemyMissingAssetPlaceholder(defId: string | undefined): THREE.Group {
    const group = new THREE.Group()
    const isBoss = PlaceholderMeshFactory.isBoss(defId)
    const bodyScale = isBoss ? 1.35 : 1.0
    const s = 0.3 * bodyScale

    const material = new THREE.MeshStandardMaterial({
      color: 0xee4444,
      roughness: 0.55,
      metalness: 0.15,
    })
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(s * 0.5, s * 0.6, s * 1.1, 8),
      material,
    )
    body.castShadow = true
    body.receiveShadow = true
    group.add(body)

    if (isBoss) {
      group.add(PlaceholderMeshFactory.buildBossCrown(bodyScale, 0xff6644))
    }

    return group
  }

  private static buildShape(
    shape: PlaceholderShape,
    scale: number,
    material: THREE.MeshStandardMaterial,
  ): THREE.Mesh {
    const s = scale * 0.3 // base unit = 0.3 world units

    switch (shape) {
      case 'box':
        return new THREE.Mesh(
          new THREE.BoxGeometry(s * 0.9, s * 1.4, s * 0.9),
          material,
        )
      case 'sphere':
        return new THREE.Mesh(
          new THREE.SphereGeometry(s * 0.7, 10, 10),
          material,
        )
      case 'octahedron':
        return new THREE.Mesh(
          new THREE.OctahedronGeometry(s * 0.65),
          material,
        )
      case 'cylinder':
        return new THREE.Mesh(
          new THREE.CylinderGeometry(s * 0.5, s * 0.6, s * 1.1, 8),
          material,
        )
      case 'capsule':
      default:
        return new THREE.Mesh(
          new THREE.CapsuleGeometry(s * 0.3, s * 0.8, 4, 8),
          material,
        )
    }
  }

  /** Floating torus crown that marks boss units. */
  static buildBossCrown(bodyScale: number, crownColor: number): THREE.Mesh {
    const s = bodyScale * 0.3
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(s * 0.55, s * 0.08, 8, 24),
      new THREE.MeshStandardMaterial({
        color: crownColor,
        emissive: new THREE.Color(crownColor),
        emissiveIntensity: 1.2,
        roughness: 0.2,
        metalness: 0.8,
      }),
    )
    torus.position.y = bodyScale * 0.55  // float above body
    torus.rotation.x = Math.PI / 8       // slight tilt
    torus.castShadow = false
    return torus
  }
}
