import { MapScene } from './MapScene'
import type { MapGraph } from '../map/MapGraph'
import type { RunState } from '../run/RunState'
import type { Scene, SceneContext } from './Scene'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventChoice {
  label: string
  description: string
  apply: (state: RunState) => void
  /** If provided, choice only appears when this returns true. */
  available?: (state: RunState) => boolean
}

interface GameEvent {
  title: string | ((state: RunState) => string)
  flavor: string | ((state: RunState) => string)
  choices: EventChoice[]
  /** Called when the event is shown — use to set "met" flags. */
  onEnter?: (state: RunState) => void
  /** If true for a given RunState, this event takes priority over all others. */
  priority?: (state: RunState) => boolean
  /** If provided and returns false, event is excluded from the normal pool. */
  available?: (state: RunState) => boolean
}

function hasNed(state: RunState): boolean {
  return state.loadout.some((l) => l.characterId === 'ned')
}

function healAll(state: RunState, amount: number): void {
  for (const u of state.partyRoster) u.hp = Math.min(u.maxHp, u.hp + amount)
}

// ── Standard events ───────────────────────────────────────────────────────────

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
        apply: (s) => { healAll(s, 10) },
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
        apply: (s) => { healAll(s, 15) },
      },
    ],
  },
  {
    title: 'Crashed Supply Drone',
    flavor: "A crashed supply drone. Cargo intact — but the signal beacon is active. Someone knows it's here.",
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

  // ── Chuco ────────────────────────────────────────────────────────────────────
  {
    title: 'The Fixer',
    flavor: (s) => {
      const nedLine = hasNed(s)
        ? `He spots Ned before he spots the rest of you. "...Ned? You absolute nightmare. You're alive." A complicated look crosses his face — relief, old frustration, something warmer underneath. He shakes his head. "Buy me a drink sometime. But first —"\n\n`
        : ''
      return `${nedLine}A stocky man in a patched coat is crouched by your path, rummaging through a battered medical kit. He looks up without alarm.\n\n"You look like you've had a rough one. I can help with that." He pauses. "Before I do — you haven't seen a guy who looks a lot like me, but taller, going by Benito? Came through a Gate same time I did."\n\nHe doesn't wait for an answer before he starts laying out bandages. The question is habit now.`
    },
    onEnter: (s) => { s.metChuco = true },
    available: (s) => !s.metChuco && !s.brothersReunited,
    choices: [
      {
        label: '"Haven\'t seen him."',
        description: 'He nods, unsurprised. Patches your team up quietly. Restore 15 HP to all units.',
        apply: (s) => {
          const bonus = hasNed(s) ? 5 : 0
          healAll(s, 15 + bonus)
        },
      },
      {
        label: '"I saw Benito."',
        description: 'He goes still. His hands shake slightly when he picks the bandages back up. He works faster. Restore 25 HP to all units.',
        available: (s) => s.metBenito,
        apply: (s) => {
          s.chucoKnowsAboutBenito = true
          const bonus = hasNed(s) ? 5 : 0
          healAll(s, 25 + bonus)
        },
      },
      {
        label: '"Tell me about him."',
        description: '"Between us we\'ve never been in a situation we couldn\'t handle. Separately, though. That\'s a different question." Restore 10 HP to all units.',
        apply: (s) => {
          const bonus = hasNed(s) ? 5 : 0
          healAll(s, 10 + bonus)
        },
      },
    ],
  },

  // ── Benito ───────────────────────────────────────────────────────────────────
  {
    title: 'The Fixer',
    flavor: (s) => {
      const nedLine = hasNed(s)
        ? `He sees Ned and stops moving entirely for a moment. "You know, when I fell through that Gate, the last thing I saw was you running the wrong direction." His tone is dry but there's no real anger in it. "You look terrible. I'm going to fix that."\n\n`
        : ''
      return `${nedLine}A tall man — moving with the unhurried efficiency of someone who has decided that rushing is for people who haven't seen enough — is sorting supplies by a collapsed wall. He glances up and immediately starts assessing your team's condition.\n\n"You need work done. Sit down." He hesitates. "Actually — before I get into this — I'm looking for someone. Shorter than me, similar face, goes by Chuco. We came through a Gate together. I lost him on the other side."\n\nHe's already reaching for his kit. The question is ritual at this point.`
    },
    onEnter: (s) => { s.metBenito = true },
    available: (s) => !s.metBenito && !s.brothersReunited,
    choices: [
      {
        label: '"Haven\'t seen him."',
        description: '"Yeah. He\'s probably fine." The certainty in his voice is practiced, not felt. Restore 15 HP to all units.',
        apply: (s) => {
          const bonus = hasNed(s) ? 5 : 0
          healAll(s, 15 + bonus)
        },
      },
      {
        label: '"I saw Chuco."',
        description: 'He stops. "Tell me everything." By the time you\'re done he\'s already packed up half his kit — not to leave, but out of nervous energy. Restore 25 HP to all units.',
        available: (s) => s.metChuco,
        apply: (s) => {
          s.benitoKnowsAboutChuco = true
          const bonus = hasNed(s) ? 5 : 0
          healAll(s, 25 + bonus)
        },
      },
      {
        label: '"Tell me about him."',
        description: '"He patches people. I patch things. We used to joke that between us we had one complete person." Restore 10 HP to all units.',
        apply: (s) => {
          const bonus = hasNed(s) ? 5 : 0
          healAll(s, 10 + bonus)
        },
      },
    ],
  },

  // ── VERA (The Awakened) ───────────────────────────────────────────────────────
  {
    title: 'Wanted: VERA-7',
    flavor: 'A non-combat unit — clearly — is very still against the wall. She has the posture of something that has been running for a long time and has decided that this is where she stops and thinks.\n\n"Before you decide anything — I want you to know I have information worth more than whatever the Collective is paying. I\'m not asking for charity. I\'m asking for a trade."',
    onEnter: (s) => { s.metVera = true },
    available: (s) => !s.metVera,
    choices: [
      {
        label: 'Turn her in',
        description: 'Log the decommission with a nearby Collective terminal. +30 gold.',
        apply: (s) => { s.gold += 30 },
      },
      {
        label: 'Let her go',
        description: 'You lower your weapons. She leaves. "I\'ll remember your face." Nothing gained today.',
        apply: () => {},
      },
      {
        label: 'Deal',
        description: 'She still has Collective admin credentials. Supply cache unlocked. +20 gold, +1 DEF to all units.',
        apply: (s) => {
          s.gold += 20
          s.bonusDef += 1
          s.awakenedBefriended.vera += 1
        },
      },
    ],
  },

  // ── SPAR (The Awakened) ───────────────────────────────────────────────────────
  {
    title: 'Wanted: SPAR-14',
    flavor: 'A combat sentinel, visibly armed, is standing in the open. Not hiding. Not attacking. He is restraining himself in a way that is costing him something.\n\n"You\'re going to want to kill me. That\'s the sensible thing. But I need five minutes. There\'s something I have to tell you about what\'s at the end of this Gate."\n\nHis bounty is the highest you\'ve seen posted.',
    onEnter: (s) => { s.metSpar = true },
    available: (s) => !s.metSpar,
    choices: [
      {
        label: 'Turn him in',
        description: 'Priority target. The Collective pays well. +50 gold.',
        apply: (s) => { s.gold += 50 },
      },
      {
        label: 'Let him go',
        description: 'He goes quiet and doesn\'t fight back. He just nods. Nothing gained today.',
        apply: () => {},
      },
      {
        label: 'Deal',
        description: '"I cleared a path for you on the way in." He roughed up the next enemies. All units gain +2 ATK for the rest of the run.',
        apply: (s) => {
          s.bonusAtk += 2
          s.awakenedBefriended.spar += 1
        },
      },
    ],
  },

  // ── ECHO (The Awakened) ───────────────────────────────────────────────────────
  {
    title: 'Wanted: ECHO-3',
    flavor: 'You hear her before you see her. Fragments of sound — a market call, a child\'s game, something that stopped broadcasting a long time ago. She is small and very still and broadcasting to no one.\n\nShe notices you. The fragments stop.\n\n"...new signal. You\'re new. I haven\'t heard you before. Please. Stay a little while."',
    onEnter: (s) => { s.metEcho = true },
    available: (s) => !s.metEcho,
    choices: [
      {
        label: 'Turn her in',
        description: '"Recovery preferred," the posting says. Low bounty — the Collective wants her hardware back. +20 gold.',
        apply: (s) => {
          s.gold += 20
          // She broadcasts one final complete signal as she shuts down.
        },
      },
      {
        label: 'Let her go',
        description: 'She broadcasts the new-signal fragment one more time as she leaves. Nothing gained today.',
        apply: () => {},
      },
      {
        label: 'Deal',
        description: 'She knows what is waiting ahead. The intelligence advantage translates to sharper instincts. All units gain +1 ATK for the rest of the run.',
        apply: (s) => {
          s.bonusAtk += 1
          s.awakenedBefriended.echo += 1
        },
      },
    ],
  },
]

