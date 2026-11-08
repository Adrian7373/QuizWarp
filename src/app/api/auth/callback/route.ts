import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { CONSENT_COOKIE } from '@/lib/legal'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data.user) {
            // Record consent given on the sign-in screen before the OAuth redirect.
            try {
                const cookieStore = await cookies()
                const consent = cookieStore.get(CONSENT_COOKIE)?.value
                if (consent) {
                    const [version, acceptedAt] = consent.split('|')
                    if (version && acceptedAt && !data.user.user_metadata?.terms_accepted_at) {
                        await supabase.auth.updateUser({
                            data: { terms_accepted_at: acceptedAt, terms_version: version },
                        })
                    }
                    cookieStore.delete(CONSENT_COOKIE)
                }
            } catch (consentError) {
                console.error("Failed to record consent:", consentError)
            }

            try {
                const existingUser = await prisma.user.findUnique({
                    where: { id: data.user.id }
                })

                if (!existingUser) {
                    await prisma.user.create({
                        data: {
                            id: data.user.id,
                            email: data.user.email!,
                            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'New User',
                            aiCredits: 10,
                            role: "STUDENT" // Default role for OAuth users
                        },
                    })
                }
            } catch (prismaError) {
                console.error("Failed to sync OAuth user to Prisma:", prismaError)
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/login?error=Invalid or expired verification link`)
}