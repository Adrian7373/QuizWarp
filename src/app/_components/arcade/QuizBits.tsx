// Quiz pieces in arcade style. No hooks: usable from server components.
import { Check, X } from "lucide-react";
import { PixelBar } from "./Hud";

/** Each answer slot keeps one cabinet-button color, so players learn "B is cyan" across the game. */
export const ANSWER_COLORS = ["bg-px-red", "bg-px-cyan", "bg-px-yellow", "bg-px-lime"] as const;
const LETTERS = ["A", "B", "C", "D"];

export type AnswerState = "idle" | "selected" | "correct" | "wrong" | "dim";

export function AnswerOption({ index, text, state = "idle" }: { index: number; text: string; state?: AnswerState }) {
    const key = ANSWER_COLORS[index % 4];
    const shell =
        state === "correct" ? "bg-px-lime text-px-void border-px-void" :
        state === "wrong" ? "bg-px-red text-px-void border-px-void" :
        state === "selected" ? "bg-raised text-fg border-px-cyan" :
        "bg-surface text-fg border-frame-strong";

    return (
        <div className={`px-notch flex items-center gap-3 border-4 py-2 pl-2 pr-3 text-lg leading-tight ${shell} ${state === "dim" ? "opacity-45" : ""}`}>
            <span className={`px-notch flex size-8 shrink-0 items-center justify-center border-4 border-px-void font-pixel text-[10px] text-px-void ${state === "correct" || state === "wrong" ? "bg-px-snow" : key}`}>
                {state === "correct" ? <Check className="size-4" strokeWidth={4} aria-hidden /> : state === "wrong" ? <X className="size-4" strokeWidth={4} aria-hidden /> : LETTERS[index % 4]}
            </span>
            <span className="min-w-0 flex-1">{text}</span>
            {state === "correct" && <span className="font-pixel text-[10px]">+100<span className="sr-only"> points, correct answer</span></span>}
            {state === "wrong" && <span className="sr-only">(wrong answer)</span>}
        </div>
    );
}

/** A static question card: what a generated question looks like in play. */
export function QuestionCard({ question, options, correct, chosen, number = 1, total = 10, timeLeft = 12, typeLabel = "Multiple choice" }: {
    question: string; options: string[]; correct: number; chosen?: number; number?: number; total?: number; timeLeft?: number; typeLabel?: string;
}) {
    return (
        <div className="px-panel p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <span className="px-label text-muted">Q {number}/{total}</span>
                <span className="px-label px-notch bg-px-cyan px-2 py-1 text-px-void">{typeLabel}</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
                <PixelBar value={timeLeft} max={20} segments={20} color="orange" label="Time left" />
                <span className="font-pixel text-[10px] text-px-orange px-glow">{timeLeft}s</span>
            </div>
            <p className="mt-4 text-xl font-semibold leading-snug">{question}</p>
            <div className="mt-4 grid gap-2">
                {options.map((o, i) => (
                    <AnswerOption
                        key={o}
                        index={i}
                        text={o}
                        state={i === correct ? "correct" : i === chosen ? "wrong" : "idle"}
                    />
                ))}
            </div>
        </div>
    );
}
