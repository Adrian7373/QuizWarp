"use server"

import prisma from "@/lib/prisma"
import { QuizData } from "./page";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ensureAppUser } from "@/lib/ensure-user";

export async function getUser(userId: string) {

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                currentStreak: true,
                aiCredits: true,
                quizzes: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        difficulty: true
                    }
                }
            }
        })

        if (!user) {
            // Signed in with Supabase but no profile row yet: create it, then re-read.
            const supabase = await createClient()
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser || authUser.id !== userId) {
                return { error: "User not found." }
            }
            await ensureAppUser(authUser)
            return getUser(userId)
        }

        return { user };

    } catch (error) {
        console.error("getUser failed:", error)
        return { error: "Failed to get user information." }
    }
}

export async function saveQuiz(quizData: QuizData, userId: string) {

    try {
        const quiz = await prisma.quiz.create({
            data: {
                title: quizData.title,
                description: quizData.description,
                creator: { connect: { id: userId } },
                questions: {
                    create: quizData.questions.map((question) => ({
                        questionText: question.questionText,
                        options: question.options,
                        correctAnswer: question.correctAnswer,
                        explanation: question.explanation,
                    }))
                }
            },
        })

        return { success: true };

    } catch (error) {
        console.error("Failed to save quiz:", error);
        return { error: "Failed to save quiz." };
    }
}

export async function deleteQuiz(quizId: string, userId: string) {
    try {
        await prisma.quiz.update({
            where: {
                id: quizId,
                creatorId: userId
            },
            data: {
                isDeleted: true
            }
        });

        return { success: true };
    } catch (error) {
        return { error: "Failed to delete quiz." };
    }
}

export async function logOutUser() {
    try {
        const supabase = await createClient()

        const { error } = await supabase.auth.signOut();

        if (error) {
            return { error: "Failed to logout user" }
        }

        revalidatePath("/")
    } catch (err) {
        return { error: "Failed to logout user" }
    }

}

/** The signed-in user's id, read on the server. Server actions are public, so never trust an id sent by the client. */
async function getSignedInUserId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
}

//For ending game sessions early
export async function endSessionEarly(sessionId: string) {
    try {
        const userId = await getSignedInUserId();
        if (!userId) return { error: "Log in to end this session." };

        // Scoped to the host: changes nothing if the caller doesn't own the session.
        const { count } = await prisma.gameSession.updateMany({
            where: { id: sessionId, hostId: userId },
            data: { status: "FINISHED" }
        });
        if (count === 0) return { error: "Session not found." };

        return { success: true };
    } catch (error) {
        console.error("Failed to end session:", error);
        return { error: "An error occurred while ending the session." };
    }
}

//Live session checker
export async function getActiveLiveSession(hostId: string) {
    try {
        const activeSession = await prisma.gameSession.findFirst({
            where: {
                hostId: hostId,
                mode: "LIVE",
                status: {
                    in: ["WAITING", "IN_PROGRESS"]
                }
            },
            select: {
                id: true,
                status: true,
                quiz: { select: { title: true } }
            }
        });

        return { session: activeSession };
    } catch (error) {
        console.error("Failed to check active session:", error);
        return { session: null };
    }
}

//Update quiz data

interface UpdateQuizData {
    title: string;
    description: string;
    questions: {
        questionText: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
        timeLimitSeconds?: number | null;
    }[];
}

export async function updateQuiz(quizId: string, userId: string, data: UpdateQuizData) {
    try {
        // 1. Verify Ownership (Security Check)
        const existingQuiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            select: { creatorId: true }
        });

        if (!existingQuiz) return { error: "Quiz not found." };
        if (existingQuiz.creatorId !== userId) return { error: "Unauthorized. You do not own this quiz." };

        // 2. Perform Atomic Nested Update
        await prisma.quiz.update({
            where: { id: quizId },
            data: {
                title: data.title,
                description: data.description,
                // Replace all existing questions with the newly edited array
                questions: {
                    deleteMany: {},
                    create: data.questions.map((q) => ({
                        questionText: q.questionText,
                        options: q.options || [],
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                        timeLimitSeconds: q.timeLimitSeconds || null
                    }))
                }
            }
        });

        // 3. Purge the cache so the NavBar and Dashboard instantly reflect the new Title/Questions
        revalidatePath('/', 'layout');

        return { success: true };

    } catch (error) {
        console.error("Failed to update quiz:", error);
        return { error: "An error occurred while saving your edits." };
    }
}



//Delete game session

export async function deleteGameSession(sessionId: string) {
    try {
        const userId = await getSignedInUserId();
        if (!userId) return { error: "Log in to delete this session." };

        // Scoped to the host: deletes nothing if the caller doesn't own the session.
        const { count } = await prisma.gameSession.deleteMany({
            where: { id: sessionId, hostId: userId }
        });
        if (count === 0) return { error: "Session not found." };

        return { success: true };
    } catch (error) {
        console.error("Failed to delete session:", error);
        return { error: "An error occurred while deleting the session." };
    }
}


