import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

// ── Forest pack (KayKit Nature / Forest) ──
import forestTree1AUrl from './environment/forest/Assets/gltf/Tree_1_A_Color1.gltf?url'
import forestTree2AUrl from './environment/forest/Assets/gltf/Tree_2_A_Color1.gltf?url'
import forestTree3AUrl from './environment/forest/Assets/gltf/Tree_3_A_Color1.gltf?url'
import forestBush1AUrl from './environment/forest/Assets/gltf/Bush_1_A_Color1.gltf?url'
import forestBush2AUrl from './environment/forest/Assets/gltf/Bush_2_A_Color1.gltf?url'
import forestRock1AUrl from './environment/forest/Assets/gltf/Rock_1_A_Color1.gltf?url'
import forestRock2AUrl from './environment/forest/Assets/gltf/Rock_2_A_Color1.gltf?url'
import forestGrass1AUrl from './environment/forest/Assets/gltf/Grass_1_A_Color1.gltf?url'

// ── BlockBits pack (KayKit BlockBits 1.0 FREE) ──
import blocksGrassUrl from '../assets/test/KayKit_BlockBits_1.0_FREE/Assets/gltf/grass.gltf?url'
import blocksDirtGrassUrl from '../assets/test/KayKit_BlockBits_1.0_FREE/Assets/gltf/dirt_with_grass.gltf?url'
import blocksMetalUrl from '../assets/test/KayKit_BlockBits_1.0_FREE/Assets/gltf/metal.gltf?url'
import blocksStoneDarkUrl from '../assets/test/KayKit_BlockBits_1.0_FREE/Assets/gltf/stone_dark.gltf?url'
import blocksBlockBlueUrl from '../assets/test/KayKit_BlockBits_1.0_FREE/Assets/gltf/colored_block_blue.gltf?url'
import blocksBlockRedUrl from '../assets/test/KayKit_BlockBits_1.0_FREE/Assets/gltf/colored_block_red.gltf?url'
import blocksDecoBlueUrl from '../assets/test/KayKit_BlockBits_1.0_FREE/Assets/gltf/decorative_block_blue.gltf?url'
import blocksStripedBlueUrl from '../assets/test/KayKit_BlockBits_1.0_FREE/Assets/gltf/striped_block_blue.gltf?url'
import blocksWoodUrl from '../assets/test/KayKit_BlockBits_1.0_FREE/Assets/gltf/wood.gltf?url'

import bannerModelUrl from './environment/mini-dungeon/banner.glb?url'
import barrelModelUrl from './environment/mini-dungeon/barrel.glb?url'
import chestModelUrl from './environment/mini-dungeon/chest.glb?url'
import coinModelUrl from './environment/mini-dungeon/coin.glb?url'
import columnModelUrl from './environment/mini-dungeon/column.glb?url'
import dirtModelUrl from './environment/mini-dungeon/dirt.glb?url'
import floorModelUrl from './environment/mini-dungeon/floor.glb?url'
import floorDetailModelUrl from './environment/mini-dungeon/floor-detail.glb?url'
import gateModelUrl from './environment/mini-dungeon/gate.glb?url'
import rocksModelUrl from './environment/mini-dungeon/rocks.glb?url'
import shieldRectangleModelUrl from './environment/mini-dungeon/shield-rectangle.glb?url'
import shieldRoundModelUrl from './environment/mini-dungeon/shield-round.glb?url'
import stairsModelUrl from './environment/mini-dungeon/stairs.glb?url'
import stonesModelUrl from './environment/mini-dungeon/stones.glb?url'
import trapModelUrl from './environment/mini-dungeon/trap.glb?url'
import wallModelUrl from './environment/mini-dungeon/wall.glb?url'
import wallHalfModelUrl from './environment/mini-dungeon/wall-half.glb?url'
import wallNarrowModelUrl from './environment/mini-dungeon/wall-narrow.glb?url'
import wallOpeningModelUrl from './environment/mini-dungeon/wall-opening.glb?url'
import weaponSpearModelUrl from './environment/mini-dungeon/weapon-spear.glb?url'
import weaponSwordModelUrl from './environment/mini-dungeon/weapon-sword.glb?url'
import woodStructureModelUrl from './environment/mini-dungeon/wood-structure.glb?url'
import woodSupportModelUrl from './environment/mini-dungeon/wood-support.glb?url'

