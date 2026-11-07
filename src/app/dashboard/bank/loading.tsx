// Route-level loading screen for the question bank, shaped like the real page.
export default function BankLoading() {
    const block = "px-notch bg-raised";
    return (
        <div className="px-crt min-h-dvh bg-bg font-sans" aria-hidden>
            <div className="h-16 border-b-4 border-frame bg-bg" />
            <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
                <div className={`h-4 w-28 ${block}`} />
                <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:items-end">
                    <div className="space-y-3">
                        <div className={`h-8 w-64 ${block}`} />
                        <div className={`h-5 w-full max-w-md ${block}`} />
                        <div className={`h-5 w-3/4 max-w-sm ${block}`} />
                    </div>
                    <div className="space-y-4">
                        <div className={`h-11 w-full ${block}`} />
                        <div className="flex flex-wrap gap-2">
                            {[16, 36, 32, 32, 20].map((w, i) => <div key={i} className={`h-9 ${block}`} style={{ width: `${w * 4}px` }} />)}
                        </div>
                    </div>
                </div>
                <ul className="mt-12 grid gap-3 md:grid-cols-2">
                    {Array.from({ length: 6 }, (_, i) => (
                        <li key={i} className="px-panel flex gap-3 p-4">
                            <div className={`size-6 shrink-0 ${block}`} />
                            <div className="w-full space-y-2.5">
                                <div className={`h-5 w-40 ${block}`} />
                                <div className={`h-5 w-11/12 ${block}`} />
                                <div className={`h-4 w-1/3 ${block}`} />
                            </div>
                        </li>
                    ))}
                </ul>
                <p className="px-label px-blink mt-6 text-center text-muted">Loading</p>
            </main>
        </div>
    );
}
