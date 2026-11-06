"use client"

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import QuizCardActions from "./QuizCardAction";
import { DifficultyMeter, LIBRARY_COLUMNS, ROW } from "./Ledger";

interface QuizCardProps {
    quiz: any;
    userId: string;
    userRole: "TEACHER" | "STUDENT";
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One quiz in the library list. */
export default function QuizCard({ quiz, userId, userRole }: QuizCardProps) {
    // Optimistic state manager
    const [isOptimisticallyDeleted, setIsOptimisticallyDeleted] = useState(false);

    return (
        <li className={`${ROW} ${LIBRARY_COLUMNS} ${isOptimisticallyDeleted ? "hidden" : ""}`}>
            <div className="min-w-0">
                <Link href={`/quiz/${quiz.id}`} className="block truncate text-lg font-semibold underline-offset-4 hover:text-link hover:underline">
                    {quiz.title}
                </Link>
                <p className="truncate text-base text-muted">
                    {quiz.description ? `${quiz.description} ` : ""}
                    <span className="whitespace-nowrap">Made {formatDistanceToNow(new Date(quiz.createdAt), { addSuffix: true })}</span>
                </p>
            </div>

            {/* One wrapped line on small screens; separate columns on lg */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-base text-muted lg:contents">
                <DifficultyMeter difficulty={quiz.difficulty} />
                <span className="tabular-nums lg:text-right lg:text-fg">
                    <span className="lg:hidden">{plural(quiz._count.questions, "question", "questions")}</span>
                    <span className="hidden lg:inline">{quiz._count.questions}</span>
                </span>
                <span className="tabular-nums lg:text-right lg:text-fg">
                    <span className="lg:hidden">{plural(quiz._count.sessions, "play", "plays")}</span>
                    <span className="hidden lg:inline">{quiz._count.sessions}</span>
                </span>
            </div>

            <QuizCardActions
                quizId={quiz.id}
                userId={userId}
                quizTitle={quiz.title}
                onDeleteOptimistic={() => setIsOptimisticallyDeleted(true)}
                onDeleteRevert={() => setIsOptimisticallyDeleted(false)}
                userRole={userRole}
            />
        </li>
    );
}
