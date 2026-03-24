import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { MapScene } from './MapScene'
import { TitleScene } from './TitleScene'
import type { Scene, SceneContext } from './Scene'
import { createRunState, type UnitLoadout } from '../run/RunState'
import { CAMPAIGNS, getCampaign, type CampaignId } from '../run/CampaignData'
import { getWeapons, getArmors, getItem, formatItemRecommendation, type ItemDefinition } from '../run/ItemData'
import { getPathNameById } from '../data/HeroPathData'
import { ATTACK_TYPES, type AttackKind } from '../entities/UnitData'
import {
  getCharacter,
  getUnlockedCharacters,
  type CharacterDefinition,
} from '../entities/CharacterData'
import type { AssetLibrary } from '../assets/AssetLibrary'

const UNIT_COUNT = 4

function escHtml(s: string): string {
  const d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}

/**
 * Each loadout preview uses its own WebGLRenderer (separate gl context). Textures
 * uploaded for one context are not valid in another — clone maps so each preview
 * uploads its own GPU textures (fixes flat white PBR models).
 */
function cloneTextureMapsForPreviewContext(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const mat of mats) {
      if (!('map' in mat)) continue
      const mapKeys = [
        'map',
        'normalMap',
        'roughnessMap',
        'metalnessMap',
        'aoMap',
        'emissiveMap',
        'lightMap',
        'clearcoatNormalMap'
      ] as const
      for (const key of mapKeys) {
        if (!(key in mat)) continue
        const tex = (mat as unknown as Record<string, unknown>)[key]
        if (tex instanceof THREE.Texture) {
          ;(mat as unknown as Record<string, THREE.Texture>)[key] = tex.clone()
        }
      }
      mat.needsUpdate = true
    }
  })
}

