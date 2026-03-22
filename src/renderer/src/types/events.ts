export type EventArchetype = 'gift' | 'branch' | 'blindBet' | 'temptation' | 'curse'

export interface GiftEvent {
  type: 'gift'
  id: string
  text: string
  effect: 'healAll' | 'healAllFull' | 'healLowest' | 'movNextCombat' | 'reroll' | 'randomMod' | 'tempShield' | 'recruitLegendary' | 'recruitLegendaryToCamp'
  value?: number
  /** For recruitLegendary: character id to add to squad */
  characterId?: string
}

export interface BranchOption {
  label: string
  effect: string
  apply: 'lootRisk' | 'healReroll' | 'sacrificeHp' | 'shortcut' | 'scoutDamage' | 'warpPortal' | 'robotHelp' | 'robotKill'
}

export interface BranchEvent {
  type: 'branch'
  id: string
  text: string
  options: [BranchOption, BranchOption]
}

export interface BlindBetEvent {
  type: 'blindBet'
  id: string
  text: string
  riskLabel: string
  outcomes: Array<{ weight: number; effect: string; apply: string }>
}

export interface TemptationTier {
  costHp: number
  reward: string
  statGain?: { stat: 'atk' | 'range' | 'maxCharges'; value: number }
}

export interface TemptationEvent {
  type: 'temptation'
  id: string
  text: string
  tiers: TemptationTier[]
}

export interface CurseEvent {
  type: 'curse'
  id: string
  text: string
  effect: 'randomMaxHp' | 'randomAtk' | 'ambushNext' | 'fatigueMov'
  value?: number
}

export type MapEvent = GiftEvent | BranchEvent | BlindBetEvent | TemptationEvent | CurseEvent
