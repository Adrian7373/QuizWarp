"use client"

// Self-paced player for assignments and practice runs. The player answers, reads the feedback,
// then moves on when ready: nothing advances on a timer, so explanations can actually be read.

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, LogOut, X } from "lucide-react";
import toast from "react-hot-toast";
import { submitAnswer, getParticipantProgress } from "../actions";
import { cleanupPracticeSession, submitAndGradeEssay } from "@/app/actions";
import { ANSWER_COLORS } from "@/app/_components/arcade/QuizBits";
import { Banner, Orbi, PixelBar, Score } from "@/app/_components/arcade/Hud";
import HoloOrb from "@/app/_components/arcade/HoloOrb";
import Sprite from "@/app/_components/arcade/Sprite";
import { FLAME } from "@/app/_components/arcade/sprites";
import Dialog from "@/app/_components/arcade/Dialog";
import SoundToggle from "@/app/_components/arcade/SoundToggle";
import MusicControl from "@/app/_components/arcade/MusicControl";
import ThemeToggle from "@/app/_components/arcade/ThemeToggle";
import { playSfx } from "@/app/_components/arcade/sfx";
import { TYPE_META, isBankType } from "@/app/dashboard/bank/_components/types";

interface AsyncPlayerProps {
    sessionId: string;
    quizTitle: string;
    questions: any[];
    /** Practice runs are deleted on exit; assignments keep their answers. */
    isPractice?: boolean;
}

type Phase = "answering" | "saving" | "grading" | "revealed";

interface Result {
    correct: boolean;
    points: number;
    chosenIndex?: number;
    typed?: string;
    feedback?: string | null;
    /** The streak this answer broke, if any. */
    lostStreak?: number;
}

const LETTERS = ["A", "B", "C", "D"];

const questionSize = (text: string) => {
    if (!text) return "text-xl sm:text-2xl";
    if (text.length > 250) return "text-lg sm:text-xl";
    if (text.length > 120) return "text-xl sm:text-2xl";
    return "text-2xl sm:text-3xl";
};

const isTypingTarget = (el: EventTarget | null) =>
    el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

