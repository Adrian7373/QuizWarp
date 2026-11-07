"use client";

import { useEffect } from "react";

// Loading screen for flashcards, shaped like the real deck.
export default function FlashcardLoading() {
    // Prevent the scroll-position bug when navigating to this page
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const block = "px-notch bg-raised";

    return (
        <div className="px-crt flex min-h-dvh flex-col bg-bg font-sans" aria-hidden>
            <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8">
                <div className="flex items-center gap-3">
                    <div className={`h-9 w-36 ${block}`} />
                    <div className={`h-5 flex-1 max-w-xs ${block}`} />
                    <div className={`ml-auto h-9 w-24 ${block}`} />
                </div>
                <div className={`h-4 w-full ${block}`} />
                <div className="flex flex-1 flex-col items-center justify-center gap-5">
                    <div className="px-panel flex min-h-[22rem] w-full max-w-2xl flex-col items-center justify-center gap-3 p-10 sm:aspect-[4/3] sm:min-h-0">
                        <div className={`h-8 w-4/5 ${block}`} />
                        <div className={`h-8 w-3/5 ${block}`} />
                        <p className="px-label px-blink mt-4 text-muted">Shuffling deck</p>
                    </div>
                    <div className={`h-14 w-full max-w-2xl ${block}`} />
                </div>
            </main>
        </div>
    );
}