import characterFemaleAModelUrl from './characters/mini-characters/character-female-a.glb?url'
import characterFemaleBModelUrl from './characters/mini-characters/character-female-b.glb?url'
import characterFemaleCModelUrl from './characters/mini-characters/character-female-c.glb?url'
import characterFemaleDModelUrl from './characters/mini-characters/character-female-d.glb?url'
import characterFemaleEModelUrl from './characters/mini-characters/character-female-e.glb?url'
import characterFemaleFModelUrl from './characters/mini-characters/character-female-f.glb?url'
import characterMaleAModelUrl from './characters/mini-characters/character-male-a.glb?url'
import characterMaleBModelUrl from './characters/mini-characters/character-male-b.glb?url'
import characterMaleCModelUrl from './characters/mini-characters/character-male-c.glb?url'
import characterMaleDModelUrl from './characters/mini-characters/character-male-d.glb?url'
import characterMaleEModelUrl from './characters/mini-characters/character-male-e.glb?url'
import characterMaleFModelUrl from './characters/mini-characters/character-male-f.glb?url'

/** KayKit Adventurers 2.0 — full-body heroes (Characters/gltf). */
import kaykitKnightUrl from './test/KayKit_Adventurers_2.0_FREE/Characters/gltf/Knight.glb?url'
import kaykitMageUrl from './test/KayKit_Adventurers_2.0_FREE/Characters/gltf/Mage.glb?url'
import kaykitRangerUrl from './test/KayKit_Adventurers_2.0_FREE/Characters/gltf/Ranger.glb?url'
import kaykitRogueUrl from './test/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb?url'
import kaykitBarbarianUrl from './test/KayKit_Adventurers_2.0_FREE/Characters/gltf/Barbarian.glb?url'
import kaykitRogueHoodedUrl from './test/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue_Hooded.glb?url'

/** KayKit Skeletons 1.1 FREE — enemy rigs (characters/gltf). */
import skelWarriorUrl from './test/KayKit_Skeletons_1.1_FREE/characters/gltf/Skeleton_Warrior.glb?url'
import skelRogueUrl from './test/KayKit_Skeletons_1.1_FREE/characters/gltf/Skeleton_Rogue.glb?url'
import skelMinionUrl from './test/KayKit_Skeletons_1.1_FREE/characters/gltf/Skeleton_Minion.glb?url'
import skelMageUrl from './test/KayKit_Skeletons_1.1_FREE/characters/gltf/Skeleton_Mage.glb?url'

export interface ModelAssetConfig {
  url: string
  scale?: number
  rotationY?: number
  yOffset?: number
  brightness?: number
}

interface ModelAsset {
  config: ModelAssetConfig
  scene: THREE.Object3D
}

export type PrototypeAssetGroup = 'environment' | 'characters'

export interface PrototypeAssetEntry {
  id: string
  filename: string
  group: PrototypeAssetGroup
  scale?: number
  yOffset?: number
  brightness?: number
}

export const MINI_DUNGEON_ASSET_IDS = {
  banner: 'env.mini-dungeon.banner',
  barrel: 'env.mini-dungeon.barrel',
  chest: 'env.mini-dungeon.chest',
  coin: 'env.mini-dungeon.coin',
  column: 'env.mini-dungeon.column',
  dirt: 'env.mini-dungeon.dirt',
  floor: 'env.mini-dungeon.floor',
  floorDetail: 'env.mini-dungeon.floor-detail',
  gate: 'env.mini-dungeon.gate',
  rocks: 'env.mini-dungeon.rocks',
  shieldRectangle: 'env.mini-dungeon.shield-rectangle',
  shieldRound: 'env.mini-dungeon.shield-round',
  stairs: 'env.mini-dungeon.stairs',
  stones: 'env.mini-dungeon.stones',
  trap: 'env.mini-dungeon.trap',
  wall: 'env.mini-dungeon.wall',
  wallHalf: 'env.mini-dungeon.wall-half',
  wallNarrow: 'env.mini-dungeon.wall-narrow',
  wallOpening: 'env.mini-dungeon.wall-opening',
  weaponSpear: 'env.mini-dungeon.weapon-spear',
  weaponSword: 'env.mini-dungeon.weapon-sword',
  woodStructure: 'env.mini-dungeon.wood-structure',
  woodSupport: 'env.mini-dungeon.wood-support'
} as const

