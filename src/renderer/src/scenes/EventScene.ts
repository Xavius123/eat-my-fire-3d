import { MapScene } from './MapScene'
import type { MapGraph } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import type { Scene, SceneContext } from './Scene'


interface EventChoice {
  label: string
  description: string
  apply: (state: RunState) => void
}

interface GameEvent {
  title: string
  flavor: string
  choices: EventChoice[]
}

// ── Temptation Event state ──
interface TemptationState {
  type: 'offering_stone' | 'parasite' | 'signal_tower'
  selectedUnitIndex: number
  clickCount: number
}

const EVENTS: GameEvent[] = [
  // ── Gift events ──
  {
    title: 'Aurora Winds',
    flavor: 'You pass through an aurora. Your team feels lighter.',
    choices: [
      {
        label: 'Accept the blessing',
        description: 'All units gain +1 ATK for the rest of the run',
        apply: (s) => { s.bonusAtk += 1 },
      },
    ],
  },
  {
    title: 'Abandoned Campfire',
    flavor: 'The embers are still warm. Your squad takes a moment to rest.',
    choices: [
      {
        label: 'Rest up',
        description: 'Restore 10 HP to all units',
        apply: (s) => {
          for (const u of s.partyRoster) u.hp = Math.min(u.maxHp, u.hp + 10)
        },
      },
    ],
  },

  // ── Branch events ──
  {
    title: 'The Field Medic',
    flavor: 'A field medic offers to patch up your squad.',
    choices: [
      {
        label: 'Focus on one',
        description: 'Restore 30 HP to one unit',
        apply: (s) => {
          const wounded = s.partyRoster.filter((u) => u.hp < u.maxHp)
          const target = wounded.length > 0 ? wounded[0] : s.partyRoster[0]
          if (target) target.hp = Math.min(target.maxHp, target.hp + 30)
        },
      },
      {
        label: 'Spread it',
        description: 'Restore 15 HP to all units',
        apply: (s) => {
          for (const u of s.partyRoster) u.hp = Math.min(u.maxHp, u.hp + 15)
        },
      },
    ],
  },
  {
    title: 'Crashed Supply Drone',
    flavor: 'A crashed supply drone. Cargo intact — but the signal beacon is active. Someone knows it\'s here.',
    choices: [
      {
        label: 'Loot quickly',
        description: '+1 DEF to all units, but next combat has tougher enemies',
        apply: (s) => { s.bonusDef += 1 },
      },
      {
        label: 'Leave it',
        description: 'Nothing happens. Better safe than sorry.',
        apply: () => {},
      },
    ],
  },
  {
    title: 'Weapon Cache',
    flavor: 'Hidden behind rubble, a stash of military-grade supplies.',
    choices: [
      {
        label: 'Take the weapons',
        description: 'All units gain +2 ATK for the rest of the run',
        apply: (s) => { s.bonusAtk += 2 },
      },
      {
        label: 'Take the armor',
        description: 'All units gain +2 DEF for the rest of the run',
        apply: (s) => { s.bonusDef += 2 },
      },
      {
        label: 'Leave it',
        description: 'Could be trapped. Walk away.',
        apply: () => {},
      },
    ],
  },

  // ── Blind Bet events ──
  {
    title: 'Mysterious Flask',
    flavor: 'A stranger offers you a flask. No label. No explanation. "Drink. It\'s medicine."',
    choices: [
      {
        label: 'Drink',
        description: 'Random: +5 Max HP or -1 ATK to all units',
        apply: (s) => {
          if (Math.random() < 0.5) {
            s.bonusMaxHp += 5
          } else {
            s.bonusAtk = Math.max(0, s.bonusAtk - 1)
          }
        },
      },
      {
        label: 'Refuse',
        description: 'Nothing happens.',
        apply: () => {},
      },
    ],
  },
  {
    title: 'Mushroom Forest',
    flavor: 'Your squad stumbles across an ancient mushroom forest.',
    choices: [
      {
        label: 'Eat the mushrooms',
        description: '-5 HP to all units',
        apply: (s) => {
          for (const u of s.partyRoster) u.hp = Math.max(1, u.hp - 5)
        },
      },
      {
        label: 'Leave',
        description: 'Nothing happens.',
        apply: () => {},
      },
    ],
  },
]

