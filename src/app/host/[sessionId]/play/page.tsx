import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import HostPlayClient from "./_components/HostPlayClient";
import type { HostQuestion } from "./_components/HostPlayBits";
import { createClient } from "@/utils/supabase/server";

interface HostPlayPageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function HostPlayPage({ params }: HostPlayPageProps) {
    const { sessionId } = await params;

    // Security: Ensure only the host can access this page
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) redirect("/login");

    const session = await prisma.gameSession.findUnique({
        where: {
            id: sessionId,
            hostId: authUser.id
        },
        include: {
            quiz: {
                select: {
                    title: true,
                    questions: true // Fetch all questions so the host can control them
                }
            }
        }
    });

    if (!session) {
        redirect("/dashboard");
    }

    return (
        <HostPlayClient
            sessionId={session.id}
            quizTitle={session.quiz.title}
            questions={session.quiz.questions as unknown as HostQuestion[]}
            initialIndex={session.currentQuestionIndex}
        />
    );
}