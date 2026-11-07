"use server"
import prisma from "@/lib/prisma";

export async function submitAnswer(
    participantId: string,
    questionId: string, // For JSON arrays, we can just pass the index as a string
    answerGiven: string,
    isCorrect: boolean,
    timeTakenMs: number
) {
    try {
        // 1. Calculate points (Base 1000 + streak bonus for Async)
        const pointsEarned = isCorrect ? 1000 : 0;

        // 2. Fetch the current participant to update streaks
        const participant = await prisma.participant.findUnique({
            where: { id: participantId },
            select: { currentStreak: true, maxStreak: true, totalScore: true }
        });

        if (!participant) return { error: "Participant not found" };

        const newStreak = isCorrect ? participant.currentStreak + 1 : 0;
        const newMaxStreak = Math.max(participant.maxStreak, newStreak);

        // Add a streak bonus (e.g., 100 extra points per streak level)
        const finalPoints = isCorrect ? pointsEarned + (newStreak * 100) : 0;

        // 3. Run a transaction to update the user and save the response simultaneously
        await prisma.$transaction([
            prisma.participantResponse.create({
                data: {
                    participantId,
                    questionId,
                    answerGiven,
                    isCorrect,
                    timeTakenMs,
                    pointsEarned: finalPoints
                }
            }),
            prisma.participant.update({
                where: { id: participantId },
                data: {
                    currentStreak: newStreak,
                    maxStreak: newMaxStreak,
                    totalScore: participant.totalScore + finalPoints
                }
            })
        ]);

        return { success: true, pointsEarned: finalPoints, currentStreak: newStreak };
    } catch (error) {
        console.error("Failed to submit answer:", error);
        return { error: "Failed to save response." };
    }
}


//Just in case a user gets disconnected. Also prevents duplicated quiz play.
export async function getParticipantProgress(participantId: string) {
    try {
        const participant = await prisma.participant.findUnique({
            where: { id: participantId },
            include: {
                responses: {
                    select: { questionId: true, isCorrect: true }
                }
            }
        });

        if (!participant) return { error: "Participant not found" };

        return {
            success: true,
            answeredQuestionIds: participant.responses.map(r => r.questionId),
            correctCount: participant.responses.filter(r => r.isCorrect).length,
            maxStreak: participant.maxStreak,
            score: participant.totalScore,
            streak: participant.currentStreak
        };
    } catch (error) {
        console.error("Failed to fetch progress:", error);
        return { error: "Failed to load progress." };
    }
}