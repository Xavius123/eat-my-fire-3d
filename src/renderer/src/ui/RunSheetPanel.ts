import { getCharacter } from '../entities/CharacterData'
import { getAvailablePaths, getPathNameById } from '../data/HeroPathData'
import { getMinorTalentIdForLevel, getMinorTalentDef, HERO_PATH_TALENT_SEQUENCES } from '../data/HeroProgressionData'
import { formatItemRecommendation, getItem } from '../run/ItemData'
import { getMod } from '../run/ModData'
import type { RunState, UnitLoadout } from '../run/RunState'
import {
  computeModRerollBudget,
  formatHeroPerkSummary,
  levelFromXp,
  MAX_HERO_LEVEL,
  xpProgressForDisplay,
} from '../run/HeroPerks'

function esc(s: string): string {
  const d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}

function itemFitRow(
  item: ReturnType<typeof getItem>,
  charId: string,
  pathId: string | undefined
): string {
  if (!item) return ''
  const line = formatItemRecommendation(item, {
    characterName: (id) => getCharacter(id)?.name,
    pathName: (id) => getPathNameById(id),
  })
  if (!line) return ''
  const hasC = item.suggestedCharacterIds?.length
  const hasP = item.suggestedPathIds?.length
  let off = false
  if (hasC && !item.suggestedCharacterIds!.includes(charId)) off = true
  if (!off && hasP && pathId && !item.suggestedPathIds!.includes(pathId)) off = true
  const cls = off ? ' run-sheet-hero-fit--off' : ''
  return `<div class="run-sheet-hero-row run-sheet-hero-fit${cls}"><span>Fit</span><span>${esc(line)}</span></div>`
}

const TALENT_KIND_LABEL: Record<string, string> = {
  stat: 'Stat',
  ability: 'Skill',
  passive: 'Passive',
}

function buildSkillTreeColumn(slot: UnitLoadout, state: RunState): string {
  const c = getCharacter(slot.characterId)
  const name = c?.name ?? slot.characterId
  const xp = state.heroXp[slot.characterId] ?? 0
  const lvl = state.heroLevel[slot.characterId] ?? levelFromXp(xp)
  const xpLine = xpProgressForDisplay(xp)
  const xpStr = xpLine.needed === 0
    ? `Lv.${lvl} MAX`
    : `Lv.${lvl} · ${xpLine.current}/${xpLine.needed} XP`

  const pathId = state.heroPath[slot.characterId]
  const paths = getAvailablePaths(slot.characterId, state.metEcho)
  const pathDef = paths.find((p) => p.id === pathId)
  const pathSeq = pathId ? (HERO_PATH_TALENT_SEQUENCES[slot.characterId]?.[pathId] ?? []) : []

  const levelRows: string[] = []

  for (let L = 1; L <= MAX_HERO_LEVEL; L++) {
    const isUnlocked = lvl >= L
    const isCurrent = lvl === L
    const tier = lvl > L ? 'past' : isCurrent ? 'current' : 'future'
    const parts: string[] = []

    if (L === 1) {
      if (c?.primaryPerk) {
        parts.push(`<div class="skt-line skt-perk"><span class="skt-badge skt-badge--perk">Perk</span><span>${esc(c.primaryPerk.description)}</span></div>`)
      }
    } else if (L === 2) {
      if (pathDef) {
        parts.push(`<div class="skt-line skt-path" style="--path-color:${pathDef.color}">
          <span class="skt-badge skt-badge--path">Path</span>
          <span><strong>${esc(pathDef.name)}</strong> — ${esc(pathDef.passive)}</span>
        </div>`)
      } else {
        const pathChoices = paths.map((p) =>
          `<span class="skt-path-option" style="--path-color:${p.color}">${esc(p.name)}</span>`
        ).join(' / ')
        parts.push(`<div class="skt-line skt-path-unpicked"><span class="skt-badge skt-badge--path">Path</span><span>${pathChoices}</span></div>`)
      }
    } else if (L >= 3 && L <= 9) {
      const idx = L - 3
      const tid = pathSeq[idx] ?? getMinorTalentIdForLevel(slot.characterId, L, pathId)
      const def = tid ? getMinorTalentDef(tid) : undefined
      if (def) {
        const kindLabel = TALENT_KIND_LABEL[def.kind] ?? 'Talent'
        const badgeCls = def.kind === 'ability' ? 'skt-badge--skill'
          : def.kind === 'passive' ? 'skt-badge--passive'
          : 'skt-badge--stat'
        const unlocked = state.heroUnlockedAbilities[slot.characterId]?.includes(def.grantId ?? '') ||
          state.heroTalents[slot.characterId]?.includes(tid)
        const lockIcon = (!isUnlocked && !unlocked) ? ' 🔒' : ''
        parts.push(`<div class="skt-line">
          <span class="skt-badge ${badgeCls}">${kindLabel}</span>
          <span>${esc(def.name)}${lockIcon} <span class="skt-desc">${esc(def.description)}</span></span>
        </div>`)
      }
    } else if (L === 10) {
      if (c?.level10Perk) {
        parts.push(`<div class="skt-line skt-perk"><span class="skt-badge skt-badge--perk">Perk</span><span>${esc(c.level10Perk.description)}</span></div>`)
      }
    }

    const body = parts.length > 0 ? parts.join('') : `<span class="skt-empty">—</span>`
    levelRows.push(`
      <div class="skt-level skt-level--${tier}">
        <div class="skt-level-num">${L}</div>
        <div class="skt-level-body">${body}</div>
      </div>`)
  }

  const weaponNames = c ? c.attacks.filter((a) => !a.abilityType).map((a) => a.name).join(' · ') : ''

  return `
    <div class="skt-hero-col">
      <div class="skt-hero-head">
        <span class="skt-hero-name">${esc(name)}</span>
        <span class="skt-hero-xp">${esc(xpStr)}</span>
      </div>
      <div class="skt-timeline">${levelRows.join('')}</div>
      ${weaponNames ? `<div class="skt-weapons">⚔ ${esc(weaponNames)}</div>` : ''}
    </div>`
}

