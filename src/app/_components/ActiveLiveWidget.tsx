"use client"

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getActiveLiveSession } from "@/app/actions";
import Link from "next/link";

export default function ActiveLiveWidget({ userId }: { userId: string }) {
    const pathname = usePathname();
    const [activeSession, setActiveSession] = useState<any>(null);

    useEffect(() => {
        // Fetch on mount and whenever the pathname changes
        async function checkSession() {
            if (!userId) return;
            const response = await getActiveLiveSession(userId);
            setActiveSession(response.session);
        }
        checkSession();
    }, [userId, pathname]);

    // Don't show the widget if they are already on the host control pages
    if (!activeSession || pathname.includes(`/host/${activeSession.id}`)) {
        return null;
    }

    // Route dynamically: if waiting, go to lobby; if in progress, go to the play controller
    const returnUrl = activeSession.status === "WAITING"
        ? `/host/${activeSession.id}`
        : `/host/${activeSession.id}/play`;

    return (
        <Link
            href={returnUrl}
            className="px-panel fixed bottom-5 right-5 z-[80] flex items-center gap-3 border-px-pink py-2.5 pl-3 pr-4 font-sans text-fg hover:-translate-y-0.5"
        >
            <span className="px-blink size-3 shrink-0 bg-px-red" aria-hidden />
            <span className="flex flex-col leading-tight">
                <span className="px-label text-px-pink">Live game running</span>
                <span className="max-w-[180px] truncate text-base">{activeSession.quiz.title}</span>
            </span>
            <span className="px-label ml-1 text-muted">Resume</span>
        </Link>
    );
}