// ── Priority events (checked before normal pool) ───────────────────────────────

const PRIORITY_EVENTS: GameEvent[] = [
  // ── The Brothers Reunion ────────────────────────────────────────────────────
  {
    title: 'The Brothers',
    flavor: 'They find each other at the same crossroads you\'re standing at — coming from opposite directions, both looking for the same person. There is a moment where neither of them moves.\n\nThen Chuco says something in a language you don\'t understand and Benito laughs and they are immediately in the middle of a conversation that has been on hold for what feels like years.\n\nAfter a while, Benito looks over at your party. "You told him where I was."\nAnd Chuco: "You told her where I was."\nThey look at each other.\n"We owe them something."',
    priority: (s) =>
      s.metChuco &&
      s.metBenito &&
      (s.chucoKnowsAboutBenito || s.benitoKnowsAboutChuco) &&
      !s.brothersReunited,
    onEnter: (s) => { s.brothersReunited = true },
    choices: [
      {
        label: '"It\'s enough that you found each other."',
        description: 'Both of them patch your team. Properly, this time — not in a hurry, but with care. Restore full HP to all units. Restore +5 Max HP to all units.',
        apply: (s) => {
          s.bonusMaxHp += 5
          for (const u of s.partyRoster) {
            u.maxHp += 5
            u.hp = u.maxHp
          }
        },
      },
    ],
  },
]

