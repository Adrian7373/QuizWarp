// Loading shape for the report, matching the real layout block for block.
export default function ReportSkeleton() {
    const block = "px-notch bg-raised";
    return (
        <div className="flex flex-col gap-10" aria-hidden>
            <div className="flex flex-col gap-4">
                <div className={`h-4 w-24 ${block}`} />
                <div className="flex gap-2"><div className={`h-6 w-24 ${block}`} /><div className={`h-6 w-20 ${block}`} /></div>
                <div className={`h-8 w-full max-w-lg ${block}`} />
                <div className={`h-5 w-64 ${block}`} />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => <div key={i} className="px-panel h-24" />)}
            </div>
            <div className="px-panel h-40" />
            <div className="px-panel divide-y-4 divide-frame">
                {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                        <div className={`size-9 shrink-0 ${block}`} />
                        <div className={`h-5 flex-1 ${block}`} />
                        <div className={`h-5 w-20 ${block}`} />
                    </div>
                ))}
            </div>
            <p className="px-label px-blink text-center text-muted">Loading</p>
        </div>
    );
}
