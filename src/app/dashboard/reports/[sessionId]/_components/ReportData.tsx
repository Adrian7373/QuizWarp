import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import prisma from "@/lib/prisma";
import { PixelBar } from "@/app/_components/arcade/Hud";
import Sprite from "@/app/_components/arcade/Sprite";
import { FLAME } from "@/app/_components/arcade/sprites";
import { EmptyState, Ledger, ROW } from "@/app/dashboard/_components/Ledger";
import { TYPE_META, isBankType } from "@/app/dashboard/bank/_components/types";
import AiInsightsCard from "./AiInsightsCard";
import ExportCsvButton from "./ExportCsvButton";

interface ReportDataProps {
    sessionId: string,
    userId: string,
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Lime when most got it, yellow when it was split, red when most missed. */
const accuracyColor = (accuracy: number) => (accuracy >= 80 ? "lime" : accuracy >= 50 ? "yellow" : "red");

const RANK_FILL = ["bg-px-yellow", "bg-px-fog", "bg-px-orange"];

function fetchReport(sessionId: string, userId: string) {
    return prisma.gameSession.findFirst({
        where: { id: sessionId, hostId: userId }, // Only the host can see this report
        include: {
            quiz: {
                select: {
                    title: true,
                    // Same query shape as the play pages, so question numbers line up with live answers.
                    questions: { select: { id: true, questionText: true, questionType: true, correctAnswer: true } },
                },
            },
            participants: {
                orderBy: { totalScore: "desc" },
                include: {
                    responses: { select: { isCorrect: true, questionId: true } },
                    faction: { select: { name: true } },
                },
            },
        },
    });
}

export type ReportSession = NonNullable<Awaited<ReturnType<typeof fetchReport>>>;

export default async function ReportData({ sessionId, userId }: ReportDataProps) {
    const session = await fetchReport(sessionId, userId);
    if (!session) redirect("/dashboard");
    return <ReportView session={session} />;
}

/** The report itself, from already-loaded data. */
export function ReportView({ session }: { session: ReportSession }) {

    const questions = session.quiz.questions;
    const players = session.participants;
    const totalQuestions = questions.length;
    const isAssignment = session.mode === "ASYNC";
    const inProgress = session.status !== "FINISHED";
    const hasFactions = players.some(p => p.faction);

    const rows = players.map(p => {
        const correct = p.responses.filter(r => r.isCorrect).length;
        return { ...p, correct, answered: p.responses.length, accuracy: pct(correct, totalQuestions) };
    });

    const averageScore = players.length ? Math.round(players.reduce((a, p) => a + p.totalScore, 0) / players.length) : 0;
    const bestStreak = players.length ? Math.max(...players.map(p => p.maxStreak)) : 0;
    const classAccuracy = pct(rows.reduce((a, r) => a + r.correct, 0), players.length * totalQuestions);
    const finishedCount = rows.filter(r => r.answered >= totalQuestions).length;

    // Per-question results. Assignments save answers by question id, live games by question number.
    const questionStats = questions.map((q, index) => {
        const answers = players.flatMap(p => p.responses.filter(r => r.questionId === q.id || r.questionId === String(index)));
        const correct = answers.filter(r => r.isCorrect).length;
        return { ...q, number: index + 1, answered: answers.length, correct, accuracy: pct(correct, answers.length) };
    });
    const mostMissed = questionStats
        .filter(q => q.answered > 0 && q.accuracy < 60)
        .reduce<number | null>((worst, q) => (worst === null || q.accuracy < questionStats[worst - 1].accuracy ? q.number : worst), null);

    const backHref = isAssignment && inProgress ? "/dashboard?tab=assignments" : "/dashboard?tab=reports";

    const stats = [
        { label: "Players", value: String(players.length), tone: "text-px-cyan", sub: isAssignment ? `${finishedCount} finished` : null },
        { label: "Average score", value: averageScore.toLocaleString(), tone: "text-px-pink", sub: null },
        { label: "Class accuracy", value: `${classAccuracy}%`, tone: "text-px-lime", sub: null },
        { label: "Best streak", value: `×${bestStreak}`, tone: "text-px-orange", sub: null, flame: true },
    ];

    const csvRows = rows.map(r => ({
        nickname: r.nickname,
        totalScore: r.totalScore,
        maxStreak: r.maxStreak,
        faction: r.faction?.name ?? null,
        correct: r.correct,
        accuracy: r.accuracy,
    }));

    const leaderboardColumns = hasFactions
        ? "lg:grid-cols-[3.5rem_minmax(0,1fr)_8rem_13rem_9rem_6rem]"
        : "lg:grid-cols-[3.5rem_minmax(0,1fr)_8rem_13rem_6rem]";

    return (
        <div className="flex flex-col gap-10">
            {/* Header */}
            <header className="flex flex-col gap-5">
                <Link href={backHref} className="inline-flex items-center gap-2 self-start text-base text-muted underline-offset-4 hover:text-fg hover:underline print:hidden">
                    <ArrowLeft className="size-4" aria-hidden /> {isAssignment && inProgress ? "Assignments" : "Reports"}
                </Link>

                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div className="flex min-w-0 flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-label px-notch px-2 py-1 text-px-void ${isAssignment ? "bg-px-cyan" : "bg-px-pink"}`}>
                                {isAssignment ? "Assignment" : "Live game"}
                            </span>
                            <span className={`px-label px-notch px-2 py-1 ${inProgress ? "bg-px-orange text-px-void" : "bg-raised text-muted"}`}>
                                {inProgress ? "In progress" : "Finished"}
                            </span>
                        </div>
                        <h1 className="px-title text-lg leading-relaxed sm:text-2xl">{session.quiz.title}</h1>
                        <p className="text-lg text-muted">
                            {isAssignment ? "Assigned" : "Played"} {format(new Date(session.createdAt), "MMM d, yyyy")}, code <span className="font-pixel text-xs text-fg">{session.joinCode}</span>
                            {isAssignment && inProgress && session.expiresAt && <>. Closes {format(new Date(session.expiresAt), "MMM d, h:mm a")}</>}
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-2 print:hidden">
                        <ExportCsvButton quizTitle={session.quiz.title} totalQuestions={totalQuestions} participants={csvRows} />
                    </div>
                </div>
            </header>

            {/* Totals */}
            <section aria-label="Session totals" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map(s => (
                    <div key={s.label} className="px-panel flex flex-col gap-3 p-4">
                        <span className={`px-label text-[9px] ${s.tone}`}>{s.label}</span>
                        <span className="flex items-center gap-2 font-pixel text-lg text-fg sm:text-xl">
                            {s.flame && <Sprite art={FLAME} scale={3} className={bestStreak > 0 ? "" : "opacity-40 grayscale"} />}
                            {s.value}
                        </span>
                        {s.sub && <span className="text-base text-muted">{s.sub}</span>}
                    </div>
                ))}
            </section>

            {players.length === 0 ? (
                <EmptyState
                    mood="sad"
                    say={isAssignment
                        ? `No one has started yet. Share the code ${session.joinCode} with your class.`
                        : "No one joined this game, so there are no scores to show."}
                />
            ) : (
                <>
                    <AiInsightsCard sessionId={session.id} initialInsight={session.classInsight} inProgress={inProgress} />

                    {/* Leaderboard */}
                    <section aria-labelledby="leaderboard-title" className="flex flex-col gap-4">
                        <h2 id="leaderboard-title" className="px-title text-base">High scores</h2>
                        <Ledger
                            columns={leaderboardColumns}
                            headers={hasFactions ? ["Rank", "Player", "Score", "Correct", "Faction", "Streak"] : ["Rank", "Player", "Score", "Correct", "Streak"]}
                            right={["Score"]}
                        >
                            {rows.map((r, i) => (
                                <li key={r.id} className={`${ROW} grid-cols-[2.5rem_minmax(0,1fr)_auto] ${leaderboardColumns}`}>
                                    <span className={`px-notch flex size-9 items-center justify-center font-pixel text-[10px] ${i < 3 ? `${RANK_FILL[i]} text-px-void` : "bg-raised text-muted"}`}>
                                        <span className="sr-only">Rank </span>{i + 1}
                                    </span>
                                    <span className="min-w-0 truncate text-lg font-semibold">{r.nickname}</span>
                                    <span className="text-right font-pixel text-xs text-fg">{r.totalScore.toLocaleString()}</span>

                                    {/* Second line on small screens, its own columns on lg */}
                                    <div className="col-span-2 col-start-2 flex flex-wrap items-center gap-x-5 gap-y-2 lg:contents">
                                        <span className="flex min-w-48 items-center gap-3 lg:min-w-0">
                                            <span className="mr-3 w-24 shrink-0 lg:w-auto lg:min-w-0 lg:flex-1">
                                                <PixelBar value={r.correct} max={totalQuestions || 1} segments={10} color={accuracyColor(r.accuracy)} label={`${r.nickname}: ${r.correct} of ${totalQuestions} correct`} />
                                            </span>
                                            <span className="shrink-0 text-base tabular-nums">
                                                {r.correct}<span className="text-muted">/{totalQuestions}</span>
                                            </span>
                                        </span>
                                        {hasFactions && <span className="truncate text-base text-muted">{r.faction?.name ?? "Solo"}</span>}
                                        <span className="inline-flex items-center gap-1.5 text-base">
                                            <span className="sr-only">Best streak </span>
                                            <Sprite art={FLAME} scale={2} className={r.maxStreak > 0 ? "" : "opacity-40 grayscale"} />×{r.maxStreak}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </Ledger>
                    </section>

                    {/* Question breakdown */}
                    <section aria-labelledby="questions-title" className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <h2 id="questions-title" className="px-title text-base">Question breakdown</h2>
                            <p className="text-lg text-muted">How many players got each question right, in quiz order.</p>
                        </div>
                        <Ledger
                            columns="lg:grid-cols-[3.5rem_minmax(0,1fr)_11rem_15rem]"
                            headers={["No.", "Question", "Type", "Correct"]}
                        >
                            {questionStats.map(q => {
                                const meta = isBankType(q.questionType) ? TYPE_META[q.questionType] : null;
                                return (
                                    <li key={q.id} className={`${ROW} grid-cols-[2.5rem_minmax(0,1fr)] lg:grid-cols-[3.5rem_minmax(0,1fr)_11rem_15rem]`}>
                                        <span className="font-pixel text-[10px] text-muted">Q{String(q.number).padStart(2, "0")}</span>
                                        <div className="flex min-w-0 flex-col gap-1">
                                            <p className="line-clamp-2 text-lg leading-snug">{q.questionText}</p>
                                            <p className="truncate text-base text-muted">Answer: {q.correctAnswer}</p>
                                            {mostMissed === q.number && (
                                                <span className="px-label px-notch mt-1 self-start bg-px-red px-2 py-1 text-[9px] text-px-void">Most missed</span>
                                            )}
                                        </div>
                                        <div className="col-start-2 flex flex-wrap items-center gap-x-5 gap-y-2 lg:contents">
                                            <span>
                                                {meta && <span className={`px-label px-notch inline-block whitespace-nowrap px-2 py-1 text-[9px] text-px-void ${meta.fill}`}>{meta.label}</span>}
                                            </span>
                                            {q.answered === 0 ? (
                                                <span className="text-base text-muted">No answers yet</span>
                                            ) : (
                                                <span className="flex min-w-48 items-center gap-3 lg:min-w-0">
                                                    <span className="mr-3 w-24 shrink-0 lg:w-auto lg:min-w-0 lg:flex-1">
                                                        <PixelBar value={q.correct} max={q.answered} segments={10} color={accuracyColor(q.accuracy)} label={`Question ${q.number}: ${q.accuracy}% correct`} />
                                                    </span>
                                                    <span className="shrink-0 text-base tabular-nums">
                                                        {q.correct}<span className="text-muted">/{q.answered}</span> <span className="text-muted">({q.accuracy}%)</span>
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </Ledger>
                    </section>
                </>
            )}
        </div>
    );
}
