// Route-level loading screen for settings, shaped like the real page.
export default function SettingsLoading() {
    const block = "px-notch bg-raised";
    return (
        <div className="px-crt min-h-dvh bg-bg font-sans" aria-hidden>
            <div className="h-16 border-b-4 border-frame bg-bg" />
            <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
                <div className={`h-4 w-28 ${block}`} />
                <div className={`mt-5 h-8 w-48 ${block}`} />
                <div className={`mb-8 mt-4 h-5 w-full max-w-md ${block}`} />
                <div className="grid items-start gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
                    <div className="px-panel space-y-2 p-3">
                        {Array.from({ length: 4 }, (_, i) => <div key={i} className={`h-11 ${block}`} />)}
                    </div>
                    <div className="px-panel space-y-5 p-7">
                        <div className="flex items-center gap-4"><div className={`size-14 ${block}`} /><div className={`h-6 w-40 ${block}`} /></div>
                        <div className="grid gap-5 lg:grid-cols-2"><div className={`h-20 ${block}`} /><div className={`h-20 ${block}`} /></div>
                        <div className="grid gap-3 sm:grid-cols-2"><div className={`h-32 ${block}`} /><div className={`h-32 ${block}`} /></div>
                        <div className={`h-11 w-40 ${block}`} />
                    </div>
                </div>
                <p className="px-label px-blink mt-6 text-center text-muted">Loading</p>
            </main>
        </div>
    );
}
