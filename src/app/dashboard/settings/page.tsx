import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import NavBar from "@/app/_components/NavBar";
import SettingsClient from "./_components/SettingsClient";
import { getUser } from "@/app/actions";
import { AppUser } from "@/app/page";
import { Tab } from "./_components/SettingsClient";

interface SettingsPageProps {
    searchParams: Promise<{ tab?: Tab }>
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {

    const resolvedTab = (await searchParams).tab || "account";
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    // The proxy already guards /dashboard; this covers a session that expired mid-visit.
    if (!authUser) {
        redirect("/login");
    }

    // Fetch full user details from Prisma
    const userResponse = await getUser(authUser.id);
    const appUser = userResponse.user as unknown as AppUser;

    if (!appUser) {
        redirect("/login");
    }

    return (
        <div className="px-crt min-h-dvh bg-bg font-sans text-fg">
            <NavBar user={appUser} />

            <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-6">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-base text-muted underline-offset-4 hover:text-fg hover:underline">
                    <ArrowLeft className="size-4" aria-hidden /> Dashboard
                </Link>
                <h1 className="px-title mt-4 text-xl sm:text-2xl">Options</h1>
                <p className="mb-8 mt-3 text-lg text-muted">Your profile, how the game looks and sounds, and your AI credits.</p>

                <SettingsClient user={appUser} initialTab={resolvedTab} />
            </main>
        </div>
    );
}
