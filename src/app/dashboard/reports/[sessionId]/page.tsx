import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import NavBar from "@/app/_components/NavBar";
import { getUser } from "@/app/actions";
import ReportData from "./_components/ReportData";
import ReportSkeleton from "./_components/ReportSkeleton";

interface ReportPageProps {
    params: Promise<{ sessionId: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
    const { sessionId } = await params;

    // The proxy already guards /dashboard; this covers a session that expired mid-visit.
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) redirect("/login");

    const userResponse = await getUser(authUser.id);
    const appUser = userResponse.user ?? null;

    return (
        <div className="px-crt min-h-dvh bg-bg font-sans text-fg">
            <NavBar user={appUser} />
            <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-6">
                <Suspense fallback={<ReportSkeleton />}>
                    <ReportData userId={authUser.id} sessionId={sessionId} />
                </Suspense>
            </main>
        </div>
    );
}
