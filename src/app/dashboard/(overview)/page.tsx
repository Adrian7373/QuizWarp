import { Suspense } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import ActiveLiveWidget from "../../_components/ActiveLiveWidget";
import GenerateNewButton from "../_components/GenerateNewButton";
import QuizCard from "../_components/QuizCard";
import RewardTracker from "../_components/RewardTracker";
import Pagination from "../_components/Pagination";
import PlayerHud from "../_components/PlayerHud";
import { AssignmentRow, ReportRow } from "../_components/SessionRows";
import { ASSIGNMENT_COLUMNS, EmptyState, LIBRARY_COLUMNS, Ledger, REPORT_COLUMNS, ROW } from "../_components/Ledger";

interface DashboardProps {
    searchParams: Promise<{ tab?: string, page?: string, q?: string }>;
}

type UserRole = "TEACHER" | "STUDENT";
type Tab = "quizzes" | "assignments" | "reports";
const ITEMS_PER_PAGE = 10;

// ==========================================
// 1. QUERY FILTERS (shared by the tab counts and the lists)
// ==========================================

const libraryWhere = (userId: string, q?: string) => ({
    creatorId: userId,
    isDeleted: false,
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
});

const assignmentsWhere = (userId: string) => ({
    hostId: userId,
    status: "IN_PROGRESS" as const,
    mode: "ASYNC" as const,
    NOT: { joinCode: { startsWith: "PRAC-" } },
    OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
    ]
});

const reportsWhere = (userId: string) => ({
    hostId: userId,
    NOT: { joinCode: { startsWith: "PRAC-" } },
    OR: [
        { status: "FINISHED" as const },
        {
            status: "IN_PROGRESS" as const,
            mode: "ASYNC" as const,
            expiresAt: { lte: new Date() }
        }
    ]
});

const sessionInclude = {
    quiz: { select: { title: true } },
    _count: { select: { participants: true } }
};

// ==========================================
// 2. LOADING SKELETON
// ==========================================

function RowsSkeleton({ rows, columns }: { rows: number, columns: string }) {
    return (
        <div className="px-panel" aria-hidden>
            <div className="hidden h-10 border-b-4 border-frame bg-raised lg:block" />
            <ul className="divide-y-4 divide-frame">
                {[...Array(rows)].map((_, i) => (
                    <li key={i} className={`${ROW} ${columns}`}>
                        <div className="space-y-2">
                            <div className="h-4 w-2/3 bg-raised px-notch" />
                            <div className="h-3.5 w-1/2 bg-raised px-notch" />
                        </div>
                        <div className="h-4 w-20 bg-raised px-notch" />
                        <div className="hidden h-4 w-8 justify-self-end bg-raised px-notch lg:block" />
                        <div className="hidden h-4 w-8 justify-self-end bg-raised px-notch lg:block" />
                        <div className="h-9 w-48 bg-raised px-notch lg:justify-self-end" />
                    </li>
                ))}
            </ul>
        </div>
    );
}

function getTabSkeleton(tab: Tab) {
    if (tab === "assignments") return <RowsSkeleton rows={3} columns={ASSIGNMENT_COLUMNS} />;
    if (tab === "reports") return <RowsSkeleton rows={5} columns={REPORT_COLUMNS} />;
    return <RowsSkeleton rows={6} columns={LIBRARY_COLUMNS} />;
}

// ==========================================
// 3. DATA FETCHING COMPONENT (Wrapped in Suspense)
// ==========================================

async function TabContent({ currentTab, userId, skip, currentPage, userRole, q }: {
    currentTab: Tab,
    userId: string,
    skip: number,
    currentPage: number,
    userRole: UserRole,
    q?: string,
}) {

    // --- TAB 1: LIBRARY ---
    if (currentTab === "quizzes") {
        const whereClause = libraryWhere(userId, q);
        const [quizzes, totalCount] = await prisma.$transaction([
            prisma.quiz.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip: skip,
                take: ITEMS_PER_PAGE,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    difficulty: true,
                    createdAt: true,
                    _count: { select: { questions: true, sessions: true } }
                }
            }),
            prisma.quiz.count({ where: whereClause })
        ]);

        if (quizzes.length === 0) {
            return q ? (
                <EmptyState mood="sad" say={`No quiz titles match “${q}”. Try a shorter word.`}>
                    <Link href="?tab=quizzes" className="px-btn px-btn-ghost">Clear search</Link>
                </EmptyState>
            ) : (
                <EmptyState say="Your library is empty. Paste some notes and I'll build your first quiz.">
                    <GenerateNewButton userId={userId} />
                </EmptyState>
            );
        }

        return (
            <>
                {q && <p className="mb-3 text-base text-muted">{totalCount} {totalCount === 1 ? "quiz matches" : "quizzes match"} “{q}”</p>}
                <Ledger columns={LIBRARY_COLUMNS} headers={["Quiz", "Level", "Questions", "Plays", ""]} right={["Questions", "Plays"]}>
                    {quizzes.map((quiz) => (
                        <QuizCard key={quiz.id} quiz={quiz} userId={userId} userRole={userRole} />
                    ))}
                </Ledger>
                <Pagination currentPage={currentPage} totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)} tab={currentTab} q={q} />
            </>
        );
    }

    // --- TAB 2: ACTIVE ASSIGNMENTS ---
    if (currentTab === "assignments") {
        const activeSessions = await prisma.gameSession.findMany({
            where: assignmentsWhere(userId),
            orderBy: { expiresAt: 'asc' }, // soonest deadline first
            include: sessionInclude
        });

        if (activeSessions.length === 0) {
            return (
                <EmptyState say="No homework is running. Pick a quiz in your Library and press Assign to get a join PIN.">
                    <Link href="?tab=quizzes" className="px-btn px-btn-ghost">Go to Library</Link>
                </EmptyState>
            );
        }

        const now = Date.now();
        return (
            <Ledger columns={ASSIGNMENT_COLUMNS} headers={["Join PIN", "Quiz", "Joined", "Deadline", ""]} right={["Joined"]}>
                {activeSessions.map((session) => <AssignmentRow key={session.id} session={session} hostId={userId} now={now} />)}
            </Ledger>
        );
    }

    // --- TAB 3: COMPLETED REPORTS ---
    if (currentTab === "reports") {
        const completedSessions = await prisma.gameSession.findMany({
            where: reportsWhere(userId),
            orderBy: { createdAt: 'desc' },
            include: sessionInclude
        });

        if (completedSessions.length === 0) {
            return <EmptyState say="No reports yet. When a live game or homework ends, the scores land here." />;
        }

        return (
            <Ledger columns={REPORT_COLUMNS} headers={["Quiz", "Mode", "Players", "When", ""]} right={["Players"]}>
                {completedSessions.map((session) => <ReportRow key={session.id} session={session} hostId={userId} />)}
            </Ledger>
        );
    }

    return null;
}


