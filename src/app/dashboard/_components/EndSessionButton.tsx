"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { endSessionEarly } from "@/app/actions";
import { Loader2, Square } from "lucide-react";
import toast from "react-hot-toast";
import Dialog from "@/app/_components/arcade/Dialog";

interface EndSessionButtonProps {
    sessionId: string;
    hostId: string;
    quizTitle?: string;
}

export default function EndSessionButton({ sessionId, hostId, quizTitle }: EndSessionButtonProps) {
    const router = useRouter();
    const [isEnding, setIsEnding] = useState(false);
    const [isShowing, setIsShowing] = useState(false);

    const handleEndEarly = async () => {
        setIsEnding(true);
        const response = await endSessionEarly(sessionId, hostId);

        if (response.error) {
            toast.error(response.error);
            setIsEnding(false);
        } else {
            toast.success("Assignment ended. Scores are in Reports.");
            setIsShowing(false);
            // Refresh the server components to instantly move the item to the Completed tab
            router.refresh();
        }
    };

    return (
        <>
            <button onClick={() => setIsShowing(true)} disabled={isEnding} className="px-btn px-btn-sm px-btn-red">
                {isEnding ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Square className="size-3.5" fill="currentColor" aria-hidden />}
                {isEnding ? "Ending…" : "End early"}
            </button>

            {isShowing && (
                <Dialog
                    title="End this assignment now?"
                    size="sm"
                    onClose={() => setIsShowing(false)}
                    locked={isEnding}
                    actions={<>
                        <button onClick={() => setIsShowing(false)} className="px-btn px-btn-ghost">Keep it open</button>
                        <button onClick={handleEndEarly} disabled={isEnding} className="px-btn px-btn-red">
                            {isEnding && <Loader2 className="size-4 animate-spin" aria-hidden />}
                            End assignment
                        </button>
                    </>}
                >
                    <p className="text-lg">
                        Students can&apos;t play {quizTitle ? <span className="font-semibold">{quizTitle}</span> : "it"} after this, and it moves to Reports with the scores so far. This can&apos;t be undone.
                    </p>
                </Dialog>
            )}
        </>
    );
}
