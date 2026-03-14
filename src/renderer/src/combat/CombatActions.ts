import * as THREE from 'three'
import { UnitEntity } from '../entities/UnitEntity'
import { UnitManager } from '../entities/UnitManager'
import { Grid } from '../grid/Grid'
import { findPath } from './Pathfinding'
import { getAttackableTiles, getCleaveExtraTiles } from './AttackTypes'
import { resolveDamage } from './DamageResolver'
import { applyStatus, isInStasis } from './StatusEffects'
import { getMod, effectiveValue } from '../run/ModData'
import { getEnemyTemplate } from '../entities/EnemyData'
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
    const isPiercing = this.hasPiercing(attacker)

    // Ranged attack animation
    if (attackType.kind === 'projectile' || attackType.kind === 'lobbed') {
      await this.animateProjectile(
        attacker, defender, tileSize,
        attackType.kind === 'lobbed'
      )
    }

    // For piercing projectiles, hit all units in line (stopped by walls)
    if (isPiercing && attackType.kind === 'projectile') {
      return this.handlePiercingAttack(attacker, defender)
    }

    // Check stasis — stasis units cannot take damage
    if (isInStasis(defender.data.statusEffects)) {
      return 0
    }

    // Primary target damage
    const auraReduction = this.getAuraDamageReduction(defender)
    const { amount: rawDamage } = resolveDamage({
      attacker: attacker.data,
      defender: defender.data,
      attackType,
      runState: this.runState,
    })
    let damage = Math.max(1, rawDamage - auraReduction)
    damage = this.applyMarkedMultiplier(defender, damage)

    this.applyDamageToUnit(defender, damage)
    this.applyOnHitEffects(attacker, defender)
    await defender.playHitEffect()

    if (defender.data.stats.hp <= 0) {
      this.handleVampiricHeal(attacker)
      this.handleUnitDeath(defender, attacker)
    }

    // Cleave: hit perpendicular units
    if (attackType.kind === 'cleave') {
      await this.handleCleave(attacker, defender)
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

  // ── Piercing attack (Alien Pigs lasers) ──

  private hasPiercing(unit: UnitEntity): boolean {
    if (!unit.data.enemyTemplateId) return false
    const template = getEnemyTemplate(unit.data.enemyTemplateId)
    return template?.specials?.some((s) => s.type === 'piercing') ?? false
  }

  private async handlePiercingAttack(
    attacker: UnitEntity,
    firstTarget: UnitEntity
  ): Promise<number> {
    const attackType = attacker.data.attackType
    const dx = Math.sign(firstTarget.data.gridX - attacker.data.gridX)
    const dz = Math.sign(firstTarget.data.gridZ - attacker.data.gridZ)
    let totalDamage = 0

    // Trace the line through all units until wall or edge
    for (let i = 1; i <= attackType.range; i++) {
      const x = attacker.data.gridX + dx * i
      const z = attacker.data.gridZ + dz * i
      if (x < 0 || x >= this.grid.width || z < 0 || z >= this.grid.height) break
      if (!this.grid.isWalkable(x, z)) break // walls stop piercing

      const unit = this.unitManager.getUnitAt(x, z)
      if (unit && unit.data.team !== attacker.data.team) {
        const { amount: rawDmg } = resolveDamage({
          attacker: attacker.data,
          defender: unit.data,
          attackType,
          runState: this.runState,
        })
        const dmg = Math.max(1, rawDmg - this.getAuraDamageReduction(unit))
        this.applyDamageToUnit(unit, dmg)
        this.applyOnHitEffects(attacker, unit)
        await unit.playHitEffect()
        totalDamage += dmg

        if (unit.data.stats.hp <= 0) {
          this.handleUnitDeath(unit, attacker)
        }
      }
      // Piercing continues through units (doesn't stop at first)
    }

    return totalDamage
  }

  // ── Cleave handling ──

  private async handleCleave(
    attacker: UnitEntity,
    defender: UnitEntity
  ): Promise<void> {
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
          attackType: attacker.data.attackType,
          runState: this.runState,
        })
        const dmg = Math.max(1, cleaveDmg - this.getAuraDamageReduction(unit))
        this.applyDamageToUnit(unit, dmg)
        this.applyOnHitEffects(attacker, unit)
        cleavePromises.push(
          unit.playHitEffect().then(() => {
            if (unit.data.stats.hp <= 0) {
              this.handleUnitDeath(unit, attacker)
            }
          })
        )
      }
    }
    if (cleavePromises.length > 0) {
      await Promise.all(cleavePromises)
    }
  }

  // ── On-hit effects (burn from enemy specials + mods) ──

  private applyOnHitEffects(attacker: UnitEntity, defender: UnitEntity): void {
    // Check if weapon has no_status_procs cursed mod
    const noProcs = attacker.data.weaponMods.some((m) => {
      const def = getMod(m.modId)
      return def?.effects.some((e) => e.kind === 'no_status_procs')
    })

    // Enemy template on-hit effects (e.g. Fire Tech Grunt burn)
    if (attacker.data.enemyTemplateId && !noProcs) {
      const template = getEnemyTemplate(attacker.data.enemyTemplateId)
      if (template?.onHitEffects) {
        for (const effect of template.onHitEffects) {
          if (effect.type === 'burn') {
            applyStatus(defender.data.statusEffects, {
              type: 'burn',
              value: effect.value,
              duration: effect.duration,
            })
          }
        }
      }
    }

    // Weapon mod on-hit effects
    for (const equipped of attacker.data.weaponMods) {
      const def = getMod(equipped.modId)
      if (!def) continue
      for (const effect of def.effects) {
        // Burn on hit (skip if no_status_procs)
        if (effect.kind === 'burn_on_hit' && !noProcs) {
          applyStatus(defender.data.statusEffects, {
            type: 'burn',
            value: effectiveValue(effect, equipped.stacks),
            duration: 2,
          })
        }
        // Stun chance (apply stasis)
        if (effect.kind === 'stun_chance' && !noProcs) {
          const chance = effectiveValue(effect, equipped.stacks)
          if (Math.random() * 100 < chance) {
            applyStatus(defender.data.statusEffects, {
              type: 'stasis',
              value: 1,
              duration: 1,
            })
          }
        }
        // Self-damage (cursed: Bloodthirst Rounds)
        if (effect.kind === 'self_damage') {
          const selfDmg = effectiveValue(effect, equipped.stacks)
          attacker.data.stats.hp = Math.max(1, attacker.data.stats.hp - selfDmg)
          attacker.refreshHPBar()
        }
      }
    }
  }

  /**
   * Check if the defender has Marked status.
   * If so, double the incoming damage and consume the mark.
   */
  private applyMarkedMultiplier(defender: UnitEntity, damage: number): number {
    const markedIdx = defender.data.statusEffects.findIndex((s) => s.type === 'marked')
    if (markedIdx >= 0) {
      defender.data.statusEffects.splice(markedIdx, 1)
      return damage * 2
    }
    return damage
  }

  // ── Aura effects ──

  private getAuraDamageReduction(defender: UnitEntity): number {
    let reduction = 0
    // Check all allies of the defender for damage_reduction auras
    const allies = this.unitManager.getTeamUnits(defender.data.team)
    for (const ally of allies) {
      if (ally.data.id === defender.data.id) continue
      if (!ally.data.enemyTemplateId) continue
      const template = getEnemyTemplate(ally.data.enemyTemplateId)
      if (!template?.specials) continue
      for (const special of template.specials) {
        if (special.type === 'aura' && special.aura?.type === 'damage_reduction') {
          const dist = Math.abs(ally.data.gridX - defender.data.gridX) +
            Math.abs(ally.data.gridZ - defender.data.gridZ)
          if (dist <= special.aura.range) {
            reduction += special.aura.value
          }
        }
      }
    }
    return reduction
  }

  /** Get ATK boost from nearby aura allies. */
  getAuraAtkBoost(unit: UnitEntity): number {
    let boost = 0
    const allies = this.unitManager.getTeamUnits(unit.data.team)
    for (const ally of allies) {
      if (ally.data.id === unit.data.id) continue
      if (!ally.data.enemyTemplateId) continue
      const template = getEnemyTemplate(ally.data.enemyTemplateId)
      if (!template?.specials) continue
      for (const special of template.specials) {
        if (special.type === 'aura' && special.aura?.type === 'atk_boost') {
          const dist = Math.abs(ally.data.gridX - unit.data.gridX) +
            Math.abs(ally.data.gridZ - unit.data.gridZ)
          if (dist <= special.aura.range) {
            boost += special.aura.value
          }
        }
      }
    }
    return boost
  }

  // ── Vampiric healing ──

  private handleVampiricHeal(attacker: UnitEntity): void {
    for (const equipped of attacker.data.weaponMods) {
      const def = getMod(equipped.modId)
      if (!def) continue
      for (const effect of def.effects) {
        if (effect.kind === 'vampiric') {
          const heal = effectiveValue(effect, equipped.stacks)
          attacker.data.stats.hp = Math.min(
            attacker.data.stats.maxHp,
            attacker.data.stats.hp + heal
          )
          attacker.refreshHPBar()
        }
      }
    }
  }

  // ── Damage application ──

  private applyDamageToUnit(unit: UnitEntity, damage: number): void {
    // Berserker rage: +1 ATK permanently per hit taken
    if (unit.data.enemyTemplateId === 'ap_berserker') {
      unit.data.stats.attack += 1
    }

    unit.data.stats.hp = Math.max(0, unit.data.stats.hp - damage)
    unit.refreshHPBar()
  }

  private handleUnitDeath(unit: UnitEntity, killer: UnitEntity): void {
    // Squealer / Alpha Squealer: explode on death
    if (unit.data.enemyTemplateId === 'ap_squealer' || unit.data.enemyTemplateId === 'ap_alpha_squealer') {
      this.handleExplosion(unit)
    }

    this.unitManager.removeUnit(unit.data.id)
  }

  private handleExplosion(unit: UnitEntity): void {
    const explosionDamage = unit.data.stats.attack // ATK value as explosion damage
    // Hit all adjacent tiles
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue
        const x = unit.data.gridX + dx
        const z = unit.data.gridZ + dz
        const target = this.unitManager.getUnitAt(x, z)
        if (target && target.data.alive && target.data.id !== unit.data.id) {
          target.data.stats.hp = Math.max(0, target.data.stats.hp - explosionDamage)
          target.refreshHPBar()
          if (target.data.stats.hp <= 0) {
            this.unitManager.removeUnit(target.data.id)
          }
        }
      }
    }
  }

  // ── Projectile animation ──

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