function buildSkillTreeHTML(state: RunState): string {
  if (state.loadout.length === 0) return '<p class="run-sheet-empty">No loadout.</p>'
  return `<div class="skt-grid">${state.loadout.map((slot) => buildSkillTreeColumn(slot, state)).join('')}</div>`
}

function buildHeroProgressionColumn(slot: UnitLoadout, state: RunState): string {
  const c = getCharacter(slot.characterId)
  const name = c?.name ?? slot.characterId
  const xp = state.heroXp[slot.characterId] ?? 0
  const lvl = state.heroLevel[slot.characterId] ?? levelFromXp(xp)
  const xpLine = xpProgressForDisplay(xp)
  const xpLineStr =
    xpLine.needed === 0
      ? `Level ${lvl} MAX`
      : `Level ${lvl} · ${xpLine.current} / ${xpLine.needed} XP (${xpLine.pct}%)`

  const pathId = state.heroPath[slot.characterId]
  const paths = getAvailablePaths(slot.characterId, state.metEcho)
  const weaponProfiles = c ? c.attacks.filter((a) => !a.abilityType) : []
  const pathSeq = pathId ? (HERO_PATH_TALENT_SEQUENCES[slot.characterId]?.[pathId] ?? []) : []

  const levelRows: string[] = []
  for (let L = 1; L <= MAX_HERO_LEVEL; L++) {
    const tier = lvl > L ? 'past' : lvl === L ? 'current' : 'future'
    const parts: string[] = []

    if (L === 1) {
      if (c?.primaryPerk) {
        parts.push(`<div class="run-sheet-prog-line"><span class="run-sheet-prog-label">Perk</span><span>${esc(c.primaryPerk.name)}</span></div>`)
      }
    } else if (L === 2) {
      parts.push(`<div class="run-sheet-prog-paths">${paths.map((p) => {
        const taken = pathId === p.id
        return `<span class="run-sheet-prog-path${taken ? ' run-sheet-prog-path--taken' : ''}" title="${esc(p.passive)}">${esc(p.name)}</span>`
      }).join('')}</div>`)
    } else if (L >= 3 && L <= 9) {
      const idx = L - 3
      const tid = pathSeq[idx] ?? getMinorTalentIdForLevel(slot.characterId, L, pathId)
      const def = tid ? getMinorTalentDef(tid) : undefined
      if (def) {
        const kindLabel = TALENT_KIND_LABEL[def.kind] ?? 'Talent'
        parts.push(`<div class="run-sheet-prog-line"><span class="run-sheet-prog-label">${kindLabel}</span><span>${esc(def.name)}</span></div>`)
      }
    }

    if (L === 10 && c?.level10Perk) {
      parts.push(`<div class="run-sheet-prog-line"><span class="run-sheet-prog-label">Perk</span><span>${esc(c.level10Perk.name)}</span></div>`)
    }

    const body = parts.length > 0 ? parts.join('') : `<span class="run-sheet-prog-empty">—</span>`
    levelRows.push(`
      <div class="run-sheet-prog-level run-sheet-prog-level--${tier}">
        <span class="run-sheet-prog-level-num">${L}</span>
        <div class="run-sheet-prog-level-body">${body}</div>
      </div>`)
  }

  const wpFoot = weaponProfiles.length > 0
    ? `<div class="run-sheet-prog-foot">${esc(weaponProfiles.map((w) => w.name).join(' · '))}</div>`
    : ''

  return `
    <div class="run-sheet-hero-progress">
      <div class="run-sheet-hero-progress-head">
        <div class="run-sheet-hero-name">${esc(name)}</div>
        <div class="run-sheet-hero-meta">${esc(xpLineStr)}</div>
      </div>
      <div class="run-sheet-prog-timeline">${levelRows.join('')}</div>
      ${weaponProfiles.length > 0 ? `<div class="run-sheet-prog-foot-hint">Weapon profiles</div>${wpFoot}` : ''}
    </div>`
}

