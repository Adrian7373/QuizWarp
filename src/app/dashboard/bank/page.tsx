import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/prisma";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import QuestionBankControls from "./_components/QuestionBankControls";
import QuestionBankGrid from "./_components/QuestionBankGrid";
import { BankSelectionProvider, PickTray } from "./_components/BankSelection";
import { BANK_TYPES, isBankType, type BankQuestionType } from "./_components/types";
import { EmptyState } from "../_components/Ledger";
import Pagination from "../_components/Pagination";
import GenerateNewButton from "../_components/GenerateNewButton";

interface QuestionBankPageProps {
    searchParams: Promise<{ page?: string; search?: string; type?: string; }>;
}

const PAGE_SIZE = 20;

// SKELETON

function BankSkeleton() {
    const block = "px-notch bg-raised";
    return (
        <div aria-hidden>
            <div className="mb-3 flex items-center justify-between">
                <div className={`h-4 w-48 ${block}`} />
                <div className={`h-9 w-36 ${block}`} />
            </div>
            <ul className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 6 }, (_, i) => (
                    <li key={i} className="px-panel flex gap-3 p-4">
                        <div className={`size-6 shrink-0 ${block}`} />
                        <div className="w-full space-y-2.5">
                            <div className={`h-5 w-40 ${block}`} />
                            <div className={`h-5 w-11/12 ${block}`} />
                            <div className={`h-5 w-2/3 ${block}`} />
                            <div className={`h-4 w-1/3 ${block}`} />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ENGINE

async function BankData({ currentPage, search, type, userId, hasAny }: {
    currentPage: number; search: string; type: BankQuestionType | "ALL"; userId: string; hasAny: boolean;
}) {
    if (!hasAny) {
        return (
            <EmptyState say="Your bank is empty. Every quiz you generate drops its questions in here, ready to remix.">
                <GenerateNewButton userId={userId} />
            </EmptyState>
        );
    }

    // Build the Prisma where clause dynamically
    const whereClause = {
        quiz: { creatorId: userId },
        ...(type !== "ALL" ? { questionType: type } : {}),
        ...(search ? {
            OR: [
                { questionText: { contains: search, mode: "insensitive" as const } },
                { quiz: { title: { contains: search, mode: "insensitive" as const } } },
            ],
        } : {}),
    };

    const [questions, totalCount] = await Promise.all([
        prisma.question.findMany({
            where: whereClause,
            select: {
                id: true,
                questionType: true,
                questionText: true,
                options: true,
                correctAnswer: true,
                quiz: { select: { title: true } },
            },
            // Newest quiz first; id keeps the order stable so pages don't shuffle.
            orderBy: [{ quiz: { createdAt: "desc" } }, { id: "asc" }],
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.question.count({ where: whereClause }),
    ]);

    if (questions.length === 0) {
        return (
            <EmptyState mood="sad" say={search ? `No questions match “${search}” with this filter.` : "No questions of this type yet."}>
                <Link href="/dashboard/bank" className="px-btn px-btn-ghost">Clear filters</Link>
            </EmptyState>
        );
    }

    return (
        <>
            <QuestionBankGrid questions={questions} totalCount={totalCount} />
            <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalCount / PAGE_SIZE)}
                params={{ search: search || undefined, type: type !== "ALL" ? type : undefined }}
            />
        </>
    );
}

export default async function QuestionBankPage({ searchParams }: QuestionBankPageProps) {
    const { page, search: rawSearch, type: rawType } = await searchParams;
    const currentPage = Math.max(1, parseInt(page || "1") || 1);
    const search = rawSearch?.trim() ?? "";
    const type: BankQuestionType | "ALL" = isBankType(rawType) ? rawType : "ALL";

    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
        throw new Error("Error accessing page!")
    }

    // The user and per-type counts for the filter chips, in parallel.
    const [userResponse, groups] = await Promise.all([
        getUser(authUser.id),
        prisma.question.groupBy({
            by: ["questionType"],
            where: { quiz: { creatorId: authUser.id } },
            _count: { _all: true },
        }),
    ]);
    const appUser = userResponse.user ?? null;

    const counts = Object.fromEntries(BANK_TYPES.map((t) => [t, 0])) as Record<BankQuestionType | "ALL", number>;
    counts.ALL = 0;
    for (const g of groups) {
        if (isBankType(g.questionType)) counts[g.questionType] = g._count._all;
        counts.ALL += g._count._all;
    }

    return (
        <div className="px-crt min-h-dvh bg-bg font-sans text-fg">
            <NavBar user={appUser} />
            <BankSelectionProvider userId={authUser.id}>
                <main className="mx-auto w-full max-w-6xl px-4 pb-40 pt-24 sm:px-6">

                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-base text-muted underline-offset-4 hover:text-fg hover:underline">
                        <ArrowLeft className="size-4" aria-hidden /> Dashboard
                    </Link>

                    <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:items-end">
                        <div>
                            <h1 className="px-title text-xl sm:text-2xl">Question bank</h1>
                            <p className="mt-3 max-w-[52ch] text-lg text-muted">
                                Every question from every quiz you&apos;ve made, in one place. Pick any mix, across pages and filters, and build a new quiz from them.
                            </p>
                        </div>
                        {counts.ALL > 0 && (
                            <QuestionBankControls initialSearch={search} initialType={type} counts={counts} />
                        )}
                    </div>

                    <div className="mt-8">
                        {/* Only the results reload on a new page, search or filter; the picks above survive. */}
                        <Suspense key={`${currentPage}-${type}-${search}`} fallback={<BankSkeleton />}>
                            <BankData currentPage={currentPage} search={search} type={type} userId={authUser.id} hasAny={counts.ALL > 0} />
                        </Suspense>
                    </div>
                </main>
                <PickTray userId={authUser.id} />
            </BankSelectionProvider>
        </div>
    );
}
