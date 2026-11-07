"use client";

import { useEffect } from "react";

// Loading screen for a saved quiz, shaped like the real one.
export default function QuizLoading() {
    // Scroll to top on mount to prevent the scroll-position bug during transitions
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const block = "px-notch bg-raised";

    return (
        <div className="px-crt min-h-dvh bg-bg font-sans" aria-hidden>
            <div className="h-16 border-b-4 border-frame bg-bg" />
            {/* Toolbar */}
            <div className="border-b-4 border-frame bg-surface">
                <div className="mx-auto flex max-w-5xl gap-2 px-3 py-2.5 sm:px-6">
                    {[20, 32, 28, 20].map((w, i) => <div key={i} className={`h-9 ${block}`} style={{ width: `${w * 4}px` }} />)}
                    <div className="ml-auto flex gap-2"><div className={`h-9 w-28 ${block}`} /><div className={`h-9 w-24 ${block}`} /></div>
                </div>
            </div>

            <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
                <div className="px-panel space-y-3 p-6">
                    <div className={`h-7 w-2/3 ${block}`} />
                    <div className={`h-5 w-full ${block}`} />
                    <div className={`h-4 w-40 ${block}`} />
                </div>
                {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="px-panel space-y-3 p-6">
                        <div className={`h-6 w-12 ${block}`} />
                        <div className={`h-6 w-11/12 ${block}`} />
                        <div className="grid gap-2 md:grid-cols-2">
                            {Array.from({ length: 4 }, (_, j) => <div key={j} className={`h-12 ${block}`} />)}
                        </div>
                    </div>
                ))}
                <p className="px-label px-blink text-center text-muted">Loading</p>
            </main>
        </div>
    );
}
