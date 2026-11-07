// Presentational pieces for the host's live control screen. No hooks, no data: HostPlayClient owns state.
import { Check } from "lucide-react";
import { ANSWER_COLORS } from "@/app/_components/arcade/QuizBits";
import { PixelBar } from "@/app/_components/arcade/Hud";

export const LETTERS = ["A", "B", "C", "D"];

export type HostQuestion = {
    id?: string;
    questionText: string;
    questionType?: string | null;
    options?: string[] | null;
    correctAnswer: string;
    explanation?: string | null;
    timeLimitSeconds?: number | null;
};

export type HostParticipant = {
    id: string;
    nickname: string;
    factionId: string | null;
    totalScore: number;
};

/** Which input players get. Older quizzes may lack questionType, so fall back to the options. */
export function kindOf(q: HostQuestion): "choice" | "typed" | "essay" {
    if (q.questionType === "ESSAY") return "essay";
    return q.options && q.options.length > 0 ? "choice" : "typed";
}

/** Each question type owns a color (see /designsystem). */
const TYPE_CHIP: Record<string, { label: string; fill: string }> = {
    MULTIPLE_CHOICE: { label: "Multiple choice", fill: "bg-px-cyan" },
    TRUE_FALSE: { label: "True or false", fill: "bg-px-pink" },
    IDENTIFICATION: { label: "Identification", fill: "bg-px-yellow" },
    ESSAY: { label: "Essay", fill: "bg-px-lime" },
};

export function typeChipOf(q: HostQuestion) {
    return TYPE_CHIP[q.questionType ?? ""] ?? (kindOf(q) === "choice" ? TYPE_CHIP.MULTIPLE_CHOICE : TYPE_CHIP.IDENTIFICATION);
}

export const formatPoints = (n: number) => n.toLocaleString("en-US");

/** Orange countdown; turns red for the last five seconds. */
export function HostTimer({ timeLeft, limit }: { timeLeft: number; limit: number }) {
    const urgent = timeLeft <= 5;
    return (
        <div className="flex items-center gap-3">
            <PixelBar value={timeLeft} max={limit} segments={30} color={urgent ? "red" : "orange"} label="Time left" />
            <span className={`w-20 shrink-0 text-right font-pixel text-xl px-glow sm:text-2xl ${urgent ? "text-px-red" : "text-px-orange"}`} aria-hidden>
                {timeLeft}s
            </span>
        </div>
    );
}

/** The live answered/total counter: the number the host watches while the room answers. */
export function AnsweredCounter({ answered, total }: { answered: number; total: number }) {
    const all = total > 0 && answered >= total;
    return (
        <div className="flex items-center gap-3">
            <span className={`font-pixel text-2xl px-glow sm:text-4xl ${all ? "text-px-lime" : "text-px-cyan"}`}>
                {answered}<span className="text-muted">/{total}</span>
            </span>
            <span className="text-lg leading-tight text-muted">{all ? "All in" : "answered"}</span>
        </div>
    );
}

const SLOT = "px-notch flex min-h-16 w-full items-center gap-4 border-4 py-2 pl-2 pr-4 text-left leading-tight sm:min-h-20";

/** An answer slot as the room sees it. Before the reveal every slot looks the same: no hint at the right one. */
export function HostOption({ index, text, state, size = "lg" }: { index: number; text: string; state: "idle" | "correct" | "dim"; size?: "lg" | "md" }) {
    const shell =
        state === "correct" ? "border-px-void bg-px-lime text-px-void" :
        state === "dim" ? "border-frame-strong bg-surface text-fg opacity-45" :
        "border-frame-strong bg-surface text-fg";
    const textSize = size === "lg" ? "text-xl sm:text-2xl xl:text-3xl" : "text-lg sm:text-xl";
    return (
        <li className={`${SLOT} ${shell} ${textSize}`}>
            <span className={`px-notch flex size-10 shrink-0 items-center justify-center border-4 border-px-void font-pixel text-xs text-px-void sm:size-12 sm:text-sm ${state === "correct" ? "bg-px-snow" : ANSWER_COLORS[index % 4]}`}>
                {state === "correct" ? <Check className="size-5" strokeWidth={4} aria-hidden /> : LETTERS[index % 4]}
            </span>
            <span className="min-w-0 flex-1 break-words">{text}</span>
            {state === "correct" && <span className="sr-only"> (correct answer)</span>}
        </li>
    );
}

