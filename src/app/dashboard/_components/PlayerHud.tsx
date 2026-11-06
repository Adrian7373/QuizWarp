// The dashboard's top panel: who is playing, their coins and streak, and the main actions.
import Link from "next/link";
import { Layers } from "lucide-react";
import Sprite from "@/app/_components/arcade/Sprite";
import { HERO } from "@/app/_components/arcade/sprites";
import { CoinCounter, PixelBar, StreakFlame } from "@/app/_components/arcade/Hud";
import GenerateNewButton from "./GenerateNewButton";

interface PlayerHudProps {
    userId: string;
    name: string | null;
    role: "TEACHER" | "STUDENT";
    credits: number;
    streak: number;
}

export default function PlayerHud({ userId, name, role, credits, streak }: PlayerHudProps) {
    // Progress towards the 7-day bonus: streak 8 -> 1, streak 7 -> 7.
    const progressInWeek = streak === 0 ? 0 : ((streak - 1) % 7) + 1;
    const daysLeft = 7 - progressInWeek;

    return (
        <section aria-label="Player" className="px-panel grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(14rem,1fr)_auto_auto] lg:items-center lg:gap-6">
            <div className="flex min-w-0 items-center gap-4">
                <Sprite art={HERO} scale={3} title="Volt, your player" />
                <div className="min-w-0">
                    <p className="px-label whitespace-nowrap text-px-pink">Player 1 · {role === "TEACHER" ? "Teacher" : "Student"}</p>
                    <h1 className="px-title mt-2 truncate text-lg sm:text-xl">{name?.split(" ")[0] || "Player"}</h1>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-frame lg:border-x-4 lg:px-6">
                <Link href="/dashboard/settings?tab=credits" className="group flex flex-col gap-1.5">
                    <CoinCounter value={credits} />
                    <span className="text-sm text-muted group-hover:text-fg group-hover:underline">AI credits</span>
                </Link>
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                        <StreakFlame days={streak} />
                        <div className="w-32"><PixelBar value={progressInWeek} max={7} segments={7} color="lime" label="Days toward the weekly bonus" /></div>
                    </div>
                    <span className="text-sm text-muted">
                        {daysLeft === 0 ? "Weekly bonus earned" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} to +5 credits`}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                <GenerateNewButton userId={userId} />
                <Link href="/dashboard/bank" className="px-btn px-btn-ghost">
                    <Layers className="size-4" aria-hidden /> Question bank
                </Link>
            </div>
        </section>
    );
}
