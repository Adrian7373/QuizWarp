import prisma from "@/lib/prisma"
import type { User as SupabaseUser } from "@supabase/supabase-js"

/**
 * Makes sure a Prisma `User` row exists for a Supabase auth user.
 *
 * Supabase Auth and the Prisma `User` table are separate. If the row was never
 * created (DB hiccup during sign-up, OAuth callback skipped, etc.) the user is
 * signed in but the app sees no profile: "Sign in" button and an empty dashboard.
 * Calling this on every authenticated load repairs that automatically.
 */
export async function ensureAppUser(authUser: SupabaseUser) {
    const existing = await prisma.user.findUnique({ where: { id: authUser.id } })
    if (existing) return existing

    const meta = authUser.user_metadata ?? {}
    const email = authUser.email
    if (!email) throw new Error("Supabase user has no email; cannot create profile")

    const normalizedEmail = email.toLowerCase()

    // A profile with this email can exist under an older auth ID (the Supabase account
    // was deleted/recreated, or the same person signed up via a different provider).
    // `email` is unique, so create() would fail. If the email is verified, re-key the
    // old row to the current auth ID; relations follow via ON UPDATE CASCADE.
    const sameEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (sameEmail) {
        if (!authUser.email_confirmed_at) {
            throw new Error("Email not verified; refusing to adopt existing profile")
        }
        return prisma.user.update({
            where: { email: normalizedEmail },
            data: { id: authUser.id },
        })
    }

    return prisma.user.create({
        data: {
            id: authUser.id,
            email: normalizedEmail,
            name: meta.full_name || meta.name || "New User",
            aiCredits: 10,
            role: meta.role === "TEACHER" ? "TEACHER" : "STUDENT",
        },
    })
}
