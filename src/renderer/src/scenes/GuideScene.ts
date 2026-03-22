/**
 * GuideScene — 2D Concept Art Reference Gallery
 *
 * Displays the original eat-my-fire 2D sprite art alongside the current
 * placeholder descriptions. This serves as the reference brief for future
 * game designers and artists commissioning custom 3D models.
 *
 * Accessible from the title screen via the "Art Guide" button.
 */

import type { Scene, SceneContext } from './Scene'
import { TitleScene } from './TitleScene'
import { FANTASY_ENEMIES, TECH_ENEMIES, ELITE_ENEMIES, BOSS_TEMPLATES } from '../entities/EnemyData'
import { getAllCharacters } from '../entities/CharacterData'

// Sprite URLs imported from eat-my-fire (relative paths won't resolve in this
// project, so we use the placeholder description system instead and note the
// original file path for each unit).
const HERO_2D_NOTES: Record<string, string> = {
  warrior:  'Hero Knight 2 — Idle.png (140×140 sheet)',
  mage:     'Evil Wizard — Idle.png (150×150 sheet)',
  healer:   'Arcane Archer sheet — 64×64 frames',
  samurai:  'Martial Hero — 200×200 idle sheet',
  ned:      'Medieval Warrior — 200×111, 8 frames',
  death:    'Martial Arts Hero 2 — 200×200 idle sheet',
}

const ENEMY_2D_NOTES: Record<string, string> = {
  grunt:               'Roguelike Dungeon Bundle / goblin_0.png',
  raider:              'Roguelike Dungeon Bundle / goblin_1.png',
  brute:               'Roguelike Dungeon Bundle / skeleton_0.png',
  bone_archer:         'Roguelike Dungeon Bundle / skeleton_1.png',
  scout:               'Roguelike Dungeon Bundle / goblin_0.png (recolored)',
  shaman:              'Roguelike Dungeon Bundle / slime_0.png',
  orc_warrior:         'Tiny RPG Character Asset Pack / orc_idle.png',
  fire_worm:           'test/Fire Worm / Idle.png',
  blob:                'Roguelike Dungeon Bundle / slime_1.png',
  tech_drone:          'Tech Dungeon / enemies x1.png frame 0',
  tech_sentinel:       'Tech Dungeon / enemies x1.png frame 2',
  tech_crawler:        'Tech Dungeon / enemies x1.png frame 4',
  tech_stalker:        'Tech Dungeon / enemies x1.png frame 6',
  tech_turret:         'Tech Dungeon / enemies x1.png frame 8',
  elite_champion:      'Roguelike Dungeon Bundle / skeleton_0.png (scaled up)',
  elite_tech_commander:'Tech Dungeon / enemies x1.png frame 2 (scaled up)',
  boss_warlord:        'Roguelike Dungeon Bundle / dungeon_master.png',
  boss_goblin_king:    'Roguelike Dungeon Bundle / goblin_king.png',
  boss_skeleton_king:  'Roguelike Dungeon Bundle / skeleton_king.png',
  boss_slime_king:     'Roguelike Dungeon Bundle / slime_king.png',
  boss_tech_overlord:  'Tech Dungeon / Boss / boss x1.png',
}

function colorSwatch(hex: number): string {
  const css = `#${hex.toString(16).padStart(6, '0')}`
  return `<span class="color-swatch" style="background:${css};border:1px solid #fff;display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:4px;border-radius:2px;"></span><code>${css}</code>`
}

function shapeIcon(shape: string): string {
  const icons: Record<string, string> = {
    capsule: '🧍', box: '📦', sphere: '🔵', octahedron: '💎', cylinder: '🥫',
  }
  return icons[shape] ?? '❓'
}