//Creates a quiz from existing questions
export async function createQuizFromBank(userId: string, title: string, description: string, questionIds: string[]) {
    try {
        // 1. Fetch the selected historical questions
        const originalQuestions = await prisma.question.findMany({
            where: {
                id: { in: questionIds },
                quiz: { creatorId: userId } // Security: Ensure they own these questions
            }
        });

        if (originalQuestions.length === 0) return { error: "No valid questions found." };

        // 2. Create the new Quiz and insert copies of the questions
        const newQuiz = await prisma.quiz.create({
            data: {
                creatorId: userId,
                title: title,
                description: description,
                difficulty: "mixed", // Since it's from a bank, difficulty varies
                questions: {
                    create: originalQuestions.map(q => ({
                        questionText: q.questionText,
                        options: q.options || [],
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                        questionType: q.questionType,
                        timeLimitSeconds: q.timeLimitSeconds
                    }))
                }
            }
        });

        return { success: true, quizId: newQuiz.id };
    } catch (error) {
        console.error("Failed to create quiz from bank:", error);
        return { error: "An error occurred while creating your combined quiz." };
    }
}

//Grade participant/student's answer with AI
export async function submitAndGradeEssay(
    participantId: string,
    questionId: string,
    studentAnswer: string,
    language: string = "English",
    timeTakenMs: number,
) {
    try {
        // 1. Fetch the question to get the rubric/correct answer
        const question = await prisma.question.findUnique({
            where: { id: questionId }
        });

        if (!question) return { error: "Question not found." };

        // 2. Call the Flask Microservice
        const baseUrl = process.env.PYTHON_AI_URL || "http://127.0.0.1:5000";
        const pythonApiUrl = `${baseUrl.replace(/\/$/, '')}/api/grade-answer`;

        const aiResponse = await fetch(pythonApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questionText: question.questionText,
                rubric: question.correctAnswer,
                studentAnswer: studentAnswer,
                language: language
            })
        });

        if (!aiResponse.ok) throw new Error("Grading engine failed.");
        const gradedData = await aiResponse.json();

        // 3. Save the result to the database
        let pointsEarned = 0;

        if (gradedData.is_correct) {
            const basePoints = 1000;
            const timeLimit = question.timeLimitSeconds || 60;

            // 1. Accuracy Multiplier: If they got 8/10, they get 80% of the base points (800)
            const accuracyMultiplier = gradedData.score / 10;

            // 2. Speed Bonus: Up to 500 extra points based on how fast they typed
            const timeRatio = Math.max(0, 1 - (timeTakenMs / 1000 / timeLimit));
            const speedBonus = timeRatio * 500;

            pointsEarned = Math.round((basePoints * accuracyMultiplier) + speedBonus);
        }

        // Save the response AND update the participant's total score in one transaction
        await prisma.$transaction([
            prisma.participantResponse.create({
                data: {
                    participantId: participantId,
                    questionId: questionId,
                    answerGiven: studentAnswer,
                    answerText: studentAnswer,
                    timeTakenMs: timeTakenMs,
                    isCorrect: gradedData.is_correct,
                    aiFeedback: gradedData.feedback,
                    score: gradedData.score
                }
            }),
            prisma.participant.update({
                where: { id: participantId },
                data: { totalScore: { increment: pointsEarned } }
            })
        ]);

        // 4. Return the feedback to the student's screen instantly
        return {
            success: true,
            isCorrect: gradedData.is_correct,
            score: gradedData.score, // The 0-10 grade
            pointsEarned: pointsEarned, // The actual 0-1500 game score!
            feedback: gradedData.feedback
        };

    } catch (error) {
        console.error("Grading error:", error);
        return { error: "Failed to grade response." };
    }
}

//Student starts a practice quiz
export async function startPracticeQuiz(quizId: string, userId: string, nickname: string) {
    try {
        // 1. Create a self-hosted ASYNC session
        const session = await prisma.gameSession.create({
            data: {
                quizId,
                hostId: userId,
                mode: "ASYNC",
                status: "IN_PROGRESS", // Instantly active
                joinCode: "PRAC-" + Math.random().toString(36).substring(2, 8).toUpperCase(), // Random dummy code

                // 2. Automatically create the Participant record in the same transaction
                participants: {
                    create: {
                        userId: userId,
                        nickname: nickname,
                    }
                }
            },
            include: {
                participants: true
            }
        });

        // Return the participant ID so the client can redirect directly to the play screen
        return {
            success: true,
            sessionId: session.id,
            participantId: session.participants[0].id
        };

    } catch (error) {
        console.error(error);
        return { error: "Failed to start practice quiz." };
    }
}


export async function cleanupPracticeSession(sessionId: string) {
    try {
        // 1. Verify it actually is a practice session before deleting
        const session = await prisma.gameSession.findUnique({
            where: { id: sessionId },
            select: { joinCode: true }
        });

        if (session && session.joinCode.startsWith("PRAC-")) {
            // 2. Delete it. (Prisma's onDelete: Cascade will automatically 
            // wipe out the linked Participants and Responses!)
            await prisma.gameSession.delete({
                where: { id: sessionId }
            });
        }
    } catch (error) {
        console.error("Failed to clean up practice session:", error);
    }
}