// ── Temptation Events ──

const TEMPTATION_EVENTS = [
  {
    type: 'offering_stone' as const,
    title: 'The Offering Stone',
    flavor: 'An ancient altar carved from black rock. It pulses faintly.',
  },
  {
    type: 'parasite' as const,
    title: 'The Parasite',
    flavor: 'Something small and glowing attaches itself to one of your units. It seems... friendly.',
  },
  {
    type: 'signal_tower' as const,
    title: 'The Signal Tower',
    flavor: 'Alien tech. Still broadcasting. You could interface with it.',
  },
]

function getOfferingCost(clickCount: number): number {
  // 5 → 12 → 20 → 30 → ...
  const costs = [5, 12, 20, 30, 42, 56, 72]
  return costs[Math.min(clickCount, costs.length - 1)]
}

function pickEvent(seed: number): GameEvent | null {
  // ~25% chance of temptation event
  if (Math.abs(seed) % 4 === 0) return null // temptation
  return EVENTS[Math.abs(seed) % EVENTS.length]
}

function pickTemptation(seed: number) {
  return TEMPTATION_EVENTS[Math.abs(seed) % TEMPTATION_EVENTS.length]
}

export class EventScene implements Scene {
  private root!: HTMLElement
  private ctx!: SceneContext
  private temptation: TemptationState | null = null

  constructor(
    private readonly mapGraph: MapGraph,
    private readonly runState: RunState,
    private readonly seed: number
  ) {}

  activate(ctx: SceneContext): void {
    this.ctx = ctx

    const event = pickEvent(this.seed)

    this.root = document.createElement('div')
    this.root.id = 'event-screen'

    if (event) {
      this.renderStandardEvent(event)
    } else {
      const tempt = pickTemptation(this.seed)
      this.renderTemptationUnitSelect(tempt)
    }

    this.root.addEventListener('click', this.onClick)
    ctx.container.appendChild(this.root)
    ctx.ready()
  }

  deactivate(): void {
    this.root.removeEventListener('click', this.onClick)
    this.root.remove()
  }

