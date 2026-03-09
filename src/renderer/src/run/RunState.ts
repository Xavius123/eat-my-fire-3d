export interface RunState {
  bonusAtk: number
  bonusDef: number
  bonusMaxHp: number
}

export function createRunState(): RunState {
  return { bonusAtk: 0, bonusDef: 0, bonusMaxHp: 0 }
}
