import type { MapEvent } from '../types/events'

const STORAGE_DISABLED = 'emf:eventDisabled'

export function getEventKey(ev: MapEvent): string {
  return `${ev.type}:${ev.id}`
}

export function getDisabledEventKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_DISABLED)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

export function setEventDisabled(key: string, disabled: boolean): void {
  const set = getDisabledEventKeys()
  if (disabled) {
    set.add(key)
  } else {
    set.delete(key)
  }
  try {
    localStorage.setItem(STORAGE_DISABLED, JSON.stringify([...set]))
  } catch {
    // ignore
  }
}

export function isEventDisabled(key: string): boolean {
  return getDisabledEventKeys().has(key)
}