/** How the round went: correct, wrong and no answer as one stacked bar with big counts. */
export function RoundResult({ correct, wrong, total, essay }: { correct: number; wrong: number; total: number; essay: boolean }) {
    const missing = Math.max(0, total - correct - wrong);
    const parts = [
        { key: "correct", label: essay ? "Scored points" : "Correct", value: correct, fill: "bg-px-lime", text: "text-px-lime" },
        { key: "wrong", label: essay ? "No points" : "Wrong", value: wrong, fill: "bg-px-red", text: "text-px-red" },
        { key: "missing", label: "No answer", value: missing, fill: "bg-px-steel", text: "text-muted" },
    ];
    return (
        <section aria-labelledby="round-heading" className="px-panel flex flex-col gap-4 p-4 sm:p-5">
            <h2 id="round-heading" className="font-pixel text-sm sm:text-base">This round</h2>
            {total === 0 ? (
                <p className="text-lg text-muted">No players in this game.</p>
            ) : (
                <>
                    <div aria-hidden className="px-notch flex h-8 gap-[3px] border-4 border-frame-strong bg-screen p-[3px] sm:h-10">
                        {parts.filter(p => p.value > 0).map(p => (
                            <span key={p.key} className={`h-full ${p.fill}`} style={{ flexGrow: p.value, flexBasis: 0 }} />
                        ))}
                    </div>
                    <dl className="grid grid-cols-3 gap-3">
                        {parts.map(p => (
                            <div key={p.key} className="flex flex-col gap-1">
                                <dt className="flex items-center gap-2 text-base text-muted sm:text-lg">
                                    <span aria-hidden className={`size-3 shrink-0 ${p.fill}`} />{p.label}
                                </dt>
                                <dd className={`font-pixel text-2xl px-glow sm:text-3xl ${p.text}`}>{p.value}</dd>
                            </div>
                        ))}
                    </dl>
                </>
            )}
        </section>
    );
}

const RANK_FILL = ["bg-px-yellow text-px-void", "bg-px-fog text-px-void", "bg-px-orange text-px-void"];

/** Solo games: the top ten, with what each player gained this round. */
export function Leaderboard({ rows }: { rows: { id: string; nickname: string; score: number; gain: number }[] }) {
    return (
        <section aria-labelledby="board-heading" className="px-panel flex flex-col">
            <div className="flex items-center justify-between gap-3 border-b-4 border-frame px-4 py-3 sm:px-5">
                <h2 id="board-heading" className="font-pixel text-sm sm:text-base">Top players</h2>
                <span className="px-label text-muted">Score</span>
            </div>
            {rows.length === 0 ? (
                <p className="px-5 py-8 text-center text-lg text-muted">No players yet.</p>
            ) : (
                <ol className="flex flex-col gap-2 p-3 sm:p-4">
                    {rows.map((p, idx) => (
                        <li key={p.id} className="px-notch flex items-center gap-3 border-4 border-frame bg-screen px-2 py-2 sm:px-3">
                            <span className={`px-notch flex size-9 shrink-0 items-center justify-center font-pixel text-[11px] ${RANK_FILL[idx] ?? "bg-raised text-fg"}`}>
                                {idx + 1}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-xl font-semibold" title={p.nickname}>{p.nickname}</span>
                            {p.gain > 0 && (
                                <span className="font-pixel text-[11px] text-px-lime">
                                    +{formatPoints(p.gain)}<span className="sr-only"> this round</span>
                                </span>
                            )}
                            <span className="w-28 text-right font-pixel text-base text-fg px-glow sm:text-lg">{formatPoints(p.score)}</span>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}
