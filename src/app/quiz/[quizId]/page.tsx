import Link from "next/link";
import QuizModal, { QuizData } from "@/app/_components/QuizModal";
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import { Orbi } from "@/app/_components/arcade/Hud";

interface QuizPageProps {
    params: Promise<{ quizId: string }>;
}

export default async function QuizPage({ params }: QuizPageProps) {
    const { quizId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch the full AppUser data so the NavBar has access to the user's quizzes
    let appUser = null;
    if (user) {
        const response = await getUser(user.id);
        if (response.user) {
            appUser = response.user;
        }
    }

    // Only the owner may open a saved quiz. Never query without a signed-in user: Prisma ignores
    // `creatorId: undefined`, which used to let logged-out visitors load any quiz (answers included).
    const quizData = user
        ? await prisma.quiz.findFirst({
            where: {
                id: quizId,
                creatorId: user.id,
            },
            select: {
                id: true,
                title: true,
                description: true,
                questions: true,
                difficulty: true
            },
        })
        : null;

    return (
        <div className="px-crt min-h-dvh bg-bg font-sans text-fg print:min-h-0">
            <div className="print:hidden">
                <NavBar user={appUser} />
            </div>
            {quizData ? (
                <div className="flex h-dvh flex-col pt-16 print:block print:h-auto print:pt-0">
                    <QuizModal isOpen={true} quizData={quizData as unknown as QuizData} user={appUser} />
                </div>
            ) : (
                // Not found, deleted, or someone else's quiz: say so instead of a blank screen.
                <main className="mx-auto flex max-w-xl flex-col items-start gap-6 px-4 pt-32">
                    <h1 className="px-title text-xl">Quiz not found</h1>
                    <Orbi mood="sad" say={user ? "This quiz doesn't exist, was deleted, or belongs to someone else." : "Sign in to open your saved quizzes."} />
                    <div className="flex flex-wrap gap-2">
                        {user && <Link href="/dashboard" className="px-btn px-btn-cyan">Go to your library</Link>}
                        <Link href="/" className="px-btn px-btn-ghost">Make a new quiz</Link>
                    </div>
                </main>
            )}
        </div>
    )
}