export const FOREST_ASSET_IDS = {
  tree1:  'env.forest.tree-1a',
  tree2:  'env.forest.tree-2a',
  tree3:  'env.forest.tree-3a',
  bush1:  'env.forest.bush-1a',
  bush2:  'env.forest.bush-2a',
  rock1:  'env.forest.rock-1a',
  rock2:  'env.forest.rock-2a',
  grass:  'env.forest.grass-1a',
} as const

export const BLOCK_ASSET_IDS = {
  grassFloor:  'env.blocks.grass',
  dirtGrass:   'env.blocks.dirt-grass',
  metalFloor:  'env.blocks.metal',
  stoneDark:   'env.blocks.stone-dark',
  blockBlue:   'env.blocks.block-blue',
  blockRed:    'env.blocks.block-red',
  decoBlue:    'env.blocks.deco-blue',
  stripedBlue: 'env.blocks.striped-blue',
  wood:        'env.blocks.wood',
} as const

const FOREST_ASSET_CATALOG: PrototypeAssetEntry[] = [
  { id: FOREST_ASSET_IDS.tree1, filename: 'Tree_1_A_Color1.gltf', group: 'environment', scale: 0.9 },
  { id: FOREST_ASSET_IDS.tree2, filename: 'Tree_2_A_Color1.gltf', group: 'environment', scale: 0.9 },
  { id: FOREST_ASSET_IDS.tree3, filename: 'Tree_3_A_Color1.gltf', group: 'environment', scale: 0.9 },
  { id: FOREST_ASSET_IDS.bush1, filename: 'Bush_1_A_Color1.gltf', group: 'environment', scale: 0.9 },
  { id: FOREST_ASSET_IDS.bush2, filename: 'Bush_2_A_Color1.gltf', group: 'environment', scale: 0.9 },
  { id: FOREST_ASSET_IDS.rock1, filename: 'Rock_1_A_Color1.gltf', group: 'environment', scale: 0.9 },
  { id: FOREST_ASSET_IDS.rock2, filename: 'Rock_2_A_Color1.gltf', group: 'environment', scale: 0.9 },
  { id: FOREST_ASSET_IDS.grass, filename: 'Grass_1_A_Color1.gltf', group: 'environment', scale: 0.9 },
]

const BLOCK_ASSET_CATALOG: PrototypeAssetEntry[] = [
  { id: BLOCK_ASSET_IDS.grassFloor,  filename: 'grass.gltf',               group: 'environment', scale: 1.0 },
  { id: BLOCK_ASSET_IDS.dirtGrass,   filename: 'dirt_with_grass.gltf',     group: 'environment', scale: 1.0 },
  { id: BLOCK_ASSET_IDS.metalFloor,  filename: 'metal.gltf',               group: 'environment', scale: 1.0 },
  { id: BLOCK_ASSET_IDS.stoneDark,   filename: 'stone_dark.gltf',          group: 'environment', scale: 1.0 },
  { id: BLOCK_ASSET_IDS.blockBlue,   filename: 'colored_block_blue.gltf',  group: 'environment', scale: 1.0 },
  { id: BLOCK_ASSET_IDS.blockRed,    filename: 'colored_block_red.gltf',   group: 'environment', scale: 1.0 },
  { id: BLOCK_ASSET_IDS.decoBlue,    filename: 'decorative_block_blue.gltf', group: 'environment', scale: 1.0 },
  { id: BLOCK_ASSET_IDS.stripedBlue, filename: 'striped_block_blue.gltf',  group: 'environment', scale: 1.0 },
  { id: BLOCK_ASSET_IDS.wood,        filename: 'wood.gltf',                group: 'environment', scale: 1.0 },
]

