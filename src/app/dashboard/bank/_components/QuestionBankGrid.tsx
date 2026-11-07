"use client"

import { Check } from "lucide-react";
import { useBankSelection, type PickedQuestion } from "./BankSelection";
import { TYPE_META, isBankType, type BankQuestionType } from "./types";

type BankQuestion = {
    id: string;
    questionType: string;
    questionText: string;
    options: unknown;
    correctAnswer: string;
    quiz: { title: string };
};

const toPick = (q: BankQuestion): PickedQuestion => ({
    id: q.id,
    questionText: q.questionText,
    questionType: (isBankType(q.questionType) ? q.questionType : "MULTIPLE_CHOICE") as BankQuestionType,
    quizTitle: q.quiz.title,
});

/** A page of questions the player can pick from. Picks live in BankSelectionProvider, above this page. */
export default function QuestionBankGrid({ questions, totalCount }: { questions: BankQuestion[]; totalCount: number }) {
    const { isPicked, toggle, pickMany, unpickMany } = useBankSelection();
    const allOnPagePicked = questions.length > 0 && questions.every((q) => isPicked(q.id));

    return (
        <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-base text-muted">
                    Showing {questions.length} of {totalCount} {totalCount === 1 ? "question" : "questions"}
                </p>
                <button
                    type="button"
                    onClick={() => allOnPagePicked ? unpickMany(questions.map((q) => q.id)) : pickMany(questions.map(toPick))}
                    data-sfx="select"
                    className="px-btn px-btn-sm px-btn-ghost"
                >
                    {allOnPagePicked ? "Unpick this page" : "Pick this page"}
                </button>
            </div>

            <ul className="grid gap-3 md:grid-cols-2">
                {questions.map((q) => (
                    <QuestionCard key={q.id} q={q} picked={isPicked(q.id)} onToggle={() => toggle(toPick(q))} />
                ))}
            </ul>
        </div>
    );
}

function QuestionCard({ q, picked, onToggle }: { q: BankQuestion; picked: boolean; onToggle: () => void }) {
    const type = isBankType(q.questionType) ? q.questionType : "MULTIPLE_CHOICE";
    const meta = TYPE_META[type];
    const options = Array.isArray(q.options) ? (q.options as unknown[]).map(String) : [];

    return (
        <li className={`px-panel flex flex-col ${picked ? "border-px-cyan bg-raised" : "hover:bg-raised/60"}`}>
            {/* The whole top area is the checkbox's label, so a click or Space anywhere picks it */}
            <label className="flex flex-1 cursor-pointer gap-3 p-4">
                <input type="checkbox" checked={picked} onChange={onToggle} data-sfx="select" className="peer sr-only" />
                <span
                    aria-hidden
                    className={`px-notch mt-0.5 flex size-6 shrink-0 items-center justify-center border-4 peer-focus-visible:border-px-cyan ${picked ? "border-px-void bg-px-cyan text-px-void" : "border-frame-strong bg-screen"}`}
                >
                    {picked && <Check className="size-3.5" strokeWidth={4} />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                        <span className={`px-notch px-1.5 py-1 font-pixel text-[9px] text-px-void ${meta.fill}`}>{meta.label}</span>
                        <span className="min-w-0 truncate text-sm text-muted">from {q.quiz.title}</span>
                    </span>
                    <span className="mt-2 line-clamp-3 block text-lg font-semibold leading-snug">{q.questionText}</span>
                    <span className="mt-2 block text-base">
                        <span className="text-muted">Answer </span>
                        <span className="font-semibold">{q.correctAnswer || "Graded by AI"}</span>
                    </span>
                </span>
            </label>

            {options.length > 0 && type !== "TRUE_FALSE" && (
                <details className="group border-t-4 border-frame px-4 py-2">
                    <summary className="cursor-pointer list-none text-sm text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
                        <span className="group-open:hidden">Show {options.length} choices</span>
                        <span className="hidden group-open:inline">Hide choices</span>
                    </summary>
                    <ul className="mt-2 grid gap-1 pb-1 sm:grid-cols-2">
                        {options.map((o, i) => (
                            <li key={i} className={`flex items-start gap-2 text-base ${o === q.correctAnswer ? "font-semibold" : "text-muted"}`}>
                                <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center font-pixel text-[8px] text-px-void px-notch ${o === q.correctAnswer ? "bg-px-lime" : "bg-px-fog"}`}>
                                    {o === q.correctAnswer ? <Check className="size-3" strokeWidth={4} aria-hidden /> : String.fromCharCode(65 + i)}
                                </span>
                                <span className="min-w-0">{o}{o === q.correctAnswer && <span className="sr-only"> (correct)</span>}</span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </li>
    );
}
