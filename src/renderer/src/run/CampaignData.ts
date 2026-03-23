import type { Faction } from '../entities/EnemyData'

export type CampaignId = 'the-run' | 'ghost-protocol' | 'wardens-path' | 'ironclad'

export interface CampaignDef {
  id: CampaignId
  name: string
  tagline: string
  description: string
  /** If set, all combat nodes are locked to this enemy faction. */
  lockedFaction?: Faction
  /** Override map column count (default 7). */
  numCols?: number
  /** If true, party HP is never restored between combats. */
  noHpRestore?: boolean
}

export const CAMPAIGNS: CampaignDef[] = [
  {
    id: 'the-run',
    name: 'The Run',
    tagline: 'Into the unknown.',
    description: 'Standard run through the Horde. Fight your way to the Skeleton King.',
    lockedFaction: 'fantasy',
  },
  {
    id: 'ghost-protocol',
    name: 'Ghost Protocol',
    tagline: 'Get in, get out.',
    description: 'Speed run through Horde territory. No detours, no mercy.',
    lockedFaction: 'fantasy',
  },
  {
    id: 'wardens-path',
    name: "Warden's Path",
    tagline: 'Hold the line.',
    description: 'Deep in enemy territory. Harder enemies, no shortcuts.',
    lockedFaction: 'fantasy',
    numCols: 9,
  },
  {
    id: 'ironclad',
    name: 'Ironclad',
    tagline: 'No rest. No mercy.',
    description: 'Long run, no HP restore between fights. Survive to the Skeleton King.',
    lockedFaction: 'fantasy',
    numCols: 9,
    noHpRestore: true,
  },
]

export function getCampaign(id: CampaignId): CampaignDef {
  return CAMPAIGNS.find((c) => c.id === id) ?? CAMPAIGNS[0]!
}