const MINI_DUNGEON_ASSET_CATALOG: PrototypeAssetEntry[] = [
  { id: MINI_DUNGEON_ASSET_IDS.banner, filename: 'banner.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.barrel, filename: 'barrel.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.chest, filename: 'chest.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.coin, filename: 'coin.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.column, filename: 'column.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.dirt, filename: 'dirt.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.floor, filename: 'floor.glb', group: 'environment' },
  {
    id: MINI_DUNGEON_ASSET_IDS.floorDetail,
    filename: 'floor-detail.glb',
    group: 'environment'
  },
  { id: MINI_DUNGEON_ASSET_IDS.gate, filename: 'gate.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.rocks, filename: 'rocks.glb', group: 'environment' },
  {
    id: MINI_DUNGEON_ASSET_IDS.shieldRectangle,
    filename: 'shield-rectangle.glb',
    group: 'environment'
  },
  { id: MINI_DUNGEON_ASSET_IDS.shieldRound, filename: 'shield-round.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.stairs, filename: 'stairs.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.stones, filename: 'stones.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.trap, filename: 'trap.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.wall, filename: 'wall.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.wallHalf, filename: 'wall-half.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.wallNarrow, filename: 'wall-narrow.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.wallOpening, filename: 'wall-opening.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.weaponSpear, filename: 'weapon-spear.glb', group: 'environment' },
  { id: MINI_DUNGEON_ASSET_IDS.weaponSword, filename: 'weapon-sword.glb', group: 'environment' },
  {
    id: MINI_DUNGEON_ASSET_IDS.woodStructure,
    filename: 'wood-structure.glb',
    group: 'environment'
  },
  { id: MINI_DUNGEON_ASSET_IDS.woodSupport, filename: 'wood-support.glb', group: 'environment' }
]

const CHARACTER_ASSET_TO_FILE: Record<string, string> = {
  'unit.mini.female-a': 'character-female-a.glb',
  'unit.mini.female-b': 'character-female-b.glb',
  'unit.mini.female-c': 'character-female-c.glb',
  'unit.mini.female-d': 'character-female-d.glb',
  'unit.mini.female-e': 'character-female-e.glb',
  'unit.mini.female-f': 'character-female-f.glb',
  'unit.mini.male-a': 'character-male-a.glb',
  'unit.mini.male-b': 'character-male-b.glb',
  'unit.mini.male-c': 'character-male-c.glb',
  'unit.mini.male-d': 'character-male-d.glb',
  'unit.mini.male-e': 'character-male-e.glb',
  'unit.mini.male-f': 'character-male-f.glb'
}

const MINI_CHARACTER_ASSET_CATALOG: PrototypeAssetEntry[] = Object.entries(
  CHARACTER_ASSET_TO_FILE
).map(([id, filename]) => ({
  id,
  filename,
  group: 'characters',
  scale: 0.45,
  yOffset: 0
}))

/** KayKit adventurers — tuned for ~1u tile grid vs mini 0.45. */
const KAYKIT_HERO_ASSET_CATALOG: PrototypeAssetEntry[] = [
  { id: 'unit.kaykit.knight', filename: 'Knight.glb', group: 'characters', scale: 0.28, yOffset: 0 },
  { id: 'unit.kaykit.mage', filename: 'Mage.glb', group: 'characters', scale: 0.28, yOffset: 0 },
  { id: 'unit.kaykit.ranger', filename: 'Ranger.glb', group: 'characters', scale: 0.28, yOffset: 0 },
  { id: 'unit.kaykit.rogue', filename: 'Rogue.glb', group: 'characters', scale: 0.28, yOffset: 0 },
  { id: 'unit.kaykit.barbarian', filename: 'Barbarian.glb', group: 'characters', scale: 0.28, yOffset: 0 },
  { id: 'unit.kaykit.rogue_hooded', filename: 'Rogue_Hooded.glb', group: 'characters', scale: 0.28, yOffset: 0 }
]

/** Same .glb can appear under multiple ids with different scale (elite/boss). */
const KAYKIT_SKELETON_ASSET_CATALOG: PrototypeAssetEntry[] = [
  { id: 'unit.kaykit.skeleton_warrior', filename: 'Skeleton_Warrior.glb', group: 'characters', scale: 0.26, yOffset: 0 },
  { id: 'unit.kaykit.skeleton_rogue', filename: 'Skeleton_Rogue.glb', group: 'characters', scale: 0.26, yOffset: 0 },
  { id: 'unit.kaykit.skeleton_minion', filename: 'Skeleton_Minion.glb', group: 'characters', scale: 0.22, yOffset: 0 },
  { id: 'unit.kaykit.skeleton_mage', filename: 'Skeleton_Mage.glb', group: 'characters', scale: 0.26, yOffset: 0 },
  { id: 'unit.kaykit.skeleton_warrior_elite', filename: 'Skeleton_Warrior.glb', group: 'characters', scale: 0.3, yOffset: 0 },
  { id: 'unit.kaykit.skeleton_boss', filename: 'Skeleton_Mage.glb', group: 'characters', scale: 0.36, yOffset: 0 }
]

export const PROTOTYPE_ASSET_CATALOG: PrototypeAssetEntry[] = [
  ...MINI_DUNGEON_ASSET_CATALOG,
  ...MINI_CHARACTER_ASSET_CATALOG,
  ...KAYKIT_HERO_ASSET_CATALOG,
  ...KAYKIT_SKELETON_ASSET_CATALOG,
  ...FOREST_ASSET_CATALOG,
  ...BLOCK_ASSET_CATALOG,
]

const ENVIRONMENT_MODEL_URLS: Record<string, string> = {
  'banner.glb': bannerModelUrl,
  'barrel.glb': barrelModelUrl,
  'chest.glb': chestModelUrl,
  'coin.glb': coinModelUrl,
  'column.glb': columnModelUrl,
  'dirt.glb': dirtModelUrl,
  'floor.glb': floorModelUrl,
  'floor-detail.glb': floorDetailModelUrl,
  'gate.glb': gateModelUrl,
  'rocks.glb': rocksModelUrl,
  'shield-rectangle.glb': shieldRectangleModelUrl,
  'shield-round.glb': shieldRoundModelUrl,
  'stairs.glb': stairsModelUrl,
  'stones.glb': stonesModelUrl,
  'trap.glb': trapModelUrl,
  'wall.glb': wallModelUrl,
  'wall-half.glb': wallHalfModelUrl,
  'wall-narrow.glb': wallNarrowModelUrl,
  'wall-opening.glb': wallOpeningModelUrl,
  'weapon-spear.glb': weaponSpearModelUrl,
  'weapon-sword.glb': weaponSwordModelUrl,
  'wood-structure.glb': woodStructureModelUrl,
  'wood-support.glb': woodSupportModelUrl
}

const CHARACTER_MODEL_URLS: Record<string, string> = {
  'character-female-a.glb': characterFemaleAModelUrl,
  'character-female-b.glb': characterFemaleBModelUrl,
  'character-female-c.glb': characterFemaleCModelUrl,
  'character-female-d.glb': characterFemaleDModelUrl,
  'character-female-e.glb': characterFemaleEModelUrl,
  'character-female-f.glb': characterFemaleFModelUrl,
  'character-male-a.glb': characterMaleAModelUrl,
  'character-male-b.glb': characterMaleBModelUrl,
  'character-male-c.glb': characterMaleCModelUrl,
  'character-male-d.glb': characterMaleDModelUrl,
  'character-male-e.glb': characterMaleEModelUrl,
  'character-male-f.glb': characterMaleFModelUrl,
  'Knight.glb': kaykitKnightUrl,
  'Mage.glb': kaykitMageUrl,
  'Ranger.glb': kaykitRangerUrl,
  'Rogue.glb': kaykitRogueUrl,
  'Barbarian.glb': kaykitBarbarianUrl,
  'Rogue_Hooded.glb': kaykitRogueHoodedUrl,
  'Skeleton_Warrior.glb': skelWarriorUrl,
  'Skeleton_Rogue.glb': skelRogueUrl,
  'Skeleton_Minion.glb': skelMinionUrl,
  'Skeleton_Mage.glb': skelMageUrl
}

const FOREST_MODEL_URLS: Record<string, string> = {
  'Tree_1_A_Color1.gltf': forestTree1AUrl,
  'Tree_2_A_Color1.gltf': forestTree2AUrl,
  'Tree_3_A_Color1.gltf': forestTree3AUrl,
  'Bush_1_A_Color1.gltf': forestBush1AUrl,
  'Bush_2_A_Color1.gltf': forestBush2AUrl,
  'Rock_1_A_Color1.gltf': forestRock1AUrl,
  'Rock_2_A_Color1.gltf': forestRock2AUrl,
  'Grass_1_A_Color1.gltf': forestGrass1AUrl,
}

const BLOCK_MODEL_URLS: Record<string, string> = {
  'grass.gltf':                 blocksGrassUrl,
  'dirt_with_grass.gltf':       blocksDirtGrassUrl,
  'metal.gltf':                 blocksMetalUrl,
  'stone_dark.gltf':            blocksStoneDarkUrl,
  'colored_block_blue.gltf':    blocksBlockBlueUrl,
  'colored_block_red.gltf':     blocksBlockRedUrl,
  'decorative_block_blue.gltf': blocksDecoBlueUrl,
  'striped_block_blue.gltf':    blocksStripedBlueUrl,
  'wood.gltf':                  blocksWoodUrl,
}

function resolvePrototypeModelUrl(entry: PrototypeAssetEntry): string {
  const url =
    FOREST_MODEL_URLS[entry.filename] ??
    BLOCK_MODEL_URLS[entry.filename] ??
    (entry.group === 'environment'
      ? ENVIRONMENT_MODEL_URLS[entry.filename]
      : CHARACTER_MODEL_URLS[entry.filename])

  if (!url) {
    throw new Error(`Missing asset for ${entry.id} (${entry.filename})`)
  }

  return url
}

export const PLAYER_UNIT_ASSET_IDS = [
  'unit.kaykit.knight',
  'unit.kaykit.mage',
  'unit.kaykit.ranger',
  'unit.kaykit.rogue'
]

/** Fallback pool when faction spawn uses generic mini + KayKit skeleton ids. */
export const ENEMY_UNIT_ASSET_IDS = [
  'unit.kaykit.skeleton_warrior',
  'unit.kaykit.skeleton_rogue',
  'unit.kaykit.skeleton_minion',
  'unit.kaykit.skeleton_mage',
  'unit.mini.female-b',
  'unit.mini.male-d'
]

export class AssetLibrary {
  private readonly gltfLoader = new GLTFLoader()
  private readonly modelConfigs = new Map<string, ModelAssetConfig>()
  private readonly loadedModels = new Map<string, ModelAsset>()
  /** Set to true once loadAll() has finished (regardless of individual failures). */
  private loadAttempted = false

  registerModel(id: string, config: ModelAssetConfig): void {
    this.modelConfigs.set(id, config)
  }

  hasLoaded(id: string): boolean {
    return this.loadedModels.has(id)
  }

  getRegisteredModelIds(): string[] {
    return Array.from(this.modelConfigs.keys())
  }

  /**
   * Returns true once loadAll() has completed (even if some assets failed to load).
   * Individual asset availability can be checked via instantiate() returning null.
   */
  isFullyLoaded(): boolean {
    return this.loadAttempted
  }

  async loadAll(): Promise<void> {
    // Skip models that are already loaded (idempotent — safe to call on a shared library)
    const entries = Array.from(this.modelConfigs.entries()).filter(
      ([id]) => !this.loadedModels.has(id)
    )
    if (entries.length === 0) {
      this.loadAttempted = true
      return
    }

    // Use allSettled so a single failing asset (e.g. broken .gltf reference)
    // does not take down the entire library and freeze every scene.
    const results = await Promise.allSettled(
      entries.map(async ([id, config]) => {
        const scene = await this.loadModel(config.url)
        this.loadedModels.set(id, { config, scene })
        return id
      })
    )

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      const messages = failed.map((r, i) => {
        const entry = entries[i]
        const reason = r.status === 'rejected' ? String(r.reason) : ''
        return `  • ${entry?.[0] ?? '?'} (${entry?.[1]?.url ?? '?'}): ${reason}`
      })
      console.warn(`[AssetLibrary] ${failed.length} asset(s) failed to load:\n${messages.join('\n')}`)
    }

    this.loadAttempted = true
  }

  instantiate(id: string): THREE.Object3D | null {
    const asset = this.loadedModels.get(id)
    if (!asset) return null

    const instance = clone(asset.scene)
    const scale = asset.config.scale ?? 1
    const rotationY = asset.config.rotationY ?? 0
    const yOffset = asset.config.yOffset ?? 0
    const brightness = asset.config.brightness ?? 1

    instance.scale.multiplyScalar(scale)
    instance.rotation.y += rotationY
    instance.position.y += yOffset

    if (brightness !== 1) {
      this.applyBrightness(instance, brightness)
    }

    this.applyShadowFlags(instance, id)
    return instance
  }

  private applyBrightness(instance: THREE.Object3D, factor: number): void {
    instance.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material]

      for (const material of materials) {
        const litMaterial = material as THREE.Material & {
          color?: THREE.Color
          emissive?: THREE.Color
        }

        if (litMaterial.color) {
          litMaterial.color.multiplyScalar(factor)
        }

        if (litMaterial.emissive) {
          litMaterial.emissive.multiplyScalar(Math.max(1, factor * 0.8))
        }

        material.needsUpdate = true
      }
    })
  }


  /**
   * Ensure glTF textures use correct color spaces with WebGLRenderer.outputColorSpace = sRGB.
   * Wrong spaces make albedo look grey/white and break PBR.
   */
  private applyGltfTextureColorSpaces(root: THREE.Object3D): void {
    const srgb = THREE.SRGBColorSpace
    const linear = THREE.LinearSRGBColorSpace
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of mats) {
        if (!(mat instanceof THREE.Material)) continue
        const m = mat as THREE.MeshStandardMaterial & Record<string, unknown>
        const colorKeys = ['map', 'emissiveMap'] as const
        const linearKeys = [
          'normalMap',
          'roughnessMap',
          'metalnessMap',
          'aoMap',
          'lightMap',
          'bumpMap',
          'displacementMap',
          'clearcoatNormalMap',
        ] as const
        for (const key of colorKeys) {
          const t = m[key]
          if (t instanceof THREE.Texture) t.colorSpace = srgb
        }
        for (const key of linearKeys) {
          const t = m[key]
          if (t instanceof THREE.Texture) t.colorSpace = linear
        }
        mat.needsUpdate = true
      }
    })
  }

  private applyShadowFlags(instance: THREE.Object3D, id: string): void {
    const isGroundLike =
      id.endsWith('.floor') ||
      id.endsWith('.floor-detail') ||
      id.endsWith('.dirt') ||
      id.endsWith('.stones')

    instance.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.receiveShadow = true
      child.castShadow = !isGroundLike
    })
  }
  private async loadModel(url: string): Promise<THREE.Object3D> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.applyGltfTextureColorSpaces(gltf.scene)
          resolve(gltf.scene)
        },
        undefined,
        (error) => reject(error)
      )
    })
  }
}

/**
 * Registers the currently-installed local prototype assets.
 */
export function registerPrototypeAssets(assets: AssetLibrary): void {
  for (const entry of PROTOTYPE_ASSET_CATALOG) {
    assets.registerModel(entry.id, {
      url: resolvePrototypeModelUrl(entry),
      scale: entry.scale ?? (entry.group === 'environment' ? 1 : 0.45),
      yOffset: entry.yOffset ?? 0,
      brightness: entry.brightness
    })
  }
}


