"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { createQuizFromBank } from "@/app/actions";
import Dialog from "@/app/_components/arcade/Dialog";
import { TYPE_META, type BankQuestionType } from "./types";

/** What the tray needs to show a pick even when it is not on the current page. */
export type PickedQuestion = {
    id: string;
    questionText: string;
    questionType: BankQuestionType;
    quizTitle: string;
};

type SelectionContextValue = {
    picked: Map<string, PickedQuestion>;
    isPicked: (id: string) => boolean;
    toggle: (q: PickedQuestion) => void;
    pickMany: (qs: PickedQuestion[]) => void;
    unpickMany: (ids: string[]) => void;
    clear: () => void;
};

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function useBankSelection() {
    const ctx = useContext(SelectionContext);
    if (!ctx) throw new Error("useBankSelection must be used inside <BankSelectionProvider>");
    return ctx;
}

/**
 * Holds the player's picks above the page's Suspense boundary, so they survive paging, searching
 * and filtering. Saved to sessionStorage so a refresh doesn't lose them either.
 */
export function BankSelectionProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
    const storageKey = `bank_picks_${userId}`;
    const [picked, setPicked] = useState<Map<string, PickedQuestion>>(new Map());

    // Restore after mount (sessionStorage is browser-only).
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) setPicked(new Map((JSON.parse(saved) as PickedQuestion[]).map((q) => [q.id, q])));
        } catch { /* private mode or bad data: start empty */ }
    }, [storageKey]);

    const save = useCallback((next: Map<string, PickedQuestion>) => {
        try { sessionStorage.setItem(storageKey, JSON.stringify([...next.values()])); } catch { /* ignore */ }
        return next;
    }, [storageKey]);

    const value = useMemo<SelectionContextValue>(() => ({
        picked,
        isPicked: (id) => picked.has(id),
        toggle: (q) => setPicked((prev) => {
            const next = new Map(prev);
            if (next.has(q.id)) next.delete(q.id); else next.set(q.id, q);
            return save(next);
        }),
        pickMany: (qs) => setPicked((prev) => {
            const next = new Map(prev);
            qs.forEach((q) => next.set(q.id, q));
            return save(next);
        }),
        unpickMany: (ids) => setPicked((prev) => {
            const next = new Map(prev);
            ids.forEach((id) => next.delete(id));
            return save(next);
        }),
        clear: () => setPicked(save(new Map())),
    }), [picked, save]);

    return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

/** Sticky bar with the picks and the Build quiz flow. Renders nothing until something is picked. */
export function PickTray({ userId }: { userId: string }) {
    const router = useRouter();
    const { picked, unpickMany, clear } = useBankSelection();
    const [isBuilding, setIsBuilding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const list = [...picked.values()];
    const mix = (Object.keys(TYPE_META) as BankQuestionType[])
        .map((t) => ({ type: t, n: list.filter((q) => q.questionType === t).length }))
        .filter((m) => m.n > 0);

    if (list.length === 0 && !isBuilding) return null;

    const handleBuild = async () => {
        if (!title.trim()) return toast.error("Give the new quiz a title.");
        setIsSubmitting(true);
        const response = await createQuizFromBank(userId, title.trim(), description.trim(), list.map((q) => q.id));

        if (response.error || !response.quizId) {
            toast.error(response.error ?? "Couldn't build the quiz. Try again.");
            setIsSubmitting(false);
            return;
        }
        toast.success(`Quiz built with ${list.length} ${list.length === 1 ? "question" : "questions"}.`);
        clear();
        router.push(`/quiz/${response.quizId}`);
    };

    return (
        <>
            {list.length > 0 && (
                <div className="fixed inset-x-0 bottom-4 z-40 px-4 sm:px-6">
                    <div className="px-panel mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-3 border-px-yellow px-4 py-3">
                        <p className="flex items-baseline gap-2">
                            <span className="font-pixel text-lg text-px-yellow px-glow">{list.length}</span>
                            <span className="text-lg">{list.length === 1 ? "question picked" : "questions picked"}</span>
                        </p>
                        <div className="hidden flex-wrap gap-1.5 md:flex" aria-label="Picked by type">
                            {mix.map((m) => (
                                <span key={m.type} className={`px-notch px-1.5 py-1 font-pixel text-[9px] text-px-void ${TYPE_META[m.type].fill}`}>
                                    {TYPE_META[m.type].short} {m.n}
                                </span>
                            ))}
                        </div>
                        <div className="ml-auto flex flex-wrap gap-2">
                            <button onClick={clear} className="px-btn px-btn-sm px-btn-ghost">Clear</button>
                            <button onClick={() => setIsBuilding(true)} data-sfx="start" className="px-btn px-btn-yellow">▶ Build quiz</button>
                        </div>
                    </div>
                </div>
            )}

            {isBuilding && (
                <Dialog
                    title="Build a new quiz"
                    onClose={() => setIsBuilding(false)}
                    locked={isSubmitting}
                    actions={<>
                        <button onClick={() => setIsBuilding(false)} className="px-btn px-btn-ghost">Keep picking</button>
                        <button onClick={handleBuild} disabled={isSubmitting || list.length === 0 || !title.trim()} data-sfx="levelup" className="px-btn px-btn-yellow">
                            {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                            Create quiz
                        </button>
                    </>}
                >
                    <div className="space-y-4">
                        <label className="block text-base font-semibold">Title
                            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Midterm review" className="px-input mt-1.5 w-full" autoFocus />
                        </label>
                        <label className="block text-base font-semibold">Description <span className="font-normal text-muted">(optional)</span>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Mixed from the cell biology and genetics quizzes" className="px-input mt-1.5 w-full resize-none" />
                        </label>
                        <div>
                            <p className="text-base font-semibold">{list.length} {list.length === 1 ? "question" : "questions"}, in this order</p>
                            <ol className="mt-1.5 max-h-60 divide-y-4 divide-frame overflow-y-auto border-4 border-frame-strong px-notch">
                                {list.map((q, i) => (
                                    <li key={q.id} className="flex items-start gap-3 bg-screen px-3 py-2">
                                        <span className="mt-0.5 w-6 shrink-0 font-pixel text-[10px] text-muted">{i + 1}</span>
                                        <span className={`mt-0.5 shrink-0 px-notch px-1 py-0.5 font-pixel text-[8px] text-px-void ${TYPE_META[q.questionType].fill}`}>{TYPE_META[q.questionType].short}</span>
                                        <span className="min-w-0 flex-1 text-base leading-snug">{q.questionText}</span>
                                        <button onClick={() => unpickMany([q.id])} aria-label="Remove from quiz" className="shrink-0 text-muted hover:text-fg">
                                            <X className="size-4" aria-hidden />
                                        </button>
                                    </li>
                                ))}
                            </ol>
                            {list.length === 0 && <p className="mt-2 text-base text-muted">Nothing picked. Close this and pick some questions.</p>}
                        </div>
                        <p className="text-sm text-muted">The questions are copied, so editing the new quiz won&apos;t change the quizzes they came from. Difficulty is set to mixed.</p>
                    </div>
                </Dialog>
            )}
        </>
    );
}
