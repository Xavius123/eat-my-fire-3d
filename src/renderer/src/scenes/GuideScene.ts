/**
 * GuideScene — In-game encyclopedia.
 *
 * Five tabs: Heroes · Enemies · Elites & Bosses · Items · Mods
 *
 * Accessible from the title screen or dev toolbar GUIDE button.
 * Pass a `returnScene` to control where the back button goes.
 */

import type { Scene, SceneContext } from './Scene'
import { TitleScene } from './TitleScene'
import { getAllCharacters } from '../entities/CharacterData'
import { FANTASY_ENEMIES, TECH_ENEMIES, ELITE_ENEMIES, BOSS_TEMPLATES } from '../entities/EnemyData'
import { getWeapons, getArmors } from '../run/ItemData'
import { getWeaponMods, getArmorMods } from '../run/ModData'
import type { CharacterDefinition } from '../entities/CharacterData'
import type { ItemDefinition } from '../run/ItemData'
import type { ModDefinition } from '../run/ModData'

type TabId = 'heroes' | 'enemies' | 'elites' | 'items' | 'mods'

const TABS: { id: TabId; label: string; color: string }[] = [
  { id: 'heroes',  label: 'Heroes',         color: '#ffaa00' },
  { id: 'enemies', label: 'Enemies',         color: '#ff6644' },
  { id: 'elites',  label: 'Elites & Bosses', color: '#cc44ff' },
  { id: 'items',   label: 'Items',           color: '#44bbff' },
  { id: 'mods',    label: 'Mods',            color: '#44ff88' },
]