export default function AsyncPlayer({ sessionId, quizTitle, questions, isPractice = false }: AsyncPlayerProps) {
    const router = useRouter();

    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoadingProgress, setIsLoadingProgress] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const [confirmExit, setConfirmExit] = useState(false);

    // Run state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // Question state
    const [phase, setPhase] = useState<Phase>("answering");
    const [pendingIndex, setPendingIndex] = useState<number | null>(null);
    const [textAnswer, setTextAnswer] = useState("");
    const [result, setResult] = useState<Result | null>(null);
    const [questionStartTime, setQuestionStartTime] = useState(() => Date.now());

    const nextRef = useRef<HTMLButtonElement>(null);
    const textRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

    // Resume where the player left off (answers are saved one by one).
    useEffect(() => {
        let cancelled = false;
        async function initPlayer() {
            const storedId = localStorage.getItem(`participant_${sessionId}`);
            if (!storedId) {
                toast.error("Join the game with its code first.");
                router.push("/join");
                return;
            }

            const progress = await getParticipantProgress(storedId);
            if (cancelled) return;

            if (progress.error) {
                toast.error(progress.error);
                router.push("/join");
                return;
            }

            setParticipantId(storedId);
            setScore(progress.score || 0);
            setStreak(progress.streak || 0);
            setBestStreak(progress.maxStreak || 0);
            setCorrectCount(progress.correctCount || 0);

            const answered = progress.answeredQuestionIds?.length ?? 0;
            if (answered >= questions.length) setIsFinished(true);
            else setCurrentIndex(answered);

            setQuestionStartTime(Date.now());
            setIsLoadingProgress(false);
        }

        initPlayer();
        return () => { cancelled = true; };
    }, [sessionId, router, questions.length]);

    const currentQuestion = questions[currentIndex];
    const kind = currentQuestion?.questionType as string | undefined;
    const isEssay = kind === "ESSAY";
    const isTyped = isEssay || kind === "IDENTIFICATION";
    const options: string[] = currentQuestion?.options ?? [];
    const isLast = currentIndex >= questions.length - 1;

    const reveal = useCallback((r: Result) => {
        setResult(r);
        setPhase("revealed");
        playSfx(r.correct ? "correct" : "wrong");
        setScore(s => s + r.points);
        if (r.correct) setCorrectCount(c => c + 1);
    }, []);

    const submitChoiceOrTyped = useCallback(async (answer: string, chosenIndex?: number) => {
        if (phase !== "answering" || !participantId || !currentQuestion) return;

        const timeTakenMs = Date.now() - questionStartTime;
        setPendingIndex(chosenIndex ?? null);

        if (isEssay) {
            setPhase("grading");
            const response = await submitAndGradeEssay(participantId, currentQuestion.id, answer, "English", timeTakenMs);

            if (!response.success) {
                // Nothing was saved, so the player can simply try again.
                toast.error("Grading didn't finish, so your answer wasn't saved. Try submitting again.");
                setPhase("answering");
                return;
            }

            const correct = !!response.isCorrect;
            const nextStreak = correct ? streak + 1 : 0;
            setStreak(nextStreak);
            setBestStreak(b => Math.max(b, nextStreak));
            reveal({ correct, points: response.pointsEarned || 0, typed: answer, feedback: response.feedback, lostStreak: correct ? 0 : streak });
            return;
        }

        setPhase("saving");
        const correct = kind === "IDENTIFICATION"
            ? answer.trim().toLowerCase() === String(currentQuestion.correctAnswer).trim().toLowerCase()
            : answer === currentQuestion.correctAnswer;

        const response = await submitAnswer(participantId, currentQuestion.id, answer, correct, timeTakenMs);

        if (!response.success) {
            toast.error("Your answer wasn't saved. Check your connection and try again.");
            setPendingIndex(null);
            setPhase("answering");
            return;
        }

        const nextStreak = response.currentStreak || 0;
        setStreak(nextStreak);
        setBestStreak(b => Math.max(b, nextStreak));
        reveal({ correct, points: response.pointsEarned || 0, chosenIndex, typed: isTyped ? answer : undefined, lostStreak: correct ? 0 : streak });
    }, [phase, participantId, currentQuestion, questionStartTime, isEssay, isTyped, kind, streak, reveal]);

    const goNext = useCallback(() => {
        if (phase !== "revealed") return;
        if (isLast) {
            setIsFinished(true);
            playSfx("levelup");
            return;
        }
        setCurrentIndex(i => i + 1);
        setPhase("answering");
        setPendingIndex(null);
        setTextAnswer("");
        setResult(null);
        setQuestionStartTime(Date.now());
    }, [phase, isLast]);

    // Focus: the Next button after a reveal (Enter continues), the answer box on typed questions.
    useEffect(() => {
        if (phase === "revealed") nextRef.current?.focus();
    }, [phase]);

    useEffect(() => {
        if (isLoadingProgress) return;
        if (isTyped) textRef.current?.focus();
    }, [currentIndex, isLoadingProgress, isTyped]);

    // Keyboard: 1-4 or A-D picks an option.
    useEffect(() => {
        if (isFinished || isTyped || phase !== "answering") return;
        function onKey(e: KeyboardEvent) {
            if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
            const k = e.key.toUpperCase();
            const idx = /^[1-4]$/.test(k) ? Number(k) - 1 : LETTERS.indexOf(k);
            if (idx >= 0 && idx < options.length) {
                e.preventDefault();
                submitChoiceOrTyped(options[idx], idx);
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isFinished, isTyped, phase, options, submitChoiceOrTyped]);

    const handleExit = async (finished: boolean) => {
        setIsExiting(true);
        if (isPractice) await cleanupPracticeSession(sessionId);
        // An unfinished assignment keeps its participant, so coming back resumes it.
        if (isPractice || finished) localStorage.removeItem(`participant_${sessionId}`);
        window.location.href = "/dashboard";
    };

    // ---------- Loading ----------
    if (!participantId || isLoadingProgress) {
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center gap-5 p-6" role="status">
                <HoloOrb scale={3} className="px-bob" title="Orbi" />
                <p className="px-label px-blink text-muted">Loading your progress</p>
            </div>
        );
    }

    const modeLabel = isPractice ? "Practice" : "Assignment";

    // ---------- Results ----------
    if (isFinished) {
        const accuracy = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
        const stats = [
            { label: "Correct", value: `${correctCount}/${questions.length}` },
            { label: "Accuracy", value: `${accuracy}%` },
            { label: "Best streak", value: `×${bestStreak}` },
        ];

        return (
            <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-4 py-10">
                <section aria-labelledby="results-title" className="px-panel flex flex-col items-center gap-6 p-6 text-center sm:p-8">
                    <Orbi mood={accuracy >= 50 ? "happy" : "sad"} scale={3} />
                    <div className="flex flex-col gap-3">
                        <h1 id="results-title" className="px-title text-lg sm:text-xl">{modeLabel} complete</h1>
                        <p className="text-lg text-muted">{quizTitle}</p>
                    </div>

                    <Score value={score} label="Final score" />

                    <dl className="grid w-full grid-cols-3 gap-2">
                        {stats.map(s => (
                            <div key={s.label} className="px-notch flex flex-col gap-2 bg-raised px-2 py-3">
                                <dt className="px-label text-[9px] text-muted">{s.label}</dt>
                                <dd className="font-pixel text-sm text-fg">{s.value}</dd>
                            </div>
                        ))}
                    </dl>

                    <p className="text-lg text-muted">
                        {accuracy >= 80 ? "Sharp run." : accuracy >= 50 ? "Solid run." : "Every miss is practice."}{" "}
                        {isPractice ? "Practice runs are cleared when you leave." : "Your answers are saved for your teacher."}
                    </p>

                    <button
                        type="button"
                        onClick={() => handleExit(true)}
                        disabled={isExiting}
                        className="px-btn px-btn-yellow px-btn-lg w-full"
                    >
                        {isExiting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                        {isExiting ? "Leaving" : "Back to dashboard"}
                    </button>
                </section>
            </main>
        );
    }

    // ---------- Playing ----------
    const typeMeta = kind && isBankType(kind) ? TYPE_META[kind] : null;
    const answeredCount = currentIndex + (phase === "revealed" ? 1 : 0);
    const locked = phase !== "answering";

    const optionState = (idx: number) => {
        if (phase === "revealed" && result) {
            if (options[idx] === currentQuestion.correctAnswer) return "correct";
            if (idx === result.chosenIndex) return "wrong";
            return "dim";
        }
        if (phase === "saving" && idx === pendingIndex) return "selected";
        if (phase === "saving") return "dim";
        return "idle";
    };

    return (
        <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6">

            {/* HUD */}
            <header className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setConfirmExit(true)}
                        className="px-btn px-btn-sm px-btn-ghost hover:[--btn:var(--px-7)] hover:[--btn-ink:var(--px-0)]"
                        aria-label={`Exit ${modeLabel.toLowerCase()}`}
                    >
                        <LogOut className="size-4" aria-hidden /><span className="hidden sm:inline">Exit</span>
                    </button>
                    <p className="min-w-0 flex-1 truncate px-1 text-lg text-muted">{quizTitle}</p>
                    <MusicControl track="answer-key-afternoon" />
                    <SoundToggle />
                    <ThemeToggle />
                </div>

                <div className="flex items-end gap-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                            <span className="px-label text-px-pink">{modeLabel}</span>
                            <span className="font-pixel text-[10px] text-fg">
                                Q {String(currentIndex + 1).padStart(2, "0")}/{String(questions.length).padStart(2, "0")}
                            </span>
                        </div>
                        <PixelBar value={answeredCount} max={questions.length || 1} segments={Math.min(Math.max(questions.length, 1), 20)} color="lime" label="Questions answered" />
                    </div>

                    <div className={`flex items-center gap-1.5 pb-0.5 ${streak >= 2 ? "" : "opacity-40 grayscale"}`} title="Answer streak">
                        <Sprite art={FLAME} scale={3} />
                        <span className="font-pixel text-xs text-px-orange"><span className="sr-only">Streak: </span>×{streak}</span>
                    </div>

                    <div className="hidden sm:block">
                        <Score value={score} />
                    </div>
                </div>
                <p className="flex items-center justify-between sm:hidden">
                    <span className="px-label text-px-pink">Score</span>
                    <span className="font-pixel text-sm text-fg px-glow">{String(score).padStart(6, "0")}</span>
                </p>
            </header>

            {/* Question */}
            <section aria-labelledby="question-text" className="px-panel flex flex-col gap-4 p-5 sm:p-7">
                {typeMeta && (
                    <span className={`px-label px-notch self-start px-2 py-1 text-px-void ${typeMeta.fill}`}>{typeMeta.label}</span>
                )}
                <h1 id="question-text" className={`${questionSize(currentQuestion.questionText)} text-balance font-semibold leading-snug`}>
                    {currentQuestion.questionText}
                </h1>
                <p className="sr-only" aria-live="polite">Question {currentIndex + 1} of {questions.length}</p>
            </section>

            {/* Answer area */}
            {isTyped ? (
                <form
                    className="flex flex-col gap-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (textAnswer.trim()) submitChoiceOrTyped(textAnswer.trim());
                    }}
                >
                    <label htmlFor="typed-answer" className="sr-only">Your answer</label>
                    {isEssay ? (
                        <>
                            <textarea
                                id="typed-answer"
                                ref={textRef}
                                value={textAnswer}
                                onChange={(e) => setTextAnswer(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && textAnswer.trim()) {
                                        e.preventDefault();
                                        submitChoiceOrTyped(textAnswer.trim());
                                    }
                                }}
                                disabled={locked}
                                rows={6}
                                placeholder="Write your answer in a few sentences."
                                className="px-input min-h-40 w-full resize-y px-4 py-3 disabled:opacity-60"
                            />
                            <p className="flex justify-between gap-3 text-base text-muted">
                                <span>Orbi grades essays for meaning, not exact wording.</span>
                                <span className="shrink-0 tabular-nums">{textAnswer.trim() ? textAnswer.trim().split(/\s+/).length : 0} words</span>
                            </p>
                        </>
                    ) : (
                        <input
                            id="typed-answer"
                            ref={textRef}
                            type="text"
                            value={textAnswer}
                            onChange={(e) => setTextAnswer(e.target.value)}
                            disabled={locked}
                            autoComplete="off"
                            placeholder="Type your answer"
                            className="px-input w-full px-4 py-4 text-center text-xl disabled:opacity-60"
                        />
                    )}

                    {phase !== "revealed" && (
                        <button type="submit" disabled={locked || !textAnswer.trim()} className="px-btn px-btn-yellow px-btn-lg w-full">
                            {locked && <Loader2 className="size-4 animate-spin" aria-hidden />}
                            {phase === "grading" ? "Grading" : phase === "saving" ? "Saving" : "Submit answer"}
                        </button>
                    )}
                    {phase === "answering" && (
                        <p className="hidden text-center text-base text-muted sm:block">
                            {isEssay ? <>Press <kbd className="font-pixel text-[10px]">Ctrl+Enter</kbd> to submit</> : <>Press <kbd className="font-pixel text-[10px]">Enter</kbd> to submit</>}
                        </p>
                    )}
                </form>
            ) : (
                <div role="group" aria-label="Answer options" className={`grid gap-3 ${options.length > 2 ? "sm:grid-cols-2" : ""}`}>
                    {options.map((option, idx) => {
                        const state = optionState(idx);
                        const shell =
                            state === "correct" ? "bg-px-lime text-px-void border-px-void" :
                                state === "wrong" ? "bg-px-red text-px-void border-px-void" :
                                    state === "selected" ? "bg-raised text-fg border-px-cyan" :
                                        "bg-surface text-fg border-frame-strong";
                        const interactive = state === "idle" ? "hover:-translate-y-0.5 hover:border-px-cyan active:translate-y-0" : "";
                        const showPoints = state === "correct" && result?.chosenIndex === idx && result.points > 0;

                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => submitChoiceOrTyped(option, idx)}
                                disabled={locked}
                                data-sfx="select"
                                aria-keyshortcuts={`${idx + 1} ${LETTERS[idx] ?? ""}`.trim()}
                                className={`px-notch flex min-h-16 items-center gap-3 border-4 py-2 pl-2 pr-4 text-left text-lg leading-tight transition-transform duration-75 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-px-cyan disabled:cursor-default ${shell} ${interactive} ${state === "dim" ? "opacity-45" : ""}`}
                            >
                                <span className={`px-notch flex size-9 shrink-0 items-center justify-center border-4 border-px-void font-pixel text-[11px] text-px-void ${state === "correct" || state === "wrong" ? "bg-px-snow" : ANSWER_COLORS[idx % 4]}`}>
                                    {state === "correct" ? <Check className="size-4" strokeWidth={4} aria-hidden /> :
                                        state === "wrong" ? <X className="size-4" strokeWidth={4} aria-hidden /> :
                                            state === "selected" ? <Loader2 className="size-4 animate-spin" aria-hidden /> :
                                                LETTERS[idx % 4]}
                                </span>
                                <span className="min-w-0 flex-1">{option}</span>
                                {showPoints && <span className="font-pixel text-[10px]">+{result!.points.toLocaleString()}</span>}
                                {state === "correct" && <span className="sr-only">(correct answer)</span>}
                                {state === "wrong" && <span className="sr-only">(your answer, wrong)</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Grading */}
            {phase === "grading" && (
                <div className="px-panel flex items-center gap-4 p-4" role="status" aria-live="polite">
                    <HoloOrb scale={2} className="px-bob shrink-0" title="Orbi" />
                    <p className="text-lg text-muted">
                        Orbi is grading your answer. The first one can take up to a minute while the grader wakes up.
                    </p>
                </div>
            )}

            {/* Feedback */}
            {phase === "revealed" && result && (
                <section aria-label="Feedback" className="px-panel flex flex-col gap-5 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <Banner
                            tone={result.correct ? "lime" : "red"}
                            title={result.correct ? "Correct" : "Miss"}
                            detail={result.correct ? `+${result.points.toLocaleString()} pts` : (result.lostStreak ?? 0) >= 2 ? `Streak ×${result.lostStreak} lost` : undefined}
                        />
                        {result.correct && streak >= 2 && (
                            <span className="font-pixel text-[10px] text-px-orange">Streak ×{streak}</span>
                        )}
                    </div>

                    {isTyped && (
                        <dl className="grid gap-3 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <dt className="px-label text-[9px] text-muted">Your answer</dt>
                                <dd className="line-clamp-4 text-lg">{result.typed}</dd>
                            </div>
                            {currentQuestion.correctAnswer && (
                                <div className="flex flex-col gap-1.5">
                                    <dt className="px-label text-[9px] text-muted">{isEssay ? "What graders look for" : "Expected answer"}</dt>
                                    <dd className="text-lg">{currentQuestion.correctAnswer}</dd>
                                </div>
                            )}
                        </dl>
                    )}

                    {(result.feedback || currentQuestion.explanation) && (
                        <div className="flex items-start gap-3 border-t-4 border-dashed border-frame pt-4">
                            <HoloOrb mood={result.correct ? "happy" : "sad"} scale={1} spin={false} className="mt-1 shrink-0" title="Orbi" />
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <p className="px-label text-[9px] text-px-cyan">{result.feedback ? "Orbi's feedback" : "Why"}</p>
                                <p className="text-lg leading-snug">{result.feedback || currentQuestion.explanation}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <span className="hidden text-base text-muted sm:inline">Press <kbd className="font-pixel text-[10px]">Enter</kbd></span>
                        <button ref={nextRef} type="button" onClick={goNext} className="px-btn px-btn-yellow">
                            {isLast ? "See results" : "Next question"}
                        </button>
                    </div>
                </section>
            )}

            {confirmExit && (
                <Dialog
                    title={isPractice ? "Leave practice?" : "Leave assignment?"}
                    onClose={() => setConfirmExit(false)}
                    locked={isExiting}
                    size="sm"
                    actions={
                        <>
                            <button type="button" onClick={() => setConfirmExit(false)} disabled={isExiting} className="px-btn px-btn-ghost">Keep playing</button>
                            <button type="button" onClick={() => handleExit(false)} disabled={isExiting} className="px-btn px-btn-red">
                                {isExiting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                                Leave
                            </button>
                        </>
                    }
                >
                    <p className="text-lg text-muted">
                        {isPractice
                            ? "This practice run and its score will be deleted."
                            : "Your answers so far are saved. Open this game again on this device to pick up where you left off."}
                    </p>
                </Dialog>
            )}
        </div>
    );
}
