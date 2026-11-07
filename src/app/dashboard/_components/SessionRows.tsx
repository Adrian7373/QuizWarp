// Rows for active assignments and completed reports. No hooks: rendered by the server page.
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import CopyLinkButton from "./CopyLinkButton";
import EndSessionButton from "./EndSessionButton";
import DeleteSessionButton from "./DeleteSessionButton";
import { ASSIGNMENT_COLUMNS, REPORT_COLUMNS, ROW } from "./Ledger";

type SessionLike = {
    id: string;
    joinCode: string;
    mode: string;
    createdAt: Date | string;
    expiresAt: Date | string | null;
    quiz: { title: string };
    _count: { participants: number };
};

const DAY = 24 * 60 * 60 * 1000;
const players = (n: number) => `${n} ${n === 1 ? "player" : "players"}`;

export function AssignmentRow({ session, now = Date.now() }: { session: SessionLike; now?: number }) {
    const due = session.expiresAt ? new Date(session.expiresAt) : null;
    const dueSoon = due !== null && due.getTime() - now < DAY;

    return (
        <li className={`${ROW} ${ASSIGNMENT_COLUMNS}`}>
            <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-1">
                <span className="px-notch bg-px-void px-2.5 py-1.5 font-pixel text-sm tracking-widest text-px-yellow px-glow">{session.joinCode}</span>
                <CopyLinkButton joinCode={session.joinCode} />
            </div>
            <h3 className="min-w-0 truncate text-lg font-semibold">{session.quiz.title}</h3>
            <span className="text-base text-muted tabular-nums lg:text-right lg:text-fg">
                <span className="lg:hidden">{players(session._count.participants)} joined</span>
                <span className="hidden lg:inline">{session._count.participants}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2 text-base" title={due ? format(due, "EEE, MMM d 'at' h:mm a") : undefined}>
                {due ? (
                    <>
                        {dueSoon && <span className="px-notch bg-px-orange px-1.5 py-0.5 font-pixel text-[9px] text-px-void">Due soon</span>}
                        <span className={dueSoon ? "text-fg" : "text-muted"}>Due {formatDistanceToNow(due, { addSuffix: true })}</span>
                    </>
                ) : (
                    <span className="text-muted">No due date</span>
                )}
            </span>
            <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
                <Link href={`/dashboard/reports/${session.id}`} className="px-btn px-btn-sm px-btn-cyan">View progress</Link>
                <EndSessionButton sessionId={session.id} quizTitle={session.quiz.title} />
            </div>
        </li>
    );
}

export function ReportRow({ session }: { session: SessionLike }) {
    const live = session.mode !== "ASYNC";
    const played = new Date(session.createdAt);

    return (
        <li className={`${ROW} ${REPORT_COLUMNS}`}>
            <h3 className="min-w-0 truncate text-lg font-semibold">{session.quiz.title}</h3>
            <span>
                <span className={`px-notch inline-block px-1.5 py-1 font-pixel text-[9px] text-px-void ${live ? "bg-px-pink" : "bg-px-cyan"}`}>
                    {live ? "Live" : "Homework"}
                </span>
            </span>
            <span className="text-base text-muted tabular-nums lg:text-right lg:text-fg">
                <span className="lg:hidden">{players(session._count.participants)}</span>
                <span className="hidden lg:inline">{session._count.participants}</span>
            </span>
            <span className="text-base text-muted" title={format(played, "EEE, MMM d 'at' h:mm a")}>
                Played {formatDistanceToNow(played, { addSuffix: true })}
            </span>
            <div className="flex items-center gap-2 lg:justify-end">
                <Link href={`/dashboard/reports/${session.id}`} className="px-btn px-btn-sm px-btn-cyan">View scores</Link>
                <DeleteSessionButton sessionId={session.id} quizTitle={session.quiz.title} />
            </div>
        </li>
    );
}
