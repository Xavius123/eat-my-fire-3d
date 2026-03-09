import * as THREE from 'three'
import { AssetLibrary } from '../assets/AssetLibrary'
import { UnitData, Team } from './UnitData'
import { UnitEntity } from './UnitEntity'

export class UnitManager {
  readonly group: THREE.Group
  private units = new Map<string, UnitEntity>()
  private meshToEntity = new Map<THREE.Object3D, UnitEntity>()
  private readonly tileSize: number
  private assetLibrary: AssetLibrary | undefined

  constructor(tileSize: number, assetLibrary?: AssetLibrary) {
    this.tileSize = tileSize
    this.assetLibrary = assetLibrary
    this.group = new THREE.Group()
  }

  addUnit(data: UnitData): UnitEntity {
    const entity = new UnitEntity(data, this.tileSize, this.assetLibrary)
    this.units.set(data.id, entity)
    this.meshToEntity.set(entity.mesh, entity)
    this.group.add(entity.mesh)
    return entity
  }

  setAssetLibrary(assetLibrary: AssetLibrary | undefined): void {
    this.assetLibrary = assetLibrary
    for (const entity of this.units.values()) {
      entity.setAssetLibrary(assetLibrary)
    }
  }

  removeUnit(id: string): void {
    const entity = this.units.get(id)
    if (entity) {
      entity.data.alive = false
      this.meshToEntity.delete(entity.mesh)
      entity.dispose()
      this.units.delete(id)
    }
  }

  getUnit(id: string): UnitEntity | undefined {
    return this.units.get(id)
  }

  getUnitAt(gridX: number, gridZ: number): UnitEntity | undefined {
    for (const entity of this.units.values()) {
      if (entity.data.alive && entity.data.gridX === gridX && entity.data.gridZ === gridZ) {
        return entity
      }
    }
    return undefined
  }

  getTeamUnits(team: Team): UnitEntity[] {
    const result: UnitEntity[] = []
    for (const entity of this.units.values()) {
      if (entity.data.alive && entity.data.team === team) {
        result.push(entity)
      }
    }
    return result
  }

  getAllAlive(): UnitEntity[] {
    const result: UnitEntity[] = []
    for (const entity of this.units.values()) {
      if (entity.data.alive) {
        result.push(entity)
      }
    }
    return result
  }

  isOccupied(gridX: number, gridZ: number): boolean {
    return this.getUnitAt(gridX, gridZ) !== undefined
  }

  getUnitByMesh(object: THREE.Object3D): UnitEntity | undefined {
    let current: THREE.Object3D | null = object
    while (current) {
      const entity = this.meshToEntity.get(current)
      if (entity) return entity
      current = current.parent
    }
    return undefined
  }

  update(dt: number): void {
    for (const entity of this.units.values()) {
      if (entity.data.alive) {
        entity.update(dt)
      }
    }
  }

  dispose(): void {
    for (const entity of this.units.values()) {
      entity.dispose()
    }
    this.units.clear()
    this.meshToEntity.clear()
  }
}