export class GuideScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext
  private activeTab: TabId = 'heroes'

  constructor(private readonly returnScene: Scene = new TitleScene()) {}

  activate(ctx: SceneContext): void {
    this.ctx = ctx
    this.root = document.createElement('div')
    this.root.id = 'guide-scene'
    this.root.style.cssText = [
      'position:absolute', 'inset:0', 'background:#0a0a14', 'color:#ddd',
      'font-family:monospace', 'display:flex', 'flex-direction:column',
      'z-index:10', 'overflow:hidden',
    ].join(';')

    this.root.innerHTML = `
      <div id="guide-header" style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:#111;border-bottom:1px solid #222;flex-shrink:0;">
        <button id="guide-back" style="padding:5px 14px;background:#1a1a1a;color:#aaa;border:1px solid #444;cursor:pointer;font-family:monospace;font-size:12px;">&#8592; Back</button>
        <span style="color:#00ff88;font-size:15px;font-weight:bold;letter-spacing:1px;">GUIDE</span>
        <div id="guide-tabs" style="display:flex;gap:4px;margin-left:8px;"></div>
      </div>
      <div id="guide-body" style="flex:1;overflow-y:auto;padding:20px 24px;"></div>
    `

    this.root.querySelector('#guide-back')!.addEventListener('click', () => {
      ctx.switchTo(this.returnScene)
    })

    const tabsEl = this.root.querySelector('#guide-tabs')!
    for (const tab of TABS) {
      const btn = document.createElement('button')
      btn.dataset.tab = tab.id
      btn.textContent = tab.label
      btn.style.cssText = [
        'padding:4px 12px', 'border:1px solid #333', 'cursor:pointer',
        'font-family:monospace', 'font-size:11px', 'background:#111',
        `color:${tab.color}`, 'border-radius:2px',
      ].join(';')
      btn.addEventListener('click', () => this.showTab(tab.id))
      tabsEl.appendChild(btn)
    }

    ctx.container.appendChild(this.root)
    this.showTab('heroes')
    ctx.ready()
  }

  deactivate(): void {
    this.root.remove()
  }

  private showTab(id: TabId): void {
    this.activeTab = id

    // Highlight active tab
    const tabsEl = this.root.querySelector('#guide-tabs')!
    tabsEl.querySelectorAll('button').forEach((btn) => {
      const isActive = btn.dataset.tab === id
      btn.style.background = isActive ? '#1e1e2e' : '#111'
      btn.style.borderColor = isActive ? '#555' : '#333'
    })

    const body = this.root.querySelector('#guide-body')!
    switch (id) {
      case 'heroes':  body.innerHTML = this.renderHeroes(); break
      case 'enemies': body.innerHTML = this.renderEnemies(); break
      case 'elites':  body.innerHTML = this.renderElites(); break
      case 'items':   body.innerHTML = this.renderItems(); break
      case 'mods':    body.innerHTML = this.renderMods(); break
    }
  }

  // ── Renderers ──────────────────────────────────────────────────────────────

  private renderHeroes(): string {
    const chars = getAllCharacters()
    const standard = chars.filter((c) => !c.legendary)
    const legendary = chars.filter((c) => c.legendary)

    return `
      ${this.section('Standard Heroes', '#ffaa00', standard.map((c) => this.heroCard(c)).join(''))}
      ${this.section('Legendary', '#ff6600', legendary.map((c) => this.heroCard(c)).join(''))}
    `
  }

  private heroCard(c: CharacterDefinition): string {
    const borderColor = c.legendary ? '#ffaa00' : '#333'
    const badge = c.legendary ? `<span style="color:#ffaa00;font-size:10px;">⭐ LEGENDARY</span>` : ''
    const passiveHtml = c.passive
      ? `<div style="color:#aaa;font-size:10px;margin-top:4px;border-top:1px solid #222;padding-top:4px;">
           <span style="color:#777;">PASSIVE</span> ${c.passive.description}
         </div>`
      : ''
    const attacks = c.attacks.map((a) => {
      const kind = a.attackType ?? a.abilityType ?? 'ability'
      return `<span style="display:inline-block;margin:1px 2px;padding:1px 6px;background:#1a1a2a;border:1px solid #333;font-size:10px;color:#aaa;">${a.name} <span style="color:#555">(${kind}, rng ${a.range})</span></span>`
    }).join('')

    return `
      <div style="display:inline-block;vertical-align:top;width:220px;margin:6px;padding:12px;background:#0f0f1a;border:1px solid ${borderColor};border-radius:3px;">
        <div style="font-size:13px;font-weight:bold;color:#eee;">${c.name} ${badge}</div>
        <div style="color:#888;font-size:10px;margin-bottom:6px;">${c.title}</div>
        <div style="display:flex;gap:8px;margin-bottom:6px;">
          ${this.stat('HP', c.baseHp, '#ff6666')}
          ${this.stat('ATK', c.baseAttack, '#ffaa44')}
          ${this.stat('DEF', c.baseDefense, '#44aaff')}
          ${this.stat('MOV', c.baseMoveRange, '#44ff88')}
          ${this.stat('RNG', c.weapon.range, '#cc88ff')}
        </div>
        <div style="color:#888;font-size:10px;margin-bottom:4px;">${c.description}</div>
        <div>${attacks}</div>
        ${passiveHtml}
        <div style="color:#555;font-size:9px;margin-top:4px;">asset: ${c.assetId}</div>
      </div>
    `
  }

  private renderEnemies(): string {
    return `
      ${this.section('Fantasy Enemies', '#ff9944', this.enemyTable(FANTASY_ENEMIES))}
      ${this.section('Tech / Robot Enemies', '#44aaff', this.enemyTable(TECH_ENEMIES))}
    `
  }

  private renderElites(): string {
    return `
      ${this.section('Elite Enemies', '#cc44ff', this.enemyTable(ELITE_ENEMIES))}
      ${this.section('Bosses', '#ff4444', this.bossTable())}
    `
  }

  private enemyTable(enemies: typeof FANTASY_ENEMIES): string {
    const rows = enemies.map((e) => `
      <tr>
        <td style="padding:5px 10px;color:#eee;font-weight:bold;">${e.name}</td>
        <td style="padding:5px 10px;color:#888;font-size:10px;">${e.id}</td>
        ${this.tdStat(e.hp, '#ff6666')}
        ${this.tdStat(e.attack, '#ffaa44')}
        ${this.tdStat(e.defense, '#44aaff')}
        ${this.tdStat(e.moveRange, '#44ff88')}
        <td style="padding:5px 10px;color:#888;font-size:10px;">${e.attackKind}</td>
        <td style="padding:5px 10px;color:#888;font-size:10px;">${e.attackRange}</td>
      </tr>
    `).join('')
    return this.table(['Name', 'ID', 'HP', 'ATK', 'DEF', 'MOV', 'Attack', 'Range'], rows)
  }

  private bossTable(): string {
    const rows = BOSS_TEMPLATES.map((b) => {
      const p = b.phases[0]!
      return `
        <tr>
          <td style="padding:5px 10px;color:#ff4444;font-weight:bold;">👑 ${b.name}</td>
          <td style="padding:5px 10px;color:#888;font-size:10px;">${b.theme}</td>
          ${this.tdStat(p.hp, '#ff6666')}
          ${this.tdStat(p.attack, '#ffaa44')}
          ${this.tdStat(p.defense, '#44aaff')}
          ${this.tdStat(p.moveRange, '#44ff88')}
          <td style="padding:5px 10px;color:#888;font-size:10px;">${b.phases.length} phase${b.phases.length > 1 ? 's' : ''}</td>
        </tr>
      `
    }).join('')
    return this.table(['Name', 'Theme', 'HP', 'ATK', 'DEF', 'MOV', 'Phases'], rows)
  }

  private renderItems(): string {
    const weapons = getWeapons()
    const armors = getArmors()
    return `
      ${this.section('Weapons', '#ffaa44', this.itemTable(weapons))}
      ${this.section('Armor', '#44aaff', this.itemTable(armors))}
    `
  }

  private itemTable(items: ItemDefinition[]): string {
    const rows = items.map((item) => {
      const statsHtml = item.effects.map((e) => {
        if (e.kind === 'stat_bonus' && e.stat && e.amount) {
          const sign = e.amount > 0 ? '+' : ''
          return `<span style="color:#aaa;font-size:10px;">${sign}${e.amount} ${e.stat}</span>`
        }
        return `<span style="color:#888;font-size:10px;">${e.kind}</span>`
      }).join(' ')
      const rarityColor = item.rarity === 'legendary' ? '#ffaa00' : item.rarity === 'rare' ? '#aa44ff' : '#666'
      return `
        <tr>
          <td style="padding:5px 10px;color:#eee;font-weight:bold;">${item.name}</td>
          <td style="padding:5px 10px;font-size:10px;color:${rarityColor};">${item.rarity}</td>
          <td style="padding:5px 10px;color:#aaa;font-size:10px;">${item.attackType ?? '—'}</td>
          <td style="padding:5px 10px;">${statsHtml}</td>
          <td style="padding:5px 10px;color:#888;font-size:10px;">${item.description}</td>
          <td style="padding:5px 10px;color:#666;font-size:10px;">${item.goldCost ?? '—'}g</td>
        </tr>
      `
    }).join('')
    return this.table(['Name', 'Rarity', 'Type', 'Stats', 'Description', 'Cost'], rows)
  }

  private renderMods(): string {
    const weaponMods = getWeaponMods()
    const armorMods = getArmorMods()
    return `
      ${this.section('Weapon Mods', '#ffaa44', this.modTable(weaponMods))}
      ${this.section('Armor Mods', '#44aaff', this.modTable(armorMods))}
    `
  }

  private modTable(mods: ModDefinition[]): string {
    const rows = mods.map((mod) => {
      const rarityColor = mod.rarity === 'legendary' ? '#ffaa00'
        : mod.rarity === 'rare'    ? '#aa44ff'
        : mod.rarity === 'cursed'  ? '#ff4444'
        : '#666'
      return `
        <tr>
          <td style="padding:5px 10px;color:#eee;font-weight:bold;">${mod.name}</td>
          <td style="padding:5px 10px;font-size:10px;color:${rarityColor};">${mod.rarity}</td>
          <td style="padding:5px 10px;color:#aaa;font-size:10px;">${mod.description}</td>
          <td style="padding:5px 10px;color:#666;font-size:10px;">${mod.nonStackable ? 'no stack' : 'stackable'}</td>
        </tr>
      `
    }).join('')
    return this.table(['Name', 'Rarity', 'Description', 'Stack'], rows)
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private section(title: string, color: string, content: string): string {
    return `
      <h2 style="color:${color};font-size:13px;border-bottom:1px solid #222;padding-bottom:5px;margin:0 0 12px;">${title}</h2>
      <div style="margin-bottom:24px;">${content}</div>
    `
  }

  private table(headers: string[], rows: string): string {
    const ths = headers.map((h) =>
      `<th style="text-align:left;padding:5px 10px;color:#555;font-size:10px;text-transform:uppercase;border-bottom:1px solid #222;">${h}</th>`
    ).join('')
    return `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr>${ths}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `
  }

  private stat(label: string, value: number, color: string): string {
    return `<div style="text-align:center;">
      <div style="color:${color};font-size:13px;font-weight:bold;">${value}</div>
      <div style="color:#555;font-size:9px;">${label}</div>
    </div>`
  }

  private tdStat(value: number, color: string): string {
    return `<td style="padding:5px 10px;color:${color};font-weight:bold;font-size:12px;">${value}</td>`
  }
}