export class LoadoutScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext

  private characters: CharacterDefinition[] = []
  private weapons: ItemDefinition[] = []
  private armors: ItemDefinition[] = []

  private selected: UnitLoadout[] = []
  private selectedCampaignId: CampaignId = 'the-run'

  // 3D character preview state
  private previewRenderers: THREE.WebGLRenderer[] = []
  private previewScenes: THREE.Scene[] = []
  private previewCameras: THREE.PerspectiveCamera[] = []
  private previewModels: (THREE.Object3D | null)[] = []
  private previewAnimId = 0
  private assetLib: AssetLibrary | null = null

  activate(ctx: SceneContext): void {
    this.ctx = ctx
    this.characters = getUnlockedCharacters()
    this.weapons = getWeapons()
    this.armors = getArmors()

    this.selected = Array.from({ length: UNIT_COUNT }, (_, i) => {
      const char = this.characters[i % this.characters.length]
      const canWeapon = !char.equipRestrictions.includes('weapon')
      const canArmor = !char.equipRestrictions.includes('armor')
      return {
        characterId: char.id,
        weaponId: canWeapon ? this.weapons[i % this.weapons.length].id : null,
        armorId: canArmor ? this.armors[i % this.armors.length].id : null,
      }
    })

    this.root = document.createElement('div')
    this.root.id = 'loadout-screen'
    this.buildUI()

    this.root.addEventListener('click', this.onClick)
    ctx.container.appendChild(this.root)

    ctx.assetsReady.then((lib) => {
      this.assetLib = lib
      this.setupPreviews(lib)
    })
    ctx.ready()
  }

  deactivate(): void {
    cancelAnimationFrame(this.previewAnimId)
    this.root.removeEventListener('click', this.onClick)
    for (const scene of this.previewScenes) {
      if (scene.environment) {
        scene.environment.dispose()
        scene.environment = null
      }
    }
    for (const r of this.previewRenderers) r.dispose()
    this.previewRenderers = []
    this.previewScenes = []
    this.previewCameras = []
    this.previewModels = []
    this.root.remove()
  }

  private getCharForSlot(i: number): CharacterDefinition {
    return this.characters.find((c) => c.id === this.selected[i].characterId)!
  }

  private buildUI(): void {
    const unitCards = Array.from({ length: UNIT_COUNT }, (_, i) => {
      const char = this.getCharForSlot(i)
      const sel = this.selected[i]
      const canWeapon = !char.equipRestrictions.includes('weapon')
      const canArmor = !char.equipRestrictions.includes('armor')
      const weaponName = sel.weaponId ? getItem(sel.weaponId)!.name : '—'
      const armorName = sel.armorId ? getItem(sel.armorId)!.name : '—'

      return `
        <div class="loadout-unit" data-unit="${i}">
          <div class="loadout-char-header">
            <span class="loadout-char-name">${char.name}</span>
            <span class="loadout-char-title">${char.title}</span>
          </div>
          <div class="loadout-preview-container">
            <canvas class="loadout-preview-canvas" data-unit="${i}" width="200" height="200"></canvas>
            <button class="loadout-swap-btn" data-unit="${i}" title="Change character">&#x21C4;</button>
          </div>
          <div class="loadout-char-desc">${char.description}</div>
          <div class="loadout-stat-preview" id="loadout-stats-${i}"></div>
          <div class="loadout-slots">
            <div class="loadout-slot ${canWeapon ? '' : 'slot-locked'}" data-unit="${i}" data-slot="weaponId">
              <div class="loadout-slot-label">WEAPON</div>
              <div class="loadout-slot-value" id="slot-weapon-${i}">${canWeapon ? weaponName : 'Cannot Equip'}</div>
              <div class="loadout-slot-rec" id="slot-weapon-rec-${i}" aria-hidden="true"></div>
            </div>
            <div class="loadout-slot ${canArmor ? '' : 'slot-locked'}" data-unit="${i}" data-slot="armorId">
              <div class="loadout-slot-label">ARMOR</div>
              <div class="loadout-slot-value" id="slot-armor-${i}">${canArmor ? armorName : 'Cannot Equip'}</div>
              <div class="loadout-slot-rec" id="slot-armor-rec-${i}" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      `
    }).join('')

    this.root.innerHTML = `
      <h2 class="loadout-title">PREPARE YOUR PARTY</h2>
      <div class="loadout-units">${unitCards}</div>
      <div class="loadout-btn-row">
        <button class="loadout-back-btn" id="loadout-back">BACK</button>
        <button class="loadout-start-btn" id="loadout-start">BEGIN RUN</button>
      </div>
      <div class="loadout-popup hidden" id="loadout-popup">
        <div class="loadout-popup-inner">
          <h3 class="loadout-popup-title" id="popup-title"></h3>
          <div class="loadout-popup-items" id="popup-items"></div>
          <button class="loadout-popup-close" id="popup-close">CANCEL</button>
        </div>
      </div>
    `

    this.updateAllPreviews()
    for (let i = 0; i < UNIT_COUNT; i++) this.updateSlotRecommendations(i)
  }

  // ── 3D character preview ──

  private setupPreviews(lib: AssetLibrary): void {
    const canvases = this.root.querySelectorAll<HTMLCanvasElement>('.loadout-preview-canvas')

    canvases.forEach((canvas, i) => {
      const scene = new THREE.Scene()

      const ambient = new THREE.AmbientLight(0xffffff, 0.8)
      scene.add(ambient)
      const key = new THREE.DirectionalLight(0xfff3dd, 1.2)
      key.position.set(3, 6, 4)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0xc7dbff, 0.4)
      fill.position.set(-3, 4, -2)
      scene.add(fill)

      const camera = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 50)
      camera.position.set(0, 1.2, 3.5)
      camera.lookAt(0, 0.8, 0)

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setSize(canvas.width, canvas.height)
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setClearColor(0x000000, 0)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15

      const pmremGenerator = new THREE.PMREMGenerator(renderer)
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture
      pmremGenerator.dispose()

      const char = this.getCharForSlot(i)
      const model = lib.instantiate(char.assetId)
      if (model) {
        cloneTextureMapsForPreviewContext(model)
        scene.add(model)
      }

      this.previewRenderers.push(renderer)
      this.previewScenes.push(scene)
      this.previewCameras.push(camera)
      this.previewModels.push(model)
    })

    const animate = (): void => {
      this.previewAnimId = requestAnimationFrame(animate)
      for (let i = 0; i < this.previewRenderers.length; i++) {
        const model = this.previewModels[i]
        if (model) model.rotation.y += 0.008
        this.previewRenderers[i].render(this.previewScenes[i], this.previewCameras[i])
      }
    }
    animate()
  }

  private swapPreviewModel(slotIndex: number, assetId: string): void {
    if (!this.assetLib || slotIndex >= this.previewScenes.length) return
    const scene = this.previewScenes[slotIndex]
    const oldModel = this.previewModels[slotIndex]
    if (oldModel) scene.remove(oldModel)

    const newModel = this.assetLib.instantiate(assetId)
    if (newModel) {
      cloneTextureMapsForPreviewContext(newModel)
      scene.add(newModel)
    }
    this.previewModels[slotIndex] = newModel
  }

  // ── Stat previews ──

  private updateAllPreviews(): void {
    for (let i = 0; i < UNIT_COUNT; i++) this.updateStatPreview(i)
  }

  private updateSlotRecommendations(unitIdx: number): void {
    const sel = this.selected[unitIdx]
    const charId = sel.characterId
    for (const slot of ['weaponId', 'armorId'] as const) {
      const el = this.root.querySelector(`#slot-${slot === 'weaponId' ? 'weapon' : 'armor'}-rec-${unitIdx}`)
      if (!el) continue
      const id = sel[slot]
      if (!id) {
        el.textContent = ''
        el.className = 'loadout-slot-rec'
        continue
      }
      const item = getItem(id)
      if (!item) continue
      const line = formatItemRecommendation(item, {
        characterName: (cid) => getCharacter(cid)?.name,
        pathName: (pid) => getPathNameById(pid),
      })
      if (!line) {
        el.textContent = ''
        el.className = 'loadout-slot-rec'
        continue
      }
      const off =
        !!item.suggestedCharacterIds?.length &&
        !item.suggestedCharacterIds.includes(charId)
      el.textContent = line
      el.className = off ? 'loadout-slot-rec loadout-slot-rec--off' : 'loadout-slot-rec'
    }
  }

  private updateStatPreview(unitIndex: number): void {
    const el = this.root.querySelector(`#loadout-stats-${unitIndex}`)
    if (!el) return

    const sel = this.selected[unitIndex]
    const char = this.getCharForSlot(unitIndex)
    const weapon = sel.weaponId ? getItem(sel.weaponId) : undefined
    const armor = sel.armorId ? getItem(sel.armorId) : undefined
    const atkType = weapon?.attackType ? ATTACK_TYPES[weapon.attackType] : ATTACK_TYPES.basic

    // Start with character base stats
    let attack = char.baseAttack
    let defense = char.baseDefense
    let maxHp = char.baseHp
    let moveRange = char.baseMoveRange

    // Add equipment bonuses
    for (const item of [weapon, armor]) {
      if (!item) continue
      for (const e of item.effects) {
        if (e.kind === 'stat_bonus' && e.stat && e.amount) {
          if (e.stat === 'attack') attack += e.amount
          if (e.stat === 'defense') defense += e.amount
          if (e.stat === 'maxHp') maxHp += e.amount
          if (e.stat === 'moveRange') moveRange += e.amount
        }
      }
    }

    const perkBlock =
      char.primaryPerk != null
        ? `<div class="loadout-perk-block">
          <span class="loadout-perk-line"><span class="loadout-perk-label">Party perk</span>${escHtml(char.primaryPerk.name)} — ${escHtml(char.primaryPerk.description)}</span>
          ${
            char.level10Perk
              ? `<span class="loadout-perk-line"><span class="loadout-perk-label">Lv 10 perk</span>${escHtml(char.level10Perk.name)} — ${escHtml(char.level10Perk.description)}</span>`
              : ''
          }
        </div>`
        : ''

    el.innerHTML = `
      <div class="stat-row"><span class="stat-label">HP</span><span class="stat-value stat-hp">${maxHp}</span></div>
      <div class="stat-row"><span class="stat-label">ATK</span><span class="stat-value stat-atk">${attack}</span></div>
      <div class="stat-row"><span class="stat-label">DEF</span><span class="stat-value stat-def">${defense}</span></div>
      <div class="stat-row"><span class="stat-label">MOV</span><span class="stat-value stat-move">${moveRange}</span></div>
      <div class="stat-row"><span class="stat-label">RNG</span><span class="stat-value stat-range">${atkType.range}</span></div>
      ${perkBlock}
    `
  }

  // ── Popup ──

  private activePopupUnit = 0
  private activePopupSlot: 'characterId' | 'weaponId' | 'armorId' = 'weaponId'

  private formatItemCard(item: ItemDefinition, isSelected: boolean, unitIdx: number): string {
    const stats: string[] = []
    for (const e of item.effects) {
      if (e.kind === 'stat_bonus' && e.stat && e.amount) {
        const sign = e.amount > 0 ? '+' : ''
        const labels: Record<string, [string, string]> = {
          attack:    ['ATK', 'stat-atk'],
          defense:   ['DEF', 'stat-def'],
          maxHp:     ['HP',  'stat-hp'],
          moveRange: ['MOV', 'stat-move'],
        }
        const [label, cls] = labels[e.stat] ?? [e.stat, '']
        stats.push(`<span class="popup-card-stat ${cls}">${sign}${e.amount} ${label}</span>`)
      }
    }
    if (item.attackType) {
      const atk = ATTACK_TYPES[item.attackType]
      stats.push(`<span class="popup-card-stat stat-range">RNG ${atk.range}</span>`)
    }

    const rarityClass = item.rarity === 'rare' ? 'rarity-rare' : ''
    const attackLabel = item.attackType ? this.attackKindLabel(item.attackType) : ''

    const charId = this.selected[unitIdx].characterId
    const rec = formatItemRecommendation(item, {
      characterName: (cid) => getCharacter(cid)?.name,
      pathName: (pid) => getPathNameById(pid),
    })
    const recOff =
      !!rec &&
      !!item.suggestedCharacterIds?.length &&
      !item.suggestedCharacterIds.includes(charId)
    const recHtml =
      rec &&
      `<div class="popup-card-rec${recOff ? ' popup-card-rec--off' : ''}">${escHtml(rec)}</div>`

    return `
      <button class="popup-card ${isSelected ? 'selected' : ''} ${rarityClass}"
              data-value="${item.id}">
        <span class="popup-card-name">${item.name}</span>
        ${attackLabel ? `<span class="popup-card-type">${attackLabel}</span>` : ''}
        <div class="popup-card-stats">${stats.join('')}</div>
        ${recHtml || ''}
      </button>
    `
  }

  private formatCharCard(char: CharacterDefinition, isSelected: boolean): string {
    const restrictions = char.equipRestrictions.length > 0
      ? `<span class="popup-card-restrict">No ${char.equipRestrictions.join(', ')}</span>`
      : ''

    return `
      <button class="popup-card ${isSelected ? 'selected' : ''}"
              data-value="${char.id}">
        <span class="popup-card-name">${char.name}</span>
        <span class="popup-card-type">${char.title}</span>
        <div class="popup-card-stats">
          <span class="popup-card-stat stat-hp">HP ${char.baseHp}</span>
          <span class="popup-card-stat stat-atk">ATK ${char.baseAttack}</span>
          <span class="popup-card-stat stat-def">DEF ${char.baseDefense}</span>
          <span class="popup-card-stat stat-move">MOV ${char.baseMoveRange}</span>
        </div>
        ${restrictions}
      </button>
    `
  }

  private attackKindLabel(kind: AttackKind): string {
    const labels: Record<AttackKind, string> = {
      basic: 'Melee',
      projectile: 'Ranged',
      lobbed: 'Arc',
      cleave: 'Cleave',
    }
    return labels[kind]
  }

  private openPopup(unitIdx: number, slot: 'characterId' | 'weaponId' | 'armorId'): void {
    this.activePopupUnit = unitIdx
    this.activePopupSlot = slot

    const popup = this.root.querySelector('#loadout-popup')!
    const items = this.root.querySelector('#popup-items')!
    const title = this.root.querySelector('#popup-title')!

    if (slot === 'characterId') {
      title.textContent = 'Choose Character'
      const currentId = this.selected[unitIdx].characterId
      items.innerHTML = this.characters
        .map((c) => this.formatCharCard(c, c.id === currentId))
        .join('')
    } else {
      const list = slot === 'weaponId' ? this.weapons : this.armors
      const currentId = this.selected[unitIdx][slot]
      title.textContent = `Choose ${slot === 'weaponId' ? 'Weapon' : 'Armor'}`
      items.innerHTML = list.map((item) => this.formatItemCard(item, item.id === currentId, unitIdx)).join('')
    }

    popup.classList.remove('hidden')
  }

  private closePopup(): void {
    this.root.querySelector('#loadout-popup')!.classList.add('hidden')
  }

  private selectPopupItem(value: string): void {
    const unitIdx = this.activePopupUnit
    const slot = this.activePopupSlot

    if (slot === 'characterId') {
      const oldCharId = this.selected[unitIdx].characterId
      const newChar = this.characters.find((c) => c.id === value)!

      // Check if the selected character is already in another slot — if so, swap
      const otherIdx = this.selected.findIndex((s, idx) => idx !== unitIdx && s.characterId === value)
      if (otherIdx !== -1) {
        // Give the other slot our current character
        this.selected[otherIdx].characterId = oldCharId
        const swappedChar = this.characters.find((c) => c.id === oldCharId)!
        // Reset equipment on the other slot if the swapped-in character has restrictions
        if (swappedChar.equipRestrictions.includes('weapon')) this.selected[otherIdx].weaponId = null
        if (swappedChar.equipRestrictions.includes('armor')) this.selected[otherIdx].armorId = null
        this.rebuildUnitCard(otherIdx)
        this.swapPreviewModel(otherIdx, swappedChar.assetId)
      }

      // Set the new character on this slot
      this.selected[unitIdx].characterId = value
      if (newChar.equipRestrictions.includes('weapon')) this.selected[unitIdx].weaponId = null
      if (newChar.equipRestrictions.includes('armor')) this.selected[unitIdx].armorId = null
      this.rebuildUnitCard(unitIdx)
      this.swapPreviewModel(unitIdx, newChar.assetId)
    } else {
      this.selected[unitIdx][slot] = value
      const item = getItem(value)!
      const slotElId = slot === 'weaponId' ? `slot-weapon-${unitIdx}` : `slot-armor-${unitIdx}`
      this.root.querySelector(`#${slotElId}`)!.textContent = item.name
      this.updateStatPreview(unitIdx)
      this.updateSlotRecommendations(unitIdx)
    }

    this.closePopup()
  }

  private rebuildUnitCard(unitIdx: number): void {
    const char = this.getCharForSlot(unitIdx)
    const sel = this.selected[unitIdx]
    const canWeapon = !char.equipRestrictions.includes('weapon')
    const canArmor = !char.equipRestrictions.includes('armor')
    const weaponName = sel.weaponId ? getItem(sel.weaponId)!.name : '—'
    const armorName = sel.armorId ? getItem(sel.armorId)!.name : '—'

    const card = this.root.querySelector(`.loadout-unit[data-unit="${unitIdx}"]`)!

    // Preserve the canvas
    const canvas = card.querySelector('.loadout-preview-canvas')!

    const charHeader = card.querySelector('.loadout-char-header')!
    charHeader.innerHTML = `
      <span class="loadout-char-name">${char.name}</span>
      <span class="loadout-char-title">${char.title}</span>
    `

    card.querySelector('.loadout-char-desc')!.textContent = char.description

    const weaponSlot = card.querySelector('.loadout-slot[data-slot="weaponId"]')!
    weaponSlot.classList.toggle('slot-locked', !canWeapon)
    card.querySelector(`#slot-weapon-${unitIdx}`)!.textContent = canWeapon ? weaponName : 'Cannot Equip'

    const armorSlot = card.querySelector('.loadout-slot[data-slot="armorId"]')!
    armorSlot.classList.toggle('slot-locked', !canArmor)
    card.querySelector(`#slot-armor-${unitIdx}`)!.textContent = canArmor ? armorName : 'Cannot Equip'

    this.updateStatPreview(unitIdx)
    this.updateSlotRecommendations(unitIdx)
  }

  private openCampaignSplash(): void {
    const c = getCampaign(this.selectedCampaignId)
    this.root.querySelector('#splash-title')!.textContent = c.name
    this.root.querySelector('#splash-tagline')!.textContent = c.tagline
    this.root.querySelector('#splash-desc')!.textContent = c.description
    this.root.querySelector('#campaign-splash')!.classList.remove('hidden')
  }

  private hideCampaignSplash(): void {
    this.root.querySelector('#campaign-splash')!.classList.add('hidden')
  }

  private startRun(): void {
    const runState = createRunState()
    runState.loadout = [...this.selected]
    runState.runSeed = Date.now()
    runState.campaignId = this.selectedCampaignId
    this.ctx.switchTo(new MapScene(undefined, runState))
  }

  // ── Event handling ──

  private onClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement

    if (target.closest('#loadout-back')) {
      this.ctx.switchTo(new TitleScene())
      return
    }

    if (target.closest('#loadout-start')) {
      this.startRun()
      return
    }

    if (target.closest('#popup-close') || target.id === 'loadout-popup') {
      this.closePopup()
      return
    }

    const popupItem = target.closest<HTMLButtonElement>('.popup-card')
    if (popupItem) {
      this.selectPopupItem(popupItem.dataset.value!)
      return
    }

    // Swap character button
    const swapBtn = target.closest<HTMLElement>('.loadout-swap-btn')
    if (swapBtn) {
      const unitIdx = parseInt(swapBtn.dataset.unit!, 10)
      this.openPopup(unitIdx, 'characterId')
      return
    }

    // Click on equipment slot (weapon, armor)
    const slot = target.closest<HTMLElement>('.loadout-slot')
    if (slot && !slot.classList.contains('slot-locked')) {
      const unitIdx = parseInt(slot.dataset.unit!, 10)
      const slotType = slot.dataset.slot as 'weaponId' | 'armorId'
      this.openPopup(unitIdx, slotType)
      return
    }
  }
}