// ==========================================
// 4. MAIN PAGE SHELL (Loads Instantly)
// ==========================================

export default async function DashboardPage({ searchParams }: DashboardProps) {
    const { tab, page, q: rawQ } = await searchParams;
    const currentTab: Tab = tab === "assignments" || tab === "reports" ? tab : "quizzes";
    const q = rawQ?.trim() || undefined;

    const currentPage = Math.max(1, Number(page) || 1);
    const skip = (currentPage - 1) * ITEMS_PER_PAGE;

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // Type Guard to satisfy TypeScript (Middleware handles the actual redirect)
    if (!authUser) {
        throw new Error("Unauthorized");
    }

    const [userResponse, counts] = await Promise.all([
        getUser(authUser.id),
        prisma.$transaction([
            prisma.quiz.count({ where: libraryWhere(authUser.id) }),
            prisma.gameSession.count({ where: assignmentsWhere(authUser.id) }),
            prisma.gameSession.count({ where: reportsWhere(authUser.id) }),
        ]),
    ]);
    const appUser = userResponse.user ?? null;
    const userRole: UserRole = appUser?.role === "TEACHER" ? "TEACHER" : "STUDENT";
    const [libraryCount, assignmentCount, reportCount] = counts;

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: "quizzes", label: "Library", count: libraryCount },
        { id: "assignments", label: "Active", count: assignmentCount },
        { id: "reports", label: "Reports", count: reportCount },
    ];

    return (
        <div className="px-crt min-h-dvh bg-bg font-sans text-fg">
            <NavBar user={appUser} />
            <RewardTracker userId={authUser.id} />
            <ActiveLiveWidget userId={authUser.id} />

            <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-6">

                <PlayerHud
                    userId={authUser.id}
                    name={appUser?.name ?? null}
                    role={userRole}
                    credits={appUser?.aiCredits ?? 0}
                    streak={appUser?.currentStreak ?? 0}
                />

                <div className="mb-4 mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <nav aria-label="Dashboard sections" className="flex flex-wrap gap-2">
                        {tabs.map((t) => {
                            const active = currentTab === t.id;
                            return (
                                <Link
                                    key={t.id}
                                    href={`?tab=${t.id}`}
                                    aria-current={active ? "page" : undefined}
                                    data-sfx="select"
                                    className={`px-btn ${active ? "px-btn-cyan" : "px-btn-ghost"}`}
                                >
                                    {t.label}
                                    <span className={`px-notch px-1.5 py-1 text-[9px] ${active ? "bg-px-void text-px-snow" : "bg-bg text-fg"}`}>{t.count}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {currentTab === "quizzes" && libraryCount > 0 && (
                        <form action="/dashboard" role="search" className="flex w-full gap-2 lg:w-auto">
                            <input type="hidden" name="tab" value="quizzes" />
                            <label className="relative flex-1 lg:w-80 lg:flex-none">
                                <span className="sr-only">Search your quizzes</span>
                                <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted" aria-hidden />
                                <input type="search" name="q" defaultValue={q} placeholder="Search your quizzes" className="px-input w-full py-1.5 pl-10" />
                            </label>
                            {q ? (
                                <Link href="?tab=quizzes" className="px-btn px-btn-ghost" aria-label="Clear search"><X className="size-4" aria-hidden /></Link>
                            ) : (
                                <button type="submit" className="px-btn px-btn-ghost">Search</button>
                            )}
                        </form>
                    )}
                </div>

                <Suspense key={`${currentTab}-${currentPage}-${q ?? ""}`} fallback={getTabSkeleton(currentTab)}>
                    <TabContent
                        currentTab={currentTab}
                        userId={authUser.id}
                        skip={skip}
                        currentPage={currentPage}
                        userRole={userRole}
                        q={q}
                    />
                </Suspense>

            </main>
        </div>
    );
}
