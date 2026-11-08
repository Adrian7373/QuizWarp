"use server"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { LEGAL } from "@/lib/legal"

export async function signUp(formData: FormData) {
    // Both agreements are required. The UI blocks submit, this blocks anything that bypasses it.
    if (formData.get('acceptedTerms') !== 'on' || formData.get('acceptedPrivacy') !== 'on') {
        redirect(`/signup?error=${encodeURIComponent('You must accept the Terms of Service and Privacy Policy to create an account')}`)
    }

    const name = formData.get('name') as string
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const password = formData.get('password') as string

    // Using string fallback to avoid Vercel build errors we fixed earlier
    const rawRole = formData.get("role") as string
    const role = (rawRole === "TEACHER" ? "TEACHER" : "STUDENT") as "TEACHER" | "STUDENT"

    const supabase = await createClient()
    const origin = (await headers()).get('origin')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const baseUrl = origin || siteUrl

    const redirectTo = `${baseUrl}/api/auth/callback?next=/verified`

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
                role,
                // Record of consent (DPA: be able to show when and to what the user agreed)
                terms_accepted_at: new Date().toISOString(),
                terms_version: LEGAL.version,
            },
            emailRedirectTo: redirectTo
        }
    })

    if (authError) {
        redirect(`/signup?error=${encodeURIComponent(authError.message)}`)
    }

    // 2. Auth Sync: Create the matching Prisma profile
    if (authData.user) {
        try {
            const existingUser = await prisma.user.findUnique({
                where: { id: authData.user.id }
            })

            if (!existingUser) {
                await prisma.user.create({
                    data: {
                        id: authData.user.id,
                        email: authData.user.email!,
                        name: name,
                        aiCredits: 20,
                        role: role
                    },
                })
            }
        } catch (prismaError) {
            console.error("Failed to sync user to Prisma:", prismaError)
        }
    }

    redirect('/login?message=Confirmation emails sent. Please verify before logging in')
}