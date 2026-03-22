import type { Faction } from '../entities/EnemyData'

export type CampaignId = 'the-run' | 'ghost-protocol' | 'wardens-path' | 'ironclad'

export interface CampaignDef {
  id: CampaignId
  name: string
  tagline: string
  description: string
  /** If set, all combat nodes are locked to this enemy faction. */
  lockedFaction?: Faction
  /** Override map column count (default 10). */
  numCols?: number
  /** If true, party HP is never restored between combats. */
  noHpRestore?: boolean
}

export const CAMPAIGNS: CampaignDef[] = [
  {
    id: 'the-run',
    name: 'The Run',
    tagline: 'Into the unknown.',
    description: 'Both factions. Standard map. No strings attached.',
  },
  {
    id: 'ghost-protocol',
    name: 'Ghost Protocol',
    tagline: 'The Collective made an offer.',
    description: 'You are fighting through Horde territory for the Collective. All enemies are Primordial Horde. Find out what the Collective actually wants before you reach the end.',
    lockedFaction: 'fantasy',
  },
  {
    id: 'wardens-path',
    name: "Warden's Path",
    tagline: 'The Horde opened a door.',
    description: 'You are escorting the Horde through Collective strongholds. All enemies are Emberfaust Collective. Discover why the Horde needs to reach a specific Gate before you do.',
    lockedFaction: 'tech',
  },
  {
    id: 'ironclad',
    name: 'Ironclad',
    tagline: 'The full Convergence.',
    description: 'Both factions at full force. 14-node map. No HP restore between fights. A third threat is waiting at the Core.',
    numCols: 14,
    noHpRestore: true,
  },
]

export function getCampaign(id: CampaignId): CampaignDef {
  return CAMPAIGNS.find((c) => c.id === id) ?? CAMPAIGNS[0]!
}
