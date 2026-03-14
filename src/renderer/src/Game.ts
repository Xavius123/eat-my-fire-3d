import * as THREE from 'three'
import { Engine } from './engine/Engine'
import { Grid } from './grid/Grid'
import { UnitManager } from './entities/UnitManager'
import { createEnemyUnit, createPlayerUnit, ATTACK_TYPES } from './entities/UnitData'
import { TurnManager } from './combat/TurnManager'
import { CombatActions } from './combat/CombatActions'
import { ActionQueue } from './combat/ActionQueue'
import { InputManager } from './input/InputManager'
import { EnemyAI } from './ai/EnemyAI'
import { GameUI } from './ui/GameUI'
import {
  AssetLibrary,
  ENEMY_UNIT_ASSET_IDS,
  PLAYER_UNIT_ASSET_IDS,
  registerPrototypeAssets
} from './assets/AssetLibrary'
import { composeLevel, ComposedLevel } from './levels/LevelComposer'
import { createStarterLevelDefinition } from './levels/LevelDefinition'
import { EnvironmentRenderer } from './environment/EnvironmentRenderer'
import type { RunState } from './run/RunState'
import { getItem } from './run/ItemData'
import { getCharacter } from './entities/CharacterData'

function shuffle<T>(values: T[]): T[] {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

export class Game {
  private engine: Engine
  private readonly ownsEngine: boolean
  private grid: Grid
  private unitManager: UnitManager
  private turnManager: TurnManager
  private combatActions: CombatActions
  private actionQueue: ActionQueue
  private inputManager: InputManager
  private enemyAI: EnemyAI
  private ui: GameUI

  private assetLibrary: AssetLibrary
  private level: ComposedLevel
  private environmentRenderer: EnvironmentRenderer

  private worldPivot: THREE.Group
  private worldContent: THREE.Group

  constructor(
    container: HTMLElement,
    sharedEngine?: Engine,
    private readonly onCombatEnd?: () => void,
    sharedAssets?: AssetLibrary,
    private readonly onReady?: () => void,
    private readonly runState?: RunState
  ) {
    if (sharedAssets) {
      this.assetLibrary = sharedAssets
    } else {
      this.assetLibrary = new AssetLibrary()
      registerPrototypeAssets(this.assetLibrary)
    }

    const levelDef = createStarterLevelDefinition()
    this.level = composeLevel(levelDef)

    // Core rendering — reuse shared engine if provided
    if (sharedEngine) {
      this.engine = sharedEngine
      this.ownsEngine = false
    } else {
      this.engine = new Engine(container)
      this.ownsEngine = true
    }
    this.grid = new Grid({
      width: this.level.width,
      height: this.level.height,
      blockedTiles: this.level.blockedTiles,
      tileAssetIds: this.level.tileAssetIds,
      assetLibrary: this.assetLibrary
    })

    const center = this.grid.getCenter()
    this.worldPivot = new THREE.Group()
    this.worldPivot.position.copy(center)

    this.worldContent = new THREE.Group()
    this.worldContent.position.set(-center.x, -center.y, -center.z)

    this.worldPivot.add(this.worldContent)
    this.engine.scene.add(this.worldPivot)
    this.worldContent.add(this.grid.group)

    this.environmentRenderer = new EnvironmentRenderer(
      this.grid,
      this.assetLibrary,
      this.level.props
    )
    this.worldContent.add(this.environmentRenderer.group)
    this.environmentRenderer.rebuild()

    this.engine.setWorldRotator(this.worldPivot)
    this.engine.setGridCenter(center, this.grid.getViewSize())
    this.engine.setGridBounds(this.grid.width, this.grid.height, this.grid.getTileSize())

    // Unit system
    this.unitManager = new UnitManager(this.grid.getTileSize(), this.assetLibrary)
    this.worldContent.add(this.unitManager.group)

    // Combat systems
    this.turnManager = new TurnManager()
    this.combatActions = new CombatActions(this.unitManager, this.grid)
    this.combatActions.setSceneGroup(this.worldContent)
    if (this.runState) {
      this.combatActions.setRunState(this.runState)
    }

    // Action queue — decouples input sources from CombatActions.
    // Local clicks go through here now; co-op network actions will too (Phase 7).
    this.actionQueue = new ActionQueue(this.combatActions, this.unitManager)

    // Input
    this.inputManager = new InputManager(
      this.engine.canvas,
      this.engine.camera,
      this.worldContent,
      this.grid,
      this.unitManager,
      this.turnManager,
      this.actionQueue
    )
    this.inputManager.enable()

    // AI
    this.enemyAI = new EnemyAI(
      this.unitManager,
      this.combatActions,
      this.turnManager,
      this.grid
    )

    // UI overlay
    this.ui = new GameUI(
      container,
      this.turnManager,
      this.inputManager,
      this.unitManager,
      this.onCombatEnd
    )

    // Wire events
    this.wireEvents()

    // Spawn initial units
    this.spawnInitialUnits()

    // Build party portraits now that units exist
    this.ui.buildPartyPortraits()

    // Hook into game loop for unit animations
    this.engine.onUpdate((dt) => {
      this.unitManager.update(dt)
    })

    // If the shared library is already fully loaded, apply models synchronously
    // before the first render frame — no placeholder flash.
    // Otherwise fall back to the async load path.
    if (this.assetLibrary.isFullyLoaded()) {
      this.grid.setAssetLibrary(this.assetLibrary)
      this.unitManager.setAssetLibrary(this.assetLibrary)
      this.environmentRenderer.rebuild()
      this.onReady?.()
    } else {
      void this.loadAssets()
    }
  }

  private wireEvents(): void {
    this.turnManager.on((event) => {
      if (event.type === 'phaseChange' && event.phase === 'enemy') {
        this.enemyAI.executeTurn().then(() => {
          const result = this.turnManager.checkGameOver(this.unitManager)
          if (!result) {
            this.turnManager.endEnemyPhase(this.unitManager)
          }
        })
      }
    })

    this.inputManager.on((event) => {
      if (event.type === 'unitAttacked') {
        this.turnManager.checkGameOver(this.unitManager)
      }
    })
  }

  private spawnInitialUnits(): void {
    const enemyAssetOrder = shuffle(ENEMY_UNIT_ASSET_IDS)

    const defaultAttackTypes = [
      ATTACK_TYPES.basic,
      ATTACK_TYPES.projectile,
      ATTACK_TYPES.lobbed,
      ATTACK_TYPES.cleave,
    ]

    // Only spawn as many player units as the loadout defines (fall back to spawn count if no loadout)
    const playerCount = this.runState?.loadout.length ?? this.level.playerSpawns.length
    const playerSpawns = this.level.playerSpawns.slice(0, playerCount)

    playerSpawns.forEach((spawn, i) => {
      const loadout = this.runState?.loadout[i]
      const character = loadout ? getCharacter(loadout.characterId) : undefined
      const weapon = loadout?.weaponId ? getItem(loadout.weaponId) : undefined
      const attackType = weapon?.attackType
        ? ATTACK_TYPES[weapon.attackType]
        : defaultAttackTypes[i % defaultAttackTypes.length]
      const unit = createPlayerUnit(`player-${i}`, spawn.x, spawn.z, attackType)

      // Store equipment IDs for UI display
      if (loadout) {
        unit.characterId = loadout.characterId
        unit.weaponId = loadout.weaponId ?? undefined
        unit.armorId = loadout.armorId ?? undefined
      }

      // Apply character base stats (override defaults)
      if (character) {
        unit.stats.hp = character.baseHp
        unit.stats.maxHp = character.baseHp
        unit.stats.attack = character.baseAttack
        unit.stats.defense = character.baseDefense
        unit.stats.moveRange = character.baseMoveRange
        unit.assetId = character.assetId
      } else {
        unit.assetId = PLAYER_UNIT_ASSET_IDS[i % PLAYER_UNIT_ASSET_IDS.length]
      }

      // Apply run-wide bonuses from rewards
      if (this.runState) {
        unit.stats.attack += this.runState.bonusAtk
        unit.stats.defense += this.runState.bonusDef
        unit.stats.maxHp += this.runState.bonusMaxHp
        unit.stats.hp += this.runState.bonusMaxHp
      }
      // Apply loadout equipment stats and weapon charges
      if (loadout) {
        for (const itemId of [loadout.weaponId, loadout.armorId]) {
          if (!itemId) continue
          const item = getItem(itemId)
          if (!item) continue
          for (const effect of item.effects) {
            if (effect.kind === 'stat_bonus' && effect.stat && effect.amount) {
              if (effect.stat === 'maxHp') {
                unit.stats.maxHp += effect.amount
                unit.stats.hp += effect.amount
              } else {
                unit.stats[effect.stat] += effect.amount
              }
            }
          }
          // Set weapon charges and exhausting flag from item data
          if (item.type === 'weapon') {
            unit.charges = item.charges ?? 1
            unit.maxCharges = item.maxCharges ?? unit.charges
            unit.rechargeRate = item.rechargeRate ?? 1
            unit.exhausting = item.exhausting ?? true
          }
        }
      }
      // Sync movementLeft with final moveRange after all stat modifications
      unit.movementLeft = unit.stats.moveRange
      this.unitManager.addUnit(unit)
    })

    this.level.enemySpawns.forEach((spawn, i) => {
      const unit = createEnemyUnit(`enemy-${i}`, spawn.x, spawn.z)
      unit.assetId = enemyAssetOrder[i % enemyAssetOrder.length]
      this.unitManager.addUnit(unit)
    })
  }

  private async loadAssets(): Promise<void> {
    try {
      await this.assetLibrary.loadAll()
      this.grid.setAssetLibrary(this.assetLibrary)
      this.unitManager.setAssetLibrary(this.assetLibrary)
      this.environmentRenderer.rebuild()
    } catch (error) {
      console.warn('Asset loading failed; continuing with fallback visuals.', error)
    } finally {
      this.onReady?.()
    }
  }

  dispose(): void {
    this.inputManager.disable()
    this.environmentRenderer.dispose()
    this.unitManager.dispose()
    this.grid.dispose()
    this.ui.dispose()
    // Remove our scene graph from the shared engine before cleanup
    this.engine.scene.remove(this.worldPivot)
    if (this.ownsEngine) {
      this.engine.dispose()
    }
  }
}
