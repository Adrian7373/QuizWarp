"use server"
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

/** Server actions are public endpoints: resolve the signed-in user on the server, never trust the client. */
async function getSignedInUserId() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
}

export async function startGameSession(sessionId: string) {
    try {
        const userId = await getSignedInUserId();
        if (!userId) return { error: "Sign in to start this game." };

        // Scoped to the host: updates nothing if the caller doesn't own the session.
        const { count } = await prisma.gameSession.updateMany({
            where: { id: sessionId, hostId: userId },
            data: { status: "IN_PROGRESS" }
        });
        if (count === 0) return { error: "Only the host can start this game." };

        return { success: true };
    } catch (error) {
        console.error("Failed to start game:", error);
        return { error: "Failed to start game." };
    }
}

export async function updateQuestionIndex(sessionId: string, newIndex: number) {
    try {
        if (!Number.isInteger(newIndex) || newIndex < 0) return { error: "That question doesn't exist." };

        const userId = await getSignedInUserId();
        if (!userId) return { error: "Sign in to control this game." };

        const { count } = await prisma.gameSession.updateMany({
            where: { id: sessionId, hostId: userId },
            data: { currentQuestionIndex: newIndex }
        });
        if (count === 0) return { error: "Only the host can change the question." };

        return { success: true };
    } catch (error) {
        console.error("Failed to advance question:", error);
        return { error: "Failed to advance to the next question." };
    }
}
