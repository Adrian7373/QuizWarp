import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import FlashcardClient from "./_components/FlashCardClient";

interface StudyPageProps {
    params: Promise<{ quizId: string }>;
}

export default async function StudyPage({ params }: StudyPageProps) {
    const { quizId } = await params;

    // Flashcards show every answer, so only the quiz's owner may open them.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();

    const quiz = await prisma.quiz.findFirst({
        where: { id: quizId, creatorId: user.id },
        include: {
            questions: true
        }
    });

    if (!quiz || quiz.questions.length === 0) {
        notFound();
    }

    // Focus mode: no NavBar, just the deck. The client's top bar links back to the quiz.
    return (
        <div className="px-crt flex min-h-dvh flex-col bg-bg font-sans text-fg">
            <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8">
                <FlashcardClient quizId={quiz.id} quiz={quiz} questions={quiz.questions} />
            </main>
        </div>
    );
}
