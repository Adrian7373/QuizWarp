'use client'

// Floating isles in the empty gutters beside the max-w-6xl page column. Only on screens wide enough
// to have real gutters (1600px+), off on gameplay screens and in print. Pure decoration: hidden from
// assistive tech and out of the tab order, but the gems, the spring and the bushes react to the mouse.
// Kept quiet on purpose: both gutters rest faded and still, and only the one under the pointer wakes up.
// The isles are .px-perch, so the wandering critters can hop onto them.

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Sprite from '../Sprite'
import { CRITTERS } from '../critters/sprites'
import { BUSH, FIREFLY, FLOWER, GEM, PINE, ROCK, SIGN, SPRING, STAR, TREE } from './sprites'

const HIDDEN_ON = [/^\/play\//, /^\/host\/[^/]+\/play/] // keep gameplay screens clear
const GEM_IDS = ['l1a', 'l1b', 'l1c', 'l3a', 'r2a', 'r2b', 'r3a']
const PIP = CRITTERS.find(c => c.id === 'pip')?.frames[0]
const GUTTER: CSSProperties = { width: 'calc((100vw - 72rem) / 2)' } // max-w-6xl = 72rem

export default function SideScenery() {
    const pathname = usePathname()
    if (HIDDEN_ON.some(r => r.test(pathname ?? ''))) return null
    return <Scenery />
}

function Scenery() {
    const [got, setGot] = useState<ReadonlySet<string>>(new Set())
    const gotRef = useRef(got) // current set for delayed calls (Pip's grab)
    const [count, setCount] = useState(0)
    const [boing, setBoing] = useState(false)
    const [awake, setAwake] = useState<'left' | 'right' | null>(null)
    const timers = useRef<number[]>([])

    useEffect(() => {
        const t = timers.current
        return () => t.forEach(id => window.clearTimeout(id))
    }, [])

    // The scenery rests faded and still; the gutter the pointer is in wakes up (full color, motion).
    // The layer ignores the pointer so it never blocks the page, so this watches the position instead of :hover.
    useEffect(() => {
        const onMove = (e: PointerEvent) => {
            const gutter = (window.innerWidth - 1152) / 2 // max-w-6xl
            setAwake(e.clientX < gutter ? 'left' : e.clientX > window.innerWidth - gutter ? 'right' : null)
        }
        const onLeave = () => setAwake(null)
        window.addEventListener('pointermove', onMove, { passive: true })
        document.addEventListener('pointerleave', onLeave)
        return () => {
            window.removeEventListener('pointermove', onMove)
            document.removeEventListener('pointerleave', onLeave)
        }
    }, [])
    const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }

    const update = (next: ReadonlySet<string>) => { gotRef.current = next; setGot(next) }

    const collect = (id: string) => {
        if (gotRef.current.has(id)) return
        const next = new Set(gotRef.current).add(id)
        update(next)
        setCount(c => c + 1)
        // All picked up: they grow back.
        if (next.size === GEM_IDS.length) later(() => update(new Set()), 1600)
    }

    const bounce = () => {
        if (boing) return
        setBoing(true)
        later(() => collect('l3a'), 200) // Pip grabs the gem floating over the spring on the way up
        later(() => setBoing(false), 780)
    }

    const gem = (id: string, style: CSSProperties) => (
        <button
            key={id}
            type="button"
            tabIndex={-1}
            data-sfx="coin"
            disabled={got.has(id)}
            onClick={() => collect(id)}
            className={`scenery-gem pointer-events-auto absolute flex size-11 cursor-pointer items-center justify-center ${got.has(id) ? 'is-got' : ''}`}
            style={style}
        >
            <Sprite art={GEM} scale={4} />
        </button>
    )

    return (
        <div aria-hidden className="scenery-layer pointer-events-none fixed inset-0 z-[1] hidden overflow-hidden min-[1600px]:block print:hidden">
            {/* ---------- Left gutter ---------- */}
            <div className={`scenery-side absolute inset-y-0 left-0 ${awake === 'left' ? 'is-awake' : ''}`} style={GUTTER}>
                {count > 0 && (
                    <div className="px-notch absolute left-4 top-[88px] flex items-center gap-2 border-4 border-frame bg-surface px-3 py-2 font-pixel text-[10px] uppercase text-px-cyan">
                        <Sprite art={GEM} scale={2} />Gems ×{count}
                    </div>
                )}

                <Twinkle art={STAR} scale={4} style={{ right: 48, top: '13%' }} />
                <Twinkle art={STAR} scale={2} style={{ left: '50%', top: '33%', animationDelay: '.6s' }} />
                <Twinkle art={STAR} scale={4} style={{ left: 40, top: '52%', animationDelay: '1.2s' }} />
                <Twinkle art={STAR} scale={2} style={{ right: 32, top: '58%', animationDelay: '1.8s' }} />
                <Twinkle art={STAR} scale={2} style={{ left: '62%', top: '82%', animationDelay: '.3s' }} />

                <Isle width={192} rows={[[16, 0], [12, 16], [8, 40], [4, 64]]} style={{ left: 16, top: '23%' }}>
                    <On left={8}><Sprite art={TREE} /></On>
                    <On left={124} rustle><Sprite art={BUSH} /></On>
                    {gem('l1a', { left: 88, bottom: 'calc(100% + 36px)' })}
                    {gem('l1b', { left: 124, bottom: 'calc(100% + 56px)' })}
                    {gem('l1c', { left: 160, bottom: 'calc(100% + 36px)' })}
                </Isle>

                <Isle width={148} rows={[[12, 0], [12, 20], [4, 40]]} style={{ right: 16, top: '42%' }}>
                    <On left={20}><Sprite art={FLOWER} /></On>
                    <On left={48}><Sprite art={FLOWER} /></On>
                    <On left={88}><Sprite art={PINE} /></On>
                </Isle>

                <Isle width={176} rows={[[16, 0], [12, 24], [8, 48]]} style={{ left: 24, top: '63%' }}>
                    <button
                        type="button"
                        tabIndex={-1}
                        data-sfx="select"
                        onClick={bounce}
                        className={`scenery-spring isle-on pointer-events-auto flex h-12 w-14 cursor-pointer items-end justify-center ${boing ? 'is-boing' : ''}`}
                        style={{ left: 16 }}
                    >
                        <Sprite art={SPRING} />
                    </button>
                    {PIP && (
                        <div className={`scenery-pip absolute ${boing ? 'is-boing' : ''}`} style={{ left: 26, bottom: 'calc(100% + 40px)' }}>
                            <Sprite art={PIP} scale={3} />
                        </div>
                    )}
                    {gem('l3a', { left: 22, bottom: 'calc(100% + 150px)' })}
                    <On left={116}><Sprite art={ROCK} /></On>
                </Isle>

                <Ground>
                    <On left={24} rustle><Sprite art={BUSH} /></On>
                    <On left={108}><Sprite art={FLOWER} /></On>
                    <On left={132}><Sprite art={FLOWER} /></On>
                    <On right={16}><Sprite art={SIGN} /></On>
                </Ground>

                <Firefly style={{ right: 56, top: '28%' }} />
                <Firefly style={{ left: '35%', top: '54%', animationDelay: '1s' }} />
                <Firefly style={{ right: 40, top: '74%', animationDelay: '2s' }} />
            </div>

            {/* ---------- Right gutter ---------- */}
            <div className={`scenery-side absolute inset-y-0 right-0 ${awake === 'right' ? 'is-awake' : ''}`} style={GUTTER}>
                <Twinkle art={STAR} scale={4} style={{ left: 48, top: '11%', animationDelay: '.9s' }} />
                <Twinkle art={STAR} scale={2} style={{ right: 48, top: '15%', animationDelay: '1.5s' }} />
                <Twinkle art={STAR} scale={2} style={{ left: '55%', top: '59%', animationDelay: '.2s' }} />
                <Twinkle art={STAR} scale={4} style={{ left: 64, top: '83%', animationDelay: '2s' }} />

                <Isle width={152} rows={[[12, 0], [12, 20], [4, 44]]} style={{ left: 32, top: '22%' }}>
                    <On left={16}><Sprite art={PINE} /></On>
                    <On left={84}><Sprite art={FLOWER} /></On>
                    <On left={112}><Sprite art={FLOWER} /></On>
                </Isle>

                <Isle width={184} rows={[[16, 0], [12, 20], [8, 48], [4, 68]]} style={{ right: 24, top: '40%' }}>
                    <On left={16}><Sprite art={ROCK} /></On>
                    <On left={100}><Sprite art={TREE} /></On>
                    {gem('r2a', { left: 4, bottom: 'calc(100% + 44px)' })}
                    {gem('r2b', { left: 48, bottom: 'calc(100% + 68px)' })}
                </Isle>

                <Isle width={128} rows={[[12, 0], [8, 24]]} style={{ left: 24, top: '61%' }}>
                    <On left={36} rustle><Sprite art={BUSH} /></On>
                    {gem('r3a', { left: 42, bottom: 'calc(100% + 56px)' })}
                </Isle>

                <Isle width={132} rows={[[12, 0], [8, 20]]} style={{ right: 24, top: '78%' }}>
                    <On left={24}><Sprite art={FLOWER} /></On>
                    <On left={72}><Sprite art={ROCK} /></On>
                </Isle>

                <Ground>
                    <On left={36}><Sprite art={PINE} /></On>
                    <On left={132}><Sprite art={ROCK} /></On>
                    <On right={40}><Sprite art={TREE} /></On>
                </Ground>

                <Firefly style={{ left: 80, top: '52%', animationDelay: '.5s' }} />
                <Firefly style={{ left: '50%', top: '86%', animationDelay: '1.6s' }} />
            </div>
        </div>
    )
}

