"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { BANK_TYPES, TYPE_META, type BankQuestionType } from "./types";

interface BankControlsProps {
    initialSearch: string;
    initialType: BankQuestionType | "ALL";
    /** Questions per type across the whole bank, for the chip counts. */
    counts: Record<BankQuestionType | "ALL", number>;
}

export default function QuestionBankControls({ initialSearch, initialType, counts }: BankControlsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [searchInput, setSearchInput] = useState(initialSearch);

    // Follow the URL when it changes from outside (e.g. a "Clear filters" link).
    useEffect(() => { setSearchInput(initialSearch); }, [initialSearch]);

    const pushParams = (mutate: (p: URLSearchParams) => void, replace = false) => {
        const params = new URLSearchParams(searchParams.toString());
        mutate(params);
        params.delete("page"); // a new search or filter starts on page 1
        const url = `${pathname}${params.size ? `?${params}` : ""}`;
        if (replace) router.replace(url); else router.push(url);
    };

    // Debounced search while typing (replace, so each keystroke isn't a history entry).
    useEffect(() => {
        if (searchInput.trim() === initialSearch) return;
        const timer = setTimeout(() => {
            pushParams((p) => { if (searchInput.trim()) p.set("search", searchInput.trim()); else p.delete("search"); }, true);
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput, initialSearch]);

    const setType = (type: BankQuestionType | "ALL") => {
        pushParams((p) => { if (type === "ALL") p.delete("type"); else p.set("type", type); });
    };

    const chips: { id: BankQuestionType | "ALL"; label: string; btn: string }[] = [
        { id: "ALL", label: "All", btn: "px-btn-cyan" },
        ...BANK_TYPES.map((t) => ({ id: t, label: TYPE_META[t].label, btn: TYPE_META[t].btn })),
    ];

    return (
        <div className="flex flex-col gap-4">
            <label className="relative block">
                <span className="sr-only">Search questions or quiz titles</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search questions or quiz titles"
                    className="px-input w-full py-2 pl-10 pr-11 [&::-webkit-search-cancel-button]:hidden"
                />
                {searchInput && (
                    <button
                        type="button"
                        onClick={() => { setSearchInput(""); pushParams((p) => p.delete("search")); }}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-muted hover:text-fg"
                    >
                        <X className="size-4" aria-hidden />
                    </button>
                )}
            </label>

            <div role="radiogroup" aria-label="Question type" className="flex flex-wrap gap-2">
                {chips.map((c) => {
                    const active = initialType === c.id;
                    return (
                        <button
                            key={c.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            data-sfx="select"
                            onClick={() => setType(c.id)}
                            disabled={!active && counts[c.id] === 0}
                            className={`px-btn px-btn-sm ${active ? c.btn : "px-btn-ghost"}`}
                        >
                            {c.label}
                            <span className={`px-notch px-1 py-0.5 ${active ? "bg-px-void text-px-snow" : "bg-bg text-fg"}`}>{counts[c.id]}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
