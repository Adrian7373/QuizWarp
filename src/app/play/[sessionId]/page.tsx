import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import AsyncPlayer from "./_components/AsyncPlayer";
import LivePlayer from "./_components/LivePlayer";

interface PlayPageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function PlayPage({ params }: PlayPageProps) {
    const { sessionId } = await params;

    // Fetch the session and the associated quiz questions
    const session = await prisma.gameSession.findUnique({
        where: { id: sessionId },
        include: {
            quiz: {
                select: {
                    title: true,
                    questions: true,
                }
            }
        }
    });

    if (!session) {
        redirect("/join");
    }

    // Pass the data to our interactive client component
    return (
        <div className="px-crt min-h-dvh bg-bg font-sans text-fg">
            {session.mode === "ASYNC" ? (
                <AsyncPlayer
                    sessionId={session.id}
                    quizTitle={session.quiz.title}
                    questions={session.quiz.questions as any[]}
                    isPractice={session.joinCode.startsWith("PRAC-")}
                />
            ) : (
                <LivePlayer
                    sessionId={session.id}
                    quizTitle={session.quiz.title}
                    questions={session.quiz.questions as any[]}
                    initialIndex={session.currentQuestionIndex}
                    initialStatus={session.status}
                />
            )}
        </div>
    );
}