function buildProgressionHTML(state: RunState): string {
  if (state.loadout.length === 0) {
    return '<p class="run-sheet-empty">No loadout.</p>'
  }
  return `<div class="run-sheet-progression">${state.loadout.map((slot) => buildHeroProgressionColumn(slot, state)).join('')}</div>`
}

function buildRunSheetHTML(state: RunState, hint?: string): string {
  const budget = computeModRerollBudget(state)
  const rerollsLeft = Math.max(0, budget - state.modRerollsSpentThisRun)

  const invRows =
    state.items.length === 0
      ? '<p class="run-sheet-empty">No inventory items yet. (Consumables and loot can appear here in future runs.)</p>'
      : `<ul class="run-sheet-inv-list">${state.items
          .map((stack) => {
            const def = getItem(stack.itemId)
            const label = def ? `${def.name} ×${stack.quantity}` : `${stack.itemId} ×${stack.quantity}`
            return `<li>${esc(label)}</li>`
          })
          .join('')}</ul>`

  const squadCards = state.loadout
    .map((slot, i) => {
      const c = getCharacter(slot.characterId)
      const name = c?.name ?? slot.characterId
      const xp = state.heroXp[slot.characterId] ?? 0
      const { level, current, needed, pct } = xpProgressForDisplay(xp)
      const xpLine =
        needed === 0
          ? `Level ${level} MAX`
          : `Level ${level} · ${current} / ${needed} XP toward next (${pct}%)`
      const pathId = state.heroPath[slot.characterId]
      const paths = getAvailablePaths(slot.characterId, state.metEcho)
      const pathLabel = pathId
        ? paths.find((p) => p.id === pathId)?.name ?? pathId
        : '—'
      const perks = c ? formatHeroPerkSummary(c, state) : ''
      const wpn = slot.weaponId ? getItem(slot.weaponId)?.name ?? slot.weaponId : '—'
      const arm = slot.armorId ? getItem(slot.armorId)?.name ?? slot.armorId : '—'
      const wFit = itemFitRow(
        slot.weaponId ? getItem(slot.weaponId) : undefined,
        slot.characterId,
        pathId
      )
      const aFit = itemFitRow(
        slot.armorId ? getItem(slot.armorId) : undefined,
        slot.characterId,
        pathId
      )
      const wMods = (state.unitWeaponMods[i] ?? [])
        .map((m) => {
          const d = getMod(m.modId)
          const label = d ? d.name : m.modId
          return m.stacks > 1 ? `${label} ×${m.stacks}` : label
        })
        .join(', ') || '—'
      const aMods = (state.unitArmorMods[i] ?? [])
        .map((m) => {
          const d = getMod(m.modId)
          const label = d ? d.name : m.modId
          return m.stacks > 1 ? `${label} ×${m.stacks}` : label
        })
        .join(', ') || '—'
      const roster = state.partyRoster.find((u) => u.unitId === `player-${i}`)
      const hpLine = roster
        ? `Roster HP: ${roster.hp} / ${roster.maxHp}`
        : ''

      return `
        <div class="run-sheet-hero-card">
          <div class="run-sheet-hero-name">${esc(name)}</div>
          <div class="run-sheet-hero-meta">${esc(xpLine)}</div>
          <div class="run-sheet-hero-row"><span>Path</span><span>${esc(pathLabel)}</span></div>
          <div class="run-sheet-hero-row"><span>Perks</span><span>${esc(perks || '—')}</span></div>
          <div class="run-sheet-hero-row"><span>Weapon</span><span>${esc(wpn)}</span></div>
          ${wFit}
          <div class="run-sheet-hero-row"><span>Armor</span><span>${esc(arm)}</span></div>
          ${aFit}
          <div class="run-sheet-hero-row"><span>Weapon mods</span><span>${esc(wMods)}</span></div>
          <div class="run-sheet-hero-row"><span>Armor mods</span><span>${esc(aMods)}</span></div>
          ${hpLine ? `<div class="run-sheet-hero-row"><span>Between fights</span><span>${esc(hpLine)}</span></div>` : ''}
        </div>`
    })
    .join('')

  const hintBlock = hint
    ? `<p class="run-sheet-hint">${esc(hint)}</p>`
    : ''

  return `
    <div class="run-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="run-sheet-title">
      <div class="run-sheet-header">
        <h2 id="run-sheet-title">Run</h2>
        <button type="button" class="run-sheet-close" aria-label="Close">×</button>
      </div>
      ${hintBlock}
      <div class="run-sheet-tabs" role="tablist" aria-label="Run overview">
        <button type="button" class="run-sheet-tab" role="tab" id="run-sheet-tab-squad" data-run-sheet-tab="squad" aria-selected="true" aria-controls="run-sheet-panel-squad">Squad</button>
        <button type="button" class="run-sheet-tab" role="tab" id="run-sheet-tab-skilltree" data-run-sheet-tab="skilltree" aria-selected="false" aria-controls="run-sheet-panel-skilltree">Skill Tree</button>
        <button type="button" class="run-sheet-tab" role="tab" id="run-sheet-tab-progression" data-run-sheet-tab="progression" aria-selected="false" aria-controls="run-sheet-panel-progression">Progression</button>
      </div>
      <div class="run-sheet-tab-panels">
        <div class="run-sheet-tabpanel" role="tabpanel" id="run-sheet-panel-squad" aria-labelledby="run-sheet-tab-squad">
          <div class="run-sheet-body-row">
            <section class="run-sheet-section run-sheet-col run-sheet-col-resources">
              <h3>Resources</h3>
              <div class="run-sheet-grid">
                <span>Gold</span><span>${state.gold}</span>
                <span>Crystals</span><span>${state.crystals}</span>
                <span>Run bonuses</span><span>+${state.bonusAtk} ATK · +${state.bonusDef} DEF · +${state.bonusMaxHp} HP</span>
                <span>Mod rerolls</span><span>${rerollsLeft} / ${budget} (spent ${state.modRerollsSpentThisRun})</span>
              </div>
            </section>
            <section class="run-sheet-section run-sheet-col run-sheet-col-inventory">
              <h3>Inventory</h3>
              ${invRows}
            </section>
            <section class="run-sheet-section run-sheet-col run-sheet-col-squad">
              <h3>Squad</h3>
              <div class="run-sheet-squad">${squadCards || '<p class="run-sheet-empty">No loadout.</p>'}</div>
            </section>
          </div>
        </div>
        <div class="run-sheet-tabpanel" role="tabpanel" id="run-sheet-panel-skilltree" aria-labelledby="run-sheet-tab-skilltree" hidden>
          ${buildSkillTreeHTML(state)}
        </div>
        <div class="run-sheet-tabpanel" role="tabpanel" id="run-sheet-panel-progression" aria-labelledby="run-sheet-tab-progression" hidden>
          ${buildProgressionHTML(state)}
        </div>
      </div>
      <p class="run-sheet-footer">Close with ×, outside click, or Esc.</p>
    </div>
  `
}

