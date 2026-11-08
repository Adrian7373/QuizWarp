"use server"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { cookies, headers } from "next/headers"
import { CONSENT_COOKIE, LEGAL } from "@/lib/legal"

export async function signInWithProvider(formData: FormData) {
    const provider = formData.get('provider') as 'google' | 'facebook'

    if (!provider) {
        redirect('/login?error=No provider selected')
    }

    // OAuth can create a new account, so consent is required here too.
    if (formData.get('acceptedTerms') !== 'on' || formData.get('acceptedPrivacy') !== 'on') {
        redirect(`/login?error=${encodeURIComponent('You must accept the Terms of Service and Privacy Policy to continue')}`)
    }

    // Carry the consent across the Google redirect; the auth callback records it on the user.
    const cookieStore = await cookies()
    cookieStore.set(CONSENT_COOKIE, `${LEGAL.version}|${new Date().toISOString()}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 10,
    })

    const supabase = await createClient()
    const origin = (await headers()).get('origin')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const baseUrl = origin || siteUrl

    // Call Supabase OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: `${baseUrl}/api/auth/callback?next=/dashboard`,
        },
    })

    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    // Redirect the user to the Google/Facebook consent screen
    if (data.url) {
        redirect(data.url)
    }
}

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const isRemembered = formData.get("rememberMe") === "on";

    console.log(formData);

    const supabase = await createClient(isRemembered);

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error("Login failed:", error.message)
        redirect('/login?error=Invalid email or password')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}