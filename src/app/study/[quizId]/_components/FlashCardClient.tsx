"use client"

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import { Banner, Orbi, PixelBar } from "@/app/_components/arcade/Hud";
import { playSfx } from "@/app/_components/arcade/sfx";
import { isMusicOn, setMusicOn } from "@/app/_components/arcade/music";
import MusicControl from "@/app/_components/arcade/MusicControl";
import SoundToggle from "@/app/_components/arcade/SoundToggle";

interface FlashcardClientProps {
    quizId: string;
    quiz: { title: string; description: string };
    questions: any[];
}

// Scale the card text to its length so long answers (essays) still fit the card.
const getFontSize = (text: string) => {
    if (!text) return "text-2xl sm:text-3xl";
    if (text.length > 200) return "text-lg sm:text-xl";
    if (text.length > 100) return "text-xl sm:text-2xl";
    return "text-2xl sm:text-4xl";
};

const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/** Small keyboard hint chip, hidden on touch-sized screens. */
function Key({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="px-notch hidden bg-px-void px-1.5 py-1 font-pixel text-[8px] text-px-snow sm:inline-block">{children}</kbd>
    );
}

export default function FlashcardClient({ quizId, quiz, questions }: FlashcardClientProps) {
    // The active queue: "Got it" removes a card, "Still learning" sends it to the back.
    // Start in the given order and shuffle after mount: shuffling during render would differ
    // between the server and the browser and break hydration.
    const [queue, setQueue] = useState(questions);
    useEffect(() => { setQueue(shuffleArray(questions)); }, [questions]);
    const [isFlipped, setIsFlipped] = useState(false);
    const [masteredCount, setMasteredCount] = useState(0);
    // Cards sent back at least once this run, for the "still learning" count and the summary.
    const [relearned, setRelearned] = useState<Set<string>>(new Set());

    const totalQuestions = questions.length;
    const isFinished = queue.length === 0;
    const currentQuestion = queue[0];
    const cardKey = currentQuestion ? String(currentQuestion.id ?? currentQuestion.questionText) : "done";

    // --- Actions ---
    // Music and sound effects use the shared arcade players (MusicControl and SoundToggle in the top bar).
    const handleFlip = useCallback(() => {
        setIsFlipped(prev => !prev);
        playSfx("blip");
    }, []);

    const handleGotIt = useCallback(() => {
        playSfx("correct");
        setIsFlipped(false);
        setQueue(prev => prev.slice(1));
        setMasteredCount(prev => prev + 1);
    }, []);

    const handleReviewLater = useCallback(() => {
        playSfx("select");
        setIsFlipped(false);
        setQueue(prev => {
            const next = [...prev];
            const moved = next.shift();
            if (moved) {
                next.push(moved);
                setRelearned(r => new Set(r).add(String(moved.id ?? moved.questionText)));
            }
            return next;
        });
    }, []);

    const handleRestart = () => {
        setQueue(shuffleArray(questions));
        setMasteredCount(0);
        setRelearned(new Set());
        setIsFlipped(false);
    };

    // Level-up jingle when the deck is cleared (only if sound is on globally).
    useEffect(() => {
        if (isFinished && totalQuestions > 0) playSfx("levelup");
    }, [isFinished, totalQuestions]);

    // --- Keyboard: Space/Enter flip, ← still learning, → got it (after flipping), M music ---
    useEffect(() => {
        if (isFinished) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const target = e.target as HTMLElement | null;
            // Let a focused button handle its own Space/Enter, so a flip never fires twice.
            const onControl = !!target?.closest("button, a, input, textarea, select");

            if ((e.code === "Space" || e.code === "Enter") && !onControl) {
                e.preventDefault();
                handleFlip();
            } else if (e.code === "ArrowRight" && isFlipped) {
                e.preventDefault();
                handleGotIt();
            } else if (e.code === "ArrowLeft" && isFlipped) {
                e.preventDefault();
                handleReviewLater();
            } else if (e.code === "KeyM") {
                setMusicOn(!isMusicOn());
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isFinished, isFlipped, handleFlip, handleGotIt, handleReviewLater]);

    // --- Top bar (shared by both states) ---
    const topBar = (
        <header className="flex items-center gap-3">
            <Link href={`/quiz/${quizId}`} className="px-btn px-btn-sm px-btn-ghost" aria-label="Back to quiz">
                <ArrowLeft className="size-4" aria-hidden /><span className="hidden sm:inline">Back to quiz</span>
            </Link>
            <p className="min-w-0 flex-1 truncate text-lg text-muted">
                <span className="sr-only">Studying </span>{quiz.title}
            </p>
            <MusicControl track="saturday-morning-save-point" />
            <SoundToggle />
        </header>
    );

    // --- Finished state ---
    if (isFinished) {
        const secondLook = relearned.size;
        return (
            <div className="flex flex-1 flex-col gap-8">
                {topBar}
                <section className="px-panel mx-auto flex w-full max-w-xl flex-col items-start gap-6 p-6 sm:p-8">
                    <h1 className="px-title text-xl sm:text-2xl">Deck mastered</h1>
                    <Banner title="Cleared!" detail={`${totalQuestions} of ${totalQuestions} cards`} tone="lime" />
                    <Orbi
                        mood="happy"
                        say={secondLook === 0
                            ? "Every card on the first try. Nice."
                            : `${secondLook} ${secondLook === 1 ? "card needed" : "cards needed"} a second look. Study again to lock them in.`}
                    />
                    <div className="flex w-full flex-col gap-2 sm:flex-row">
                        <button onClick={handleRestart} data-sfx="start" className="px-btn px-btn-lg px-btn-yellow sm:flex-1">
                            <RotateCcw className="size-5" aria-hidden /> Study again
                        </button>
                        <Link href={`/quiz/${quizId}`} className="px-btn px-btn-lg px-btn-ghost sm:flex-1">Back to quiz</Link>
                    </div>
                </section>
            </div>
        );
    }

    // --- Active study state ---
    const stillLearning = queue.filter(q => relearned.has(String(q.id ?? q.questionText))).length;
    const face = isFlipped ? currentQuestion.correctAnswer : currentQuestion.questionText;

    return (
        <div className="flex flex-1 flex-col gap-5">
            {/* A quick stepped "card flip": the new face squashes in from the middle. Rests under reduced motion. */}
            <style>{`@keyframes study-flip { from { transform: scaleX(0.05); } to { transform: scaleX(1); } }`}</style>

            {topBar}

            {/* HUD */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex min-w-[14rem] flex-1 items-center gap-3">
                    <span className="px-label whitespace-nowrap text-px-lime px-glow">Mastered</span>
                    <PixelBar value={masteredCount} max={totalQuestions} segments={Math.min(totalQuestions, 20)} color="lime" label="Cards mastered" />
                    <span className="whitespace-nowrap font-pixel text-[10px]">{masteredCount}/{totalQuestions}</span>
                </div>
                <p className="text-base text-muted">
                    {queue.length} left{stillLearning > 0 && <>, <span className="text-fg">{stillLearning} still learning</span></>}
                </p>
            </div>

            {/* The card */}
            <div className="flex flex-1 flex-col items-center justify-center gap-5">
                <button
                    type="button"
                    key={`${cardKey}-${isFlipped}`}
                    onClick={handleFlip}
                    aria-label={isFlipped ? "Answer side. Flip back to the question." : "Question side. Flip to see the answer."}
                    data-sfx="none"
                    style={{ animation: "study-flip 160ms steps(3, end)" }}
                    className={`px-panel relative flex min-h-[22rem] w-full max-w-2xl cursor-pointer flex-col items-center justify-center gap-4 px-6 py-14 text-center sm:aspect-[4/3] sm:min-h-0 sm:px-12 ${isFlipped ? "border-px-lime bg-raised" : "hover:bg-raised/60"}`}
                >
                    <span className={`px-notch absolute left-4 top-4 px-2 py-1 font-pixel text-[9px] text-px-void ${isFlipped ? "bg-px-lime" : "bg-px-cyan"}`}>
                        {isFlipped ? "Answer" : "Question"}
                    </span>
                    <span className="absolute right-4 top-4 font-pixel text-[9px] text-muted">{masteredCount + 1}/{totalQuestions}</span>

                    <span className={`${getFontSize(face)} block max-w-[32ch] font-semibold leading-snug text-balance`}>{face}</span>

                    {isFlipped && currentQuestion.explanation && (
                        <span className="block max-w-[52ch] border-t-4 border-dashed border-frame pt-4 text-base text-muted text-balance sm:text-lg">
                            {currentQuestion.explanation}
                        </span>
                    )}

                    {!isFlipped && <span className="px-label px-blink absolute bottom-4 text-muted">Tap to flip</span>}
                </button>

                {/* Controls: one action before the flip, a self-check after it */}
                <div className="flex w-full max-w-2xl flex-col gap-2 sm:flex-row">
                    {isFlipped ? (
                        <>
                            <button onClick={handleReviewLater} data-sfx="none" className="px-btn px-btn-lg px-btn-orange sm:flex-1">
                                <Key>←</Key> Still learning
                            </button>
                            <button onClick={handleGotIt} data-sfx="none" className="px-btn px-btn-lg px-btn-lime sm:flex-1">
                                <Check className="size-5" strokeWidth={3} aria-hidden /> Got it <Key>→</Key>
                            </button>
                        </>
                    ) : (
                        <button onClick={handleFlip} data-sfx="none" className="px-btn px-btn-lg px-btn-cyan w-full">
                            Show answer <Key>Space</Key>
                        </button>
                    )}
                </div>

                <p className="hidden text-center text-sm text-muted sm:block">
                    Space flips the card. After flipping, ← keeps it in the deck and → marks it learned. M turns music on or off.
                </p>
            </div>
        </div>
    );
}