/** A floating island: grass cap, then dirt rows that step inward ([height, inset] each). */
function Isle({ width, rows, style, children }: { width: number; rows: [number, number][]; style: CSSProperties; children?: ReactNode }) {
    return (
        <div className="px-perch absolute" style={{ width, ...style }}>
            <div className="isle-hi" />
            <div className="isle-grass" />
            <div className="isle-fringe" />
            {rows.map(([h, inset], i) => (
                <div key={i} className="isle-dirt" style={{ height: h, marginInline: inset }} />
            ))}
            {children}
        </div>
    )
}

/** The strip of ground along the bottom of a gutter, where the critters walk. */
function Ground({ children }: { children: ReactNode }) {
    return (
        <div className="absolute inset-x-0 bottom-0">
            <div className="isle-hi" style={{ marginInline: 0 }} />
            <div className="isle-grass" />
            <div className="isle-fringe" />
            <div className="isle-dirt h-3" />
            {children}
        </div>
    )
}

/** Something standing on top of an isle or the ground. */
function On({ left, right, rustle, children }: { left?: number; right?: number; rustle?: boolean; children: ReactNode }) {
    return (
        <div className={`isle-on ${rustle ? 'scenery-rustle pointer-events-auto' : ''}`} style={{ left, right }}>
            {children}
        </div>
    )
}

function Twinkle({ art, scale, style }: { art: string[]; scale: number; style: CSSProperties }) {
    return <div className="scenery-twinkle absolute" style={style}><Sprite art={art} scale={scale} /></div>
}

function Firefly({ style }: { style: CSSProperties }) {
    return <div className="scenery-fly absolute" style={style}><Sprite art={FIREFLY} /></div>
}
