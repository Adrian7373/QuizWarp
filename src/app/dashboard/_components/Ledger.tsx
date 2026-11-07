// Shared list pieces for the dashboard. No hooks: usable from the server page.
import { Orbi } from "@/app/_components/arcade/Hud";

/**
 * Column templates. A header row and its data rows must share one template so the columns
 * line up; the actions column is fixed-width because an `auto` column collapses in the header.
 * Below `lg` the rows stack instead.
 */
export const LIBRARY_COLUMNS = "lg:grid-cols-[minmax(0,1fr)_8rem_5.5rem_4.5rem_19rem]";
export const ASSIGNMENT_COLUMNS = "lg:grid-cols-[10rem_minmax(0,1fr)_5.5rem_12rem_17rem]";
export const REPORT_COLUMNS = "lg:grid-cols-[minmax(0,1fr)_7rem_5.5rem_10rem_13rem]";

/** A panel of rows with a pixel header row. */
export function Ledger({ columns, headers, right = [], children }: {
    columns: string; headers: string[]; right?: string[]; children: React.ReactNode;
}) {
    return (
        <div className="px-panel">
            <div className={`hidden gap-x-4 border-b-4 border-frame bg-raised px-4 py-2.5 lg:grid ${columns}`}>
                {headers.map((h, i) => (
                    <span key={i} className={`px-label text-[9px] text-muted ${right.includes(h) ? "text-right" : ""}`}>{h}</span>
                ))}
            </div>
            <ul className="divide-y-4 divide-frame">{children}</ul>
        </div>
    );
}

/** Row shell: stacked on small screens, columns on lg. */
export const ROW = "grid gap-x-4 gap-y-3 px-4 py-3.5 hover:bg-raised/60 lg:items-center";

/** Orbi explains what to do next, with an optional action. */
export function EmptyState({ mood = "idle", say, children }: { mood?: "idle" | "sad"; say: string; children?: React.ReactNode }) {
    return (
        <div className="px-panel flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <Orbi mood={mood} say={say} />
            {children && <div className="shrink-0">{children}</div>}
        </div>
    );
}

const LEVELS: Record<string, { n: number; fill: string; label: string }> = {
    easy: { n: 1, fill: "bg-px-lime", label: "Easy" },
    normal: { n: 2, fill: "bg-px-yellow", label: "Normal" },
    hard: { n: 3, fill: "bg-px-red", label: "Hard" },
};

/** Difficulty as a 3-block meter, like a game's difficulty select. */
export function DifficultyMeter({ difficulty }: { difficulty: string }) {
    const level = LEVELS[difficulty] ?? LEVELS.normal;
    return (
        <span className="inline-flex items-center gap-2 text-base">
            <span className="flex gap-[3px]" aria-hidden>
                {[1, 2, 3].map((i) => (
                    <span key={i} className={`size-2.5 border-2 border-px-void ${i <= level.n ? level.fill : "bg-raised"}`} />
                ))}
            </span>
            {level.label}
        </span>
    );
}
