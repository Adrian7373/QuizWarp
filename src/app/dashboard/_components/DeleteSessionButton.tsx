"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteGameSession } from "@/app/actions";
import { Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Dialog from "@/app/_components/arcade/Dialog";

interface DeleteSessionButtonProps {
    sessionId: string;
    quizTitle?: string;
}

export default function DeleteSessionButton({ sessionId, quizTitle }: DeleteSessionButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isShowing, setIsShowing] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        const response = await deleteGameSession(sessionId);

        if (response.error) {
            toast.error(response.error);
            setIsDeleting(false);
        } else {
            toast.success("Report deleted.");
            setIsShowing(false);
            router.refresh();
        }
    }

    return (
        <>
            <button
                onClick={() => setIsShowing(true)}
                disabled={isDeleting}
                className="px-btn px-btn-sm px-btn-ghost hover:[--btn:var(--px-7)] hover:[--btn-ink:var(--px-0)]"
                aria-label={quizTitle ? `Delete report for ${quizTitle}` : "Delete report"}
                title="Delete report"
            >
                {isDeleting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
            </button>

            {isShowing && (
                <Dialog
                    title="Delete this report?"
                    size="sm"
                    onClose={() => setIsShowing(false)}
                    locked={isDeleting}
                    actions={<>
                        <button onClick={() => setIsShowing(false)} className="px-btn px-btn-ghost">Cancel</button>
                        <button onClick={handleDelete} disabled={isDeleting} data-sfx="wrong" className="px-btn px-btn-red">
                            {isDeleting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                            Delete report
                        </button>
                    </>}
                >
                    <p className="text-lg">The scores and leaderboard{quizTitle ? <> for <span className="font-semibold">{quizTitle}</span></> : null} will be removed. The quiz itself stays in your Library. This can&apos;t be undone.</p>
                </Dialog>
            )}
        </>
    )
}
