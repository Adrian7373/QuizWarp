// Whether the wandering critters are shown. On by default; stored in localStorage under "critters".

const KEY = 'critters'
export const CRITTERS_EVENT = 'critterschange'

export function isCrittersOn() {
    try { return localStorage.getItem(KEY) !== 'off' } catch { return true }
}

export function setCrittersOn(on: boolean) {
    try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* private mode */ }
    window.dispatchEvent(new Event(CRITTERS_EVENT))
}

export function critterSubscribe(onChange: () => void) {
    window.addEventListener(CRITTERS_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
        window.removeEventListener(CRITTERS_EVENT, onChange)
        window.removeEventListener('storage', onChange)
    }
}
