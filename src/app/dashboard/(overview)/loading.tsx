// Route-level loading screen for the dashboard, shaped like the real page.
export default function DashboardLoading() {
    const block = "px-notch bg-raised";
    return (
        <div className="px-crt min-h-dvh bg-bg font-sans" aria-hidden>
            <div className="h-16 border-b-4 border-frame bg-bg" />

            <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
                {/* Player HUD */}
                <div className="px-panel flex flex-wrap items-center gap-6 p-5">
                    <div className={`size-14 ${block}`} />
                    <div className="space-y-2"><div className={`h-3 w-32 ${block}`} /><div className={`h-6 w-48 ${block}`} /></div>
                    <div className="ml-auto flex gap-2"><div className={`h-11 w-40 ${block}`} /><div className={`h-11 w-40 ${block}`} /></div>
                </div>

                {/* Tabs */}
                <div className="mb-4 mt-8 flex gap-2">
                    <div className={`h-11 w-32 ${block}`} /><div className={`h-11 w-28 ${block}`} /><div className={`h-11 w-32 ${block}`} />
                </div>

                {/* List */}
                <div className="px-panel">
                    <div className="hidden h-10 border-b-4 border-frame bg-raised lg:block" />
                    <ul className="divide-y-4 divide-frame">
                        {[...Array(6)].map((_, i) => (
                            <li key={i} className="flex items-center justify-between gap-4 px-4 py-4">
                                <div className="w-full max-w-md space-y-2"><div className={`h-4 w-2/3 ${block}`} /><div className={`h-3.5 w-1/2 ${block}`} /></div>
                                <div className={`hidden h-9 w-56 sm:block ${block}`} />
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="px-label px-blink mt-6 text-center text-muted">Loading</p>
            </main>
        </div>
    );
}
