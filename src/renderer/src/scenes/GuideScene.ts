/**
 * GuideScene — In-game encyclopedia / pre-production reference.
 *
 * Tabs: Heroes · Enemies · Elites & Bosses · Items · Mods · NPCs · Events
 *
 * Accessible from title screen or dev toolbar GUIDE button.
 */

import type { Scene, SceneContext } from './Scene'
import { TitleScene } from './TitleScene'
import type { AssetLibrary } from '../assets/AssetLibrary'
import { getAllCharacters } from '../entities/CharacterData'
import { FANTASY_ENEMIES, TECH_ENEMIES, ELITE_ENEMIES, BOSS_TEMPLATES } from '../entities/EnemyData'
import {
  createGuideModelStrip,
  GUIDE_STRIP_SLOT_PX,
  type GuideStripEntry,
} from '../guide/GuideModelStrip'
import { getWeapons, getArmors } from '../run/ItemData'
import { getWeaponMods, getArmorMods } from '../run/ModData'
import type { CharacterDefinition } from '../entities/CharacterData'
import type { ItemDefinition } from '../run/ItemData'
import type { ModDefinition } from '../run/ModData'
import {
  HERO_SPRITES, ENEMY_SPRITES, ELITE_SPRITES, BOSS_SPRITES, NPC_SPRITES, spriteImg,
} from '../guide/GuideSprites'

type TabId = 'heroes' | 'enemies' | 'elites' | 'items' | 'mods' | 'npcs' | 'events'

const TABS: { id: TabId; label: string; color: string }[] = [
  { id: 'heroes',  label: 'Heroes',         color: '#ffaa00' },
  { id: 'enemies', label: 'Enemies',         color: '#ff6644' },
  { id: 'elites',  label: 'Elites & Bosses', color: '#cc44ff' },
  { id: 'items',   label: 'Items',           color: '#44bbff' },
  { id: 'mods',    label: 'Mods',            color: '#44ff88' },
  { id: 'npcs',    label: 'NPCs',            color: '#ffcc44' },
  { id: 'events',  label: 'Events',          color: '#ff88aa' },
]

