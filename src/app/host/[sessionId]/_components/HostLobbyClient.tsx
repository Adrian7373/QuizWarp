"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Check, Copy, Loader2, Play, Users } from "lucide-react";
import { startGameSession } from "../actions";
import toast from "react-hot-toast";
import { deleteGameSession } from "@/app/actions";
import { ANSWER_COLORS } from "@/app/_components/arcade/QuizBits";
import { Orbi } from "@/app/_components/arcade/Hud";
import Dialog from "@/app/_components/arcade/Dialog";
import { playSfx } from "@/app/_components/arcade/sfx";
import { HostShell, HostTopBar } from "./HostBits";

interface HostLobbyClientProps {
    sessionId: string;
    joinCode: string;
    quizTitle: string;
    initialParticipants: { id: string; nickname: string }[];
}

// The site origin, read from the browser after hydration (the server falls back to the configured URL).
const noopSubscribe = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

export default function HostLobbyClient({ sessionId, joinCode, quizTitle, initialParticipants }: HostLobbyClientProps) {
    const [isCopied, setIsCopied] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [announcement, setAnnouncement] = useState("");
    const router = useRouter();
    const supabase = createClient();
    const origin = useSyncExternalStore(noopSubscribe, getOrigin, getServerOrigin);
    const joinUrl = `${origin}/join`;
    const joinUrlLabel = joinUrl.replace(/^https?:\/\//, "");
    const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleCancelGame = async () => {
        setIsCanceling(true);
        const response = await deleteGameSession(sessionId);

        if (response.error) {
            toast.error(response.error);
            setIsCanceling(false);
        } else {
            toast.success("Game cancelled.");
            router.push("/dashboard");
        }
    };

    const handleCopyLink = async () => {
        // The join link pre-fills the code on the join page.
        const joinLink = `${window.location.origin}/join?pin=${joinCode}`;
        try {
            await navigator.clipboard.writeText(joinLink);
        } catch {
            toast.error("Couldn't copy. Share the code instead.");
            return;
        }
        playSfx("coin");
        setIsCopied(true);
        toast.success("Join link copied!");
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setIsCopied(false), 2000);
    };

    useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); }, []);

    // 1. Initialize state with the Prisma data passed from the server
    const [participants, setParticipants] = useState(initialParticipants);

    // 2. ONLY use Supabase for the Realtime WebSockets
    useEffect(() => {
        const channel = supabase
            .channel('lobby-updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Participant',
                    filter: `sessionId=eq.${sessionId}`
                },
                (payload) => {
                    const newParticipant = payload.new as { id: string, nickname: string };
                    // A player who joined while the page loaded is already in the server list.
                    setParticipants(prev => prev.some(p => p.id === newParticipant.id) ? prev : [...prev, newParticipant]);
                    setAnnouncement(`${newParticipant.nickname} joined.`);
                    playSfx("coin");
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, supabase]);

    const handleStartGame = async () => {
        if (participants.length === 0 || isStarting) return;
        setIsStarting(true);

        toast.loading("Starting game...", { id: "start-game" });

        const response = await startGameSession(sessionId);

        if (response?.error) {
            toast.error(response.error, { id: "start-game" });
            setIsStarting(false);
            return;
        }

        playSfx("start");
        toast.success("Game started!", { id: "start-game" });
        router.push(`/host/${sessionId}/play`);
    };

    const count = participants.length;
    const canStart = count > 0 && !isStarting && !isCanceling;

    return (
        <HostShell>
            <HostTopBar quizTitle={quizTitle} status="lobby" />
            <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>

            <main className="flex flex-1 flex-col gap-4 sm:gap-6">
                {/* Join band: the one thing the room needs to read from the back row. */}
                <section aria-labelledby="join-heading" className="px-panel flex flex-col items-center gap-5 px-4 py-6 text-center sm:px-8 sm:py-8">
                    <h1 id="join-heading" className="text-xl text-muted sm:text-2xl lg:text-3xl">
                        Go to <span className="font-semibold text-fg">{joinUrlLabel || "this site /join"}</span> and enter the game code
                    </h1>
                    <p
                        aria-label={`Game code ${joinCode.split("").join(" ")}`}
                        className="flex justify-center gap-1.5 sm:gap-3 text-[clamp(1.75rem,min(6vw,11vh),7.5rem)] leading-none"
                    >
                        {joinCode.split("").map((digit, i) => (
                            <span
                                key={i}
                                aria-hidden
                                className="px-notch border-4 border-px-void bg-px-yellow px-[0.3em] py-[0.25em] font-pixel text-px-void shadow-[inset_-0.08em_-0.08em_0_0_rgb(0_0_0/0.25)]"
                            >
                                {digit}
                            </span>
                        ))}
                    </p>
                    <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            data-sfx="none"
                            className={`px-btn w-full sm:w-auto ${isCopied ? "px-btn-lime" : "px-btn-cyan"}`}
                        >
                            {isCopied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                            {isCopied ? "Link copied" : "Copy join link"}
                        </button>
                        <p className="text-base text-muted">The link fills in the code for players.</p>
                    </div>
                </section>

                {/* Players */}
                <section aria-labelledby="players-heading" className="px-panel flex min-h-64 flex-1 flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-frame px-4 py-4 sm:px-6">
                        <h2 id="players-heading" className="flex items-center gap-3 font-pixel text-sm sm:text-base">
                            <Users className="size-5 text-px-cyan" aria-hidden />
                            Players
                        </h2>
                        <p className="flex items-baseline gap-2">
                            <span className="font-pixel text-2xl text-px-yellow px-glow sm:text-4xl">{count}</span>
                            <span className="text-lg text-muted">{count === 1 ? "player in" : "players in"}</span>
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        {count === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-4 py-6 text-center">
                                <Orbi mood="idle" scale={3} />
                                <p className="max-w-[40ch] text-xl">
                                    No one has joined yet. Ask the class to open <span className="font-semibold">{joinUrlLabel || "/join"}</span> and type the code above.
                                </p>
                                <p className="px-label px-blink text-px-pink">Waiting for players</p>
                            </div>
                        ) : (
                            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 2xl:grid-cols-6" aria-label="Players in the lobby">
                                {participants.map((p, i) => (
                                    <li
                                        key={p.id}
                                        style={{ animation: "host-pop 180ms steps(3, end)" }}
                                        className="px-notch flex min-w-0 items-center gap-3 border-4 border-frame-strong bg-raised px-3 py-2"
                                    >
                                        <span aria-hidden className={`size-3 shrink-0 ${ANSWER_COLORS[i % 4]}`} />
                                        <span className="min-w-0 truncate text-lg font-semibold sm:text-xl" title={p.nickname}>{p.nickname}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </main>

            <footer className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-3 border-t-4 border-frame bg-bg px-4 py-3 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 xl:-mx-10 xl:px-10">
                <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    disabled={isCanceling || isStarting}
                    className="px-btn px-btn-ghost w-full hover:[--btn:var(--px-7)] hover:[--btn-ink:var(--px-0)] sm:w-auto"
                >
                    Cancel game
                </button>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
                    {count === 0 && (
                        <p id="start-reason" className="text-center text-base text-muted sm:text-right">
                            Start opens once a player joins.
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={handleStartGame}
                        disabled={!canStart}
                        aria-describedby={count === 0 ? "start-reason" : undefined}
                        data-sfx="none"
                        className="px-btn px-btn-lg px-btn-yellow w-full sm:w-auto"
                    >
                        {isStarting ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Play className="size-5" fill="currentColor" aria-hidden />}
                        {isStarting ? "Starting…" : "Start game"}
                    </button>
                </div>
            </footer>

            {confirmCancel && (
                <Dialog
                    title="Cancel this game?"
                    onClose={() => setConfirmCancel(false)}
                    locked={isCanceling}
                    size="sm"
                    actions={
                        <>
                            <button type="button" onClick={() => setConfirmCancel(false)} disabled={isCanceling} className="px-btn px-btn-ghost">
                                Keep lobby open
                            </button>
                            <button type="button" onClick={handleCancelGame} disabled={isCanceling} className="px-btn px-btn-red">
                                {isCanceling && <Loader2 className="size-4 animate-spin" aria-hidden />}
                                Cancel game
                            </button>
                        </>
                    }
                >
                    <p className="text-lg">
                        The game is deleted and its code stops working{count > 0 ? ` for the ${count} ${count === 1 ? "player" : "players"} in the lobby` : ""}. This can&apos;t be undone.
                    </p>
                </Dialog>
            )}
        </HostShell>
    );
}
