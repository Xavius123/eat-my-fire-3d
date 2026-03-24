/**
 * NPC catalog — single source for names, roles, and copy.
 * Sprites live in guide/GuideSprites (NPC_SPRITES keyed by id).
 */

export type NpcTheme = 'fantasy' | 'tech'

export interface NpcDefinition {
  id: string
  name: string
  role: string
  description: string
  theme: NpcTheme
}

export const NPC_CATALOG: Record<string, NpcDefinition> = {
  merchant: {
    id: 'merchant',
    name: 'Merchant',
    role: 'Shop',
    description: 'Sells healing and upgrades.',
    theme: 'fantasy',
  },
  healer: {
    id: 'healer',
    name: 'Healer',
    role: 'Rest',
    description: 'Restores HP or grants buffs.',
    theme: 'fantasy',
  },
  blacksmith: {
    id: 'blacksmith',
    name: 'Blacksmith',
    role: 'Upgrade',
    description: 'Improves weapons or armor.',
    theme: 'fantasy',
  },
  mystic: {
    id: 'mystic',
    name: 'Mystic',
    role: 'Event',
    description: 'Offers risky choices and rewards.',
    theme: 'fantasy',
  },
  guide: {
    id: 'guide',
    name: 'Guide',
    role: 'Info',
    description: 'Shares lore and hints.',
    theme: 'fantasy',
  },
  stranger: {
    id: 'stranger',
    name: 'Stranger',
    role: 'Event',
    description: 'Unknown intentions.',
    theme: 'fantasy',
  },
  robot_scout: {
    id: 'robot_scout',
    name: 'Robot Scout',
    role: 'Wanted',
    description: 'Wanted alien. Help or kill for bounty.',
    theme: 'tech',
  },
  robot_merchant: {
    id: 'robot_merchant',
    name: 'Robot Merchant',
    role: 'Wanted',
    description: 'Wanted alien. Help or kill for bounty.',
    theme: 'tech',
  },
}

export function getAllNpcs(): NpcDefinition[] {
  return Object.values(NPC_CATALOG)
}

export function getNpc(id: string): NpcDefinition | undefined {
  return NPC_CATALOG[id]
}
