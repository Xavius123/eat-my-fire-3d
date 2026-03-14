/**
 * MetaProgression — Persistent unlock tracking across runs.
 *
 * Stores which characters, weapons, and armors have been unlocked.
 * Persists to localStorage (Electron has access to this).
 */

const STORAGE_KEY = 'magitek_meta_progression'

export interface MetaProgressionData {
  /** Character IDs that have been unlocked. */
  unlockedCharacters: string[]
  /** Weapon item IDs unlocked for loadout selection. */
  unlockedWeapons: string[]
  /** Armor item IDs unlocked for loadout selection. */
  unlockedArmors: string[]
  /** Total runs completed (wins). */
  runsCompleted: number
  /** Total runs attempted. */
  runsAttempted: number
}

const DEFAULT_UNLOCKS: MetaProgressionData = {
  unlockedCharacters: ['vanguard', 'striker', 'sentinel'],
  unlockedWeapons: ['iron_sword', 'hunting_bow', 'rusty_dagger'],
  unlockedArmors: ['leather_vest', 'scout_cloak'],
  runsCompleted: 0,
  runsAttempted: 0,
}

let cached: MetaProgressionData | null = null

/** Load meta-progression from persistent storage. */
export function loadMetaProgression(): MetaProgressionData {
  if (cached) return cached
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MetaProgressionData>
      cached = {
        unlockedCharacters: parsed.unlockedCharacters ?? DEFAULT_UNLOCKS.unlockedCharacters,
        unlockedWeapons: parsed.unlockedWeapons ?? DEFAULT_UNLOCKS.unlockedWeapons,
        unlockedArmors: parsed.unlockedArmors ?? DEFAULT_UNLOCKS.unlockedArmors,
        runsCompleted: parsed.runsCompleted ?? 0,
        runsAttempted: parsed.runsAttempted ?? 0,
      }
      return cached
    }
  } catch {
    // Storage unavailable or corrupt — use defaults
  }
  cached = { ...DEFAULT_UNLOCKS }
  return cached
}

/** Save meta-progression to persistent storage. */
export function saveMetaProgression(data: MetaProgressionData): void {
  cached = data
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage unavailable — progress won't persist
  }
}

/** Unlock a character. Returns true if newly unlocked. */
export function unlockCharacter(id: string): boolean {
  const data = loadMetaProgression()
  if (data.unlockedCharacters.includes(id)) return false
  data.unlockedCharacters.push(id)
  saveMetaProgression(data)
  return true
}

/** Unlock a weapon. Returns true if newly unlocked. */
export function unlockWeapon(id: string): boolean {
  const data = loadMetaProgression()
  if (data.unlockedWeapons.includes(id)) return false
  data.unlockedWeapons.push(id)
  saveMetaProgression(data)
  return true
}

/** Unlock an armor. Returns true if newly unlocked. */
export function unlockArmor(id: string): boolean {
  const data = loadMetaProgression()
  if (data.unlockedArmors.includes(id)) return false
  data.unlockedArmors.push(id)
  saveMetaProgression(data)
  return true
}

/** Check if a character is unlocked. */
export function isCharacterUnlocked(id: string): boolean {
  return loadMetaProgression().unlockedCharacters.includes(id)
}

/** Check if a weapon is unlocked. */
export function isWeaponUnlocked(id: string): boolean {
  return loadMetaProgression().unlockedWeapons.includes(id)
}

/** Check if an armor is unlocked. */
export function isArmorUnlocked(id: string): boolean {
  return loadMetaProgression().unlockedArmors.includes(id)
}

/** Record a run attempt. */
export function recordRunAttempt(): void {
  const data = loadMetaProgression()
  data.runsAttempted += 1
  saveMetaProgression(data)
}

/** Record a run completion (victory). Triggers unlock checks. */
export function recordRunCompletion(): void {
  const data = loadMetaProgression()
  data.runsCompleted += 1

  // ── Unlock triggers ──
  // First win: unlock Channeler (Syl)
  if (data.runsCompleted >= 1) {
    if (!data.unlockedCharacters.includes('channeler')) {
      data.unlockedCharacters.push('channeler')
    }
  }
  // 2 wins: unlock Medic (Mira)
  if (data.runsCompleted >= 2) {
    if (!data.unlockedCharacters.includes('medic')) {
      data.unlockedCharacters.push('medic')
    }
  }
  // 3 wins: unlock Juggernaut (Vex)
  if (data.runsCompleted >= 3) {
    if (!data.unlockedCharacters.includes('juggernaut')) {
      data.unlockedCharacters.push('juggernaut')
    }
  }
  // 2 wins: unlock rare weapons
  if (data.runsCompleted >= 2) {
    for (const id of ['war_hammer', 'fire_staff']) {
      if (!data.unlockedWeapons.includes(id)) {
        data.unlockedWeapons.push(id)
      }
    }
  }
  // 2 wins: unlock rare armors
  if (data.runsCompleted >= 2) {
    for (const id of ['chain_mail', 'iron_plate', 'battle_robes']) {
      if (!data.unlockedArmors.includes(id)) {
        data.unlockedArmors.push(id)
      }
    }
  }

  saveMetaProgression(data)
}

/** Reset all progress (for testing). */
export function resetMetaProgression(): void {
  cached = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
