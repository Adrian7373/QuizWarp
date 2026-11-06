// Loading state for the generator panel, shaped like the real one.
export default function GeneratorSkeleton() {
    const block = "px-notch bg-raised";
    return (
        <div className="px-panel w-full p-4 sm:p-5" aria-hidden>
            <div className={`h-3 w-40 ${block}`} />
            <div className="mt-3 grid grid-cols-3 gap-2">
                <div className={`h-9 ${block}`} /><div className={`h-9 ${block}`} /><div className={`h-9 ${block}`} />
            </div>
            <div className={`mt-3 h-44 ${block}`} />
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className={`h-[4.5rem] ${block}`} /><div className={`h-[4.5rem] ${block}`} /><div className={`col-span-2 h-[4.5rem] sm:col-span-1 ${block}`} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2"><div className={`h-9 ${block}`} /><div className={`h-9 ${block}`} /><div className={`h-9 ${block}`} /><div className={`h-9 ${block}`} /></div>
            <div className="mt-4 flex h-14 items-center justify-center bg-px-dusk px-notch">
                <span className="px-label px-blink text-muted">Loading</span>
            </div>
        </div>
    );
}
