"use client"

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, Loader2, LogOut, Lock, Mail, Save } from "lucide-react";
import toast from "react-hot-toast";
import { AppUser } from "@/app/page";
import { logOutUser, updateAccountProfile } from "../actions";
import Dialog from "@/app/_components/arcade/Dialog";
import Sprite from "@/app/_components/arcade/Sprite";
import { HERO } from "@/app/_components/arcade/sprites";
import { CoinCounter, PixelBar, StreakFlame } from "@/app/_components/arcade/Hud";
import { applyTheme, useTheme, type Theme } from "@/app/_components/arcade/ThemeToggle";
import { useSfxOn } from "@/app/_components/arcade/SoundToggle";
import { playSfx, setSfxOn } from "@/app/_components/arcade/sfx";

export type Tab = "account" | "preferences" | "security" | "credits";
type Role = "TEACHER" | "STUDENT";

interface SettingsClientProps {
    user: AppUser;
    initialTab: Tab;
}

const TABS: { id: Tab; label: string; hint: string }[] = [
    { id: "account", label: "Profile", hint: "Name and role" },
    { id: "preferences", label: "Game options", hint: "Screen and sound" },
    { id: "credits", label: "AI credits", hint: "Balance and rules" },
    { id: "security", label: "Account", hint: "Password and sign out" },
];

const ROLES: { id: Role; label: string; perks: string[]; fill: string }[] = [
    { id: "TEACHER", label: "Teacher", perks: ["Host live games", "Assign homework with due dates", "See class reports and AI insights"], fill: "border-px-pink" },
    { id: "STUDENT", label: "Student", perks: ["Study with flashcards", "Practice runs with instant feedback", "Join games with a PIN"], fill: "border-px-cyan" },
];

/** A small "Coming soon" chip for features that aren't built yet. */
function Soon() {
    return <span className="px-notch shrink-0 bg-raised px-1.5 py-1 font-pixel text-[8px] text-muted">Coming soon</span>;
}

/** A selectable card used for role and screen choices. */
function ChoiceCard({ checked, onSelect, accent, children, label }: {
    checked: boolean; onSelect: () => void; accent: string; children: React.ReactNode; label: string;
}) {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={label}
            data-sfx="select"
            onClick={onSelect}
            className={`px-notch relative flex flex-col items-start gap-2 border-4 p-4 text-left ${checked ? `${accent} bg-raised` : "border-frame-strong bg-surface hover:bg-raised"}`}
        >
            {checked && (
                <span className="px-notch absolute right-2 top-2 flex size-6 items-center justify-center bg-px-lime text-px-void">
                    <Check className="size-3.5" strokeWidth={4} aria-hidden />
                </span>
            )}
            {children}
        </button>
    );
}