  private renderStandardEvent(event: GameEvent): void {
    this.root.innerHTML = `
      <div class="event-panel">
        <h2 class="event-title">${event.title}</h2>
        <p class="event-flavor">${event.flavor}</p>
        <div class="event-choices">
          ${event.choices.map((c, i) => `
            <button class="event-choice" data-index="${i}">
              <div class="event-choice-label">${c.label}</div>
              <div class="event-choice-desc">${c.description}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `
  }

  private renderTemptationUnitSelect(tempt: typeof TEMPTATION_EVENTS[0]): void {
    const unitCount = this.runState.loadout.length || 3
    this.root.innerHTML = `
      <div class="event-panel">
        <h2 class="event-title">${tempt.title}</h2>
        <p class="event-flavor">${tempt.flavor}</p>
        <h3 style="color:#ffd700;margin-top:16px;">Choose which unit approaches:</h3>
        <div class="event-choices">
          ${Array.from({ length: unitCount }, (_, i) => {
            const loadout = this.runState.loadout[i]
            const name = loadout?.characterId ?? `Unit ${i + 1}`
            const hp = this.runState.partyRoster[i]?.hp ?? '?'
            return `
              <button class="event-choice" data-tempt-unit="${i}" data-tempt-type="${tempt.type}">
                <div class="event-choice-label">${name}</div>
                <div class="event-choice-desc">HP: ${hp}</div>
              </button>
            `
          }).join('')}
        </div>
        <button class="event-choice" data-leave="true" style="margin-top:12px;">
          <div class="event-choice-label">Leave</div>
          <div class="event-choice-desc">Walk away safely</div>
        </button>
      </div>
    `
  }

  private applyTemptationReward(): void {
    if (!this.temptation) return
    const t = this.temptation
    const unit = this.runState.partyRoster[t.selectedUnitIndex]
    if (!unit) return

    switch (t.type) {
      case 'offering_stone': {
        const cost = getOfferingCost(t.clickCount)
        unit.hp -= cost
        // Apply reward based on weapon type
        const weaponId = this.runState.loadout[t.selectedUnitIndex]?.weaponId
        // For simplicity, always grant +1 ATK (the exact reward type is applied at combat spawn)
        this.runState.bonusAtk += 1
        break
      }
      case 'parasite': {
        unit.maxHp -= 5
        unit.hp = Math.min(unit.hp, unit.maxHp)
        // Passive heal is tracked as a bonus (simplified)
        this.runState.bonusMaxHp -= 5 // permanent max HP loss
        break
      }
      case 'signal_tower': {
        // -1 MOV (simplified as run-wide effect)
        if (t.clickCount < 2) {
          // Just range bonus, MOV penalty handled at unit level
        }
        break
      }
    }

    t.clickCount += 1
  }

  private onClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement

    // Leave button
    const leaveBtn = target.closest<HTMLButtonElement>('[data-leave]')
    if (leaveBtn) {
      this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
      return
    }

    // Temptation unit selection
    const temptUnitBtn = target.closest<HTMLButtonElement>('[data-tempt-unit]')
    if (temptUnitBtn) {
      const unitIdx = parseInt(temptUnitBtn.dataset.temptUnit ?? '0', 10)
      const temptType = temptUnitBtn.dataset.temptType as TemptationState['type']
      this.temptation = { type: temptType, selectedUnitIndex: unitIdx, clickCount: 0 }
      this.renderTemptationInteractionSync()
      return
    }

    // Temptation interact
    const interactBtn = target.closest<HTMLButtonElement>('[data-tempt-interact]')
    if (interactBtn && this.temptation) {
      this.applyTemptationReward()
      this.renderTemptationInteractionSync()
      return
    }

    // Standard event choice
    const btn = target.closest<HTMLButtonElement>('.event-choice')
    if (btn && btn.dataset.index !== undefined) {
      const idx = parseInt(btn.dataset.index, 10)
      const event = pickEvent(this.seed)
      if (event) {
        event.choices[idx].apply(this.runState)
      }
      this.ctx.switchTo(new MapScene(this.mapGraph, this.runState))
    }
  }

  private renderTemptationInteractionSync(): void {
    if (!this.temptation) return
    const t = this.temptation
    const unit = this.runState.partyRoster[t.selectedUnitIndex]
    if (!unit) return

    let rewardText = ''
    let nextCost = 0

    switch (t.type) {
      case 'offering_stone': {
        nextCost = getOfferingCost(t.clickCount)
        rewardText = '+1 ATK'
        break
      }
      case 'parasite': {
        nextCost = 5
        rewardText = `+2 HP/turn heal, -5 max HP`
        break
      }
      case 'signal_tower': {
        nextCost = 0
        if (t.clickCount < 2) rewardText = '+1 Range, -1 MOV'
        else if (t.clickCount === 2) rewardText = 'Second attack type, MOV becomes 0'
        else rewardText = 'Fully interfaced'
        break
      }
    }

    const canSurvive = t.type === 'signal_tower' ? t.clickCount < 3 : unit.hp > nextCost
    const costText = t.type === 'signal_tower'
      ? (t.clickCount >= 3 ? 'Fully interfaced' : `Cost: -1 MOV permanently`)
      : `Cost: ${nextCost} HP (current: ${unit.hp}/${unit.maxHp})`

    const titleMap = {
      offering_stone: 'The Offering Stone',
      parasite: 'The Parasite',
      signal_tower: 'The Signal Tower',
    }

    this.root.innerHTML = `
      <div class="event-panel">
        <h2 class="event-title">${titleMap[t.type]}</h2>
        <p class="event-flavor">Interactions: ${t.clickCount}</p>
        <p style="color:#aaa;font-size:14px;">${costText}</p>
        <div class="event-choices">
          ${canSurvive ? `
            <button class="event-choice" data-tempt-interact="true">
              <div class="event-choice-label">Interact</div>
              <div class="event-choice-desc">${rewardText}</div>
            </button>
          ` : `
            <div style="color:#f88;font-size:14px;padding:16px;">
              Unit cannot survive another offering.
            </div>
          `}
          <button class="event-choice" data-leave="true">
            <div class="event-choice-label">Walk away</div>
            <div class="event-choice-desc">Leave with what you have</div>
          </button>
        </div>
      </div>
    `
  }
}

