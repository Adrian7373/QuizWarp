"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, WifiOff } from "lucide-react";
import toast from "react-hot-toast";
import { submitAnswer, getParticipantProgress } from "../actions";
import { submitAndGradeEssay } from "@/app/actions";
import { Orbi, PixelBar } from "@/app/_components/arcade/Hud";
import HoloOrb from "@/app/_components/arcade/HoloOrb";
import SoundToggle from "@/app/_components/arcade/SoundToggle";
import MusicControl from "@/app/_components/arcade/MusicControl";
import { playSfx } from "@/app/_components/arcade/sfx";
import {
    AnswerStreak, Key, LETTERS, OptionButton, OptionResult, TimerBar, TYPE_CHIP, Verdict,
    formatPoints, kindOf, type LiveQuestion, type OptionState,
} from "./live/LiveBits";

interface LivePlayerProps {
    sessionId: string;
    quizTitle: string;
    questions: any[];
    initialIndex: number;
    initialStatus: string;
}

/** Choice answers must match exactly; typed (identification) answers ignore case and outer spaces. */
function checkAnswer(q: LiveQuestion, answer: string) {
    if (kindOf(q) === "typed") return answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    return answer === q.correctAnswer;
}

export default function LivePlayer({ sessionId, quizTitle, initialStatus, questions, initialIndex }: LivePlayerProps) {
    const router = useRouter();
    const supabase = createClient();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // AI grading state
    const [isGrading, setIsGrading] = useState(false);
    const [aiResult, setAiResult] = useState<{ feedback: string, score: number } | null>(null);

    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isLoadingProgress, setIsLoadingProgress] = useState(true);

    // Synced Game State
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isFinished, setIsFinished] = useState(initialStatus === "FINISHED");
    const [isWaiting, setIsWaiting] = useState(initialStatus === "WAITING");

    // Player Stats
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);

    // Local Question State
    const [hasAnswered, setHasAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    // Points for the current question: a number once known, "pending" while saved offline.
    const [lastPoints, setLastPoints] = useState<number | "pending" | null>(null);

    // Offline resilience states
    const [isOffline, setIsOffline] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Screen reader announcements (one polite live region for the whole player)
    const [announcement, setAnnouncement] = useState("");
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    // 1. Authenticate & Rehydrate
    useEffect(() => {
        async function initPlayer() {
            const storedId = localStorage.getItem(`participant_${sessionId}`);
            if (!storedId) {
                toast.error("You need to join the game first!");
                router.push("/join");
                return;
            }

            setParticipantId(storedId);
            const progress = await getParticipantProgress(storedId);

            if (progress.success) {
                setScore(progress.score || 0);
                setStreak(progress.streak || 0);
                // Check if they already answered the CURRENT question (handles disconnects).
                // Choice answers are saved under the question index, essays under the question id.
                const answered = progress.answeredQuestionIds ?? [];
                const currentId = questions[initialIndex]?.id;
                if (answered.includes(initialIndex.toString()) || (currentId && answered.includes(currentId))) {
                    setHasAnswered(true);
                }
            }
            setIsLoadingProgress(false);
        }
        initPlayer();
    }, [sessionId, router, initialIndex, questions]);

    const currentQuestion = questions[currentIndex] as LiveQuestion | undefined;

    // 2. Reset timer when the teacher advances the question
    useEffect(() => {
        if (currentQuestion?.timeLimitSeconds) {
            setTimeLeft(currentQuestion.timeLimitSeconds);
        } else {
            setTimeLeft(null);
        }
    }, [currentIndex, currentQuestion]);

    // 3. Local countdown loop
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || hasAnswered || isWaiting) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev && prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, hasAnswered, isWaiting]);

    // 4. Supabase Realtime: Listen for Teacher's Commands
    useEffect(() => {
        const channel = supabase
            .channel('live-game-sync')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'GameSession',
                    filter: `id=eq.${sessionId}`
                },
                (payload) => {

                    if (payload.eventType === 'DELETE') {
                        toast.error("The host has cancelled the game.");
                        window.location.href = "/join";
                        return;
                    }

                    if (payload.eventType === 'UPDATE') {
                        const session = payload.new;

                        // Handle Status Changes
                        if (session.status === 'FINISHED') {
                            setIsFinished(true);
                        } else if (session.status === 'IN_PROGRESS') {
                            setIsWaiting(false); // The host clicked Start Game!
                        }

                        // Handle Question Index Changes
                        if (session.currentQuestionIndex > currentIndex) {
                            setCurrentIndex(session.currentQuestionIndex);
                            // Reset local states for the new question!
                            setHasAnswered(false);
                            setSelectedAnswer(null);
                            setIsCorrect(null);
                            setIsGrading(false);
                            setAiResult(null);
                            setLastPoints(null);
                            setQuestionStartTime(Date.now());
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, currentIndex, supabase]);

    useEffect(() => {
        // Set initial status
        setIsOffline(!navigator.onLine);

        const handleOnline = async () => {
            setIsOffline(false);
            setSyncing(true);
            let syncToast: string | undefined;

            try {
                const queue = JSON.parse(localStorage.getItem(`offline_queue_${sessionId}`) || "[]");

                if (queue.length > 0) {
                    syncToast = toast.loading("Sending saved answers…");

                    for (const payload of queue) {
                        if (payload.type === 'MCQ') {
                            await submitAnswer(
                                payload.participantId,
                                payload.questionIndex,
                                payload.answer,
                                payload.isCorrect,
                                payload.timeTakenMs
                            );
                        } else if (payload.type === 'ESSAY') {
                            // Essays grade in the background when reconnected
                            await submitAndGradeEssay(
                                payload.participantId,
                                payload.questionId,
                                payload.answer,
                                "English",
                                payload.timeTakenMs
                            );
                        }
                    }

                    // Clear queue after successful sync
                    localStorage.removeItem(`offline_queue_${sessionId}`);
                    toast.success("Saved answers sent.", { id: syncToast });
                    syncToast = undefined;
                }
            } catch (error) {
                console.error("Failed to sync offline queue:", error);
                // Keep the queue; it is retried the next time the connection comes back.
                if (syncToast) toast.error("Couldn't send saved answers yet. They stay on this device.", { id: syncToast });
            } finally {
                setSyncing(false);
            }
        };

        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [sessionId]);

    // ---------- Feedback: sound and announcements ----------

    /** Uses the server's streak when it sent one, else counts locally (offline, essays). */
    const bumpStreak = useCallback((correct: boolean, serverStreak?: number) => {
        setStreak(prev => (typeof serverStreak === "number" ? serverStreak : correct ? prev + 1 : 0));
    }, []);
    useEffect(() => { setBestStreak(b => Math.max(b, streak)); }, [streak]);

    // Game start and game over jingles (only if the player turned sound on).
    const wasWaiting = useRef(isWaiting);
    useEffect(() => {
        if (wasWaiting.current && !isWaiting) {
            playSfx("start");
            setAnnouncement("The game has started.");
        }
        wasWaiting.current = isWaiting;
    }, [isWaiting]);

    useEffect(() => {
        if (isFinished) {
            playSfx("levelup");
            setAnnouncement("Game over.");
        }
    }, [isFinished]);

    // Announce each new question, then key moments of its countdown.
    useEffect(() => {
        if (isWaiting || isFinished || isLoadingProgress || !currentQuestion) return;
        const limit = currentQuestion.timeLimitSeconds;
        setAnnouncement(`Question ${currentIndex + 1} of ${questions.length}. ${currentQuestion.questionText}${limit ? ` ${limit} seconds.` : ""}`);
    }, [currentIndex, currentQuestion, questions.length, isWaiting, isFinished, isLoadingProgress]);

    useEffect(() => {
        if (hasAnswered || isWaiting) return;
        if (timeLeft === 10 || timeLeft === 5) setAnnouncement(`${timeLeft} seconds left.`);
        if (timeLeft === 0) {
            setAnnouncement("Time's up. Waiting for the host.");
            playSfx("wrong");
        }
    }, [timeLeft, hasAnswered, isWaiting]);

    // Put the cursor in the answer box on each typed question (only with a mouse, so phones don't pop the keyboard over the question).
    useEffect(() => {
        if (hasAnswered || isWaiting || !currentQuestion || kindOf(currentQuestion) === "choice") return;
        if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();
    }, [currentIndex, currentQuestion, hasAnswered, isWaiting]);

    // ---------- Answer handlers ----------

    const handleShortAnswerSubmit = async () => {
        if (!currentQuestion || !selectedAnswer || selectedAnswer.trim() === '') return;

        setHasAnswered(true);
        setAnnouncement("Answer locked in. Orbi is grading it.");
        const timeTakenMs = Date.now() - questionStartTime;

        const payload = {
            type: 'ESSAY',
            participantId: participantId!,
            questionId: currentQuestion.id,
            answer: selectedAnswer,
            timeTakenMs
        };

        if (!navigator.onLine) {
            // OFFLINE: Queue it up and show a pending state
            const queue = JSON.parse(localStorage.getItem(`offline_queue_${sessionId}`) || "[]");
            queue.push(payload);
            localStorage.setItem(`offline_queue_${sessionId}`, JSON.stringify(queue));
            setAiResult({ feedback: "Your answer is saved on this device. Orbi grades it when you're back online.", score: 0 });
            setLastPoints("pending");
            setAnnouncement("You're offline. Your answer is saved and will be graded when you reconnect.");
            return;
        }

        // ONLINE: Normal AI Grading
        setIsGrading(true);
        try {
            const response = await submitAndGradeEssay(
                participantId!,
                currentQuestion.id,
                selectedAnswer,
                "English",
                timeTakenMs,
            );

            setIsGrading(false);

            if (response.success) {
                const points = response.isCorrect ? (response.pointsEarned || 0) : 0;
                setIsCorrect(response.isCorrect);
                setAiResult({ feedback: response.feedback, score: response.score });
                setLastPoints(points);
                bumpStreak(!!response.isCorrect);
                if (response.isCorrect) setScore(prev => prev + points);
                playSfx(response.isCorrect ? "correct" : "wrong");
                setAnnouncement(`${response.isCorrect ? "Correct" : "Not quite"}. Scored ${response.score} out of 10${points ? `, plus ${points} points` : ""}. ${response.feedback}`);
            } else {
                toast.error("Couldn't grade your answer. Try submitting again.");
                setAnnouncement("Couldn't grade your answer. Try submitting again.");
                setHasAnswered(false);
            }
        } catch (error) {
            setIsGrading(false);
            const queue = JSON.parse(localStorage.getItem(`offline_queue_${sessionId}`) || "[]");
            queue.push(payload);
            localStorage.setItem(`offline_queue_${sessionId}`, JSON.stringify(queue));
            setAiResult({ feedback: "The connection dropped. Your answer is saved on this device and gets graded when you reconnect.", score: 0 });
            setLastPoints("pending");
            setAnnouncement("The connection dropped. Your answer is saved and will be graded later.");
        }
    };

    const handleAnswerClick = async (answer: string) => {
        if (!currentQuestion || hasAnswered || !participantId || timeLeft === 0) return;

        const timeTakenMs = Date.now() - questionStartTime;
        const isAnswerCorrect = checkAnswer(currentQuestion, answer);

        setHasAnswered(true);
        setSelectedAnswer(answer);
        setIsCorrect(isAnswerCorrect);
        playSfx(isAnswerCorrect ? "correct" : "wrong");

        // Optimistically update score assuming it will sync
        if (isAnswerCorrect) {
            // Give base points optimistically (backend will calculate exact points later)
            setScore(prev => prev + 1000);
        }
        setLastPoints(isAnswerCorrect ? 1000 : 0);

        const payload = {
            type: 'MCQ',
            participantId,
            questionIndex: currentIndex.toString(),
            answer,
            isCorrect: isAnswerCorrect,
            timeTakenMs
        };

        if (!navigator.onLine) {
            // OFFLINE: Save to queue
            const queue = JSON.parse(localStorage.getItem(`offline_queue_${sessionId}`) || "[]");
            queue.push(payload);
            localStorage.setItem(`offline_queue_${sessionId}`, JSON.stringify(queue));
            bumpStreak(isAnswerCorrect);
            if (isAnswerCorrect) setLastPoints("pending");
            setAnnouncement(`${isAnswerCorrect ? "Correct" : "Wrong"}. You're offline, so the answer is saved and sent when you reconnect.`);
            return;
        }

        // ONLINE: Normal submission
        try {
            const response = await submitAnswer(
                participantId,
                currentIndex.toString(),
                answer,
                isAnswerCorrect,
                timeTakenMs
            );
            if (response.success && response.pointsEarned) {
                // Correct optimistic score with actual calculated score
                setScore(prev => (prev - 1000) + response.pointsEarned!);
                setLastPoints(response.pointsEarned);
            }
            bumpStreak(isAnswerCorrect, response.success ? response.currentStreak : undefined);
            const points = response.success && response.pointsEarned ? response.pointsEarned : isAnswerCorrect ? 1000 : 0;
            setAnnouncement(isAnswerCorrect
                ? `Correct, plus ${points} points. Waiting for the host.`
                : `Wrong. The answer was ${currentQuestion.correctAnswer}. Waiting for the host.`);
        } catch (error) {
            // Fallback if the network drops exactly during the request
            const queue = JSON.parse(localStorage.getItem(`offline_queue_${sessionId}`) || "[]");
            queue.push(payload);
            localStorage.setItem(`offline_queue_${sessionId}`, JSON.stringify(queue));
            bumpStreak(isAnswerCorrect);
            if (isAnswerCorrect) setLastPoints("pending");
            setAnnouncement(`${isAnswerCorrect ? "Correct" : "Wrong"}. The connection dropped, so the answer is saved and sent later.`);
        }
    };

    // Keyboard: 1-4 or A-D picks an answer on choice questions.
    const canPick = !!currentQuestion && kindOf(currentQuestion) === "choice" && !hasAnswered && timeLeft !== 0
        && !isWaiting && !isFinished && !isLoadingProgress && !!participantId;
    const pickRef = useRef(handleAnswerClick);
    useEffect(() => { pickRef.current = handleAnswerClick; });
    useEffect(() => {
        if (!canPick || !currentQuestion) return;
        const options = currentQuestion.options ?? [];
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
            const target = e.target as HTMLElement | null;
            if (target?.closest("input, textarea, select, [contenteditable]")) return;
            const k = e.key.toUpperCase();
            const idx = /^[1-4]$/.test(k) ? Number(k) - 1 : LETTERS.indexOf(k);
            if (idx < 0 || idx >= options.length) return;
            e.preventDefault();
            void pickRef.current(options[idx]);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [canPick, currentQuestion]);

    // ---------- Screens ----------

    const liveRegion = <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>;

    const topBar = (
        <header className="flex items-center gap-3">
            {isFinished ? (
                <span className="px-notch inline-flex shrink-0 items-center bg-raised px-2 py-1.5 font-pixel text-[9px] text-fg">Ended</span>
            ) : (
                <span className="px-notch inline-flex shrink-0 items-center gap-2 bg-px-pink px-2 py-1.5 font-pixel text-[9px] text-px-void">
                    <span aria-hidden className="px-blink size-2 bg-px-void" />Live
                </span>
            )}
            <p className="min-w-0 flex-1 truncate text-lg text-muted">
                <span className="sr-only">Live game: </span>{quizTitle}
            </p>
            <MusicControl track="high-score-picnic" />
            <SoundToggle />
        </header>
    );

    const shell = (children: React.ReactNode, center = false) => (
        <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8">
            {/* Stepped pop for verdicts; rests under reduced motion (globals.css). */}
            <style>{`@keyframes live-pop { from { transform: scale(0.92); } to { transform: scale(1); } }`}</style>
            {topBar}
            {liveRegion}
            {center ? <div className="flex flex-1 flex-col items-center justify-center">{children}</div> : children}
        </main>
    );

    if (!participantId || isLoadingProgress) {
        return shell(
            <div className="flex flex-col items-center gap-5 text-center" role="status">
                <HoloOrb mood="idle" scale={3} />
                <p className="px-label px-blink text-muted">Connecting to the game</p>
            </div>,
            true,
        );
    }

    if (isFinished) {
        return shell(
            <section className="px-panel flex w-full max-w-xl flex-col gap-6 p-6 sm:p-8" aria-labelledby="live-over">
                <h1 id="live-over" className="font-pixel text-xl leading-relaxed text-px-pink px-glow sm:text-2xl">Game over</h1>
                <div className="grid grid-cols-2 gap-3">
                    <div className="px-notch flex flex-col gap-2 border-4 border-frame bg-screen p-4">
                        <span className="px-label text-muted">Final score</span>
                        <span className="font-pixel text-lg text-fg px-glow sm:text-2xl">{formatPoints(score)}</span>
                    </div>
                    <div className="px-notch flex flex-col gap-2 border-4 border-frame bg-screen p-4">
                        <span className="px-label text-muted">Best streak</span>
                        <AnswerStreak count={bestStreak} />
                    </div>
                </div>
                <Orbi mood="happy" say="The podium and final standings are on the host's screen." />
                <div className="flex w-full flex-col gap-2 sm:flex-row">
                    <Link href="/join" data-sfx="start" className="px-btn px-btn-lg px-btn-yellow w-full sm:flex-1">Join another game</Link>
                    <button onClick={() => router.push('/')} className="px-btn px-btn-lg px-btn-ghost w-full sm:flex-1">Home</button>
                </div>
            </section>,
            true,
        );
    }

    if (isWaiting) {
        return shell(
            <section className="px-panel flex w-full max-w-xl flex-col items-center gap-6 p-6 text-center sm:p-10" aria-labelledby="live-lobby">
                <h1 id="live-lobby" className="px-title text-xl sm:text-2xl">You&apos;re in!</h1>
                <p className="max-w-[36ch] text-lg text-muted">
                    Watch the host&apos;s screen. The first question shows up here as soon as the game starts.
                </p>
                <Orbi mood="idle" scale={3} />
                <p className="px-label px-blink text-px-pink">Waiting for the host</p>
                <dl className="grid w-full grid-cols-2 gap-3 border-t-4 border-dashed border-frame pt-5 text-left">
                    <div>
                        <dt className="px-label text-muted">Questions</dt>
                        <dd className="mt-1 font-pixel text-sm">{questions.length}</dd>
                    </div>
                    <div>
                        <dt className="px-label text-muted">Your score</dt>
                        <dd className="mt-1 font-pixel text-sm">{formatPoints(score)}</dd>
                    </div>
                </dl>
                <p className="hidden text-base text-muted sm:block">Tip: answer with the keys 1 to 4 or A to D.</p>
            </section>,
            true,
        );
    }

    if (!currentQuestion) {
        return shell(
            <div className="flex flex-col items-center gap-5 text-center" role="status">
                <Orbi mood="idle" scale={3} />
                <p className="px-label px-blink text-muted">Waiting for the next question</p>
            </div>,
            true,
        );
    }

    const kind = kindOf(currentQuestion);
    const options = currentQuestion.options ?? [];
    const chip = TYPE_CHIP[currentQuestion.questionType ?? ""] ?? (kind === "choice" ? TYPE_CHIP.MULTIPLE_CHOICE : TYPE_CHIP.IDENTIFICATION);
    const limit = currentQuestion.timeLimitSeconds ?? null;
    const timeUp = timeLeft === 0 && !hasAnswered;

    const hud = (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="px-notch bg-px-void px-2 py-1 font-pixel text-[10px] text-px-snow">
                    Q{currentIndex + 1}<span className="opacity-60">/{questions.length}</span>
                </span>
                <span className={`px-notch px-1.5 py-1 font-pixel text-[9px] text-px-void ${chip.fill}`}>{chip.label}</span>
                <div className="ml-auto flex items-center gap-5">
                    <AnswerStreak count={streak} />
                    <span className="inline-flex items-baseline gap-2">
                        <span className="px-label text-muted">Score</span>
                        <span className="font-pixel text-sm text-fg px-glow">{formatPoints(score)}</span>
                    </span>
                </div>
            </div>
            {hasAnswered ? (
                <div className="px-notch flex items-center gap-3 border-4 border-px-cyan bg-raised px-3 py-2">
                    <span aria-hidden className="size-3 bg-px-cyan" />
                    <span className="font-pixel text-[11px] text-px-cyan px-glow">Locked in</span>
                    <span className="ml-auto text-base text-muted">
                        {isGrading ? "Grading…" : <>Waiting for the host<span className="px-blink">…</span></>}
                    </span>
                </div>
            ) : limit && timeLeft !== null ? (
                <TimerBar timeLeft={timeLeft} limit={limit} />
            ) : (
                <p className="px-label text-muted">No time limit</p>
            )}
        </div>
    );

    const offlineBanner = (isOffline || syncing) && (
        <div className="px-notch flex items-start gap-3 border-4 border-px-void bg-px-orange px-4 py-3 text-px-void">
            {syncing ? <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin" aria-hidden /> : <WifiOff className="mt-0.5 size-5 shrink-0" aria-hidden />}
            <p className="text-base font-semibold">
                {syncing ? "Back online. Sending your saved answers…" : "You're offline. Keep playing: answers save on this device and send when you reconnect."}
            </p>
        </div>
    );

    const questionPanel = (compact: boolean) => (
        <section className={`px-panel ${compact ? "p-4 sm:p-5" : "flex min-h-40 items-center p-5 sm:min-h-48 sm:p-8"}`}>
            <h1 className={`font-semibold leading-snug text-balance ${compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}>
                {currentQuestion.questionText}
            </h1>
        </section>
    );

    const grid = options.length >= 2 ? "sm:grid-cols-2" : "";

    /** The options after the round: your pick, the right answer, the rest dimmed. */
    const revealList = (picked: string | null) => (
        <ul className={`grid gap-2 sm:gap-3 ${grid}`} aria-label="Answers">
            {options.map((option, idx) => {
                const right = option === currentQuestion.correctAnswer;
                const mine = picked === option;
                const state: OptionState = right ? "correct" : mine ? "wrong" : "dim";
                return <OptionResult key={idx} index={idx} text={option} state={state} picked={mine} />;
            })}
        </ul>
    );

    // --- Stage: what the player sees below the HUD ---
    let stage: React.ReactNode;

    if (timeUp) {
        stage = (
            <>
                <Verdict tone="red" title="Time's up" detail="No answer" />
                {questionPanel(true)}
                {kind === "choice" ? revealList(null) : kind === "typed" && (
                    <p className="px-notch border-4 border-px-lime bg-screen px-4 py-3 text-lg">
                        <span className="font-pixel text-[11px] text-px-lime">Answer</span> <span className="font-semibold">{currentQuestion.correctAnswer}</span>
                    </p>
                )}
                <Orbi mood="sad" say="Too slow this round. Get ready for the next one." />
            </>
        );
    } else if (kind === "essay") {
        const graded = hasAnswered && !isGrading && aiResult && isCorrect !== null;
        const saved = hasAnswered && !isGrading && aiResult && isCorrect === null;
        stage = (
            <>
                {graded && (
                    <Verdict
                        tone={isCorrect ? "lime" : "red"}
                        title={isCorrect ? "Correct!" : "Not quite"}
                        detail={typeof lastPoints === "number" && lastPoints > 0 ? `+${formatPoints(lastPoints)}` : undefined}
                    />
                )}
                {questionPanel(hasAnswered)}
                {!hasAnswered ? (
                    <form
                        className="flex flex-col gap-3"
                        onSubmit={(e) => { e.preventDefault(); void handleShortAnswerSubmit(); }}
                    >
                        <label htmlFor="live-essay" className="text-base font-semibold">Your answer</label>
                        <textarea
                            id="live-essay"
                            ref={(el) => { inputRef.current = el; }}
                            value={selectedAnswer || ''}
                            onChange={(e) => setSelectedAnswer(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void handleShortAnswerSubmit(); }
                            }}
                            rows={6}
                            placeholder="Write your answer in your own words."
                            className="px-input min-h-40 w-full resize-y text-lg"
                        />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="hidden text-sm text-muted sm:block">Orbi grades it out of 10. Ctrl + Enter submits.</p>
                            <button type="submit" disabled={!selectedAnswer?.trim()} data-sfx="select" className="px-btn px-btn-lg px-btn-yellow w-full sm:w-auto">
                                Submit for grading
                            </button>
                        </div>
                    </form>
                ) : isGrading ? (
                    <div className="px-panel flex items-center gap-4 p-5" role="status">
                        <HoloOrb mood="idle" scale={2} />
                        <p className="text-lg">Orbi is grading your answer<span className="px-blink">…</span></p>
                    </div>
                ) : graded ? (
                    <section className={`px-notch flex flex-col gap-4 border-4 bg-screen p-4 sm:p-5 ${isCorrect ? "border-px-lime" : "border-px-red"}`} aria-label="AI feedback">
                        <div className="flex items-center gap-3">
                            <span className="px-label whitespace-nowrap text-muted">AI score</span>
                            <PixelBar value={aiResult!.score} max={10} segments={10} color={isCorrect ? "lime" : "red"} label="AI score out of 10" />
                            <span className="whitespace-nowrap font-pixel text-xs">{aiResult!.score}/10</span>
                        </div>
                        <div className="flex gap-3">
                            <span className="shrink-0"><HoloOrb mood={isCorrect ? "happy" : "sad"} scale={1} spin={false} /></span>
                            <p className="max-w-[60ch] text-lg leading-relaxed">{aiResult!.feedback}</p>
                        </div>
                        {selectedAnswer && (
                            <details className="text-base text-muted">
                                <summary className="cursor-pointer">Your answer</summary>
                                <p className="mt-2 whitespace-pre-wrap text-fg">{selectedAnswer}</p>
                            </details>
                        )}
                    </section>
                ) : saved ? (
                    <div className="px-notch flex gap-3 border-4 border-frame-strong bg-screen p-4">
                        <WifiOff className="mt-1 size-5 shrink-0 text-px-orange" aria-hidden />
                        <p className="text-lg">{aiResult!.feedback}</p>
                    </div>
                ) : (
                    <Orbi mood="idle" say="You already answered this one. Hang tight for the next question." />
                )}
            </>
        );
    } else if (hasAnswered) {
        // Choice and typed answers, locked in.
        const known = isCorrect !== null;
        stage = (
            <>
                {known ? (
                    <Verdict
                        tone={isCorrect ? "lime" : "red"}
                        title={isCorrect ? "Correct!" : "Wrong"}
                        detail={isCorrect ? (lastPoints === "pending" ? "Points sync later" : typeof lastPoints === "number" ? `+${formatPoints(lastPoints)}` : undefined) : streak === 0 && bestStreak > 0 ? "Streak lost" : undefined}
                    />
                ) : (
                    <Verdict tone="steel" title="Answer saved" />
                )}
                {questionPanel(true)}
                {kind === "choice" && known ? revealList(selectedAnswer) : kind === "typed" && known ? (
                    <div className="flex flex-col gap-2">
                        <p className={`px-notch border-4 bg-screen px-4 py-3 text-lg ${isCorrect ? "border-px-lime" : "border-px-red"}`}>
                            <span className="font-pixel text-[11px] text-muted">You said</span> <span className="font-semibold">{selectedAnswer}</span>
                        </p>
                        {!isCorrect && (
                            <p className="px-notch border-4 border-px-lime bg-screen px-4 py-3 text-lg">
                                <span className="font-pixel text-[11px] text-px-lime">Answer</span> <span className="font-semibold">{currentQuestion.correctAnswer}</span>
                            </p>
                        )}
                    </div>
                ) : null}
                <Orbi
                    mood={!known ? "idle" : isCorrect ? "happy" : "sad"}
                    say={!known
                        ? "You already answered this one. Hang tight for the next question."
                        : isCorrect
                            ? (streak >= 2 ? `${streak} in a row. Keep it going.` : "Nice one. Waiting for everyone else.")
                            : "Shake it off. The next question is yours."}
                />
            </>
        );
    } else if (kind === "typed") {
        stage = (
            <>
                {questionPanel(false)}
                <form
                    className="flex flex-col gap-3"
                    onSubmit={(e) => { e.preventDefault(); const v = (selectedAnswer || "").trim(); if (v) void handleAnswerClick(v); }}
                >
                    <label htmlFor="live-typed" className="text-base font-semibold">Your answer</label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            id="live-typed"
                            ref={(el) => { inputRef.current = el; }}
                            type="text"
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            value={selectedAnswer || ''}
                            onChange={(e) => setSelectedAnswer(e.target.value)}
                            placeholder="Type the answer"
                            className="px-input w-full text-xl"
                        />
                        <button type="submit" disabled={!selectedAnswer?.trim()} data-sfx="none" className="px-btn px-btn-lg px-btn-yellow w-full shrink-0 sm:w-auto">
                            Lock in <Key>Enter</Key>
                        </button>
                    </div>
                    <p className="text-sm text-muted">Capitals don&apos;t matter.</p>
                </form>
            </>
        );
    } else {
        stage = (
            <>
                {questionPanel(false)}
                <div className={`grid gap-2 sm:gap-3 ${grid}`} role="group" aria-label="Answers. Press 1 to 4 or A to D.">
                    {options.map((option, idx) => (
                        <OptionButton key={idx} index={idx} text={option} onPick={() => void handleAnswerClick(option)} />
                    ))}
                </div>
                <p className="hidden text-center text-sm text-muted sm:block">Press 1 to {Math.min(options.length, 4)} or A to {LETTERS[Math.min(options.length, 4) - 1]} to answer.</p>
            </>
        );
    }

    return shell(
        <>
            {hud}
            {offlineBanner}
            <div key={currentIndex} className="flex flex-col gap-4">{stage}</div>
        </>,
    );
}
