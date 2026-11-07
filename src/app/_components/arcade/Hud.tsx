// HUD building blocks. No hooks, so they render in server and client components.
import Sprite from "./Sprite";
import { COIN, FLAME, HEART, HEART_EMPTY } from "./sprites";
import HoloOrb, { type HoloMood } from "./HoloOrb";

export function Hearts({ lives, max = 3 }: { lives: number; max?: number }) {
    return (
        <span className="inline-flex items-center gap-1" role="img" aria-label={`${lives} of ${max} lives`}>
            {Array.from({ length: max }, (_, i) => (
                <Sprite key={i} art={i < lives ? HEART : HEART_EMPTY} scale={3} />
            ))}
        </span>
    );
}

/** AI credits, shown as coins. */
export function CoinCounter({ value, label = "AI credits" }: { value: number; label?: string }) {
    return (
        <span className="inline-flex items-center gap-2" title={label}>
            <Sprite art={COIN} scale={3} />
            <span className="font-pixel text-xs text-fg"><span className="sr-only">{label}: </span>×{value}</span>
        </span>
    );
}

/** Daily login streak. */
export function StreakFlame({ days }: { days: number }) {
    return (
        <span className="inline-flex items-center gap-2" title="Day streak">
            <Sprite art={FLAME} scale={3} className={days > 0 ? "" : "opacity-40 grayscale"} />
            <span className="font-pixel text-xs text-fg"><span className="sr-only">Day streak: </span>{days}</span>
        </span>
    );
}

const FILL: Record<string, string> = {
    lime: "bg-px-lime", cyan: "bg-px-cyan", yellow: "bg-px-yellow", orange: "bg-px-orange", pink: "bg-px-pink", red: "bg-px-red",
};

/** A segmented progress bar: XP, timers, generation progress. */
export function PixelBar({ value, max = 100, segments = 20, color = "lime", label }: {
    value: number; max?: number; segments?: number; color?: keyof typeof FILL; label: string;
}) {
    const filled = Math.round((Math.min(value, max) / max) * segments);
    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={Math.round(value)}
            className="flex h-4 w-full gap-[3px] border-4 border-frame-strong bg-screen p-[2px] px-notch box-content"
        >
            {Array.from({ length: segments }, (_, i) => (
                <span key={i} className={`h-full flex-1 ${i < filled ? FILL[color] : "bg-transparent"}`} />
            ))}
        </div>
    );
}

export function Score({ value, digits = 6, label = "Score" }: { value: number; digits?: number; label?: string }) {
    return (
        <span className="inline-flex flex-col gap-1">
            <span className="px-label text-px-pink">{label}</span>
            <span className="font-pixel text-lg tracking-wider text-fg px-glow">{String(value).padStart(digits, "0")}</span>
        </span>
    );
}

/** Orbi, the AI companion (an amber hologram sphere), with an optional speech bubble. */
export function Orbi({ mood = "idle", say, scale = 2, bob = true }: { mood?: HoloMood; say?: React.ReactNode; scale?: number; bob?: boolean }) {
    return (
        <div className="flex items-end gap-2">
            <HoloOrb mood={mood} scale={scale} className={bob ? "px-bob" : ""} title={`Orbi, ${mood}`} />
            {say && <SpeechBubble>{say}</SpeechBubble>}
        </div>
    );
}

export function SpeechBubble({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative mb-6">
            <div className="px-panel max-w-[16rem] px-3 py-2 text-sm leading-snug">{children}</div>
            {/* pixel tail pointing at the speaker on the left */}
            <span aria-hidden className="absolute -left-2 bottom-2 h-2 w-3 bg-frame" />
        </div>
    );
}

/** The big moment banner: LEVEL UP, HIGH SCORE, etc. */
export function Banner({ title, detail, tone = "lime" }: { title: string; detail?: string; tone?: "lime" | "yellow" | "pink" | "red" }) {
    const fill = { lime: "bg-px-lime", yellow: "bg-px-yellow", pink: "bg-px-pink", red: "bg-px-red" }[tone];
    return (
        <div role="status" className={`px-notch inline-flex items-center gap-3 border-4 border-px-void px-4 py-3 text-px-void ${fill}`}>
            <span className="font-pixel text-sm">{title}</span>
            {detail && <span className="text-base font-semibold">{detail}</span>}
        </div>
    );
}