export interface MountRunSheetOptions {
  /** Shown under the title (e.g. combat pause). */
  hint?: string
  /** Called after the overlay is removed (backdrop, X, or programmatic close). */
  onClose?: () => void
}

/**
 * Full-screen overlay with run summary. Click backdrop or .run-sheet-close to dismiss.
 * Caller may also call `close()` (e.g. from Esc) — wire that in MapScene / GameUI.
 */
export function mountRunSheetOverlay(
  container: HTMLElement,
  runState: RunState,
  options?: MountRunSheetOptions
): { close: () => void } {
  const backdrop = document.createElement('div')
  backdrop.className = 'run-sheet-backdrop'
  backdrop.innerHTML = buildRunSheetHTML(runState, options?.hint)

  const close = (): void => {
    backdrop.remove()
    options?.onClose?.()
  }

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close()
  })
  backdrop.querySelector('.run-sheet-close')?.addEventListener('click', close)

  backdrop.querySelector('.run-sheet-panel')?.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  type TabId = 'squad' | 'skilltree' | 'progression'

  const tabs: Record<TabId, HTMLButtonElement | null> = {
    squad:       backdrop.querySelector('[data-run-sheet-tab="squad"]'),
    skilltree:   backdrop.querySelector('[data-run-sheet-tab="skilltree"]'),
    progression: backdrop.querySelector('[data-run-sheet-tab="progression"]'),
  }
  const panels: Record<TabId, HTMLElement | null> = {
    squad:       backdrop.querySelector('#run-sheet-panel-squad'),
    skilltree:   backdrop.querySelector('#run-sheet-panel-skilltree'),
    progression: backdrop.querySelector('#run-sheet-panel-progression'),
  }

  const showTab = (which: TabId): void => {
    for (const id of Object.keys(tabs) as TabId[]) {
      tabs[id]?.setAttribute('aria-selected', String(id === which))
      if (panels[id]) panels[id]!.hidden = id !== which
    }
  }

  for (const id of Object.keys(tabs) as TabId[]) {
    tabs[id]?.addEventListener('click', () => showTab(id))
  }

  container.appendChild(backdrop)

  return { close }
}
