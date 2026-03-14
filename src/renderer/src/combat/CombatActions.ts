import * as THREE from 'three'
import { UnitEntity } from '../entities/UnitEntity'
import { UnitManager } from '../entities/UnitManager'
import { Grid } from '../grid/Grid'
import { findPath } from './Pathfinding'
import { getAttackableTiles, getCleaveExtraTiles } from './AttackTypes'
import { resolveDamage } from './DamageResolver'
import type { RunState } from '../run/RunState'

export class CombatActions {
  private sceneGroup: THREE.Object3D | null = null
  /** Optional run state — passed to DamageResolver so trait/item hooks can fire. */
  private runState?: RunState

  constructor(
    private unitManager: UnitManager,
    private grid: Grid
  ) {}

  setRunState(runState: RunState): void {
    this.runState = runState
  }

  /** Set the scene group for projectile/lobbed visuals. */
  setSceneGroup(group: THREE.Object3D): void {
    this.sceneGroup = group
  }

  async moveUnit(
    unit: UnitEntity,
    targetX: number,
    targetZ: number
  ): Promise<boolean> {
    if (unit.data.movementLeft <= 0) return false
    if (!this.grid.isWalkable(targetX, targetZ)) return false

    const destinationOccupant = this.unitManager.getUnitAt(targetX, targetZ)
    if (
      destinationOccupant &&
      destinationOccupant.data.id !== unit.data.id
    ) {
      return false
    }

    const path = findPath(
      { x: unit.data.gridX, z: unit.data.gridZ },
      { x: targetX, z: targetZ },
      this.grid.width,
      this.grid.height,
      (x, z) => {
        if (!this.grid.isWalkable(x, z)) return true
        const other = this.unitManager.getUnitAt(x, z)
        if (!other) return false
        if (other.data.team !== unit.data.team) return true
        return other.data.blocksAllies
      }
    )

    if (path.length === 0) return false
    if (path.length > unit.data.movementLeft) return false

    unit.data.movementLeft -= path.length
    unit.data.gridX = targetX
    unit.data.gridZ = targetZ

    await unit.animateMoveTo(path, this.grid.getTileSize())
    return true
  }

  async attackUnit(
    attacker: UnitEntity,
    defender: UnitEntity
  ): Promise<number> {
    if (attacker.data.charges <= 0) return 0

    attacker.data.charges -= 1
    if (attacker.data.exhausting) {
      attacker.data.movementLeft = 0
    }

    const attackType = attacker.data.attackType
    const tileSize = this.grid.getTileSize()

    // Ranged attack animation
    if (attackType.kind === 'projectile' || attackType.kind === 'lobbed') {
      await this.animateProjectile(
        attacker, defender, tileSize,
        attackType.kind === 'lobbed'
      )
    }

    // Primary target damage
    const { amount: damage } = resolveDamage({
      attacker: attacker.data,
      defender: defender.data,
      attackType,
      runState: this.runState,
    })
    defender.data.stats.hp = Math.max(0, defender.data.stats.hp - damage)
    defender.refreshHPBar()
    await defender.playHitEffect()

    if (defender.data.stats.hp <= 0) {
      this.unitManager.removeUnit(defender.data.id)
    }

    // Cleave: hit perpendicular units
    if (attackType.kind === 'cleave') {
      const extraTiles = getCleaveExtraTiles(
        { x: attacker.data.gridX, z: attacker.data.gridZ },
        { x: defender.data.gridX, z: defender.data.gridZ }
      )
      const cleavePromises: Promise<void>[] = []
      for (const tile of extraTiles) {
        const unit = this.unitManager.getUnitAt(tile.x, tile.z)
        if (unit && unit.data.alive && unit.data.team !== attacker.data.team) {
          const { amount: cleaveDmg } = resolveDamage({
            attacker: attacker.data,
            defender: unit.data,
            attackType,
            runState: this.runState,
          })
          unit.data.stats.hp = Math.max(0, unit.data.stats.hp - cleaveDmg)
          unit.refreshHPBar()
          cleavePromises.push(
            unit.playHitEffect().then(() => {
              if (unit.data.stats.hp <= 0) {
                this.unitManager.removeUnit(unit.data.id)
              }
            })
          )
        }
      }
      if (cleavePromises.length > 0) {
        await Promise.all(cleavePromises)
      }
    }

    return damage
  }

  canAttack(attacker: UnitEntity, defender: UnitEntity): boolean {
    const targets = getAttackableTiles(
      { x: attacker.data.gridX, z: attacker.data.gridZ },
      attacker.data.attackType,
      this.grid,
      this.unitManager,
      attacker.data.team
    )
    return targets.some(
      (t) => t.x === defender.data.gridX && t.z === defender.data.gridZ
    )
  }

  private async animateProjectile(
    attacker: UnitEntity,
    defender: UnitEntity,
    tileSize: number,
    arc: boolean
  ): Promise<void> {
    const parent = this.sceneGroup
    if (!parent) return

    const from = new THREE.Vector3(
      attacker.data.gridX * tileSize, 0.4,
      attacker.data.gridZ * tileSize
    )
    const to = new THREE.Vector3(
      defender.data.gridX * tileSize, 0.4,
      defender.data.gridZ * tileSize
    )

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5
      })
    )
    sphere.position.copy(from)
    parent.add(sphere)

    const dx = Math.abs(defender.data.gridX - attacker.data.gridX)
    const dz = Math.abs(defender.data.gridZ - attacker.data.gridZ)
    const dist = dx + dz
    const duration = arc ? 0.3 + dist * 0.08 : 0.15 + dist * 0.04
    const arcHeight = arc ? 0.5 + dist * 0.3 : 0
    const startTime = performance.now()

    return new Promise((resolve) => {
      function tick() {
        const t = Math.min((performance.now() - startTime) / (duration * 1000), 1)
        sphere.position.lerpVectors(from, to, t)
        sphere.position.y = 0.4 + Math.sin(t * Math.PI) * arcHeight
        if (t >= 1) {
          parent!.remove(sphere)
          sphere.geometry.dispose()
          ;(sphere.material as THREE.Material).dispose()
          resolve()
        } else {
          requestAnimationFrame(tick)
        }
      }
      requestAnimationFrame(tick)
    })
  }

}
