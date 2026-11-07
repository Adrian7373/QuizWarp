import ReportSkeleton from "./_components/ReportSkeleton";

// Route-level loading screen: the NavBar's space plus the report's shape.
export default function ReportsLoading() {
    return (
        <div className="px-crt min-h-dvh bg-bg font-sans">
            <div className="h-16 border-b-4 border-frame bg-bg" />
            <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
                <ReportSkeleton />
            </main>
        </div>
    );
}
