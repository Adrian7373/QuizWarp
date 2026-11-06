import type { Metadata } from 'next'
import Sprite from '../_components/arcade/Sprite'
import HoloOrb from '../_components/arcade/HoloOrb'
import { HERO, ICON_HOMEWORK, ICON_LIVE, ICON_REPORTS, ICON_STUDY } from '../_components/arcade/sprites'
import { Banner, CoinCounter, Hearts, Orbi, PixelBar, Score, SpeechBubble, StreakFlame } from '../_components/arcade/Hud'
import { AnswerOption, QuestionCard } from '../_components/arcade/QuizBits'
import ThemeToggle from '../_components/arcade/ThemeToggle'
import SoundToggle from '../_components/arcade/SoundToggle'
import SfxPreview from './SfxPreview'
import PlayerHud from '../dashboard/_components/PlayerHud'
import QuizRow from '../dashboard/_components/QuizCard'
import { AssignmentRow, ReportRow } from '../dashboard/_components/SessionRows'
import { ASSIGNMENT_COLUMNS, EmptyState, LIBRARY_COLUMNS, Ledger, REPORT_COLUMNS } from '../dashboard/_components/Ledger'

export const metadata: Metadata = {
    title: 'Arcade design system | QuizWarp',
    description: 'The 16-color palette, pixel type, controls, HUD, mascots and sounds for QuizWarp.',
}

// Sample data for the dashboard section.
const ago = (h: number) => new Date(Date.now() - h * 3_600_000)
const SAMPLE_QUIZZES = [
    { id: 's1', title: 'Cell biology review', description: 'Organelles, membranes and how cells make energy.', difficulty: 'normal', createdAt: ago(48), _count: { questions: 10, sessions: 4 } },
    { id: 's2', title: 'World War II causes', description: 'Treaties, alliances and the road to 1939.', difficulty: 'hard', createdAt: ago(200), _count: { questions: 15, sessions: 1 } },
    { id: 's3', title: 'Fractions warm-up', description: 'Adding and comparing fractions with unlike denominators.', difficulty: 'easy', createdAt: ago(500), _count: { questions: 5, sessions: 0 } },
]
const SAMPLE_SESSIONS = [
    { id: 'a1', joinCode: 'QW4821', mode: 'ASYNC', createdAt: ago(30), expiresAt: ago(-6), quiz: { title: 'Cell biology review' }, _count: { participants: 18 } },
    { id: 'a2', joinCode: 'QW7730', mode: 'ASYNC', createdAt: ago(10), expiresAt: ago(-72), quiz: { title: 'World War II causes' }, _count: { participants: 1 } },
    { id: 'r1', joinCode: 'QW1102', mode: 'LIVE', createdAt: ago(26), expiresAt: null, quiz: { title: 'Fractions warm-up' }, _count: { participants: 24 } },
    { id: 'r2', joinCode: 'QW0919', mode: 'ASYNC', createdAt: ago(240), expiresAt: ago(100), quiz: { title: 'Cell biology review' }, _count: { participants: 21 } },
]

const PALETTE = [
    { i: '0', name: 'Void', hex: '#0B0817', role: 'Cabinet screen, outlines, ink on paper' },
    { i: '1', name: 'Night', hex: '#1A1433', role: 'Panels on the cabinet' },
    { i: '2', name: 'Dusk', hex: '#2C2457', role: 'Panel frames, ghost buttons' },
    { i: '3', name: 'Steel', hex: '#5B5A8F', role: 'Input frames, muted text on paper' },
    { i: '4', name: 'Fog', hex: '#A9ACD6', role: 'Muted text on the cabinet' },
    { i: '5', name: 'Snow', hex: '#FBF8FF', role: 'Text on the cabinet, panels on paper' },
    { i: '6', name: 'Paper', hex: '#F5ECD6', role: 'The manual page (light mode)' },
    { i: '7', name: 'Red', hex: '#FF3B5C', role: 'Wrong answers, hearts, answer A, hard level' },
    { i: '8', name: 'Orange', hex: '#FF8A1F', role: 'Timers, streak flame, Orbi’s hologram' },
    { i: '9', name: 'Yellow', hex: '#FFE23D', role: 'Start buttons, coins, titles, normal level' },
    { i: 'A', name: 'Lime', hex: '#7DFF4A', role: 'Correct answers, XP, answer D, easy level' },
    { i: 'B', name: 'Green', hex: '#19B86A', role: 'Lime’s shade in sprites and charts' },
    { i: 'C', name: 'Cyan', hex: '#2EE6FF', role: 'Focus, links, Volt’s visor, answer B' },
    { i: 'D', name: 'Blue', hex: '#2F6BFF', role: 'Volt’s armor, info' },
    { i: 'E', name: 'Purple', hex: '#A24DFF', role: 'Bonus items, fourth team' },
    { i: 'F', name: 'Pink', hex: '#FF3FD1', role: 'Title shadow, Volt’s core, live games' },
]

