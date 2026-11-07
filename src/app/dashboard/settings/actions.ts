"use server"
import prisma from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateAccountProfile(userId: string, rawName: string, newRole: "TEACHER" | "STUDENT") {
    // Server actions are public endpoints: only let a signed-in user change their own profile.
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser || authUser.id !== userId) {
        return { error: "You can only change your own profile.", message: "Not allowed" };
    }

    const newName = rawName.trim();
    if (newName.length < 1 || newName.length > 50) {
        return { error: "Display name must be 1 to 50 characters.", message: "Invalid name" };
    }
    if (newRole !== "TEACHER" && newRole !== "STUDENT") {
        return { error: "Choose Teacher or Student.", message: "Invalid role" };
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });

    if (currentUser?.name === newName && currentUser.role === newRole) {
        return { success: true, message: "No changes made." };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { name: newName, role: newRole },
        });

        return { message: "Profile updated successfully." }
    } catch (error) {
        return { error: "Failed to update profile.", message: "Server error" }
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