"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { endSessionEarly } from "@/app/actions";
import { ChevronRight, Eye, Loader2, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { updateQuestionIndex } from "../../actions";
import { createClient } from "@/utils/supabase/client";
import Dialog from "@/app/_components/arcade/Dialog";
import { playSfx } from "@/app/_components/arcade/sfx";
import FactionRaceTrack from "./FactionRaceTrack";
import { HostShell, HostTopBar, Kbd } from "../../_components/HostBits";
import {
    AnsweredCounter, HostOption, HostTimer, Leaderboard, RoundResult,
    kindOf, typeChipOf, type HostParticipant, type HostQuestion,
} from "./HostPlayBits";

interface HostPlayClientProps {
    sessionId: string;
    quizTitle: string;
    questions: HostQuestion[];
    initialIndex: number;
}

/** Keys that drive the host's main action, when focus isn't on a control that handles them itself. */
const PRIMARY_KEYS = new Set([" ", "Enter", "n", "N", "ArrowRight"]);

export default function HostPlayClient({ sessionId, quizTitle, questions, initialIndex }: HostPlayClientProps) {
    const router = useRouter();
    const supabase = createClient();

    // Flow States
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isAdvancing, setIsAdvancing] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [confirmEnd, setConfirmEnd] = useState(false);
    const [announcement, setAnnouncement] = useState("");

    const [viewState, setViewState] = useState<"QUESTION" | "STANDINGS">("QUESTION");

    const [participants, setParticipants] = useState<HostParticipant[]>([]);
    const [factions, setFactions] = useState<{ id: string; name: string }[]>([]);
    const [maxFactions, setMaxFactions] = useState(0);

    // Who answered this question, derived from the score updates the standings already listen to:
    // every answer saves a Participant row. `baseline` holds each score when the question opened.
    const [round, setRound] = useState<{ index: number; ids: string[] }>({ index: initialIndex, ids: [] });
    const [baseline, setBaseline] = useState<Record<string, number>>({});
    const participantsRef = useRef<HostParticipant[]>([]);
    const indexRef = useRef(initialIndex);
    useEffect(() => { participantsRef.current = participants; }, [participants]);
    useEffect(() => { indexRef.current = currentIndex; }, [currentIndex]);

    const currentQuestion = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;

    // ==========================================
    // 1. DATA FETCHING & REALTIME SYNC
    // ==========================================
    useEffect(() => {
        const fetchInitialData = async () => {
            // Get session config (Solo vs Factions)
            const { data: sessionData } = await supabase.from('GameSession').select('maxFactions').eq('id', sessionId).single();
            if (sessionData) setMaxFactions(sessionData.maxFactions);

            // Get Factions
            const { data: factionData } = await supabase.from('Faction').select('*').eq('sessionId', sessionId);
            if (factionData) setFactions(factionData);

            // Get Initial Participants
            const { data: participantData } = await supabase.from('Participant').select('*').eq('sessionId', sessionId);
            if (participantData) {
                const list = participantData as HostParticipant[];
                setParticipants(list);
                setBaseline(prev => {
                    const next = { ...prev };
                    for (const p of list) if (!(p.id in next)) next[p.id] = p.totalScore;
                    return next;
                });
            }
        };

        fetchInitialData();

        // Listen for scores updating as students submit answers!
        const channel = supabase.channel('host-standings')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'Participant', filter: `sessionId=eq.${sessionId}` },
                (payload) => {
                    const next = payload.new as HostParticipant;
                    const prev = participantsRef.current.find(p => p.id === next.id);

                    // A faction change alone is not an answer; anything else on this row is.
                    const factionOnly = prev && prev.factionId !== next.factionId && prev.totalScore === next.totalScore;
                    if (!factionOnly) {
                        const idx = indexRef.current;
                        setRound(r => r.index !== idx ? { index: idx, ids: [next.id] } : r.ids.includes(next.id) ? r : { index: idx, ids: [...r.ids, next.id] });
                    }
                    if (!prev) setBaseline(b => (next.id in b ? b : { ...b, [next.id]: 0 }));

                    // Players who joined after the page loaded are added instead of dropped.
                    setParticipants(list => list.some(p => p.id === next.id) ? list.map(p => p.id === next.id ? next : p) : [...list, next]);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [sessionId, supabase]);

    // ==========================================
    // 2. TIMERS & HANDLERS
    // ==========================================
    useEffect(() => {
        if (currentQuestion?.timeLimitSeconds) {
            setTimeLeft(currentQuestion.timeLimitSeconds);
        } else {
            setTimeLeft(null);
        }
    }, [currentIndex, currentQuestion]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || isAdvancing || viewState === "STANDINGS") return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev !== null && prev <= 1) {
                    clearInterval(timer);
                    // Time's up! Auto-reveal the standings instead of immediately jumping to the next question
                    setViewState("STANDINGS");
                    return 0;
                }
                return prev ? prev - 1 : 0;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isAdvancing, viewState]);

    // Round numbers
    const answeredIds = round.index === currentIndex ? round.ids : [];
    const total = participants.length;
    const answered = Math.min(answeredIds.length, total || answeredIds.length);
    const gainOf = (p: HostParticipant) => p.totalScore - (baseline[p.id] ?? p.totalScore);
    const answeredSet = new Set(answeredIds);
    const correctCount = participants.filter(p => answeredSet.has(p.id) && gainOf(p) > 0).length;
    const wrongCount = participants.filter(p => answeredSet.has(p.id)).length - correctCount;

    const revealAnswer = useCallback(() => {
        playSfx("select");
        setViewState("STANDINGS");
    }, []);

    const handleNextQuestion = useCallback(async () => {
        if (isLastQuestion || isAdvancing) return;

        setIsAdvancing(true);
        const nextIndex = currentIndex + 1;

        const response = await updateQuestionIndex(sessionId, nextIndex);

        if (response.error) {
            toast.error(response.error);
        } else {
            // New round: snapshot scores so this question's points can be told apart.
            setBaseline(Object.fromEntries(participantsRef.current.map(p => [p.id, p.totalScore])));
            setRound({ index: nextIndex, ids: [] });
            setCurrentIndex(nextIndex);
            setViewState("QUESTION"); // Flip back to the question view
            playSfx("start");
        }
        setIsAdvancing(false);
    }, [currentIndex, isAdvancing, isLastQuestion, sessionId]);

    const handleEndGame = useCallback(async () => {
        setIsAdvancing(true);
        const response = await endSessionEarly(sessionId);

        if (response.error) {
            toast.error(response.error);
            setIsAdvancing(false);
        } else {
            playSfx("levelup");
            toast.success("Game Finished!");
            router.push(`/dashboard/reports/${sessionId}`);
        }
    }, [router, sessionId]);

    const primaryAction = viewState === "QUESTION" ? revealAnswer : !isLastQuestion ? handleNextQuestion : handleEndGame;

    // Announce each new question and each reveal to screen readers.
    useEffect(() => {
        if (!currentQuestion) return;
        setAnnouncement(`Question ${currentIndex + 1} of ${questions.length}: ${currentQuestion.questionText}`);
    }, [currentIndex, currentQuestion, questions.length]);

    useEffect(() => {
        if (viewState !== "STANDINGS" || !currentQuestion) return;
        setAnnouncement(`Answer revealed: ${currentQuestion.correctAnswer}.`);
    }, [viewState, currentQuestion]);

    const everyoneIn = total > 0 && answered >= total;
    useEffect(() => {
        if (everyoneIn && viewState === "QUESTION") setAnnouncement("Everyone has answered.");
    }, [everyoneIn, viewState]);

    // Host keyboard: Space, Enter, N or Right arrow runs the main action; E opens End game.
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || confirmEnd || isAdvancing) return;
            const el = e.target as HTMLElement | null;
            if (el?.closest("input, textarea, select, [contenteditable='true'], [role='dialog']")) return;
            // Space and Enter already press a focused button or link: let them.
            if ((e.key === " " || e.key === "Enter") && el?.closest("button, a, summary")) return;
            if (PRIMARY_KEYS.has(e.key)) {
                e.preventDefault();
                void primaryAction();
            } else if (e.key === "e" || e.key === "E") {
                e.preventDefault();
                setConfirmEnd(true);
            }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [confirmEnd, isAdvancing, primaryAction]);

    const liveRegion = <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>;

    if (!currentQuestion) {
        return (
            <HostShell>
                <HostTopBar quizTitle={quizTitle} />
                <div className="px-panel flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
                    <h1 className="px-title text-lg sm:text-xl">No question to show</h1>
                    <p className="max-w-[44ch] text-lg text-muted">This quiz has no question at this step. End the game to see the report.</p>
                    <button type="button" onClick={handleEndGame} disabled={isAdvancing} data-sfx="none" className="px-btn px-btn-lg px-btn-yellow">
                        {isAdvancing ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Trophy className="size-5" aria-hidden />}
                        End game
                    </button>
                </div>
            </HostShell>
        );
    }

    const kind = kindOf(currentQuestion);
    const options = currentQuestion.options ?? [];
    const chip = typeChipOf(currentQuestion);
    const limit = currentQuestion.timeLimitSeconds ?? null;
    const revealed = viewState === "STANDINGS";

    const standingsRows = [...participants]
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 10)
        .map(p => ({ id: p.id, nickname: p.nickname, score: p.totalScore, gain: gainOf(p) }));

    const optionGrid = (size: "lg" | "md") => (
        <ul className={`grid gap-3 ${options.length > 2 ? "md:grid-cols-2" : options.length === 2 ? "sm:grid-cols-2" : ""}`} aria-label="Answers">
            {options.map((option, idx) => (
                <HostOption
                    key={idx}
                    index={idx}
                    text={option}
                    size={size}
                    state={!revealed ? "idle" : option === currentQuestion.correctAnswer ? "correct" : "dim"}
                />
            ))}
        </ul>
    );

    const typedAnswer = (
        <div className="px-notch flex flex-col gap-2 border-4 border-px-lime bg-screen px-4 py-3 sm:px-5 sm:py-4">
            <span className="px-label text-px-lime">{kind === "essay" ? "What a good answer covers" : "Answer"}</span>
            <p className={`whitespace-pre-wrap font-semibold ${kind === "essay" ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}>{currentQuestion.correctAnswer}</p>
        </div>
    );

    // Primary button: the one yellow action on screen.
    const primary = viewState === "QUESTION"
        ? { label: "Reveal answer", icon: <Eye className="size-5" aria-hidden /> }
        : !isLastQuestion
            ? { label: "Next question", icon: <ChevronRight className="size-5" aria-hidden /> }
            : { label: "Show final podium", icon: <Trophy className="size-5" aria-hidden /> };

    return (
        <HostShell>
            <HostTopBar quizTitle={quizTitle}>
                <span className="px-notch shrink-0 bg-px-void px-2 py-1.5 font-pixel text-[10px] text-px-snow sm:text-xs">
                    Q{currentIndex + 1}<span className="opacity-60">/{questions.length}</span>
                </span>
            </HostTopBar>
            {liveRegion}

            {!revealed ? (
                // ----------------------------------------------------
                // VIEW A: THE QUESTION (no hint of the right answer: this screen is projected)
                // ----------------------------------------------------
                <main className="flex flex-1 flex-col gap-4 sm:gap-6">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                        <span className={`px-notch px-2 py-1.5 font-pixel text-[10px] text-px-void sm:text-xs ${chip.fill}`}>{chip.label}</span>
                        <div className="ml-auto">
                            <AnsweredCounter answered={answered} total={total} />
                        </div>
                    </div>
                    {limit && timeLeft !== null ? (
                        <HostTimer timeLeft={timeLeft} limit={limit} />
                    ) : (
                        <p className="px-label text-muted">No time limit</p>
                    )}

                    <section className="px-panel flex min-h-40 flex-1 items-center justify-center p-5 text-center sm:min-h-56 sm:p-10">
                        <h1 className="max-w-[40ch] text-balance text-[clamp(1.75rem,3.4vw,4rem)] font-semibold leading-tight">
                            {currentQuestion.questionText}
                        </h1>
                    </section>

                    {kind === "choice" ? optionGrid("lg") : (
                        <p className="px-notch border-4 border-dashed border-frame-strong px-4 py-4 text-center text-xl text-muted">
                            {kind === "essay" ? "Players write their answer. Orbi grades it out of 10." : "Players type their answer."}
                        </p>
                    )}
                </main>
            ) : (
                // ----------------------------------------------------
                // VIEW B: THE REVEAL + STANDINGS (Race Track or Solo)
                // ----------------------------------------------------
                <main className="grid flex-1 items-start gap-4 sm:gap-6 lg:grid-cols-12">
                    <div className="flex flex-col gap-4 sm:gap-5 lg:col-span-7" style={{ animation: "host-pop 180ms steps(3, end)" }}>
                        <section className="px-panel flex flex-col gap-3 p-4 sm:p-6">
                            <span className={`px-notch self-start px-2 py-1 font-pixel text-[10px] text-px-void ${chip.fill}`}>{chip.label}</span>
                            <h1 className="text-balance text-2xl font-semibold leading-snug sm:text-3xl xl:text-4xl">{currentQuestion.questionText}</h1>
                        </section>
                        {kind === "choice" ? optionGrid("md") : typedAnswer}
                        {currentQuestion.explanation && (
                            <p className="px-notch border-4 border-frame bg-screen px-4 py-3 text-lg leading-relaxed text-muted">
                                <span className="font-semibold text-fg">Why: </span>{currentQuestion.explanation}
                            </p>
                        )}
                        <RoundResult correct={correctCount} wrong={wrongCount} total={total} essay={kind === "essay"} />
                    </div>
                    <div className="lg:col-span-5">
                        {maxFactions > 0 ? (
                            <FactionRaceTrack factions={factions} participants={participants} />
                        ) : (
                            <Leaderboard rows={standingsRows} />
                        )}
                    </div>
                </main>
            )}

            {/* Control footer */}
            <footer className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-3 border-t-4 border-frame bg-bg px-4 py-3 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 xl:-mx-10 xl:px-10">
                <button
                    type="button"
                    onClick={() => setConfirmEnd(true)}
                    disabled={isAdvancing}
                    aria-keyshortcuts="E"
                    className="px-btn px-btn-ghost w-full hover:[--btn:var(--px-7)] hover:[--btn-ink:var(--px-0)] sm:w-auto"
                >
                    End game <Kbd>E</Kbd>
                </button>
                <div className="flex items-center gap-4">
                    <p className="hidden items-center gap-2 text-base text-muted lg:flex">
                        <Kbd>Space</Kbd><Kbd>N</Kbd> {primary.label.toLowerCase()}
                    </p>
                    <button
                        type="button"
                        onClick={() => void primaryAction()}
                        disabled={isAdvancing}
                        aria-keyshortcuts="Space N Enter ArrowRight"
                        data-sfx="none"
                        className={`px-btn px-btn-lg px-btn-yellow w-full sm:w-auto ${everyoneIn && !revealed ? "px-hop" : ""}`}
                    >
                        {isAdvancing ? <Loader2 className="size-5 animate-spin" aria-hidden /> : primary.icon}
                        {primary.label}
                    </button>
                </div>
            </footer>

            {confirmEnd && (
                <Dialog
                    title="End the game now?"
                    onClose={() => setConfirmEnd(false)}
                    locked={isAdvancing}
                    size="sm"
                    actions={
                        <>
                            <button type="button" onClick={() => setConfirmEnd(false)} disabled={isAdvancing} className="px-btn px-btn-ghost">
                                Keep playing
                            </button>
                            <button type="button" onClick={handleEndGame} disabled={isAdvancing} data-sfx="none" className="px-btn px-btn-red">
                                {isAdvancing && <Loader2 className="size-4 animate-spin" aria-hidden />}
                                End game
                            </button>
                        </>
                    }
                >
                    <p className="text-lg">
                        {isLastQuestion
                            ? "This is the last question. Players go to the final podium and you go to the report."
                            : `${questions.length - currentIndex - 1} ${questions.length - currentIndex - 1 === 1 ? "question is" : "questions are"} left. Players go to the final podium and you go to the report.`}
                    </p>
                </Dialog>
            )}
        </HostShell>
    );
}
