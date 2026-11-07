import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import HostLobbyClient from "./_components/HostLobbyClient";
import { createClient } from "@/utils/supabase/server";

interface HostPageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function HostPage({ params }: HostPageProps) {
    const { sessionId } = await params;
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/login")
    }

    // 1. Fetch initial state using Prisma!
    const session = await prisma.gameSession.findFirst({
        where: { id: sessionId, hostId: user.id },
        include: {
            quiz: { select: { title: true } },
            participants: { select: { id: true, nickname: true } }
        }
    });

    if (!session) {
        redirect("/dashboard");
    }

    // 2. Pass the data to the Client Component
    return (
        <HostLobbyClient
            sessionId={session.id}
            joinCode={session.joinCode}
            quizTitle={session.quiz.title}
            initialParticipants={session.participants}
        />
    );
}