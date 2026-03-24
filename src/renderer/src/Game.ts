import * as THREE from 'three'
import { Engine } from './engine/Engine'
import { Grid } from './grid/Grid'
import { UnitManager } from './entities/UnitManager'
import { createEnemyUnit, createPlayerUnit, createEnemyFromTemplate, ATTACK_TYPES } from './entities/UnitData'
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
import { createNodeSeed } from './levels/LevelDefinition'
import { selectBiome, createLevelDefinitionForBiome, getBiomeLighting } from './levels/BiomeRegistry'
import { EnvironmentRenderer } from './environment/EnvironmentRenderer'
import type { RunState } from './run/RunState'
import { DEV_MODE } from './utils/devMode'
import { mulberry32 } from './utils/prng'
import { getItem } from './run/ItemData'
import { getCharacter } from './entities/CharacterData'
import { applyHeroMinorTalents, applyHeroPerkStatBonuses } from './run/HeroPerks'
import { getPathAbility } from './entities/CharacterData'
import { getMod, effectiveValue } from './run/ModData'
import {
  getEnemyTemplate,
  getRegularEnemies,
  getBossTemplate,
  scaleEnemyForDepth,
  sampleWave,
  applyEliteVariant,
  type Faction,
} from './entities/EnemyData'

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

export type CombatType = 'combat' | 'elite' | 'miniboss' | 'boss' | 'quickbattle'

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

  /** Faction for this encounter (determines enemy spawns and biome). */
  private faction?: Faction
  private combatType: CombatType
  /** Map column index within the current segment (resets when a new act is appended). */
  private depth: number
  /** Monotonic difficulty index: ring × columns + column + one-shot event bonus. */
  private effectiveCombatDepth: number
  private nodeId: string

  constructor(
    container: HTMLElement,
    sharedEngine?: Engine,
    private readonly onCombatEnd?: () => void,
    sharedAssets?: AssetLibrary,
    private readonly onReady?: () => void,
    private readonly runState?: RunState,
    faction?: Faction,
    combatType: CombatType = 'combat',
    nodeId: string = 'default',
    depth: number = 0,
    private readonly onDefeat?: () => void
  ) {
    this.faction = faction
    this.combatType = combatType
    this.nodeId = nodeId
    this.depth = depth

    let depthBonus = 0
    if (runState) {
      depthBonus = runState.nextCombatEnemyDepthBonus
      runState.nextCombatEnemyDepthBonus = 0
    }
    const ring = runState?.ringIndex ?? 0
    const colsPerRing = 7
    this.effectiveCombatDepth = ring * colsPerRing + depth + depthBonus

    if (sharedAssets) {
      this.assetLibrary = sharedAssets
    } else {
      this.assetLibrary = new AssetLibrary()
      registerPrototypeAssets(this.assetLibrary)
    }

    const nodeType = combatType === 'boss' ? 'boss' : combatType === 'elite' ? 'elite' : combatType === 'miniboss' ? 'miniboss' : 'combat'
    const biomeId = selectBiome(faction, nodeType, this.effectiveCombatDepth)
    if (DEV_MODE) {
      console.info('[Combat]', { biomeId, faction, depth: this.depth, effectiveDepth: this.effectiveCombatDepth, nodeType: combatType })
    }
    const levelSeed = createNodeSeed(runState?.runSeed ?? 0, nodeId)
    const levelDef = createLevelDefinitionForBiome(biomeId, levelSeed, nodeType)
    this.level = composeLevel(levelDef)

    // Core rendering — reuse shared engine if provided
    if (sharedEngine) {
      this.engine = sharedEngine
      this.ownsEngine = false
    } else {
      this.engine = new Engine(container)
      this.ownsEngine = true
    }

    // Apply biome-specific scene lighting and background colour
    const biomeLighting = getBiomeLighting(biomeId)
    this.engine.setBiomeTone(biomeLighting.sky, biomeLighting.ground, biomeLighting.bg)
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

    // Action queue
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
      this.onCombatEnd,
      this.onDefeat,
      async (caster, ability, target) => {
        this.turnManager.setAnimating()
        await this.combatActions.useAbility(caster, ability, target)
        this.turnManager.restorePhase()
      },
      this.runState
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
        // Handle spawner units before regular AI
        this.handleSpawners().then(() => {
          return this.enemyAI.executeTurn()
        }).then(() => {
          const result = this.turnManager.checkGameOver(this.unitManager)
          if (!result) {
            this.turnManager.endEnemyPhase(this.unitManager)
          }
        })
      }
    })

    this.inputManager.on((event) => {
      if (event.type === 'unitAttacked') {
        this.engine.shake(0.12, 0.14)
        this.turnManager.checkGameOver(this.unitManager)
      }
    })
  }

  /** Handle Spawner-type enemies that create new units each turn. */
  private async handleSpawners(): Promise<void> {
    const enemies = this.unitManager.getTeamUnits('enemy')
    for (const enemy of enemies) {
      if (!enemy.data.enemyTemplateId) continue
      const template = getEnemyTemplate(enemy.data.enemyTemplateId!)
      if (!template?.specials) continue
      for (const special of template.specials) {
        if (special.type === 'spawn' && special.spawnTemplateId) {
          const spawnTemplate = getEnemyTemplate(special.spawnTemplateId!)
          if (!spawnTemplate) continue
          // Find adjacent empty tile
          const spawnTile = this.findAdjacentEmpty(enemy.data.gridX, enemy.data.gridZ)
          if (spawnTile) {
            const spawnId = `spawned-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
            const unit = createEnemyFromTemplate(spawnId, spawnTile.x, spawnTile.z, spawnTemplate)
            this.unitManager.addUnit(unit)
          }
        }
      }
    }
  }

  private findAdjacentEmpty(x: number, z: number): { x: number; z: number } | null {
    const dirs = [
      { x: 1, z: 0 }, { x: -1, z: 0 },
      { x: 0, z: 1 }, { x: 0, z: -1 },
    ]
    for (const d of dirs) {
      const nx = x + d.x
      const nz = z + d.z
      if (nx >= 0 && nx < this.grid.width && nz >= 0 && nz < this.grid.height) {
        if (this.grid.isWalkable(nx, nz) && !this.unitManager.isOccupied(nx, nz)) {
          return { x: nx, z: nz }
        }
      }
    }
    return null
  }

  private spawnInitialUnits(): void {
    const defaultAttackTypes = [
      ATTACK_TYPES.basic,
      ATTACK_TYPES.projectile,
      ATTACK_TYPES.lobbed,
      ATTACK_TYPES.cleave,
    ]

    // Only spawn as many player units as the loadout defines
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

      if (character && this.runState) {
        applyHeroPerkStatBonuses(character, this.runState, unit)
        applyHeroMinorTalents(character, this.runState, unit)
        // Inject path abilities and passives unlocked via leveling
        const unlockedIds = this.runState.heroUnlockedAbilities[character.id] ?? []
        for (const grantId of unlockedIds) {
          const ability = getPathAbility(grantId)
          if (ability && !unit.unlockedAbilities.includes(grantId)) {
            unit.unlockedAbilities.push(grantId)
          } else if (!ability) {
            // It's a passive — track on the unit for DamageResolver checks
            if (!unit.activePassives.includes(grantId)) {
              unit.activePassives.push(grantId)
            }
          }
        }
      }

      // Apply run-wide bonuses from rewards
      if (this.runState) {
        unit.stats.attack += this.runState.bonusAtk
        unit.stats.defense += this.runState.bonusDef
        unit.stats.maxHp += this.runState.bonusMaxHp
        unit.stats.hp += this.runState.bonusMaxHp
        // Camp bonus charges (Benito's spiced meal) — applied once then cleared below
        if (this.runState.campBonusCharges > 0) {
          unit.charges += this.runState.campBonusCharges
          unit.maxCharges += this.runState.campBonusCharges
        }
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

      // Apply equipped mods from RunState
      if (this.runState) {
        const weaponMods = this.runState.unitWeaponMods[i] ?? []
        const armorMods = this.runState.unitArmorMods[i] ?? []
        unit.weaponMods = [...weaponMods]
        unit.armorMods = [...armorMods]

        // Apply mod stat effects
        for (const equipped of weaponMods) {
          const def = getMod(equipped.modId)
          if (!def) continue
          for (const effect of def.effects) {
            const val = effectiveValue(effect, equipped.stacks)
            switch (effect.kind) {
              case 'flat_range':
                unit.stats.attackRange += val
                unit.attackType = { ...unit.attackType, range: unit.stats.attackRange }
                break
              case 'flat_charges':
                unit.maxCharges += val
                unit.charges += val
                break
              case 'recharge_boost':
                unit.rechargeRate += val
                break
            }
          }
        }
        for (const equipped of armorMods) {
          const def = getMod(equipped.modId)
          if (!def) continue
          for (const effect of def.effects) {
            const val = effectiveValue(effect, equipped.stacks)
            switch (effect.kind) {
              case 'flat_hp':
                unit.stats.maxHp += val
                unit.stats.hp += val
                break
              case 'flat_defense':
                unit.stats.defense += val
                break
              case 'flat_movement':
                unit.stats.moveRange += val
                break
              case 'negate_first_hit':
                unit.reactiveShieldActive = true
                break
              case 'heal_once':
                unit.medkitAvailable = true
                break
            }
          }
        }
      }

      // Restore HP from party roster (persistent across combats)
      if (this.runState) {
        const saved = this.runState.partyRoster.find((u) => u.unitId === `player-${i}`)
        if (saved) {
          unit.stats.hp = Math.min(saved.hp, unit.stats.maxHp)
        }
      }

      // Sync movementLeft with final moveRange after all stat modifications
      unit.movementLeft = unit.stats.moveRange
      this.unitManager.addUnit(unit)
    })

    // Clear one-shot camp bonuses now that all player units have been spawned
    if (this.runState) {
      this.runState.campBonusCharges = 0
    }

    // Spawn enemies based on combat type and faction
    if (this.combatType === 'quickbattle') {
      this.spawnQuickBattle()
    } else if (this.combatType === 'boss') {
      this.spawnBoss()
    } else if (this.combatType === 'miniboss') {
      this.spawnMiniBoss()
    } else {
      this.spawnFactionEnemies()
    }
  }

  private makeCombatRng(): () => number {
    const seed = this.runState?.runSeed ?? 0
    let h = seed >>> 0
    const id = this.nodeId
    for (let i = 0; i < id.length; i++) {
      h = Math.imul(31, h) + id.charCodeAt(i)
    }
    return mulberry32(h >>> 0)
  }

  private spawnFactionEnemies(): void {
    const faction = this.faction
    if (!faction) {
      // Fallback to generic enemies
      this.spawnGenericEnemies()
      return
    }

    const pool = getRegularEnemies(faction)
    if (pool.length === 0) {
      this.spawnGenericEnemies()
      return
    }

    const rng = this.makeCombatRng()
    const cap = Math.min(3 + Math.floor(this.effectiveCombatDepth / 2), 5)
    const count = Math.min(this.level.enemySpawns.length, cap)
    let wave = sampleWave(pool, count, rng)
    if (this.combatType === 'elite' && wave.length > 0) {
      const idx = Math.floor(rng() * wave.length)
      wave = [...wave]
      wave[idx] = applyEliteVariant(wave[idx]!)
    }

    const spawns = this.level.enemySpawns.slice(0, wave.length)
    spawns.forEach((spawn, i) => {
      const base = wave[i]
      if (!base) return
      const template =
        this.effectiveCombatDepth > 0 ? scaleEnemyForDepth(base, this.effectiveCombatDepth) : base
      const unit = createEnemyFromTemplate(`enemy-${i}`, spawn.x, spawn.z, template)
      this.unitManager.addUnit(unit)
    })
  }

  private spawnGenericEnemies(): void {
    const enemyAssetOrder = shuffle(ENEMY_UNIT_ASSET_IDS)
    this.level.enemySpawns.forEach((spawn, i) => {
      const unit = createEnemyUnit(`enemy-${i}`, spawn.x, spawn.z)
      unit.assetId = enemyAssetOrder[i % enemyAssetOrder.length]
      this.unitManager.addUnit(unit)
    })
  }

  private spawnMiniBoss(): void {
    const regularPool = getRegularEnemies(this.faction)

    if (regularPool.length === 0) {
      this.spawnGenericEnemies()
      return
    }

    // Mini boss: a heavily scaled regular enemy standing in as a named threat
    const miniBossBase = regularPool[0]!
    const miniBoss = scaleEnemyForDepth(miniBossBase, this.effectiveCombatDepth + 3)
    const bossSpawn = this.level.enemySpawns[0] ?? { x: 7, z: 7 }
    const bossUnit = createEnemyFromTemplate('miniboss', bossSpawn.x, bossSpawn.z, miniBoss)
    this.unitManager.addUnit(bossUnit)

    // Two escorts from the regular pool, depth-scaled
    const escortSpawns = this.level.enemySpawns.slice(1, 3)
    const rng = this.makeCombatRng()
    const escortTemplates = sampleWave(regularPool, escortSpawns.length, rng)
    escortSpawns.forEach((spawn, i) => {
      const base = escortTemplates[i] ?? regularPool[i % regularPool.length]!
      const escort = scaleEnemyForDepth(base, this.effectiveCombatDepth)
      this.unitManager.addUnit(createEnemyFromTemplate(`miniboss-escort-${i}`, spawn.x, spawn.z, escort))
    })
  }

  private spawnBoss(): void {
    const bossTheme = this.faction === 'tech' ? 'tech' : 'fantasy'
    const boss = getBossTemplate(bossTheme)
    const phase1 = boss.phases[0]
    const spawn = this.level.enemySpawns[0] ?? { x: 7, z: 7 }

    const attackType = ATTACK_TYPES[phase1.attackKind] ?? ATTACK_TYPES.basic
    const unit = createEnemyUnit('boss', spawn.x, spawn.z, { ...attackType, range: phase1.attackRange })
    unit.assetId = boss.assetId
    unit.stats.hp = phase1.hp
    unit.stats.maxHp = phase1.hp
    unit.stats.attack = phase1.attack
    unit.stats.defense = phase1.defense
    unit.stats.moveRange = phase1.moveRange
    unit.movementLeft = phase1.moveRange
    unit.bossPhase = 0
    unit.enemyTemplateId = boss.id
    this.unitManager.addUnit(unit)

    // Spawn any Phase 1 adds
    this.spawnBossAdds(phase1.addTemplateIds, 1)
  }

  /**
   * Quick Battle: boss + 3 faction regulars as escorts.
   * Designed for fast map testing — boss at far center, escorts flanking.
   */
  private spawnQuickBattle(): void {
    const faction = this.faction ?? 'fantasy'
    const bossTheme = faction === 'tech' ? 'tech' : 'fantasy'
    const boss = getBossTemplate(bossTheme)
    const phase1 = boss.phases[0]
    const w = this.grid.width
    const h = this.grid.height

    // Boss positioned at center of far edge
    const bossX = Math.floor(w / 2)
    const bossZ = h - 2
    const bossAttack = ATTACK_TYPES[phase1.attackKind] ?? ATTACK_TYPES.basic
    const bossUnit = createEnemyUnit('qb-boss', bossX, bossZ, { ...bossAttack, range: phase1.attackRange })
    bossUnit.assetId = boss.assetId
    bossUnit.stats.hp = phase1.hp
    bossUnit.stats.maxHp = phase1.hp
    bossUnit.stats.attack = phase1.attack
    bossUnit.stats.defense = phase1.defense
    bossUnit.stats.moveRange = phase1.moveRange
    bossUnit.movementLeft = phase1.moveRange
    bossUnit.bossPhase = 0
    bossUnit.enemyTemplateId = boss.id
    this.unitManager.addUnit(bossUnit)

    // 3 regular faction escorts near the boss
    const regularPool = getRegularEnemies(faction)
    const escortPositions = [
      { x: bossX - 2, z: bossZ - 1 },
      { x: bossX + 2, z: bossZ - 1 },
      { x: bossX,     z: bossZ - 2 },
    ]
    const rng = this.makeCombatRng()
    const escortWave = sampleWave(regularPool, escortPositions.length, rng)
    escortPositions.forEach((pos, i) => {
      const clampedX = Math.max(0, Math.min(w - 1, pos.x))
      const clampedZ = Math.max(0, Math.min(h - 1, pos.z))
      if (!this.grid.isWalkable(clampedX, clampedZ)) return
      const base = escortWave[i] ?? regularPool[i % Math.max(1, regularPool.length)]
      if (!base) return
      const escort = scaleEnemyForDepth(base, this.effectiveCombatDepth)
      this.unitManager.addUnit(createEnemyFromTemplate(`qb-escort-${i}`, clampedX, clampedZ, escort))
    })
  }

  private spawnBossAdds(templateIds: string[], startIdx: number): void {
    const availableSpawns = this.level.enemySpawns.slice(1) // first spawn is boss
    templateIds.forEach((templateId, i) => {
      const template = getEnemyTemplate(templateId)
      if (!template) return
      const spawn = availableSpawns[i % availableSpawns.length] ?? { x: 8, z: 8 }
      const scaled =
        this.effectiveCombatDepth > 0
          ? scaleEnemyForDepth(template, this.effectiveCombatDepth)
          : template
      const unit = createEnemyFromTemplate(`boss-add-${startIdx + i}`, spawn.x, spawn.z, scaled)
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

  /** Saves surviving player unit HP to runState.partyRoster for persistence across combats. */
  savePartyRoster(): void {
    if (!this.runState) return
    const playerUnits = this.unitManager.getTeamUnits('player')
    this.runState.partyRoster = playerUnits.map((u) => ({
      unitId: u.data.id,
      hp: u.data.stats.hp,
      maxHp: u.data.stats.maxHp,
    }))
  }

  /** Dev only — instantly removes all enemies and triggers victory. */
  devKillEnemies(): void {
    const enemies = this.unitManager.getTeamUnits('enemy')
    for (const e of enemies) {
      this.unitManager.removeUnit(e.id)
    }
    // checkGameOver emits the gameOver event → GameUI shows Victory screen.
    // If gameEnded was already set (shouldn't happen), fall back to direct callback.
    const result = this.turnManager.checkGameOver(this.unitManager)
    if (!result) {
      this.onCombatEnd?.()
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
