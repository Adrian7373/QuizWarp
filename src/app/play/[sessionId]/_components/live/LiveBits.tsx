// Presentational pieces for the live (synchronous) player. No hooks, no data: LivePlayer owns the game state.
import { Check, X } from "lucide-react";
import { ANSWER_COLORS } from "@/app/_components/arcade/QuizBits";
import { PixelBar } from "@/app/_components/arcade/Hud";
import Sprite from "@/app/_components/arcade/Sprite";
import { FLAME } from "@/app/_components/arcade/sprites";

export const LETTERS = ["A", "B", "C", "D"];

export type LiveQuestion = {
    id: string;
    questionText: string;
    questionType?: string | null;
    options?: string[] | null;
    correctAnswer: string;
    explanation?: string | null;
    timeLimitSeconds?: number | null;
};

/** Which input a question gets. Older quizzes may lack questionType, so fall back to the options. */
export function kindOf(q: LiveQuestion): "choice" | "typed" | "essay" {
    if (q.questionType === "ESSAY") return "essay";
    return q.options && q.options.length > 0 ? "choice" : "typed";
}

/** Each question type owns a color (see /designsystem). */
export const TYPE_CHIP: Record<string, { label: string; fill: string }> = {
    MULTIPLE_CHOICE: { label: "Multiple choice", fill: "bg-px-cyan" },
    TRUE_FALSE: { label: "True or false", fill: "bg-px-pink" },
    IDENTIFICATION: { label: "Identification", fill: "bg-px-yellow" },
    ESSAY: { label: "Essay", fill: "bg-px-lime" },
};

export const formatPoints = (n: number) => n.toLocaleString("en-US");

/** Small keyboard hint chip, hidden on touch-sized screens. */
export function Key({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="px-notch hidden bg-px-void px-1.5 py-1 font-pixel text-[8px] text-px-snow sm:inline-block">{children}</kbd>
    );
}

export type OptionState = "idle" | "correct" | "wrong" | "dim";

/** The look of an answer slot (same as arcade AnswerOption, minus its fixed +100: the verdict shows the real points). */
function OptionFace({ index, text, state }: { index: number; text: string; state: OptionState }) {
    const result = state === "correct" || state === "wrong";
    return (
        <>
            <span className={`px-notch flex size-9 shrink-0 items-center justify-center border-4 border-px-void font-pixel text-[11px] text-px-void ${result ? "bg-px-snow" : ANSWER_COLORS[index % 4]}`}>
                {state === "correct" ? <Check className="size-4" strokeWidth={4} aria-hidden /> : state === "wrong" ? <X className="size-4" strokeWidth={4} aria-hidden /> : LETTERS[index % 4]}
            </span>
            <span className="min-w-0 flex-1 break-words">{text}</span>
        </>
    );
}

const SHELL: Record<OptionState, string> = {
    idle: "border-frame-strong bg-surface text-fg",
    correct: "border-px-void bg-px-lime text-px-void",
    wrong: "border-px-void bg-px-red text-px-void",
    dim: "border-frame-strong bg-surface text-fg opacity-45",
};
const SLOT = "px-notch flex min-h-16 w-full items-center gap-3 border-4 py-2 pl-2 pr-3 text-left text-lg leading-tight sm:text-xl";

/** A pickable answer slot. Hover lifts the frame to cyan, press sinks it two pixels. */
export function OptionButton({ index, text, onPick, disabled }: { index: number; text: string; onPick: () => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            onClick={onPick}
            disabled={disabled}
            data-sfx="none"
            aria-keyshortcuts={`${index + 1} ${LETTERS[index]}`}
            className={`${SLOT} ${SHELL.idle} cursor-pointer transition-transform duration-75 [transition-timing-function:steps(1)] hover:border-px-cyan hover:bg-raised focus-visible:border-px-cyan focus-visible:outline-none active:translate-y-0.5 disabled:cursor-default`}
        >
            <OptionFace index={index} text={text} state="idle" />
        </button>
    );
}

/** A revealed answer slot, read-only. */
export function OptionResult({ index, text, state, picked }: { index: number; text: string; state: OptionState; picked?: boolean }) {
    const sr = state === "correct" ? (picked ? " (your answer, correct)" : " (correct answer)") : state === "wrong" ? " (your answer, wrong)" : "";
    return (
        <li className={`${SLOT} ${SHELL[state]}`}>
            <OptionFace index={index} text={text} state={state} />
            {sr && <span className="sr-only">{sr}</span>}
        </li>
    );
}

/** Orange countdown; turns red for the last five seconds. */
export function TimerBar({ timeLeft, limit }: { timeLeft: number; limit: number }) {
    const urgent = timeLeft <= 5;
    return (
        <div className="flex items-center gap-3">
            <PixelBar value={timeLeft} max={limit} segments={20} color={urgent ? "red" : "orange"} label="Time left" />
            <span className={`w-12 shrink-0 text-right font-pixel text-sm px-glow ${urgent ? "text-px-red" : "text-px-orange"}`} aria-hidden>
                {timeLeft}s
            </span>
        </div>
    );
}

/** Answer streak (the arcade StreakFlame counts login days, so this one is labelled for answers). */
export function AnswerStreak({ count }: { count: number }) {
    return (
        <span className="inline-flex items-center gap-2" title="Answer streak">
            <Sprite art={FLAME} scale={3} className={count > 0 ? "" : "opacity-40 grayscale"} />
            <span className="font-pixel text-xs text-px-orange px-glow"><span className="sr-only">Answer streak: </span>{count}</span>
        </span>
    );
}

/** The verdict strip after an answer. Decorative to assistive tech: LivePlayer announces results itself. */
export function Verdict({ tone, title, detail }: { tone: "lime" | "red" | "steel"; title: string; detail?: string }) {
    const fill = { lime: "bg-px-lime text-px-void", red: "bg-px-red text-px-void", steel: "bg-raised text-fg" }[tone];
    return (
        <div
            aria-hidden
            style={{ animation: "live-pop 180ms steps(3, end)" }}
            className={`px-notch flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-4 border-px-void px-4 py-3 ${fill}`}
        >
            <span className="font-pixel text-base sm:text-lg">{title}</span>
            {detail && <span className="font-pixel text-xs sm:text-sm">{detail}</span>}
        </div>
    );
}