export class GuideScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext
  private activeTab: TabId = 'heroes'
  private assetLib: AssetLibrary | null = null
  private stripCleanups: (() => void)[] = []

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
      <div id="guide-header" style="display:flex;align-items:center;gap:12px;padding:10px 16px;background:#111;border-bottom:1px solid #222;flex-shrink:0;flex-wrap:wrap;row-gap:6px;">
        <button id="guide-back" style="padding:5px 14px;background:#1a1a1a;color:#aaa;border:1px solid #444;cursor:pointer;font-family:monospace;font-size:12px;">&#8592; Back</button>
        <span style="color:#00ff88;font-size:15px;font-weight:bold;letter-spacing:1px;">GUIDE</span>
        <div id="guide-tabs" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
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

    void ctx.assetsReady.then((lib) => {
      this.assetLib = lib
      this.mount3dStrips()
    })
  }

  deactivate(): void {
    this.clear3dStrips()
    this.root.remove()
  }

  private clear3dStrips(): void {
    for (const d of this.stripCleanups) d()
    this.stripCleanups = []
  }

  /** Mount WebGL preview strips for the active tab (requires shared AssetLibrary). */
  private mount3dStrips(): void {
    const lib = this.assetLib
    if (!lib) return

    const mount = (elementId: string, entries: GuideStripEntry[]) => {
      if (entries.length === 0) return
      const el = this.root.querySelector(`#${elementId}`)
      if (!el) return
      const { canvas, slotUsesGlb, dispose } = createGuideModelStrip(lib, entries)
      const labelRow = document.createElement('div')
      labelRow.style.cssText =
        'display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;max-width:100%;overflow-x:auto;padding-bottom:4px;'
      entries.forEach((e, i) => {
        const glb = slotUsesGlb[i]
        const cell = document.createElement('div')
        cell.style.cssText = `width:${GUIDE_STRIP_SLOT_PX}px;min-width:${GUIDE_STRIP_SLOT_PX}px;text-align:center;font-size:9px;font-family:monospace;`
        cell.innerHTML = `
          <div style="color:#ccc;font-size:10px;">${e.label}</div>
          <div style="color:#555;font-size:8px;word-break:break-all;line-height:1.2;">${e.assetId}</div>
          <div style="color:${glb ? '#5c5' : '#c55'};font-weight:bold;font-size:9px;">${glb ? 'GLB' : 'PLACEHOLDER'}</div>
        `
        labelRow.appendChild(cell)
      })
      el.appendChild(canvas)
      el.appendChild(labelRow)
      this.stripCleanups.push(() => {
        dispose()
        labelRow.remove()
      })
    }

    const chars = getAllCharacters()
    const standard = chars.filter((c) => !c.legendary)
    const legendary = chars.filter((c) => c.legendary)

    switch (this.activeTab) {
      case 'heroes':
        mount(
          'guide-3d-heroes-standard',
          standard.map(
            (c): GuideStripEntry => ({
              label: c.name,
              assetId: c.assetId,
              defId: c.id,
              team: 'player',
            }),
          ),
        )
        mount(
          'guide-3d-heroes-legendary',
          legendary.map(
            (c): GuideStripEntry => ({
              label: c.name,
              assetId: c.assetId,
              defId: c.id,
              team: 'player',
            }),
          ),
        )
        break
      case 'enemies':
        mount(
          'guide-3d-enemies-fantasy',
          FANTASY_ENEMIES.map(
            (e): GuideStripEntry => ({
              label: e.name,
              assetId: e.assetId,
              defId: e.id,
              team: 'enemy',
            }),
          ),
        )
        mount(
          'guide-3d-enemies-tech',
          TECH_ENEMIES.map(
            (e): GuideStripEntry => ({
              label: e.name,
              assetId: e.assetId,
              defId: e.id,
              team: 'enemy',
            }),
          ),
        )
        break
      case 'elites':
        mount(
          'guide-3d-elites',
          ELITE_ENEMIES.map(
            (e): GuideStripEntry => ({
              label: e.name,
              assetId: e.assetId,
              defId: e.id,
              team: 'enemy',
            }),
          ),
        )
        mount(
          'guide-3d-bosses',
          BOSS_TEMPLATES.map(
            (b): GuideStripEntry => ({
              label: b.name,
              assetId: b.assetId,
              defId: b.id,
              team: 'enemy',
            }),
          ),
        )
        break
      default:
        break
    }
  }

  private showTab(id: TabId): void {
    this.activeTab = id
    const tabsEl = this.root.querySelector('#guide-tabs')!
    tabsEl.querySelectorAll('button').forEach((btn) => {
      const isActive = (btn as HTMLElement).dataset.tab === id
      ;(btn as HTMLElement).style.background = isActive ? '#1e1e2e' : '#111'
      ;(btn as HTMLElement).style.borderColor = isActive ? '#555' : '#333'
    })

    this.clear3dStrips()
    const body = this.root.querySelector('#guide-body')!
    switch (id) {
      case 'heroes':  body.innerHTML = this.renderHeroes(); break
      case 'enemies': body.innerHTML = this.renderEnemies(); break
      case 'elites':  body.innerHTML = this.renderElites(); break
      case 'items':   body.innerHTML = this.renderItems(); break
      case 'mods':    body.innerHTML = this.renderMods(); break
      case 'npcs':    body.innerHTML = this.renderNpcs(); break
      case 'events':  body.innerHTML = this.renderEvents(); break
    }
    this.mount3dStrips()
  }

  // ── Tab renderers ──────────────────────────────────────────────────────────

  private renderHeroes(): string {
    const chars = getAllCharacters()
    const standard = chars.filter((c) => !c.legendary)
    const legendary = chars.filter((c) => c.legendary)
    return `
      ${this.section(
        'Standard Heroes',
        '#ffaa00',
        `<p style="color:#666;font-size:10px;margin:0 0 8px;">3D preview — rotate slowly; GLB vs PLACEHOLDER from AssetLibrary.</p>
         <div id="guide-3d-heroes-standard" style="margin-bottom:16px;"></div>
         ${standard.map((c) => this.heroCard(c)).join('')}`,
      )}
      ${this.section(
        'Legendary',
        '#ff6600',
        `<div id="guide-3d-heroes-legendary" style="margin-bottom:16px;"></div>
         ${legendary.map((c) => this.heroCard(c)).join('')}`,
      )}
    `
  }

  private heroCard(c: CharacterDefinition): string {
    const borderColor = c.legendary ? '#ffaa00' : '#333'
    const badge = c.legendary ? `<span style="color:#ffaa00;font-size:10px;"> ⭐ LEGENDARY</span>` : ''
    const passiveHtml = c.passive
      ? `<div style="color:#aaa;font-size:10px;margin-top:4px;border-top:1px solid #222;padding-top:4px;">
           <span style="color:#777;">PASSIVE</span> ${c.passive.description}
         </div>`
      : ''
    const attacks = c.attacks.map((a) => {
      const kind = a.attackType ?? a.abilityType ?? 'ability'
      return `<span style="display:inline-block;margin:1px 2px;padding:1px 6px;background:#1a1a2a;border:1px solid #333;font-size:10px;color:#aaa;">${a.name} <span style="color:#555">${kind} r${a.range}</span></span>`
    }).join('')
    const sprite = HERO_SPRITES[c.id]
    const spriteEl = sprite ? spriteImg(sprite, 56) : `<div style="width:56px;height:56px;background:#1a1a2a;border:1px dashed #333;"></div>`

    return `
      <div style="display:inline-flex;flex-direction:column;vertical-align:top;width:230px;margin:6px;padding:10px;background:#0f0f1a;border:1px solid ${borderColor};border-radius:3px;gap:6px;">
        <div style="display:flex;gap:10px;align-items:center;">
          ${spriteEl}
          <div>
            <div style="font-size:13px;font-weight:bold;color:#eee;">${c.name}${badge}</div>
            <div style="color:#888;font-size:10px;">${c.title}</div>
            <div style="display:flex;gap:6px;margin-top:4px;">
              ${this.stat('HP', c.baseHp, '#ff6666')}
              ${this.stat('ATK', c.baseAttack, '#ffaa44')}
              ${this.stat('DEF', c.baseDefense, '#44aaff')}
              ${this.stat('MOV', c.baseMoveRange, '#44ff88')}
              ${this.stat('RNG', c.weapon.range, '#cc88ff')}
            </div>
          </div>
        </div>
        <div style="color:#888;font-size:10px;">${c.description}</div>
        <div>${attacks}</div>
        ${passiveHtml}
      </div>
    `
  }

  private renderEnemies(): string {
    return `
      ${this.section(
        'Fantasy Enemies',
        '#ff9944',
        `<div id="guide-3d-enemies-fantasy" style="margin-bottom:16px;"></div>
         ${this.enemyTable(FANTASY_ENEMIES)}`,
      )}
      ${this.section(
        'Tech / Robot Enemies',
        '#44aaff',
        `<div id="guide-3d-enemies-tech" style="margin-bottom:16px;"></div>
         ${this.enemyTable(TECH_ENEMIES)}`,
      )}
    `
  }

  private renderElites(): string {
    return `
      ${this.section(
        'Elite Enemies',
        '#cc44ff',
        `<div id="guide-3d-elites" style="margin-bottom:16px;"></div>
         ${this.enemyTable(ELITE_ENEMIES, ELITE_SPRITES)}`,
      )}
      ${this.section(
        'Bosses',
        '#ff4444',
        `<div id="guide-3d-bosses" style="margin-bottom:16px;"></div>
         ${this.bossTable()}`,
      )}
    `
  }

  private enemyTable(
    enemies: typeof FANTASY_ENEMIES,
    spriteMap: typeof ENEMY_SPRITES = ENEMY_SPRITES,
  ): string {
    const rows = enemies.map((e) => {
      const sprite = spriteMap[e.id] ?? ENEMY_SPRITES[e.id]
      const spriteEl = sprite ? spriteImg(sprite, 40) : `<div style="width:40px;height:40px;background:#1a1a2a;border:1px dashed #333;display:inline-block;"></div>`
      return `
        <tr>
          <td style="padding:4px 8px;">${spriteEl}</td>
          <td style="padding:4px 8px;color:#eee;font-weight:bold;font-size:12px;">${e.name}</td>
          <td style="padding:4px 8px;color:#666;font-size:10px;">${e.id}</td>
          <td style="padding:4px 8px;color:#8a8;font-size:9px;max-width:160px;word-break:break-all;">${e.assetId}</td>
          ${this.tdStat(e.hp, '#ff6666')}
          ${this.tdStat(e.attack, '#ffaa44')}
          ${this.tdStat(e.defense, '#44aaff')}
          ${this.tdStat(e.moveRange, '#44ff88')}
          <td style="padding:4px 8px;color:#888;font-size:10px;">${e.attackKind}</td>
          <td style="padding:4px 8px;color:#888;font-size:10px;">${e.attackRange}</td>
        </tr>
      `
    }).join('')
    return this.table(['', 'Name', 'ID', 'Asset ID', 'HP', 'ATK', 'DEF', 'MOV', 'Attack', 'Rng'], rows)
  }

  private bossTable(): string {
    const rows = BOSS_TEMPLATES.map((b) => {
      const p = b.phases[0]!
      const sprite = BOSS_SPRITES[b.id]
      const spriteEl = sprite ? spriteImg(sprite, 40) : `<div style="width:40px;height:40px;background:#1a1a2a;border:1px dashed #333;display:inline-block;"></div>`
      return `
        <tr>
          <td style="padding:4px 8px;">${spriteEl}</td>
          <td style="padding:4px 8px;color:#ff4444;font-weight:bold;font-size:12px;">👑 ${b.name}</td>
          <td style="padding:4px 8px;color:#888;font-size:10px;">${b.theme}</td>
          <td style="padding:4px 8px;color:#8a8;font-size:9px;max-width:160px;word-break:break-all;">${b.assetId}</td>
          ${this.tdStat(p.hp, '#ff6666')}
          ${this.tdStat(p.attack, '#ffaa44')}
          ${this.tdStat(p.defense, '#44aaff')}
          ${this.tdStat(p.moveRange, '#44ff88')}
          <td style="padding:4px 8px;color:#888;font-size:10px;">${b.phases.length} phase${b.phases.length > 1 ? 's' : ''}</td>
        </tr>
      `
    }).join('')
    return this.table(['', 'Name', 'Theme', 'Asset ID', 'HP', 'ATK', 'DEF', 'MOV', 'Phases'], rows)
  }

  private renderItems(): string {
    return `
      ${this.section('Weapons', '#ffaa44', this.itemTable(getWeapons()))}
      ${this.section('Armor', '#44aaff', this.itemTable(getArmors()))}
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
          <td style="padding:4px 8px;color:#eee;font-weight:bold;font-size:12px;">${item.name}</td>
          <td style="padding:4px 8px;font-size:10px;color:${rarityColor};">${item.rarity}</td>
          <td style="padding:4px 8px;color:#aaa;font-size:10px;">${item.attackType ?? '—'}</td>
          <td style="padding:4px 8px;">${statsHtml}</td>
          <td style="padding:4px 8px;color:#888;font-size:10px;">${item.description}</td>
          <td style="padding:4px 8px;color:#666;font-size:10px;">${item.goldCost ?? '—'}g</td>
        </tr>
      `
    }).join('')
    return this.table(['Name', 'Rarity', 'Type', 'Stats', 'Description', 'Cost'], rows)
  }

  private renderMods(): string {
    return `
      ${this.section('Weapon Mods', '#ffaa44', this.modTable(getWeaponMods()))}
      ${this.section('Armor Mods', '#44aaff', this.modTable(getArmorMods()))}
    `
  }

  private modTable(mods: ModDefinition[]): string {
    const rows = mods.map((mod) => {
      const rarityColor = mod.rarity === 'legendary' ? '#ffaa00'
        : mod.rarity === 'rare'   ? '#aa44ff'
        : mod.rarity === 'cursed' ? '#ff4444' : '#666'
      return `
        <tr>
          <td style="padding:4px 8px;color:#eee;font-weight:bold;font-size:12px;">${mod.name}</td>
          <td style="padding:4px 8px;font-size:10px;color:${rarityColor};">${mod.rarity}</td>
          <td style="padding:4px 8px;color:#aaa;font-size:10px;">${mod.slotType}</td>
          <td style="padding:4px 8px;color:#888;font-size:10px;">${mod.description}</td>
          <td style="padding:4px 8px;color:#666;font-size:10px;">${mod.nonStackable ? 'no stack' : 'stackable'}</td>
        </tr>
      `
    }).join('')
    return this.table(['Name', 'Rarity', 'Slot', 'Description', 'Stack'], rows)
  }

  private renderNpcs(): string {
    const npcs = [
      { id: 'merchant',      name: 'Merchant',      role: 'Shop',    description: 'Sells healing and upgrades.' },
      { id: 'healer',        name: 'Healer',         role: 'Rest',    description: 'Restores HP or grants buffs.' },
      { id: 'blacksmith',    name: 'Blacksmith',     role: 'Upgrade', description: 'Improves weapons or armor.' },
      { id: 'mystic',        name: 'Mystic',         role: 'Event',   description: 'Offers risky choices and rewards.' },
      { id: 'guide',         name: 'Guide',          role: 'Info',    description: 'Shares lore and hints.' },
      { id: 'stranger',      name: 'Stranger',       role: 'Event',   description: 'Unknown intentions.' },
      { id: 'robot_scout',   name: 'Robot Scout',    role: 'Wanted',  description: 'Wanted alien. Help or kill for bounty.' },
      { id: 'robot_merchant',name: 'Robot Merchant', role: 'Wanted',  description: 'Wanted alien. Help or kill for bounty.' },
    ]

    const cards = npcs.map((npc) => {
      const sprite = NPC_SPRITES[npc.id]
      const spriteEl = sprite ? spriteImg(sprite, 56) : `<div style="width:56px;height:56px;background:#1a1a2a;border:1px dashed #333;"></div>`
      const roleColor = npc.role === 'Wanted' ? '#ff4444' : npc.role === 'Event' ? '#cc88ff' : '#44ffaa'
      return `
        <div style="display:inline-flex;align-items:center;gap:10px;vertical-align:top;width:260px;margin:6px;padding:10px;background:#0f0f1a;border:1px solid #2a2a3a;border-radius:3px;">
          ${spriteEl}
          <div>
            <div style="font-size:13px;font-weight:bold;color:#eee;">${npc.name}</div>
            <div style="font-size:10px;color:${roleColor};margin-bottom:4px;">${npc.role}</div>
            <div style="font-size:10px;color:#888;">${npc.description}</div>
          </div>
        </div>
      `
    }).join('')

    return this.section('NPCs', '#ffcc44', cards)
  }

  private renderEvents(): string {
    const gifts = [
      { id: 'medic',          text: 'A medic tends to your wounds.',                    effect: 'Heal 6 HP to all' },
      { id: 'respite',        text: 'A quiet moment of rest.',                           effect: 'Heal 8 HP to lowest' },
      { id: 'windfall',       text: 'A surge of energy fills your squad.',              effect: '+2 MOV next combat' },
      { id: 'boon',           text: 'Fortune smiles upon you.',                          effect: '+1 reroll' },
      { id: 'lucky_find',     text: 'You find a forgotten cache.',                       effect: 'Gain 1 random mod' },
      { id: 'shrine',         text: 'A benevolent shrine grants protection.',            effect: 'Temporary shield' },
      { id: 'chucos_house',   text: "Chuco's House. Roasted meat and rest.",             effect: 'Heal all to full' },
      { id: 'meet_ned',       text: 'A figure in iron armor. "Ned. I could use company."', effect: 'Recruit Ned (legendary)' },
      { id: 'ned_wandering',  text: 'Ned strides from the mist.',                       effect: 'Recruit Ned to camp' },
    ]

    const branches = [
      { id: 'loot_risk',        text: 'A cache lies unguarded.',           options: ['Loot (+1 mod, +1 enemy)', 'Leave'] },
      { id: 'heal_reroll',      text: 'Healer offers aid for luck.',        options: ['Rest (heal 8 all, -1 reroll)', 'Press on'] },
      { id: 'sacrifice_hp',     text: 'A dark altar promises power.',       options: ['Accept (-4 max HP, +2 ATK)', 'Refuse'] },
      { id: 'shortcut',         text: 'A dangerous shortcut.',              options: ['Take it (next = Elite)', 'Stay on course'] },
      { id: 'scout',            text: 'Scout ahead for advantages.',        options: ['Send scout (3 dmg, +1 charge)', 'Stay together'] },
      { id: 'warp_portal',      text: 'A shimmering portal tears reality.', options: ['Step through (skip 1 layer)', 'Back away'] },
      { id: 'robot_encounter',  text: 'Wanted aliens. Kill or help?',       options: ['Help (heal 6, +5g)', 'Collect bounty (25g + mod)'] },
    ]

    const blindBets = [
      { id: 'unknown_chest',    text: 'A locked chest.',         riskLabel: 'Open it',  outcomes: ['50% Heal 10 all', '50% -1 ATK (random unit)'] },
      { id: 'strange_fountain', text: 'Water glows faintly.',    riskLabel: 'Drink',    outcomes: ['40% +5 max HP (random)', '30% -1 MOV (random)', '30% Nothing'] },
      { id: 'shrine',           text: 'Ancient shrine.',         riskLabel: 'Pray',     outcomes: ['40% +1 random mod', '35% -1 reroll', '25% Nothing'] },
    ]

    const curses = [
      { id: 'cursed_zone', text: 'You stumble into a cursed zone.', effect: '-2 max HP (random unit)' },
      { id: 'hex',         text: 'A hex saps your strength.',       effect: '-1 ATK (random unit)' },
      { id: 'fatigue',     text: 'The march wears on you.',          effect: '-1 MOV (random unit)' },
    ]

    const giftRows = gifts.map((g) => `
      <tr>
        <td style="padding:4px 8px;color:#44ffaa;font-size:10px;">🎁</td>
        <td style="padding:4px 8px;color:#ddd;font-size:11px;">${g.text}</td>
        <td style="padding:4px 8px;color:#44ffaa;font-size:10px;">${g.effect}</td>
      </tr>
    `).join('')

    const branchRows = branches.map((b) => `
      <tr>
        <td style="padding:4px 8px;color:#ffcc44;font-size:10px;">🔀</td>
        <td style="padding:4px 8px;color:#ddd;font-size:11px;">${b.text}</td>
        <td style="padding:4px 8px;color:#aaa;font-size:10px;">${b.options.join(' / ')}</td>
      </tr>
    `).join('')

    const blindRows = blindBets.map((b) => `
      <tr>
        <td style="padding:4px 8px;color:#cc88ff;font-size:10px;">❓</td>
        <td style="padding:4px 8px;color:#ddd;font-size:11px;">${b.text}</td>
        <td style="padding:4px 8px;color:#888;font-size:10px;">[${b.riskLabel}] ${b.outcomes.join(' · ')}</td>
      </tr>
    `).join('')

    const curseRows = curses.map((c) => `
      <tr>
        <td style="padding:4px 8px;color:#ff4444;font-size:10px;">💀</td>
        <td style="padding:4px 8px;color:#ddd;font-size:11px;">${c.text}</td>
        <td style="padding:4px 8px;color:#ff6666;font-size:10px;">${c.effect}</td>
      </tr>
    `).join('')

    const altarRows = `
      <tr>
        <td style="padding:4px 8px;color:#ff8800;font-size:10px;">🔥</td>
        <td style="padding:4px 8px;color:#ddd;font-size:11px;">An altar demands blood. Each offering grants power—but the cost rises.</td>
        <td style="padding:4px 8px;color:#aaa;font-size:10px;">Tiers: 5hp→+1ATK · 12hp→+1ATK · 20hp→+1ATK · 30hp→+1ATK · 45hp→+1ATK</td>
      </tr>
    `

    const allRows = giftRows + branchRows + blindRows + altarRows + curseRows
    const legend = `
      <div style="display:flex;gap:16px;margin-bottom:12px;font-size:10px;color:#888;">
        <span><span style="color:#44ffaa">🎁</span> Gift — always positive</span>
        <span><span style="color:#ffcc44">🔀</span> Branch — player choice</span>
        <span><span style="color:#cc88ff">❓</span> Blind Bet — random outcome</span>
        <span><span style="color:#ff8800">🔥</span> Temptation — escalating trade</span>
        <span><span style="color:#ff4444">💀</span> Curse — negative</span>
      </div>
    `
    return this.section('Map Events', '#ff88aa', legend + this.table(['', 'Description', 'Effect / Options'], allRows))
  }

  // ── Shared helpers ─────────────────────────────────────────────────────────

  private section(title: string, color: string, content: string): string {
    return `
      <h2 style="color:${color};font-size:13px;border-bottom:1px solid #222;padding-bottom:5px;margin:0 0 12px;">${title}</h2>
      <div style="margin-bottom:28px;">${content}</div>
    `
  }

  private table(headers: string[], rows: string): string {
    const ths = headers.map((h) =>
      `<th style="text-align:left;padding:4px 8px;color:#555;font-size:10px;text-transform:uppercase;border-bottom:1px solid #222;">${h}</th>`
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
      <div style="color:${color};font-size:12px;font-weight:bold;">${value}</div>
      <div style="color:#555;font-size:9px;">${label}</div>
    </div>`
  }

  private tdStat(value: number, color: string): string {
    return `<td style="padding:4px 8px;color:${color};font-weight:bold;font-size:12px;">${value}</td>`
  }
}
