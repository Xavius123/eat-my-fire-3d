/**
 * GuideSprites — 2D sprite URLs imported from the sibling eat-my-fire repo.
 * These are used only in GuideScene as reference art for pre-production.
 * Vite bundles them at build time via the @2d alias.
 */

// ── Heroes ──
import heroKnight from '@2d/test/Hero Knight 2/Sprites/Idle.png'
import evilWizard  from '@2d/test/Evil Wizard/Sprites/Idle.png'
import arcaneArcher from '@2d/test/Arcane archer/spritesheet.png'
import martialHero  from '@2d/test/Martial Hero/Sprites/Idle.png'
import martialHero2 from '@2d/test/Martial Hero 2/Sprites/Idle.png'
import medievalWarrior from '@2d/test/Medieval Warrior Pack 2/Sprites/Idle.png'

// ── Fantasy Enemies ──
import goblin0   from '@2d/Roguelike Dungeon - Asset Bundle/Sprites/Monsters/Goblin/Variant0/Goblin_Walk_0.png'
import goblin1   from '@2d/Roguelike Dungeon - Asset Bundle/Sprites/Monsters/Goblin/Variant1/Goblin_Walk_0.png'
import skeleton0 from '@2d/Roguelike Dungeon - Asset Bundle/Sprites/Monsters/Skeleton/Variant0/Skeleton_Walk_0.png'
import skeleton1 from '@2d/Roguelike Dungeon - Asset Bundle/Sprites/Monsters/Skeleton/Variant1/Skeleton_Walk_0.png'
import slime0    from '@2d/Roguelike Dungeon - Asset Bundle/Sprites/Monsters/Slime/Variant0/Slime_Walk_0.png'
import slime1    from '@2d/Roguelike Dungeon - Asset Bundle/Sprites/Monsters/Slime/Variant1/Slime_Walk_0.png'
import orcIdle   from '@2d/Tiny RPG Character Asset Pack v1.03b -Free Soldier&Orc/Tiny RPG Character Asset Pack v1.03 -Free Soldier&Orc/Characters(100x100)/Orc/Orc with shadows/Orc-Idle.png'
import fireWorm  from '@2d/test/Fire Worm/Sprites/Worm/Idle.png'

// ── Tech Enemies (spritesheet) ──
import techEnemies from '@2d/levels/Tech Dungeon/Enemies/enemies x1.png'
import techBoss    from '@2d/levels/Tech Dungeon/Boss/boss x1.png'

// ── Bosses ──
import dungeonMaster from '@2d/Roguelike Dungeon - Asset Bundle/Sprites/Bosses/Dungeon Master/DungeonMaster_Walk_0.png'
import goblinKing    from '@2d/Roguelike Dungeon - Asset Bundle/Sprites/Bosses/Goblin King/GoblinKing_Walk_0.png'
import skeletonKing  from '@2d/Roguelike Dungeon - Asset Bundle/Sprites/Bosses/Skeleton King/SkeletonKing_Walk_0.png'
import slimeKing     from '@2d/Roguelike Dungeon - Asset Bundle/Sprites/Bosses/Slime King/SlimeKing_Walk_0.png'

// ── NPCs ──
import npcSheet    from '@2d/levels/Tech Dungeon/NPC/npc x1.png'
import robotNpc1   from '@2d/test/64px_robot_pack/npc1/npc1-Sheet.png'
import robotNpc2   from '@2d/test/64px_robot_pack/npc2/npc_2-Sheet.png'

// ─────────────────────────────────────────────────────────────────────────────

export const HERO_SPRITES: Record<string, string> = {
  warrior:  heroKnight,
  mage:     evilWizard,
  healer:   arcaneArcher,
  samurai:  martialHero,
  ned:      medievalWarrior,
  death:    martialHero2,
}

export const ENEMY_SPRITES: Record<string, string | { sheet: string; col: number; row: number; cellW: number; cellH: number }> = {
  grunt:       goblin0,
  raider:      goblin1,
  brute:       skeleton0,
  bone_archer: skeleton1,
  scout:       goblin0,
  shaman:      slime0,
  orc_warrior: orcIdle,
  fire_worm:   fireWorm,
  blob:        slime1,
  // Tech enemies — spritesheet (32×32 cells). Legacy ids reuse drone art until 3D roster grows.
  tech_drone:    { sheet: techEnemies, col: 0, row: 0, cellW: 32, cellH: 32 },
  tech_sentinel: { sheet: techEnemies, col: 0, row: 0, cellW: 32, cellH: 32 },
  tech_crawler:  { sheet: techEnemies, col: 4, row: 0, cellW: 32, cellH: 32 },
  tech_stalker:  { sheet: techEnemies, col: 6, row: 0, cellW: 32, cellH: 32 },
  tech_turret:   { sheet: techEnemies, col: 0, row: 0, cellW: 32, cellH: 32 },
}

export const ELITE_SPRITES: Record<string, string | { sheet: string; col: number; row: number; cellW: number; cellH: number }> = {
  elite_champion:       skeleton0,
  elite_tech_commander: { sheet: techEnemies, col: 2, row: 0, cellW: 32, cellH: 32 },
}

export const BOSS_SPRITES: Record<string, string | { sheet: string; col: number; row: number; cellW: number; cellH: number }> = {
  boss_warlord:        dungeonMaster,
  boss_goblin_king:    goblinKing,
  boss_skeleton_king:  skeletonKing,
  boss_slime_king:     slimeKing,
  boss_tech_overlord:  { sheet: techBoss, col: 0, row: 0, cellW: 32, cellH: 32 },
}

export const NPC_SPRITES: Record<string, { sheet: string; col: number; row: number; cellW: number; cellH: number } | string> = {
  merchant:      { sheet: npcSheet, col: 0, row: 0, cellW: 32, cellH: 32 },
  healer:        { sheet: npcSheet, col: 1, row: 0, cellW: 32, cellH: 32 },
  blacksmith:    { sheet: npcSheet, col: 2, row: 0, cellW: 32, cellH: 32 },
  mystic:        { sheet: npcSheet, col: 3, row: 1, cellW: 32, cellH: 32 },
  guide:         { sheet: npcSheet, col: 4, row: 1, cellW: 32, cellH: 32 },
  stranger:      { sheet: npcSheet, col: 5, row: 1, cellW: 32, cellH: 32 },
  robot_scout:   robotNpc1,
  robot_merchant: robotNpc2,
}

/** Render an img tag for a sprite (single image or sheet frame). */
export function spriteImg(
  src: string | { sheet: string; col: number; row: number; cellW: number; cellH: number },
  size = 48,
): string {
  if (typeof src === 'string') {
    return `<img src="${src}" style="width:${size}px;height:${size}px;object-fit:contain;image-rendering:pixelated;vertical-align:middle;" />`
  }
  // Spritesheet: use CSS background-position to show the right frame
  const scale = size / src.cellW
  const sheetW = 10 * src.cellW * scale   // approx — wide enough
  const bx = -(src.col * src.cellW * scale)
  const by = -(src.row * src.cellH * scale)
  return `<div style="display:inline-block;width:${size}px;height:${size}px;
    background-image:url('${src.sheet}');
    background-size:${sheetW}px auto;
    background-position:${bx}px ${by}px;
    image-rendering:pixelated;vertical-align:middle;flex-shrink:0;"></div>`
}
