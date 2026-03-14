export interface UnitStats {
  hp: number
  maxHp: number
  attack: number
  defense: number
  moveRange: number
  attackRange: number
  ap: number
  maxAp: number
}

export type Team = 'player' | 'enemy'

export type AttackKind = 'basic' | 'projectile' | 'lobbed' | 'cleave'

export interface AttackType {
  kind: AttackKind
  range: number
  label: string
}

export const ATTACK_TYPES: Record<AttackKind, AttackType> = {
  basic:      { kind: 'basic',      range: 1, label: 'Basic' },
  projectile: { kind: 'projectile', range: 4, label: 'Projectile' },
  lobbed:     { kind: 'lobbed',     range: 3, label: 'Lobbed' },
  cleave:     { kind: 'cleave',     range: 1, label: 'Cleave' },
}

export type UnitOwner = 'host' | 'guest'

export interface UnitData {
  id: string
  team: Team
  gridX: number
  gridZ: number
  stats: UnitStats
  alive: boolean
  blocksAllies: boolean // heavy units block allies, light units can be walked through
  assetId?: string
  attackType: AttackType
  /** In co-op, which player controls this unit. Undefined in single-player. */
  owner?: UnitOwner
}

export function createPlayerUnit(
  id: string,
  gridX: number,
  gridZ: number,
  attackType: AttackType = ATTACK_TYPES.basic
): UnitData {
  return {
    id,
    team: 'player',
    gridX,
    gridZ,
    alive: true,
    blocksAllies: false,
    assetId: 'unit.player',
    attackType,
    stats: {
      hp: 10,
      maxHp: 10,
      attack: 4,
      defense: 1,
      moveRange: 3,
      attackRange: attackType.range,
      ap: 2,
      maxAp: 2
    }
  }
}

export function createEnemyUnit(
  id: string,
  gridX: number,
  gridZ: number,
  attackType: AttackType = ATTACK_TYPES.basic
): UnitData {
  return {
    id,
    team: 'enemy',
    gridX,
    gridZ,
    alive: true,
    blocksAllies: false,
    assetId: 'unit.enemy',
    attackType,
    stats: {
      hp: 8,
      maxHp: 8,
      attack: 3,
      defense: 1,
      moveRange: 3,
      attackRange: attackType.range,
      ap: 2,
      maxAp: 2
    }
  }
}
