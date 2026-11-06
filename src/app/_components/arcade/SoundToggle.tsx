'use client'

import { useSyncExternalStore } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { isSfxOn, playSfx, setSfxOn, SFX_EVENT } from './sfx'

function subscribe(onChange: () => void) {
    window.addEventListener(SFX_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
        window.removeEventListener(SFX_EVENT, onChange)
        window.removeEventListener('storage', onChange)
    }
}

export default function SoundToggle() {
    const on = useSyncExternalStore(subscribe, isSfxOn, () => false)

    function toggle() {
        setSfxOn(!on)
        if (!on) playSfx('coin', true) // confirm with a coin when sound comes on
    }

    return (
        <button
            type="button"
            onClick={toggle}
            aria-pressed={on}
            aria-label={on ? 'Turn sound off' : 'Turn sound on'}
            title={on ? 'Sound on' : 'Sound off'}
            data-sfx="none"
            className={`px-btn px-btn-sm ${on ? 'px-btn-cyan' : 'px-btn-ghost'}`}
        >
            {on ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
        </button>
    )
}
