import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    tab: string;
    /** Active search, kept across pages. */
    q?: string;
}

export default function Pagination({ currentPage, totalPages, tab, q }: PaginationProps) {
    if (totalPages <= 1) return null;

    const href = (page: number) => `?${new URLSearchParams({ tab, page: String(page), ...(q ? { q } : {}) })}`;
    const atStart = currentPage <= 1;
    const atEnd = currentPage >= totalPages;

    return (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-4">
            <span className="px-label text-muted">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
                <Link href={href(currentPage - 1)} aria-label="Previous page" aria-disabled={atStart} tabIndex={atStart ? -1 : undefined}
                    className={`px-btn px-btn-sm px-btn-ghost ${atStart ? "pointer-events-none opacity-40" : ""}`}>
                    <ChevronLeft className="size-4" aria-hidden /> Prev
                </Link>
                <Link href={href(currentPage + 1)} aria-label="Next page" aria-disabled={atEnd} tabIndex={atEnd ? -1 : undefined}
                    className={`px-btn px-btn-sm px-btn-ghost ${atEnd ? "pointer-events-none opacity-40" : ""}`}>
                    Next <ChevronRight className="size-4" aria-hidden />
                </Link>
            </div>
        </nav>
    );
}