export default function SettingsClient({ user, initialTab }: SettingsClientProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<Tab>(TABS.some((t) => t.id === initialTab) ? initialTab : "account");
    const [isSaving, setIsSaving] = useState(false);

    // Loading state of logout
    const [isPending, setIsPending] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Form states for the Profile tab
    const [savedName, setSavedName] = useState(user.name || "");
    const [savedRole, setSavedRole] = useState<Role>((user.role as Role) || "TEACHER");
    const [name, setName] = useState(user.name || "");
    const [role, setRole] = useState<Role>((user.role as Role) || "TEACHER");

    const theme = useTheme();
    const soundOn = useSfxOn();

    const trimmedName = name.trim();
    const nameError = trimmedName.length === 0 ? "Enter a display name." : trimmedName.length > 50 ? "Keep it to 50 characters or fewer." : "";
    const hasChanges = trimmedName !== savedName || role !== savedRole;

    // Keep the open tab in the URL, so a refresh or a shared link lands on it.
    const selectTab = (tab: Tab) => {
        setActiveTab(tab);
        router.replace(`${pathname}?tab=${tab}`, { scroll: false });
    };

    const handleLogOut = async () => {
        setIsPending(true);

        const response = await logOutUser();

        if (response?.error) {
            toast.error("Failed to logout user. Server error")
            setIsPending(false);
            setIsLoggingOut(false);
            return;
        }

        // Settings needs a session, so leave it instead of refreshing into an error.
        toast.success("Logged out")
        router.push("/");
        router.refresh();
    }

    const handleAccountSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (nameError || !hasChanges) return;
        setIsSaving(true);

        try {
            const response = await updateAccountProfile(user.id, trimmedName, role);

            if (response?.error) {
                toast.error(response.error)
            } else {
                toast.success(response.message ?? "Profile saved.")
                setSavedName(trimmedName);
                setSavedRole(role);
                setName(trimmedName);
                router.refresh(); // the navbar and dashboard show the new name and role
            }
        }
        finally {
            setIsSaving(false);
        }
    };

    const setTheme = (t: Theme) => { if (t !== theme) applyTheme(t); };
    const setSound = (on: boolean) => {
        if (on === soundOn) return;
        setSfxOn(on);
        if (on) playSfx("coin", true);
    };

    // Streak progress toward the weekly bonus (same rule as the dashboard).
    const streak = user.currentStreak ?? 0;
    const progressInWeek = streak === 0 ? 0 : ((streak - 1) % 7) + 1;

    return (
        <div className="grid items-start gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">

            {/* Options menu */}
            <nav aria-label="Settings sections" className="px-panel p-2 md:sticky md:top-24">
                <ul className="flex gap-1 overflow-x-auto md:flex-col [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <li key={tab.id} className="shrink-0">
                                <button
                                    type="button"
                                    onClick={() => selectTab(tab.id)}
                                    aria-current={isActive ? "page" : undefined}
                                    data-sfx="select"
                                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${isActive ? "bg-raised" : "hover:bg-raised/60"}`}
                                >
                                    <span aria-hidden className={`w-3 font-pixel text-[10px] text-px-yellow ${isActive ? "px-blink" : "invisible"}`}>▶</span>
                                    <span className="flex flex-col">
                                        <span className={`whitespace-nowrap font-pixel text-[10px] ${isActive ? "text-fg" : "text-muted"}`}>{tab.label}</span>
                                        <span className="hidden text-sm text-muted md:block">{tab.hint}</span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="px-panel min-w-0 p-5 sm:p-7">

                {/* --- PROFILE --- */}
                {activeTab === "account" && (
                    <form onSubmit={handleAccountSave} className="space-y-7" noValidate>
                        <div className="flex items-center gap-4">
                            <Sprite art={HERO} scale={3} title="Volt, your player" />
                            <div className="min-w-0">
                                <h2 className="px-title text-base sm:text-lg">Profile</h2>
                                <p className="mt-1 text-base text-muted">How you appear in games and reports.</p>
                            </div>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                            <label className="block text-base font-semibold">Display name
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={60}
                                    aria-invalid={!!nameError}
                                    aria-describedby="name-help"
                                    className={`px-input mt-1.5 w-full ${nameError ? "border-px-red" : ""}`}
                                />
                                <span id="name-help" className={`mt-1.5 block text-sm font-normal ${nameError ? "text-px-red" : "text-muted"}`}>
                                    {nameError || "Players see this on the leaderboard."}
                                </span>
                            </label>

                            <label className="block text-base font-semibold">Email
                                <span className="relative mt-1.5 block">
                                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted" aria-hidden />
                                    <input type="email" value={user.email} readOnly className="px-input w-full cursor-default pl-10 text-muted" />
                                </span>
                                <span className="mt-1.5 block text-sm font-normal text-muted">Tied to how you sign in, so it can&apos;t be changed here.</span>
                            </label>
                        </div>

                        <fieldset>
                            <legend className="text-base font-semibold">Role</legend>
                            <div role="radiogroup" aria-label="Role" className="mt-2 grid gap-3 sm:grid-cols-2">
                                {ROLES.map((r) => (
                                    <ChoiceCard key={r.id} checked={role === r.id} onSelect={() => setRole(r.id)} accent={r.fill} label={r.label}>
                                        <span className="font-pixel text-xs">{r.label}</span>
                                        <ul className="space-y-1 text-base text-muted">
                                            {r.perks.map((p) => <li key={p}>{p}</li>)}
                                        </ul>
                                    </ChoiceCard>
                                ))}
                            </div>
                            {role !== savedRole && (
                                <p className="mt-2 text-sm text-muted">Your dashboard changes to the {role === "TEACHER" ? "teacher" : "student"} tools after you save.</p>
                            )}
                        </fieldset>

                        <div className="flex flex-wrap items-center gap-3 border-t-4 border-dashed border-frame pt-5">
                            <button type="submit" disabled={isSaving || !hasChanges || !!nameError} data-sfx="coin" className="px-btn px-btn-yellow">
                                {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
                                {isSaving ? "Saving…" : "Save changes"}
                            </button>
                            {hasChanges ? (
                                <button type="button" onClick={() => { setName(savedName); setRole(savedRole); }} className="px-btn px-btn-ghost">Undo</button>
                            ) : (
                                <span className="text-base text-muted">All changes saved.</span>
                            )}
                        </div>
                    </form>
                )}

                {/* --- GAME OPTIONS --- */}
                {activeTab === "preferences" && (
                    <div className="space-y-7">
                        <div>
                            <h2 className="px-title text-base sm:text-lg">Game options</h2>
                            <p className="mt-1 text-base text-muted">Saved on this device.</p>
                        </div>

                        <fieldset>
                            <legend className="text-base font-semibold">Screen</legend>
                            <div role="radiogroup" aria-label="Screen" className="mt-2 grid gap-3 sm:grid-cols-2">
                                {([["dark", "Cabinet", "Dark screen with scanlines and glow."], ["light", "Paper", "Printed-manual look. Easier on projectors."]] as const).map(([t, label, hint]) => (
                                    <ChoiceCard key={t} checked={theme === t} onSelect={() => setTheme(t)} accent="border-px-cyan" label={`${label} screen`}>
                                        {/* Mini preview of each screen, drawn with its own colors */}
                                        <span aria-hidden className={`px-notch flex h-14 w-full items-center gap-2 border-4 border-px-void px-3 ${t === "dark" ? "bg-px-void" : "bg-px-paper"}`}>
                                            <span className={`h-2.5 w-16 ${t === "dark" ? "bg-px-yellow" : "bg-px-void"}`} />
                                            <span className="h-2.5 w-6 bg-px-pink" />
                                            <span className="ml-auto h-5 w-10 border-2 border-px-void bg-px-cyan" />
                                        </span>
                                        <span className="font-pixel text-xs">{label}</span>
                                        <span className="text-base text-muted">{hint}</span>
                                    </ChoiceCard>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend className="text-base font-semibold">Sound effects</legend>
                            <div role="radiogroup" aria-label="Sound effects" className="mt-2 grid gap-3 sm:grid-cols-2">
                                <ChoiceCard checked={soundOn} onSelect={() => setSound(true)} accent="border-px-cyan" label="Sound on">
                                    <span className="font-pixel text-xs">On</span>
                                    <span className="text-base text-muted">Chiptune blips for buttons, coins, and right or wrong answers.</span>
                                </ChoiceCard>
                                <ChoiceCard checked={!soundOn} onSelect={() => setSound(false)} accent="border-px-cyan" label="Sound off">
                                    <span className="font-pixel text-xs">Off</span>
                                    <span className="text-base text-muted">Silent. Good for quiet classrooms.</span>
                                </ChoiceCard>
                            </div>
                        </fieldset>

                        <div className="flex items-start justify-between gap-4 border-t-4 border-dashed border-frame pt-5 opacity-70">
                            <div>
                                <p className="text-base font-semibold">Email notifications</p>
                                <p className="text-base text-muted">Get the report by email when homework ends.</p>
                            </div>
                            <Soon />
                        </div>
                    </div>
                )}

                {/* --- AI CREDITS --- */}
                {activeTab === "credits" && (
                    <div className="space-y-7">
                        <h2 className="px-title text-base sm:text-lg">AI credits</h2>

                        <div className="px-notch flex flex-wrap items-center gap-x-10 gap-y-5 border-4 border-frame bg-screen p-5">
                            <div>
                                <p className="text-sm text-muted">Balance</p>
                                <div className="mt-1 scale-[1.6] origin-left"><CoinCounter value={user.aiCredits} /></div>
                            </div>
                            <div className="min-w-[14rem] flex-1">
                                <p className="mb-1.5 flex items-center gap-2 text-sm text-muted"><StreakFlame days={streak} /> day streak</p>
                                <PixelBar value={progressInWeek} max={7} segments={7} color="lime" label="Days toward the weekly bonus" />
                                <p className="mt-1.5 text-sm text-muted">
                                    {7 - progressInWeek === 0 ? "Weekly bonus earned" : `${7 - progressInWeek} ${7 - progressInWeek === 1 ? "day" : "days"} to +5 credits`}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                                <h3 className="text-lg font-semibold">How you earn credits</h3>
                                <ul className="mt-2 divide-y-4 divide-frame border-4 border-frame">
                                    {[["+1", "Every day you log in"], ["+5", "Every 7-day login streak"], ["Up to 20", "Topped up each month if you're below 20"]].map(([n, what]) => (
                                        <li key={what} className="flex items-center gap-3 bg-screen px-3 py-2.5 text-base">
                                            <span className="w-20 shrink-0 font-pixel text-[10px] text-px-yellow px-glow">{n}</span>{what}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">What a quiz costs</h3>
                                <ul className="mt-2 divide-y-4 divide-frame border-4 border-frame">
                                    {[["1", "Up to 10 questions"], ["2", "11 to 20 questions"], ["4", "40 questions"]].map(([n, what]) => (
                                        <li key={what} className="flex items-center gap-3 bg-screen px-3 py-2.5 text-base">
                                            <span className="w-20 shrink-0 font-pixel text-[10px] text-px-yellow px-glow">{n} {n === "1" ? "credit" : "credits"}</span>{what}
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-2 text-sm text-muted">One credit per 10 questions, rounded up.</p>
                            </div>
                        </div>

                        <div className="border-t-4 border-dashed border-frame pt-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h3 className="text-lg font-semibold">Top up</h3>
                                <Soon />
                            </div>
                            <div className="mt-3 grid gap-3 opacity-70 sm:grid-cols-2">
                                {[["100", "₱150.00"], ["500", "₱500.00"]].map(([n, price]) => (
                                    <div key={n} className="px-notch flex items-center justify-between gap-3 border-4 border-frame-strong bg-surface p-4">
                                        <div>
                                            <p className="font-pixel text-sm">{n}</p>
                                            <p className="text-base text-muted">credits for {price}</p>
                                        </div>
                                        <button type="button" disabled className="px-btn px-btn-sm">Buy</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ACCOUNT --- */}
                {activeTab === "security" && (
                    <div className="space-y-7">
                        <h2 className="px-title text-base sm:text-lg">Account</h2>

                        <ul className="divide-y-4 divide-frame border-4 border-frame">
                            <li className="flex flex-wrap items-center justify-between gap-4 bg-screen p-4 opacity-70">
                                <div className="flex items-start gap-3">
                                    <Lock className="mt-1 size-5 text-muted" aria-hidden />
                                    <div>
                                        <p className="text-base font-semibold">Change password</p>
                                        <p className="text-base text-muted">Set a new password for email sign-in.</p>
                                    </div>
                                </div>
                                <Soon />
                            </li>
                            <li className="flex flex-wrap items-center justify-between gap-4 bg-screen p-4">
                                <div className="flex items-start gap-3">
                                    <LogOut className="mt-1 size-5 text-muted" aria-hidden />
                                    <div>
                                        <p className="text-base font-semibold">Sign out</p>
                                        <p className="text-base text-muted">Log out of QuizWarp on this device.</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setIsLoggingOut(true)} className="px-btn px-btn-red">Sign out</button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>

            {isLoggingOut && (
                <Dialog
                    title="Sign out?"
                    size="sm"
                    onClose={() => setIsLoggingOut(false)}
                    locked={isPending}
                    actions={<>
                        <button onClick={() => setIsLoggingOut(false)} className="px-btn px-btn-ghost">Cancel</button>
                        <button onClick={handleLogOut} disabled={isPending} className="px-btn px-btn-red">
                            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
                            Sign out
                        </button>
                    </>}
                >
                    <p className="text-lg">You can sign back in anytime. Your quizzes, reports and credits stay in your account.</p>
                </Dialog>
            )}
        </div>
    );
}
