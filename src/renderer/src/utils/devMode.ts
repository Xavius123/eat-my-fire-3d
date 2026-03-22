/**
 * devMode — development flag with runtime toggle.
 *
 * Set via:
 *  - URL param:       ?dev=1  (any page load)
 *  - localStorage:    localStorage.setItem('emf:dev', '1')
 *  - Console toggle:  window.__emfDev(true/false)
 *
 * When DEV_MODE is true:
 *  - Dev toolbar is visible (MENU / GUIDE / KILL)
 *  - All characters including legendary are unlocked
 *  - Event disable toggles are available in the Guide
 */

const STORAGE_KEY = 'emf:dev'

function detectDevMode(): boolean {
  try {
    if (typeof window !== 'undefined') {
      // Explicit override via URL
      const param = new URLSearchParams(window.location.search).get('dev')
      if (param === '0') return false
      if (param === '1') return true
      // Explicit opt-out via localStorage ('0' = off)
      if (localStorage.getItem(STORAGE_KEY) === '0') return false
    }
  } catch {
    // ignore
  }
  return true // on by default during pre-production
}

export let DEV_MODE: boolean = detectDevMode()

/** Toggle dev mode at runtime (also persists to localStorage). */
export function setDevMode(enabled: boolean): void {
  DEV_MODE = enabled
  try {
    // Store '0' for off (default is on, so we only need to track the off state)
    if (enabled) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, '0')
    }
  } catch {
    // ignore
  }
  // Notify any listeners
  window.dispatchEvent(new CustomEvent('emf:devModeChanged', { detail: { enabled } }))
}

// Expose on window for console toggling
if (typeof window !== 'undefined') {
  ;(window as any).__emfDev = setDevMode
}