const MODES = [
    { icon: ICON_LIVE, title: 'Live', fill: 'bg-px-pink' },
    { icon: ICON_HOMEWORK, title: 'Homework', fill: 'bg-px-cyan' },
    { icon: ICON_STUDY, title: 'Study', fill: 'bg-px-yellow' },
    { icon: ICON_REPORTS, title: 'Reports', fill: 'bg-px-lime' },
]

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
    return (
        <section id={id} className="scroll-mt-24 border-t-4 border-dashed border-frame py-12">
            <h2 className="px-title text-base sm:text-lg">{title}</h2>
            {intro && <p className="mt-3 max-w-[64ch] text-lg text-muted">{intro}</p>}
            <div className="mt-8">{children}</div>
        </section>
    )
}

function Sub({ children }: { children: React.ReactNode }) {
    return <h3 className="px-label mb-3 text-px-cyan px-glow">{children}</h3>
}

export default function ArcadeDesignSystem() {
    const nav = [['palette', 'Palette'], ['type', 'Type'], ['controls', 'Controls'], ['hud', 'HUD'], ['quiz', 'Quiz'], ['mascots', 'Mascots'], ['fx', 'Effects'], ['dashboard', 'Dashboard'], ['rules', 'Rules']]

    return (
        <div className="px-crt min-h-dvh bg-bg font-sans text-fg">
            <header className="sticky top-0 z-50 border-b-4 border-frame bg-bg">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                    <div className="flex items-center gap-6">
                        <span className="font-pixel text-xs text-px-yellow px-glow">QUIZWARP KIT</span>
                        <nav aria-label="Sections" className="hidden items-center gap-4 lg:flex">
                            {nav.map(([id, label]) => (
                                <a key={id} href={`#${id}`} className="text-base text-muted underline-offset-4 hover:text-fg hover:underline">{label}</a>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <SoundToggle />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 sm:px-6">
                {/* Attract screen */}
                <section className="grid items-end gap-10 py-14 lg:grid-cols-[1fr_auto]">
                    <div>
                        <p className="px-label text-px-pink">Player 1 · Design system</p>
                        <h1 className="px-title mt-4 text-2xl sm:text-4xl">Arcade kit</h1>
                        <p className="mt-5 max-w-[58ch] text-xl text-muted">
                            QuizWarp should feel like a cabinet in a dark arcade, not another dashboard. Sixteen colors, two pixel fonts, hard edges,
                            and two mascots: Volt the armored hero and Orbi, the AI that builds your quizzes.
                        </p>
                        <p className="px-label px-blink mt-6 text-px-yellow">Press start</p>
                    </div>
                    <div className="flex items-end gap-4">
                        <Sprite art={HERO} scale={6} className="px-hop" title="Volt, the hero" />
                        <Orbi mood="happy" say="Every color here has exactly one job." />
                    </div>
                </section>

                <div className="px-panel mb-12 flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4">
                    <Hearts lives={2} />
                    <CoinCounter value={12} />
                    <StreakFlame days={4} />
                    <div className="min-w-[12rem] flex-1"><PixelBar value={4} max={7} segments={7} color="lime" label="Weekly streak progress" /></div>
                    <Score value={4200} />
                </div>

                <Section id="palette" title="Palette" intro="A fixed 4-bit palette: 16 colors, indexed 0 to F. Nothing outside it ships. On the cabinet, color is light: glowing text and fills on black. In the paper manual, color is ink: it only appears as fills with a black outline, never as thin colored text.">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {PALETTE.map((c) => (
                            <div key={c.i} className="px-panel">
                                <div className="flex h-16 items-start justify-between border-b-4 border-frame p-2" style={{ background: c.hex }}>
                                    <span className="px-notch bg-px-void px-1.5 py-1 font-pixel text-[10px] text-px-snow">{c.i}</span>
                                </div>
                                <div className="p-3">
                                    <p className="flex items-baseline justify-between gap-2"><span className="font-semibold">{c.name}</span><span className="font-pixel text-[9px] text-muted">{c.hex}</span></p>
                                    <p className="mt-1 text-sm leading-snug text-muted">{c.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                <Section id="type" title="Type" intro="Press Start 2P is the cabinet marquee: titles, buttons, HUD and scores, always uppercase and short. Pixelify Sans carries everything people actually read, including long questions and essay answers.">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="px-panel p-5">
                            <Sub>Press Start 2P · display</Sub>
                            <p className="px-title text-2xl">Level up</p>
                            <div className="mt-5 space-y-3">
                                <p className="font-pixel text-base">Title 16 / 24</p>
                                <p className="font-pixel text-xs">Button 11 / 14</p>
                                <p className="font-pixel text-[10px] text-muted">Label 10 / 15</p>
                                <p className="font-pixel text-lg tracking-wider">004200</p>
                            </div>
                        </div>
                        <div className="px-panel p-5">
                            <Sub>Pixelify Sans · reading</Sub>
                            <p className="text-2xl font-semibold leading-snug">Which organelle carries out photosynthesis?</p>
                            <div className="mt-5 space-y-3">
                                <p className="text-xl">Question 20 / 28, semibold</p>
                                <p className="text-lg">Body 18 / 26. Paste your notes and Orbi turns them into questions with answers and explanations.</p>
                                <p className="text-sm text-muted">Small 14 / 20 for meta like due dates.</p>
                            </div>
                        </div>
                    </div>
                </Section>

                <Section id="controls" title="Controls" intro="Every control is a pixel frame with stepped corners. Buttons are beveled cabinet buttons: they light up on hover and press in when clicked. Yellow is the one main action on a screen.">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="px-panel p-5">
                            <Sub>Buttons</Sub>
                            <div className="flex flex-wrap items-center gap-3">
                                <button className="px-btn px-btn-lg px-btn-yellow" data-sfx="start">▶ Generate quiz</button>
                                <button className="px-btn px-btn-cyan">Host live</button>
                                <button className="px-btn px-btn-pink">Assign</button>
                                <button className="px-btn px-btn-ghost">Cancel</button>
                                <button className="px-btn px-btn-red">End game</button>
                                <button className="px-btn" disabled>Generating…</button>
                                <button className="px-btn px-btn-sm px-btn-lime">Small</button>
                            </div>
                        </div>
                        <div className="px-panel p-5">
                            <Sub>Fields</Sub>
                            <div className="space-y-4">
                                <label className="block text-base font-semibold">Quiz title
                                    <input className="px-input mt-1.5 w-full" placeholder="Cell biology review" />
                                </label>
                                <label className="block text-base font-semibold">Join PIN
                                    <input className="px-input mt-1.5 w-full border-px-red font-pixel text-sm tracking-widest" defaultValue="QW-48" aria-invalid />
                                    <span className="mt-1.5 block text-base text-px-red dark:text-px-red">PINs have 6 characters. Check the code your teacher shared.</span>
                                </label>
                            </div>
                        </div>
                        <div className="px-panel p-5 lg:col-span-2">
                            <Sub>Toggles</Sub>
                            <div className="flex flex-wrap gap-6">
                                <div role="tablist" aria-label="Source" className="flex gap-2">
                                    {['File', 'Text', 'Image'].map((t, i) => (
                                        <button key={t} role="tab" aria-selected={i === 1} data-sfx="select" className={`px-btn px-btn-sm ${i === 1 ? 'px-btn-cyan' : 'px-btn-ghost'}`}>{t}</button>
                                    ))}
                                </div>
                                <div role="radiogroup" aria-label="Question type" className="flex flex-wrap gap-2">
                                    {[['Multiple choice', 'px-btn-cyan'], ['True or false', 'px-btn-pink'], ['Identification', 'px-btn-yellow'], ['Essay', 'px-btn-lime']].map(([t, c], i) => (
                                        <button key={t} role="radio" aria-checked={i === 0} data-sfx="select" className={`px-btn px-btn-sm ${i === 0 ? c : 'px-btn-ghost'}`}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <p className="mt-4 text-base text-muted">Each question type owns a color: multiple choice cyan, true or false pink, identification yellow, essay lime. Unselected toggles are ghost buttons.</p>
                        </div>
                    </div>
                </Section>

                <Section id="hud" title="HUD" intro="Account numbers become game objects. AI credits are coins, the daily streak is a flame and an XP bar, scores use pixel digits. Big moments get a banner and a sound.">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="px-panel space-y-5 p-5">
                            <Sub>Counters</Sub>
                            <div className="flex flex-wrap items-center gap-8"><Hearts lives={3} /><Hearts lives={1} /><CoinCounter value={12} /><StreakFlame days={4} /><StreakFlame days={0} /></div>
                            <div className="space-y-3">
                                <div><p className="mb-1.5 text-sm text-muted">XP to weekly bonus</p><PixelBar value={4} max={7} segments={7} color="lime" label="XP" /></div>
                                <div><p className="mb-1.5 text-sm text-muted">Time left</p><PixelBar value={6} max={20} segments={20} color="orange" label="Time left" /></div>
                                <div><p className="mb-1.5 text-sm text-muted">Orbi is building your quiz</p><PixelBar value={65} color="cyan" label="Generation progress" /></div>
                            </div>
                        </div>
                        <div className="px-panel space-y-5 p-5">
                            <Sub>Moments</Sub>
                            <div className="flex flex-wrap gap-8"><Score value={4200} /><Score value={9800} label="High score" /></div>
                            <div className="flex flex-col items-start gap-3">
                                <Banner title="Level up!" detail="+5 AI credits" tone="lime" />
                                <Banner title="High score" detail="Maya R. · 9800" tone="yellow" />
                                <Banner title="Time up" detail="Quiz closed" tone="red" />
                            </div>
                        </div>
                    </div>
                </Section>

                <Section id="quiz" title="Quiz" intro="Answer slots keep a fixed cabinet color, A red, B cyan, C yellow, D lime, so players find them by color in live games. Results always pair color with an icon: a check for correct, a cross for wrong.">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="px-panel space-y-2 p-5">
                            <Sub>Answer states</Sub>
                            <AnswerOption index={0} text="Idle: Troposphere" />
                            <AnswerOption index={1} text="Selected: Stratosphere" state="selected" />
                            <AnswerOption index={1} text="Correct: Stratosphere" state="correct" />
                            <AnswerOption index={2} text="Wrong: Mesosphere" state="wrong" />
                            <AnswerOption index={3} text="Dimmed: Thermosphere" state="dim" />
                        </div>
                        <QuestionCard
                            question="Which layer of the atmosphere contains the ozone layer?"
                            options={['Troposphere', 'Stratosphere', 'Mesosphere', 'Thermosphere']}
                            correct={1}
                            chosen={2}
                        />
                    </div>
                </Section>

                <Section id="mascots" title="Mascots" intro="Two original characters. Volt is the player’s hero: blue armor, cyan visor, pink core. Orbi is the AI: a hologram sphere of broken amber light that spins while it thinks, reads your notes, builds the quiz and reacts to answers. Happy throws sparks; sad dims to embers. Use them in empty states, loading and feedback, one at a time, never as decoration on every panel.">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="px-panel flex items-end gap-6 p-5">
                            <Sprite art={HERO} scale={8} title="Volt" />
                            <div>
                                <Sub>Volt · 16×20</Sub>
                                <p className="text-base text-muted">Hops on a correct answer or a level up. Stands still everywhere else.</p>
                            </div>
                        </div>
                        <div className="px-panel space-y-4 p-5">
                            <Sub>Orbi · 31×31 hologram</Sub>
                            <div className="flex justify-center py-3"><HoloOrb scale={6} title="Orbi, spinning" /></div>
                            <Orbi mood="idle" say="Paste your notes. I’ll write the questions." bob={false} />
                            <Orbi mood="happy" say="Correct! +100" bob={false} />
                            <Orbi mood="sad" say="Not quite. The answer was Stratosphere." bob={false} />
                        </div>
                    </div>
                </Section>

                <Section id="fx" title="Effects and sound" intro="The cabinet gets CRT scanlines and neon glow; paper mode turns both off. Motion is stepped, never smooth: blinks, hops and presses move in whole pixels. Sound is off until the player turns it on with the speaker button, and everything rests under reduced motion.">
                    <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
                        <div className="px-panel space-y-4 p-5">
                            <Sub>Motion</Sub>
                            <p className="px-label px-blink text-px-yellow">Insert notes to start</p>
                            <div className="flex items-end gap-6"><Sprite art={HERO} scale={3} className="px-hop" /><Orbi mood="idle" scale={3} /></div>
                            <div className="flex flex-wrap gap-3">
                                {MODES.map((m) => (
                                    <span key={m.title} className={`px-notch flex size-12 items-center justify-center border-4 border-px-void ${m.fill}`} title={m.title}>
                                        <Sprite art={m.icon} scale={3} />
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="px-panel p-5">
                            <Sub>Sounds · preview</Sub>
                            <SfxPreview />
                        </div>
                    </div>
                </Section>

                <Section id="dashboard" title="Dashboard" intro="The dashboard is the player hub: who is playing, their coins and streak, then tabs with counts and dense lists. These are the real components with sample data, so their buttons won't do anything useful here.">
                    <PlayerHud userId="sample" name="Maya Reyes" role="TEACHER" credits={12} streak={4} />
                    <div className="mt-6 space-y-6">
                        <Ledger columns={LIBRARY_COLUMNS} headers={['Quiz', 'Level', 'Questions', 'Plays', '']} right={['Questions', 'Plays']}>
                            {SAMPLE_QUIZZES.map((q) => <QuizRow key={q.id} quiz={q} userId="sample" userRole="TEACHER" />)}
                        </Ledger>
                        <Ledger columns={ASSIGNMENT_COLUMNS} headers={['Join PIN', 'Quiz', 'Joined', 'Deadline', '']} right={['Joined']}>
                            {SAMPLE_SESSIONS.slice(0, 2).map((s) => <AssignmentRow key={s.id} session={s} hostId="sample" />)}
                        </Ledger>
                        <Ledger columns={REPORT_COLUMNS} headers={['Quiz', 'Mode', 'Players', 'When', '']} right={['Players']}>
                            {SAMPLE_SESSIONS.slice(2).map((s) => <ReportRow key={s.id} session={s} hostId="sample" />)}
                        </Ledger>
                        <EmptyState say="No homework is running. Pick a quiz in your Library and press Assign to get a join PIN." />
                    </div>
                </Section>

                <Section id="rules" title="Rules">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="px-panel p-5">
                            <Sub>Do</Sub>
                            <ul className="space-y-2 text-lg">
                                <li>Use the 16 palette tokens (<span className="font-pixel text-[10px]">bg-px-*</span>) and the semantic ones (<span className="font-pixel text-[10px]">bg-surface</span>, <span className="font-pixel text-[10px]">text-muted</span>).</li>
                                <li>Keep one yellow main action per screen.</li>
                                <li>Use arcade words for big moments only: Press start, Level up, High score, Game over.</li>
                                <li>Pair every result color with an icon or word.</li>
                            </ul>
                        </div>
                        <div className="px-panel p-5">
                            <Sub>Don’t</Sub>
                            <ul className="space-y-2 text-lg">
                                <li>Add a 17th color, gradients or soft blurred shadows.</li>
                                <li>Set long text in Press Start 2P. It is for short labels only.</li>
                                <li>Use colored text on paper mode. Use a filled chip instead.</li>
                                <li>Turn forms and errors into game-speak. Teachers need plain words there.</li>
                            </ul>
                        </div>
                    </div>
                </Section>
            </main>
        </div>
    )
}
