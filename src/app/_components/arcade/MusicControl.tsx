'use client'

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { ChevronDown, Music, Music2 } from 'lucide-react'
import {
    MUSIC_EVENT, TRACKS, currentTrack, isMusicOn, pickTrack, pickedTrack, setMusicOn,
    startScreenMusic, trackTitle, type TrackId,
} from './music'

function subscribe(onChange: () => void) {
    window.addEventListener(MUSIC_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
        window.removeEventListener(MUSIC_EVENT, onChange)
        window.removeEventListener('storage', onChange)
    }
}

// One string snapshot so useSyncExternalStore can compare it by value.
const snapshot = () => `${isMusicOn() ? 1 : 0}|${pickedTrack() ?? ''}|${currentTrack() ?? ''}`

function useMusic() {
    const [on, picked, current] = useSyncExternalStore(subscribe, snapshot, () => '0||').split('|')
    return { on: on === '1', picked: (picked || null) as TrackId | null, current: (current || null) as TrackId | null }
}

/** Three pixel bars that bounce while music plays (still under reduced motion). */
function EqBars({ playing }: { playing: boolean }) {
    return (
        <span aria-hidden className="flex h-3 items-end gap-[2px]">
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    className={`w-[3px] bg-current ${playing ? 'motion-safe:animate-[px-eq_0.9s_steps(3,end)_infinite]' : ''}`}
                    style={{ height: playing ? `${[60, 100, 40][i]}%` : '30%', animationDelay: `${i * -0.3}s` }}
                />
            ))}
        </span>
    )
}

/**
 * Background music for a screen: plays `track` unless the player picked another one.
 * A toggle mutes it; the arrow opens the track list.
 */
export default function MusicControl({ track, align = 'right' }: { track: TrackId; align?: 'left' | 'right' }) {
    const { on, picked, current } = useMusic()
    const [open, setOpen] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)
    const menuId = useId()

    useEffect(() => startScreenMusic(track), [track])

    useEffect(() => {
        if (!open) return
        const onDown = (e: PointerEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false) }
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('pointerdown', onDown)
        document.addEventListener('keydown', onKey)
        return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
    }, [open])

    const playing = on && !!current
    const nowTitle = current ? trackTitle(current) : trackTitle(track)

    const choose = (id: TrackId | null) => {
        pickTrack(id)
        setOpen(false)
    }

    const item = 'flex w-full items-center gap-3 px-3 py-2 text-left text-base hover:bg-raised focus-visible:bg-raised focus-visible:outline-none'

    return (
        <div ref={wrapRef} className="relative flex">
            <button
                type="button"
                onClick={() => setMusicOn(!on)}
                aria-pressed={on}
                aria-label={on ? `Mute music (${nowTitle})` : 'Play music'}
                title={on ? `Music: ${nowTitle}` : 'Music off'}
                data-sfx="none"
                className={`px-btn px-btn-sm ${on ? 'px-btn-pink' : 'px-btn-ghost'}`}
            >
                {on ? <EqBars playing={playing} /> : <Music className="size-4 opacity-60" aria-hidden />}
            </button>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                aria-controls={menuId}
                aria-label="Choose music"
                title="Choose music"
                data-sfx="none"
                className="px-btn px-btn-sm px-btn-ghost -ml-1 px-1.5"
            >
                <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
            </button>

            {open && (
                <div
                    id={menuId}
                    role="menu"
                    aria-label="Background music"
                    className={`px-panel z-[95] py-2 max-sm:fixed max-sm:inset-x-4 max-sm:top-16 sm:absolute sm:top-full sm:mt-2 sm:w-72 ${align === 'right' ? 'sm:right-0' : 'sm:left-0'}`}
                >
                    <p className="px-label px-3 pb-2 pt-1 text-[9px] text-px-pink">Background music</p>
                    <button
                        type="button"
                        role="menuitemradio"
                        aria-checked={picked === null}
                        onClick={() => choose(null)}
                        className={item}
                    >
                        <span className={`size-2.5 shrink-0 border-2 border-frame-strong ${picked === null ? 'bg-px-cyan' : ''}`} aria-hidden />
                        <span className="min-w-0 flex-1">
                            Screen default
                            <span className="block truncate text-sm text-muted">{trackTitle(track)}</span>
                        </span>
                    </button>
                    <div className="mx-3 my-1 border-t-4 border-dashed border-frame" />
                    {TRACKS.map(t => {
                        const isPicked = picked === t.id
                        const isNow = playing && current === t.id
                        return (
                            <button
                                key={t.id}
                                type="button"
                                role="menuitemradio"
                                aria-checked={isPicked}
                                onClick={() => choose(t.id)}
                                className={item}
                            >
                                <span className={`size-2.5 shrink-0 border-2 border-frame-strong ${isPicked ? 'bg-px-cyan' : ''}`} aria-hidden />
                                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                                {isNow && <span className="text-px-pink"><EqBars playing /></span>}
                            </button>
                        )
                    })}
                    <div className="mx-3 my-1 border-t-4 border-dashed border-frame" />
                    <button type="button" role="menuitem" onClick={() => { setMusicOn(!on); setOpen(false) }} className={item}>
                        <Music2 className="size-4 shrink-0 text-muted" aria-hidden />
                        {on ? 'Mute music' : 'Play music'}
                    </button>
                </div>
            )}
        </div>
    )
}
