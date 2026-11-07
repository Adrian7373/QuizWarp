// Shared pieces for the host's (projected) screens. No data: the lobby and play clients own state.
import Logo from "@/app/_components/Logo";
import SoundToggle from "@/app/_components/arcade/SoundToggle";
import ThemeToggle from "@/app/_components/arcade/ThemeToggle";

/** Stepped pop used when a player chip or verdict appears. Rests under reduced motion (globals.css). */
export const POP_KEYFRAMES = `@keyframes host-pop { from { transform: scale(0.85); } to { transform: scale(1); } }`;

/** Page wrapper for host screens: cabinet background, CRT overlay, full height. */
export function HostShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="px-crt min-h-dvh bg-bg font-sans text-fg">
            <style>{POP_KEYFRAMES}</style>
            <div className="mx-auto flex min-h-dvh w-full max-w-[1760px] flex-col gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 xl:px-10">
                {children}
            </div>
        </div>
    );
}

/** Top bar: logo, LIVE chip, quiz title, then whatever the screen adds, then sound and theme. */
export function HostTopBar({ quizTitle, status = "live", children }: { quizTitle: string; status?: "lobby" | "live"; children?: React.ReactNode }) {
    return (
        <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Logo variant="arcade" compact />
            <span className="px-notch inline-flex shrink-0 items-center gap-2 bg-px-pink px-2 py-1.5 font-pixel text-[9px] text-px-void">
                <span aria-hidden className="px-blink size-2 bg-px-void" />
                {status === "lobby" ? "Lobby" : "Live"}
            </span>
            <p className="min-w-0 flex-1 truncate text-lg text-muted sm:text-xl">
                <span className="sr-only">Quiz: </span>{quizTitle}
            </p>
            {children}
            <div className="flex items-center gap-2">
                <SoundToggle />
                <ThemeToggle />
            </div>
        </header>
    );
}

/** Small keyboard hint chip, hidden on touch-sized screens. */
export function Kbd({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="px-notch hidden bg-px-void px-1.5 py-1 font-pixel text-[8px] text-px-snow sm:inline-block">{children}</kbd>
    );
}