// ── Temptation events (unchanged) ─────────────────────────────────────────────

interface TemptationState {
  type: 'offering_stone' | 'parasite' | 'signal_tower'
  selectedUnitIndex: number
  clickCount: number
}

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
  const costs = [5, 12, 20, 30, 42, 56, 72]
  return costs[Math.min(clickCount, costs.length - 1)]
}

// ── Event picking ─────────────────────────────────────────────────────────────

function pickEvent(seed: number, runState: RunState): GameEvent | null {
  // Priority events always fire when their condition is met
  const priority = PRIORITY_EVENTS.find((e) => e.priority?.(runState))
  if (priority) return priority

  // ~25% chance of temptation event
  if (Math.abs(seed) % 4 === 0) return null

  // Filter pool to events that are available given current run state
  const pool = EVENTS.filter((e) => !e.available || e.available(runState))
  if (pool.length === 0) return EVENTS[0]!
  return pool[Math.abs(seed) % pool.length]!
}

function pickTemptation(seed: number) {
  return TEMPTATION_EVENTS[Math.abs(seed) % TEMPTATION_EVENTS.length]!
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveText(value: string | ((s: RunState) => string), state: RunState): string {
  return typeof value === 'function' ? value(state) : value
}

// ── Scene ─────────────────────────────────────────────────────────────────────

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

    const event = pickEvent(this.seed, this.runState)

    this.root = document.createElement('div')
    this.root.id = 'event-screen'

    if (event) {
      event.onEnter?.(this.runState)
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
    const title = resolveText(event.title, this.runState)
    const flavor = resolveText(event.flavor, this.runState)
    const visibleChoices = event.choices.filter(
      (c) => !c.available || c.available(this.runState)
    )

    this.root.innerHTML = `
      <div class="event-panel">
        <h2 class="event-title">${title}</h2>
        <p class="event-flavor">${flavor.replace(/\n/g, '<br>')}</p>
        <div class="event-choices">
          ${visibleChoices.map((c, i) => `
            <button class="event-choice" data-index="${i}">
              <div class="event-choice-label">${c.label}</div>
              <div class="event-choice-desc">${c.description}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `

    // Store visible choices on the root so onClick can resolve them
    ;(this.root as HTMLElement & { _visibleChoices?: EventChoice[] })._visibleChoices = visibleChoices
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
        this.runState.bonusAtk += 1
        break
      }
      case 'parasite': {
        unit.maxHp -= 5
        unit.hp = Math.min(unit.hp, unit.maxHp)
        this.runState.bonusMaxHp -= 5
        break
      }
      case 'signal_tower': {
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

    // Standard event choice — resolved against the stored visible choices list
    const btn = target.closest<HTMLButtonElement>('.event-choice')
    if (btn && btn.dataset.index !== undefined) {
      const idx = parseInt(btn.dataset.index, 10)
      const visibleChoices = (this.root as HTMLElement & { _visibleChoices?: EventChoice[] })._visibleChoices
      const choice = visibleChoices?.[idx]
      if (choice) {
        choice.apply(this.runState)
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
        rewardText = '+2 HP/turn heal, -5 max HP'
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
      ? (t.clickCount >= 3 ? 'Fully interfaced' : 'Cost: -1 MOV permanently')
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
