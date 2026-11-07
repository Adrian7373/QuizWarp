'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

// <html data-theme> is the source of truth (set before paint in layout.tsx). Cabinet = dark, manual = light.
function subscribe(onChange: () => void) {
    const observer = new MutationObserver(onChange)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
}

const getTheme = () => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'

export type Theme = 'light' | 'dark'

/** The current screen (cabinet = dark, manual = light), kept in sync with <html data-theme>. */
export function useTheme(): Theme {
    return useSyncExternalStore(subscribe, getTheme, () => 'dark')
}

/** Switch screens and remember the choice. */
export function applyTheme(next: Theme) {
    // Suspend transitions for the instant of the switch so nothing animates through the wrong colors.
    const freeze = document.createElement('style')
    freeze.textContent = '*,*::before,*::after{transition:none!important}'
    document.head.appendChild(freeze)
    document.documentElement.dataset.theme = next
    void getComputedStyle(document.body).opacity
    setTimeout(() => freeze.remove(), 0)
    try { localStorage.setItem('theme', next) } catch { /* private mode: won't persist */ }
}

export default function ThemeToggle() {
    const theme = useTheme()
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const toggle = () => applyTheme(next)

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${next} mode`}
            data-sfx="select"
            className="px-btn px-btn-sm px-btn-ghost"
        >
            {theme === 'dark' ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
    )
}
