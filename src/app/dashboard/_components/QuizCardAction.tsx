"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Play, Trash2, Loader2, Copy, Check, BrainCircuit, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { deleteQuiz, startPracticeQuiz } from "@/app/actions";
import { createAsyncSession, createLiveSession } from "@/app/actions/generate";
import Link from "next/link";
import Dialog from "@/app/_components/arcade/Dialog";

interface QuizCardActionsProps {
    quizId: string;
    userId: string;
    quizTitle: string;
    userRole: "TEACHER" | "STUDENT";
    onDeleteOptimistic: () => void;
    onDeleteRevert: () => void;
}

const row = "px-btn px-btn-sm";

export default function QuizCardActions({ quizId, userId, quizTitle, onDeleteOptimistic, onDeleteRevert, userRole }: QuizCardActionsProps) {
    const router = useRouter();

    //Practice State
    const [isStartingPractice, setIsStartingPractice] = useState(false);

    // Modal States
    const [isAssigning, setIsAssigning] = useState(false);
    const [isLaunchingLive, setIsLaunchingLive] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form States
    const [dueDate, setDueDate] = useState("");
    const [generatedPin, setGeneratedPin] = useState("");
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [maxFactions, setMaxFactions] = useState(4);
    const [isCreatingLive, setIsCreatingLive] = useState(false);
    const [gameMode, setGameMode] = useState<"SOLO" | "FACTIONS">("SOLO");

    // Handlers
    const handleCreateAssignment = async () => {
        if (!dueDate) return toast.error("Please select a due date.");
        setIsCreatingSession(true);
        const response = await createAsyncSession(quizId, userId, new Date(dueDate));

        if (response.error) {
            toast.error(response.error);
        } else {
            setGeneratedPin(response.session!.joinCode);
            toast.success("Assignment created!");
        }
        setIsCreatingSession(false);
    };

    const handleCopyLink = async () => {
        const joinLink = `${window.location.origin}/join?pin=${generatedPin}`;
        await navigator.clipboard.writeText(joinLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const closeAssign = () => {
        setIsAssigning(false);
        setGeneratedPin("");
        setDueDate("");
    };

    const handleConfirmLiveLaunch = async () => {
        setIsCreatingLive(true);
        const finalMaxFactions = gameMode === "SOLO" ? 0 : maxFactions;
        const response = await createLiveSession(quizId, userId, finalMaxFactions);

        if (response.error) {
            toast.error(response.error);
            setIsCreatingLive(false);
        } else {
            router.push(`/host/${response.session!.id}`);
        }
    };

    const handleDelete = async () => {
        // A. Instantly close the modal and hide the row visually
        setIsDeleting(false);
        onDeleteOptimistic();

        // B. Perform the server action in the background
        const response = await deleteQuiz(quizId, userId);

        if (response?.error) {
            // C. If it fails, bring the row back and show an error
            onDeleteRevert();
            toast.error("Failed to delete quiz.");
        } else {
            // D. On success, silently refresh the server data so the next page load is accurate
            toast.success("Quiz deleted successfully!");
            router.refresh();
        }
    };

    const handlePracticeLaunch = async () => {
        setIsStartingPractice(true);

        // 1. Satisfy TS by guaranteeing quizId and userId are valid strings before calling
        if (!quizId || !userId) {
            toast.error("Missing quiz or user information.");
            setIsStartingPractice(false);
            return;
        }

        const response = await startPracticeQuiz(quizId, userId, "Practice Mode");

        // 2. Check for the error AND guarantee the response variables exist
        if (response.error || !response.sessionId || !response.participantId) {
            toast.error(response.error || "Failed to start practice.");
            setIsStartingPractice(false);
        } else {
            // 3. TS now knows for a fact that response.participantId is a string
            localStorage.setItem(`participant_${response.sessionId}`, response.participantId);
            router.push(`/play/${response.sessionId}`);
        }
    };

    // Earliest allowed due time: now, in the datetime-local format.
    const minDue = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    return (
        <>
            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
                {userRole === "STUDENT" ? (
                    <>
                        <Link href={`/study/${quizId}`} className={`${row} px-btn-yellow`}>
                            <BookOpen className="size-4" aria-hidden /> Study
                        </Link>
                        <button
                            onClick={(e) => { e.preventDefault(); handlePracticeLaunch(); }}
                            disabled={isStartingPractice}
                            data-sfx="start"
                            className={`${row} px-btn-lime`}
                        >
                            {isStartingPractice ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BrainCircuit className="size-4" aria-hidden />}
                            Practice
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={() => setIsLaunchingLive(true)} className={`${row} px-btn-pink`}>
                            <Play className="size-4" fill="currentColor" aria-hidden /> Host live
                        </button>
                        <button onClick={() => setIsAssigning(true)} className={`${row} px-btn-cyan`}>
                            <CalendarClock className="size-4" aria-hidden /> Assign
                        </button>
                    </>
                )}

                <button
                    onClick={(e) => { e.preventDefault(); setIsDeleting(true); }}
                    className={`${row} px-btn-ghost hover:[--btn:var(--px-7)] hover:[--btn-ink:var(--px-0)]`}
                    aria-label={`Delete ${quizTitle}`}
                    title="Delete quiz"
                >
                    <Trash2 className="size-4" aria-hidden />
                </button>
            </div>

            {isDeleting && (
                <Dialog
                    title="Delete this quiz?"
                    size="sm"
                    onClose={() => setIsDeleting(false)}
                    actions={<>
                        <button onClick={() => setIsDeleting(false)} className="px-btn px-btn-ghost">Cancel</button>
                        <button onClick={handleDelete} data-sfx="wrong" className="px-btn px-btn-red">Delete quiz</button>
                    </>}
                >
                    <p className="text-lg"><span className="font-semibold">{quizTitle}</span> and its questions will be deleted. Past reports stay. This can&apos;t be undone.</p>
                </Dialog>
            )}

            {isAssigning && (
                <Dialog
                    title={generatedPin ? "Homework is live" : "Assign as homework"}
                    onClose={closeAssign}
                    locked={isCreatingSession}
                    actions={generatedPin ? (
                        <button onClick={closeAssign} className="px-btn px-btn-ghost">Done</button>
                    ) : (<>
                        <button onClick={closeAssign} className="px-btn px-btn-ghost">Cancel</button>
                        <button onClick={handleCreateAssignment} disabled={isCreatingSession || !dueDate} data-sfx="start" className="px-btn px-btn-cyan">
                            {isCreatingSession && <Loader2 className="size-4 animate-spin" aria-hidden />}
                            Create join PIN
                        </button>
                    </>)}
                >
                    {!generatedPin ? (
                        <div className="space-y-4">
                            <p className="text-lg text-muted">Students play <span className="font-semibold text-fg">{quizTitle}</span> at their own pace until the deadline. Scores land in Reports.</p>
                            <label className="block text-base font-semibold">Due date and time
                                <input type="datetime-local" min={minDue} value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="px-input mt-1.5 w-full" />
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-lg text-muted">Share this PIN or the link with your class. You can track who joined under Active assignments.</p>
                            <p className="px-notch break-all bg-px-void px-4 py-6 text-center font-pixel text-3xl tracking-widest text-px-yellow sm:text-4xl">{generatedPin}</p>
                            <button onClick={handleCopyLink} data-sfx="coin" className="px-btn px-btn-lg px-btn-yellow w-full">
                                {isCopied ? <Check className="size-5" aria-hidden /> : <Copy className="size-5" aria-hidden />}
                                {isCopied ? "Link copied" : "Copy join link"}
                            </button>
                        </div>
                    )}
                </Dialog>
            )}

            {isLaunchingLive && (
                <Dialog
                    title="Host a live game"
                    onClose={() => setIsLaunchingLive(false)}
                    locked={isCreatingLive}
                    actions={<>
                        <button onClick={() => setIsLaunchingLive(false)} className="px-btn px-btn-ghost">Cancel</button>
                        <button onClick={handleConfirmLiveLaunch} disabled={isCreatingLive} data-sfx="start" className="px-btn px-btn-pink">
                            {isCreatingLive && <Loader2 className="size-4 animate-spin" aria-hidden />}
                            Open lobby
                        </button>
                    </>}
                >
                    <div className="space-y-4">
                        <p className="text-lg text-muted">Everyone joins <span className="font-semibold text-fg">{quizTitle}</span> with a PIN and answers each question at the same time.</p>
                        <div role="radiogroup" aria-label="Game mode" className="grid grid-cols-2 gap-2">
                            {([["SOLO", "Solo", "Every player for themselves"], ["FACTIONS", "Teams", "Players split into factions"]] as const).map(([mode, label, hint]) => (
                                <button
                                    key={mode}
                                    role="radio"
                                    aria-checked={gameMode === mode}
                                    data-sfx="select"
                                    onClick={() => setGameMode(mode)}
                                    className={`px-notch flex flex-col items-start gap-1 border-4 p-3 text-left ${gameMode === mode ? "border-px-pink bg-raised" : "border-frame-strong bg-surface hover:bg-raised"}`}
                                >
                                    <span className="font-pixel text-[11px]">{label}</span>
                                    <span className="text-base text-muted">{hint}</span>
                                </button>
                            ))}
                        </div>
                        {gameMode === "FACTIONS" && (
                            <div className="space-y-2">
                                <p className="text-base font-semibold">Number of teams</p>
                                <div role="radiogroup" aria-label="Number of teams" className="flex gap-2">
                                    {[2, 3, 4, 5, 6].map((num) => (
                                        <button
                                            key={num}
                                            role="radio"
                                            aria-checked={maxFactions === num}
                                            data-sfx="select"
                                            onClick={() => setMaxFactions(num)}
                                            className={`px-btn flex-1 ${maxFactions === num ? "px-btn-pink" : "px-btn-ghost"}`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-base text-muted">The first {maxFactions} players to join become team leaders.</p>
                            </div>
                        )}
                    </div>
                </Dialog>
            )}
        </>
    );
}
