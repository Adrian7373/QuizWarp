"use client"
import { CircleUserRound, LayoutDashboard, LogOut, Loader2, Menu, Plus, Settings, X } from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "./arcade/ThemeToggle";
import SoundToggle from "./arcade/SoundToggle";
import { CoinCounter, StreakFlame } from "./arcade/Hud";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AppUser } from "../page";
import Link from "next/link";
import { logOutUser } from "../actions";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
const SignupModal = dynamic(() => import('./SignUpModal'), { ssr: false });

interface NavBarProps {
    user: AppUser | null
    activeQuizId?: string | null
    isFallback?: boolean;
}

const navLink = "flex items-center gap-3 px-2.5 py-2 text-lg text-fg hover:bg-raised";

export default function NavBar({ user, activeQuizId, isFallback = false }: NavBarProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const pathname = usePathname();

    // Loading state of logout
    const [isPending, setIsPending] = useState(false);

    const [localQuizzes, setLocalQuizzes] = useState<any[]>([]);

    // Fetch from local storage when the component mounts
    useEffect(() => {
        if (!user) {
            const savedQuizzes = localStorage.getItem('anon_quizzes');
            if (savedQuizzes) {
                setLocalQuizzes(JSON.parse(savedQuizzes));
            }
        }
    }, [user, isOpen]);

    const toggleMenu = () => {
        setIsOpen((prev) => !prev)
    }

    const toggleSignIn = () => {
        setIsSigningIn((prev) => !prev)
    }

    const toggleLogout = () => {
        setIsLoggingOut((prev) => !prev)
    }

    const handleLogOut = async () => {
        setIsPending(true);

        const response = await logOutUser();

        if (response?.error) {
            toast.error("Failed to logout user. Server error")
            setIsPending(false);
            setIsLoggingOut(false);
            return;
        }

        // Success: close modal, stop pending, refresh server components
        setIsPending(false);
        setIsLoggingOut(false);
        toast.success("Logged out")
        router.refresh();
    }

    const quizItemClass = (isActive: boolean) =>
        `flex w-full shrink-0 items-center gap-2 px-2.5 py-2 text-left text-base ${isActive
            ? 'bg-raised text-fg'
            : 'text-muted hover:bg-raised hover:text-fg'
        }`;

    return (
        <div className="print:hidden font-sans text-fg">
            {/* The HUD bar. Drawer and dialogs are siblings so their fixed positioning is never trapped by it. */}
            <header className="fixed inset-x-0 top-0 z-50 border-b-4 border-frame bg-bg">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <button type="button" onClick={toggleMenu} aria-label="Open menu" className="px-btn px-btn-sm px-btn-ghost">
                            <Menu className="size-4" aria-hidden />
                        </button>
                        <Link href="/" aria-label="QuizWarp home"><Logo variant="arcade" compact /></Link>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {isFallback ? (
                            <div className="h-9 w-24 animate-pulse bg-raised px-notch" />
                        ) : user ? (
                            <div className="mr-1 flex items-center gap-3 sm:gap-4">
                                <StreakFlame days={user.currentStreak} />
                                <Link href={`/dashboard/settings?tab=credits`} className="hover:opacity-80">
                                    <CoinCounter value={user.aiCredits} />
                                </Link>
                            </div>
                        ) : (
                            <button onClick={toggleSignIn} className="px-btn px-btn-sm px-btn-cyan">
                                Sign in
                            </button>
                        )}
                        <SoundToggle />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <div
                onClick={toggleMenu}
                className={`fixed inset-0 z-[60] bg-px-void/70 ${isOpen ? 'visible' : 'invisible'}`}
            >
                <aside
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Menu"
                    className={`fixed left-0 top-0 h-full w-72 border-r-4 border-frame bg-surface transition-transform duration-150 ease-[steps(4)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className="flex h-full flex-col p-4">

                        <div className="mb-6 flex shrink-0 items-center justify-between">
                            <Logo variant="arcade" />
                            <button type="button" onClick={toggleMenu} aria-label="Close menu" className="px-btn px-btn-sm px-btn-ghost">
                                <X className="size-4" aria-hidden />
                            </button>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col pb-4">
                            <div className="mb-5 flex shrink-0 flex-col gap-1">
                                <Link href="/" className={navLink}><Plus className="size-5" aria-hidden />New quiz</Link>
                                <Link hidden={!user} href="/dashboard" className={navLink}><LayoutDashboard className="size-5" aria-hidden />Dashboard</Link>
                            </div>

                            <p className="px-label mb-2 shrink-0 border-b-4 border-dashed border-frame pb-2 text-px-pink">Saved quizzes</p>

                            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {user ? (
                                    [...user.quizzes].reverse().map((quiz) => {
                                        const isActive = pathname === `/quiz/${quiz.id}`;

                                        return (
                                            <Link
                                                key={quiz.id}
                                                href={`/quiz/${quiz.id}`}
                                                onClick={toggleMenu}
                                                className={quizItemClass(isActive)}
                                            >
                                                {isActive && <span aria-hidden className="font-pixel text-[10px] text-px-yellow">▶</span>}
                                                <p className="select-none truncate">{quiz.title}</p>
                                            </Link>
                                        )
                                    })
                                ) : localQuizzes.length > 0 ? (
                                    localQuizzes.map((quiz) => {
                                        const isActive = activeQuizId === quiz.id;

                                        return (
                                            <button
                                                key={quiz.id}
                                                onClick={() => {
                                                    toggleMenu();
                                                    // Dispatch a custom browser event containing the quiz payload
                                                    window.dispatchEvent(new CustomEvent('openLocalQuiz', { detail: quiz }));
                                                }}
                                                className={quizItemClass(isActive)}
                                            >
                                                {isActive && <span aria-hidden className="font-pixel text-[10px] text-px-yellow">▶</span>}
                                                <p className="select-none truncate">{quiz.title}</p>
                                            </button>
                                        )
                                    })
                                ) : (
                                    <p className="px-2.5 py-2 text-base text-muted">Quizzes you generate show up here.</p>
                                )}
                            </div>
                        </div>

                        {!user && (
                            <div className="px-panel mb-4 flex shrink-0 flex-col gap-3 bg-raised p-3">
                                <p className="text-base text-muted">Sign in to save quizzes, host live games and track scores.</p>
                                <button onClick={toggleSignIn} className="px-btn px-btn-sm px-btn-cyan w-full">Sign in</button>
                            </div>
                        )}

                        <div className="mt-auto flex shrink-0 items-center justify-between border-t-4 border-frame pt-3">
                            <div className="flex items-center gap-3">
                                <CircleUserRound className="size-8 text-muted" aria-hidden />
                                <div className="flex flex-col">
                                    <p className="text-base font-semibold">{user?.name || 'Guest'}</p>
                                    <p className="px-label text-[9px] text-muted">{user?.role?.toLowerCase() || 'Player 1'}</p>
                                </div>
                            </div>
                            {!!user && (
                                <div className="flex items-center gap-1">
                                    <Link href={"/dashboard/settings"} aria-label="Settings" className="px-btn px-btn-sm px-btn-ghost">
                                        <Settings className="size-4" aria-hidden />
                                    </Link>
                                    <button onClick={toggleLogout} aria-label="Log out" className="px-btn px-btn-sm px-btn-red">
                                        <LogOut className="size-4" aria-hidden />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            {isSigningIn && (
                <SignupModal onClose={toggleSignIn} />
            )}

            {isLoggingOut && (
                <div onClick={toggleLogout} className='fixed inset-0 z-[70] flex h-dvh items-center justify-center bg-px-void/70 p-4'>
                    <div role="dialog" aria-modal="true" aria-labelledby="logout-title" onClick={(e) => e.stopPropagation()} className='px-panel flex w-full max-w-sm flex-col gap-5 p-6'>
                        <div className="flex flex-col gap-2">
                            <h2 id="logout-title" className='px-title text-base'>Log out?</h2>
                            <p className="text-lg text-muted">You can log back in anytime. Saved quizzes stay in your account.</p>
                        </div>
                        <div className='flex justify-end gap-2'>
                            <button onClick={toggleLogout} className='px-btn px-btn-ghost'>Cancel</button>
                            <button className='px-btn px-btn-red' onClick={handleLogOut}>
                                {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