export class GuideScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext

  activate(ctx: SceneContext): void {
    this.ctx = ctx
    this.root = document.createElement('div')
    this.root.id = 'guide-scene'
    this.root.style.cssText = `
      position:absolute;inset:0;background:#0d0d1a;color:#fff;
      font-family:monospace;overflow-y:auto;padding:24px 32px;
      box-sizing:border-box;z-index:10;
    `

    this.root.innerHTML = `
      <button id="guide-back" style="margin-bottom:20px;padding:8px 18px;background:#222;color:#00ff88;border:1px solid #00ff88;cursor:pointer;font-size:13px;">← Back to Title</button>
      <h1 style="color:#00ff88;font-size:22px;margin:0 0 4px;">EAT MY FIRE — 2D Concept Art Reference</h1>
      <p style="color:#888;font-size:11px;margin:0 0 24px;">
        Original eat-my-fire 2D sprites. Use these as the brief when commissioning custom 3D models.<br>
        Source: <code>C:/Repo/games/eat-my-fire/src/game/assets/</code>
      </p>

      <h2 style="color:#ffaa00;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px;">Heroes</h2>
      ${this.heroSection()}

      <h2 style="color:#ff4444;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px;margin-top:28px;">Bosses — All 5</h2>
      ${this.bossSection()}

      <h2 style="color:#ff9944;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px;margin-top:28px;">Elite Enemies</h2>
      ${this.eliteSection()}

      <h2 style="color:#ccc;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px;margin-top:28px;">Fantasy Standard Enemies</h2>
      ${this.enemySection(FANTASY_ENEMIES)}

      <h2 style="color:#4488ff;font-size:15px;border-bottom:1px solid #333;padding-bottom:6px;margin-top:28px;">Tech / Robot Enemies</h2>
      ${this.enemySection(TECH_ENEMIES)}

      <p style="color:#555;font-size:10px;margin-top:32px;">
        Placeholder 3D shapes are generated by PlaceholderMeshFactory.ts.<br>
        To replace a unit, provide a GLB file and register it in AssetLibrary.ts with the matching asset ID.
      </p>
    `

    this.root.querySelector('#guide-back')?.addEventListener('click', () => {
      ctx.switchTo(new TitleScene())
    })

    ctx.container.appendChild(this.root)
    ctx.ready()
  }

  deactivate(): void {
    this.root.remove()
  }

  private row(cells: string[]): string {
    return `<tr style="border-bottom:1px solid #1a1a2e">${cells.map(
      (c, i) => `<td style="padding:6px 10px;${i === 0 ? 'color:#fff;font-weight:bold' : 'color:#ccc;'}font-size:11px;">${c}</td>`
    ).join('')}</tr>`
  }

  private table(headers: string[], rows: string[]): string {
    return `<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
      <thead><tr>${headers.map((h) => `<th style="text-align:left;padding:6px 10px;color:#888;font-size:10px;text-transform:uppercase;border-bottom:1px solid #333;">${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table>`
  }

  private heroSection(): string {
    const chars = getAllCharacters()
    const rows = chars.map((c) =>
      this.row([
        `${c.legendary ? '⭐ ' : ''}${c.name}`,
        c.class,
        `HP:${c.baseHp} ATK:${c.baseAttack} DEF:${c.baseDefense} MOV:${c.baseMoveRange}`,
        c.unlocked ? '<span style="color:#00ff88">Unlocked</span>' : '<span style="color:#ffaa00">Legendary</span>',
        `<code style="color:#888">${c.assetId}</code>`,
        `<span style="color:#555;font-size:10px;">${HERO_2D_NOTES[c.id] ?? '—'}</span>`,
      ])
    )
    return this.table(['Name', 'Class', 'Stats', 'Status', '3D Asset ID', '2D Reference'], rows)
  }

  private bossSection(): string {
    const rows = BOSS_TEMPLATES.map((b) => {
      const p = b.phases[0]!
      return this.row([
        `👑 ${b.name}`,
        b.theme,
        `HP:${p.hp} ATK:${p.attack} DEF:${p.defense}`,
        shapeIcon(b.placeholder.shape) + ' ' + b.placeholder.shape,
        colorSwatch(b.placeholder.color),
        `scale ×${b.placeholder.scale}`,
        `<span style="color:#555;font-size:10px;">${ENEMY_2D_NOTES[b.id] ?? '—'}</span>`,
      ])
    })
    return this.table(['Name', 'Theme', 'Stats', 'Shape', 'Color', 'Size', '2D Reference'], rows)
  }

  private eliteSection(): string {
    const rows = ELITE_ENEMIES.map((e) =>
      this.row([
        `★ ${e.name}`,
        e.theme,
        `HP:${e.hp} ATK:${e.attack} DEF:${e.defense}`,
        shapeIcon(e.placeholder.shape) + ' ' + e.placeholder.shape,
        colorSwatch(e.placeholder.color),
        `scale ×${e.placeholder.scale}`,
        `<span style="color:#555;font-size:10px;">${ENEMY_2D_NOTES[e.id] ?? '—'}</span>`,
      ])
    )
    return this.table(['Name', 'Theme', 'Stats', 'Shape', 'Color', 'Size', '2D Reference'], rows)
  }

  private enemySection(enemies: typeof FANTASY_ENEMIES): string {
    const rows = enemies.map((e) =>
      this.row([
        e.name,
        e.id,
        `HP:${e.hp} ATK:${e.attack} DEF:${e.defense} MOV:${e.moveRange}`,
        shapeIcon(e.placeholder.shape) + ' ' + e.placeholder.shape,
        colorSwatch(e.placeholder.color),
        `scale ×${e.placeholder.scale}`,
        `<span style="color:#555;font-size:10px;">${ENEMY_2D_NOTES[e.id] ?? '—'}</span>`,
      ])
    )
    return this.table(['Name', 'ID', 'Stats', 'Shape', 'Color', 'Size', '2D Reference'], rows)
  }
}
