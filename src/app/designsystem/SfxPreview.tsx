'use client'

import { playSfx, type Sfx } from '../_components/arcade/sfx'

const SOUNDS: { name: Sfx; use: string; btn: string }[] = [
    { name: 'blip', use: 'Any button', btn: 'px-btn-ghost' },
    { name: 'select', use: 'Tabs, toggles', btn: 'px-btn-ghost' },
    { name: 'start', use: 'Generate, start game', btn: 'px-btn-yellow' },
    { name: 'coin', use: 'Credits earned, sound on', btn: 'px-btn-yellow' },
    { name: 'correct', use: 'Right answer', btn: 'px-btn-lime' },
    { name: 'wrong', use: 'Wrong answer', btn: 'px-btn-red' },
    { name: 'levelup', use: 'Streak bonus, level up', btn: 'px-btn-pink' },
]

// Previews play even while sound is off, because the visitor asked to hear them.
export default function SfxPreview() {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SOUNDS.map((s) => (
                <div key={s.name} className="flex items-center gap-3">
                    <button type="button" data-sfx="none" onClick={() => playSfx(s.name, true)} className={`px-btn px-btn-sm ${s.btn}`}>
                        ▶ {s.name}
                    </button>
                    <span className="text-sm text-muted">{s.use}</span>
                </div>
            ))}
        </div>
    )
}
