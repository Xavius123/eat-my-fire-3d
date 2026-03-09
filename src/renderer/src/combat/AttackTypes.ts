import type { GridCoord } from './Pathfinding'
import type { Grid } from '../grid/Grid'
import type { UnitManager } from '../entities/UnitManager'
import type { AttackType, Team } from '../entities/UnitData'

const CARDINAL = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
]

/**
 * Returns tiles with attackable enemies for a given attack type.
 */
export function getAttackableTiles(
  origin: GridCoord,
  attackType: AttackType,
  grid: Grid,
  unitManager: UnitManager,
  attackerTeam: Team
): GridCoord[] {
  switch (attackType.kind) {
    case 'basic':
    case 'cleave':
      return getMeleeTargets(origin, attackType.range, grid, unitManager, attackerTeam)
    case 'projectile':
      return getProjectileTargets(origin, attackType.range, grid, unitManager, attackerTeam)
    case 'lobbed':
      return getLobbedTargets(origin, attackType.range, grid, unitManager, attackerTeam)
  }
}

/** Basic / Cleave: enemies within Manhattan distance. */
function getMeleeTargets(
  origin: GridCoord,
  range: number,
  grid: Grid,
  unitManager: UnitManager,
  attackerTeam: Team
): GridCoord[] {
  const targets: GridCoord[] = []
  for (let dx = -range; dx <= range; dx++) {
    for (let dz = -range; dz <= range; dz++) {
      if (dx === 0 && dz === 0) continue
      if (Math.abs(dx) + Math.abs(dz) > range) continue
      const x = origin.x + dx
      const z = origin.z + dz
      if (x < 0 || x >= grid.width || z < 0 || z >= grid.height) continue
      const unit = unitManager.getUnitAt(x, z)
      if (unit && unit.data.team !== attackerTeam) {
        targets.push({ x, z })
      }
    }
  }
  return targets
}

/**
 * Projectile: scan each cardinal direction up to range.
 * Stops at blocked terrain or the first unit (friend or foe).
 * Only returns tiles with enemies (friendly units block the path but aren't targetable).
 */
function getProjectileTargets(
  origin: GridCoord,
  range: number,
  grid: Grid,
  unitManager: UnitManager,
  attackerTeam: Team
): GridCoord[] {
  const targets: GridCoord[] = []
  for (const dir of CARDINAL) {
    for (let i = 1; i <= range; i++) {
      const x = origin.x + dir.x * i
      const z = origin.z + dir.z * i
      if (x < 0 || x >= grid.width || z < 0 || z >= grid.height) break
      if (!grid.isWalkable(x, z)) break
      const unit = unitManager.getUnitAt(x, z)
      if (unit) {
        if (unit.data.team !== attackerTeam) {
          targets.push({ x, z })
        }
        break // projectile stops at first unit regardless of team
      }
    }
  }
  return targets
}

/** Lobbed: cardinal directions up to range, ignoring obstacles/units in the path. */
function getLobbedTargets(
  origin: GridCoord,
  range: number,
  grid: Grid,
  unitManager: UnitManager,
  attackerTeam: Team
): GridCoord[] {
  const targets: GridCoord[] = []
  for (const dir of CARDINAL) {
    for (let i = 1; i <= range; i++) {
      const x = origin.x + dir.x * i
      const z = origin.z + dir.z * i
      if (x < 0 || x >= grid.width || z < 0 || z >= grid.height) break
      // Lobbed ignores obstacles and units in the path — only checks the tile itself
      const unit = unitManager.getUnitAt(x, z)
      if (unit && unit.data.team !== attackerTeam) {
        targets.push({ x, z })
      }
    }
  }
  return targets
}

/**
 * Cleave: extra tiles hit perpendicular to the attack direction.
 * Returns the two tiles adjacent to the target, perpendicular to the attacker→target line.
 */
export function getCleaveExtraTiles(
  attacker: GridCoord,
  target: GridCoord
): GridCoord[] {
  const dx = target.x - attacker.x
  const dz = target.z - attacker.z
  return [
    { x: target.x + dz, z: target.z + dx },
    { x: target.x - dz, z: target.z - dx },
  ]
}
