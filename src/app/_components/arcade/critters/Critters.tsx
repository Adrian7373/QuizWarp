'use client'

// Tiny critters that wander the page. They walk along the bottom of the screen, hop onto the tops
// of buttons and panels, startle when the cursor comes close, and talk when clicked.
// Movement runs in one requestAnimationFrame loop that writes transforms straight to the DOM,
// so React never re-renders per frame. Off on gameplay screens, in print, and when the player turns
// them off in Settings; under reduced motion they stand still.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import Sprite from '../Sprite'
import { playSfx } from '../sfx'
import { CRITTERS, CRITTER_SIZE, type CritterArt } from './sprites'
import { critterSubscribe, isCrittersOn } from './settings'

const SCALE = 3
const PX = CRITTER_SIZE * SCALE // on-screen size
const GRAVITY = 1400 // px/s²
const PERCH_SELECTOR = '.px-btn, .px-panel'
const HIDDEN_ON = [/^\/play\//, /^\/host\/[^/]+\/play/] // keep gameplay screens clear

type Mode = 'floor' | 'perch' | 'air'
type Act = 'walk' | 'idle' | 'flee'

interface Body {
    x: number; y: number; vx: number; vy: number; dir: 1 | -1
    mode: Mode; act: Act; until: number; speed: number
    target: Element | null // perch element (also the landing target while in the air)
    offset: number // x relative to the perch's left edge
    startledAt: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]

function usableRect(el: Element | null) {
    if (!el || !el.isConnected) return null
    const r = el.getBoundingClientRect()
    // Needs room to stand, below the fixed NavBar, and on screen.
    if (r.width < PX * 2.5 || r.top < 64 + PX + 8 || r.top > window.innerHeight - 24 || r.right < 0 || r.left > window.innerWidth) return null
    return r
}

/** A random button or panel top that's on screen and not inside the header or a dialog. */
function findPerch(exclude: Element | null) {
    const options = [...document.querySelectorAll(PERCH_SELECTOR)].filter(el =>
        el !== exclude && !el.closest('header, [role="dialog"], [role="menu"], [data-no-critters]') && usableRect(el))
    return options.length ? pick(options) : null
}

function floorY() { return window.innerHeight - PX }

function groundFor(b: Body) {
    if (b.target) {
        const r = usableRect(b.target)
        if (r) return { y: r.top - PX + SCALE, min: r.left, max: r.right - PX, left: r.left, perched: true }
    }
    return { y: floorY(), min: 0, max: window.innerWidth - PX, left: 0, perched: false }
}

/** Launch a body on an arc that lands at (tx, ty) after `t` seconds. */
function jumpTo(b: Body, tx: number, ty: number, target: Element | null, t = 0.8) {
    b.mode = 'air'
    b.target = target
    b.vx = (tx - b.x) / t
    b.vy = (ty - b.y - 0.5 * GRAVITY * t * t) / t
    if (b.vx !== 0) b.dir = b.vx > 0 ? 1 : -1
}

function hop(b: Body, power = 320) {
    if (b.mode === 'air') return
    b.mode = 'air'
    b.vy = -power
    b.vx = b.act === 'flee' ? b.dir * b.speed : 0
}

/** Pick the next thing to do. */
function decide(b: Body, now: number) {
    const roll = Math.random()
    if (roll < 0.15) {
        // Travel: hop onto a button or panel, or back down to the floor.
        const perch = b.mode === 'floor' ? findPerch(null) : Math.random() < 0.5 ? findPerch(b.target) : null
        if (perch) {
            const r = perch.getBoundingClientRect()
            jumpTo(b, rand(r.left, r.right - PX), r.top - PX + SCALE, perch, Math.min(1.1, 0.5 + Math.abs(r.top - b.y) / 900))
        } else if (b.mode === 'perch') {
            jumpTo(b, b.x + b.dir * rand(40, 120), floorY(), null, 0.7)
        }
        b.act = 'idle'
        b.until = now + 1200
    } else if (roll < 0.62) {
        b.act = 'walk'
        b.speed = rand(22, 42)
        if (Math.random() < 0.4) b.dir = b.dir === 1 ? -1 : 1
        b.until = now + rand(1800, 5000)
    } else if (roll < 0.7) {
        b.act = 'idle'
        hop(b, rand(200, 320))
        b.until = now + 900
    } else {
        b.act = 'idle'
        b.until = now + rand(1200, 3500)
    }
}

interface CritterView { art: CritterArt; key: number }

export default function Critters() {
    const pathname = usePathname()
    const on = useSyncExternalStore(critterSubscribe, isCrittersOn, () => false)
    const hidden = HIDDEN_ON.some(r => r.test(pathname ?? ''))

    if (!on || hidden) return null
    return <CritterField key={pathname} />
}

function CritterField() {
    const [cast, setCast] = useState<CritterView[]>([])
    const [bubbles, setBubbles] = useState<Record<number, string>>({})
    const els = useRef<(HTMLDivElement | null)[]>([])
    const bodies = useRef<Body[]>([])
    const mouse = useRef({ x: -999, y: -999 })
    const bubbleTimers = useRef<Record<number, number>>({})

    // Pick a random cast for this page: 3 on wide screens, 2 on phones.
    useEffect(() => {
        const count = window.innerWidth < 640 ? 2 : 3
        const shuffled = [...CRITTERS].sort(() => Math.random() - 0.5).slice(0, count)
        setCast(shuffled.map((art, key) => ({ art, key })))
        bodies.current = shuffled.map(() => ({
            x: rand(16, window.innerWidth - PX - 16), y: floorY(), vx: 0, vy: 0,
            dir: Math.random() < 0.5 ? 1 : -1, mode: 'floor', act: 'idle', until: performance.now() + rand(300, 2500),
            speed: 30, target: null, offset: 0, startledAt: 0,
        }))
    }, [])

    const say = (i: number, text: string, ms = 2200) => {
        setBubbles(b => ({ ...b, [i]: text }))
        window.clearTimeout(bubbleTimers.current[i])
        bubbleTimers.current[i] = window.setTimeout(() => setBubbles(b => { const n = { ...b }; delete n[i]; return n }), ms)
    }

    useEffect(() => {
        if (!cast.length) return
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const onMove = (e: PointerEvent) => { mouse.current = { x: e.clientX, y: e.clientY } }
        const onLeave = () => { mouse.current = { x: -999, y: -999 } }
        window.addEventListener('pointermove', onMove, { passive: true })
        document.addEventListener('pointerleave', onLeave)

        let raf = 0
        let last = performance.now()

        const render = (i: number, b: Body) => {
            const el = els.current[i]
            if (!el) return
            el.style.transform = `translate3d(${Math.round(b.x)}px, ${Math.round(b.y)}px, 0)`
            el.dataset.walking = String(b.mode !== 'air' && b.act !== 'idle')
            el.dataset.air = String(b.mode === 'air')
            const flip = el.firstElementChild?.nextElementSibling as HTMLElement | null
            if (flip) flip.style.transform = `scaleX(${b.dir})`
        }

        if (reduced) {
            bodies.current.forEach((b, i) => { b.act = 'idle'; render(i, b) })
            const onResize = () => bodies.current.forEach((b, i) => { b.y = floorY(); b.x = Math.min(b.x, window.innerWidth - PX); render(i, b) })
            window.addEventListener('resize', onResize)
            return () => { window.removeEventListener('resize', onResize); window.removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave) }
        }

        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now

            bodies.current.forEach((b, i) => {
                const g = groundFor(b)

                // A perch that scrolled away or vanished: fall to the floor.
                if (b.mode === 'perch' && !g.perched) {
                    b.target = null
                    b.mode = 'air'
                    b.vx = 0
                    b.vy = 0
                }

                // Cursor close by: startle and run the other way.
                const cx = b.x + PX / 2, cy = b.y + PX / 2
                const dx = cx - mouse.current.x, dy = cy - mouse.current.y
                if (b.mode !== 'air' && dx * dx + dy * dy < 70 * 70 && now - b.startledAt > 1500) {
                    b.startledAt = now
                    b.dir = dx >= 0 ? 1 : -1
                    b.act = 'flee'
                    b.speed = 150
                    b.until = now + 900
                    hop(b, 260)
                    say(i, '!', 700)
                }

                if (b.mode === 'air') {
                    b.vy += GRAVITY * dt
                    b.x += b.vx * dt
                    b.y += b.vy * dt
                    const land = groundFor(b)
                    if (b.vy > 0 && b.y >= land.y) {
                        b.y = land.y
                        b.vy = 0
                        b.vx = 0
                        if (b.target && land.perched) {
                            b.mode = 'perch'
                            b.x = Math.max(land.min, Math.min(land.max, b.x))
                            b.offset = b.x - land.left
                        } else {
                            b.target = null
                            b.mode = 'floor'
                        }
                    }
                    b.x = Math.max(0, Math.min(window.innerWidth - PX, b.x))
                } else {
                    if (now > b.until) decide(b, now)
                    if (b.act !== 'idle') {
                        const step = b.dir * b.speed * dt
                        if (b.mode === 'perch') {
                            b.offset += step
                            // At the edge: usually turn around, sometimes jump down.
                            if (b.offset < 0 || g.left + b.offset > g.max) {
                                if (b.act === 'flee' || Math.random() < 0.3) jumpTo(b, b.x + b.dir * rand(30, 90), floorY(), null, 0.6)
                                else { b.dir = b.dir === 1 ? -1 : 1; b.offset = Math.max(0, Math.min(g.max - g.left, b.offset)) }
                            }
                        } else {
                            b.x += step
                            if (b.x < 0 || b.x > g.max) { b.dir = b.dir === 1 ? -1 : 1; b.x = Math.max(0, Math.min(g.max, b.x)) }
                        }
                    }
                    if (b.mode === 'perch') {
                        const r = groundFor(b)
                        b.x = r.left + b.offset
                        b.y = r.y
                    } else if (b.mode === 'floor') {
                        b.y = floorY()
                    }
                }
                render(i, b)
            })
            raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)

        const timers = bubbleTimers.current
        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener('pointermove', onMove)
            document.removeEventListener('pointerleave', onLeave)
            Object.values(timers).forEach(t => window.clearTimeout(t))
        }
    }, [cast])

    const poke = (i: number, art: CritterArt) => {
        const b = bodies.current[i]
        if (!b) return
        b.startledAt = performance.now() // a click isn't a scare
        b.act = 'idle'
        b.until = performance.now() + 1800
        hop(b, 300)
        playSfx('coin')
        say(i, pick(art.lines))
    }

    return (
        <div aria-hidden className="critter-layer pointer-events-none fixed inset-0 z-[45] overflow-hidden print:hidden">
            {cast.map(({ art, key }, i) => (
                <div
                    key={key}
                    ref={el => { els.current[i] = el }}
                    onClick={() => poke(i, art)}
                    className="critter pointer-events-auto absolute left-0 top-0 cursor-pointer will-change-transform"
                    style={{ width: PX, height: PX, transform: 'translate3d(-100px, -100px, 0)' }}
                    title={art.name}
                >
                    {/* Speech bubble, kept upright (outside the flipping wrapper) */}
                    <div className={`critter-bubble pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap ${bubbles[i] ? '' : 'hidden'}`}>
                        <span className="px-notch block border-4 border-frame bg-surface px-2 py-1 font-pixel text-[9px] leading-none text-fg">{bubbles[i]}</span>
                    </div>
                    <div className="h-full w-full">
                        <div className="h-full w-full overflow-hidden">
                            <div className="critter-strip flex" style={{ width: PX * 2 }}>
                                <Sprite art={art.frames[0]} scale={SCALE} />
                                <Sprite art={art.frames[1]} scale={SCALE} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

