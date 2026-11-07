"use client"

import { Flag } from "lucide-react";

interface Faction {
    id: string;
    name: string;
}

interface Participant {
    id: string;
    nickname: string;
    factionId: string | null;
    totalScore: number;
}

interface FactionRaceTrackProps {
    factions: Faction[];
    participants: Participant[];
}

// Each faction keeps one lane color for the whole game (by join order, not by rank, so colors don't swap
// when teams overtake each other). Pink is left out: it means "live" on this screen.
const LANE_COLORS = ["bg-px-cyan", "bg-px-orange", "bg-px-lime", "bg-px-purple", "bg-px-blue", "bg-px-red"];

const formatPoints = (n: number) => n.toLocaleString("en-US");

export default function FactionRaceTrack({ factions, participants }: FactionRaceTrackProps) {
    // 1. Total score and head count per faction, with its stable color
    const factionScores = factions.map((faction, i) => {
        const members = participants.filter(p => p.factionId === faction.id);
        return {
            ...faction,
            color: LANE_COLORS[i % LANE_COLORS.length],
            members: members.length,
            score: members.reduce((sum, p) => sum + p.totalScore, 0),
        };
    });

    // 2. Sort by score (highest at the top)
    const sortedFactions = [...factionScores].sort((a, b) => b.score - a.score);

    // 3. Scale the track to the leader. A floor of 1000 keeps the bars from jumping to full on the first question.
    const maxScore = Math.max(...sortedFactions.map(f => f.score), 1000);

    return (
        <section aria-labelledby="race-heading" className="px-panel flex flex-col">
            <div className="flex items-center justify-between gap-3 border-b-4 border-frame px-4 py-3 sm:px-5">
                <h2 id="race-heading" className="flex items-center gap-3 font-pixel text-sm sm:text-base">
                    <Flag className="size-5 text-px-yellow" aria-hidden />
                    Faction race
                </h2>
                <span className="px-label text-muted">Team points</span>
            </div>

            {sortedFactions.length === 0 ? (
                <p className="px-5 py-8 text-center text-lg text-muted">No factions in this game.</p>
            ) : (
                <ol className="flex flex-col gap-5 p-4 sm:p-5">
                    {sortedFactions.map((faction, index) => {
                        // Width relative to the leader; at least 3% so an empty lane still shows its color.
                        const progress = Math.max(3, Math.min((faction.score / maxScore) * 100, 100));
                        const isLeader = index === 0 && faction.score > 0;

                        return (
                            <li key={faction.id} className="flex flex-col gap-2">
                                <div className="flex items-baseline gap-3">
                                    <span className={`px-notch shrink-0 px-1.5 py-1 font-pixel text-[10px] ${isLeader ? "bg-px-yellow text-px-void" : "bg-raised text-fg"}`}>
                                        {index + 1}
                                        <span className="sr-only">{index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"} place</span>
                                    </span>
                                    <span className="min-w-0 flex-1 truncate text-xl font-semibold sm:text-2xl" title={faction.name}>{faction.name}</span>
                                    <span className="hidden text-base text-muted sm:inline">{faction.members} {faction.members === 1 ? "player" : "players"}</span>
                                    <span className="font-pixel text-base text-fg px-glow sm:text-xl">{formatPoints(faction.score)}</span>
                                </div>
                                <div aria-hidden className="px-notch relative h-8 border-4 border-frame-strong bg-screen p-[3px] sm:h-10">
                                    <div
                                        className={`relative h-full ${faction.color} transition-[width] duration-700 [transition-timing-function:steps(14,end)]`}
                                        style={{ width: `${progress}%` }}
                                    >
                                        {/* The racer: a light block at the front of the bar */}
                                        <span className="absolute inset-y-0 right-0 w-2 bg-px-snow/80" />
                                    </div>
                                    {/* Finish line */}
                                    <span className="absolute inset-y-0 right-0 w-2 bg-[repeating-linear-gradient(to_bottom,var(--px-5)_0_4px,var(--px-0)_4px_8px)] opacity-60" />
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}
