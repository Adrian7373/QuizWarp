"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { ArrowLeft, BookOpen, BrainCircuit, CalendarClock, Check, ChevronDown, Copy, Download, Edit, Loader2, Play, Printer, RotateCcw, Save, Timer, Trash2, X } from 'lucide-react';
import type { AppUser, QuizType } from '../page';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { deleteQuiz, updateQuiz } from '../actions';
import { createAsyncSession, createLiveSession } from '../actions/generate';
import { startPracticeQuiz } from '../actions';
import Dialog from './arcade/Dialog';
import { Banner, PixelBar } from './arcade/Hud';
import HoloOrb from './arcade/HoloOrb';
import { playSfx } from './arcade/sfx';

// Interfaces matching your Pydantic/Prisma unified schema
export interface Question {
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    timeLimitSeconds?: number | null;
    questionType?: QuizType;
}

export interface QuizData {
    id?: string;
    title: string;
    description: string;
    difficulty: string;
    questions: Question[];
}

interface QuizModalProps {
    isOpen?: boolean | null;
    onClose?: () => void | null;
    quizData: QuizData | null;
    user?: AppUser | null;
}

// Answer keys keep fixed cabinet colors: A red, B cyan, C yellow, D lime (see /designsystem).
const KEY_FILL = ["bg-px-red", "bg-px-cyan", "bg-px-yellow", "bg-px-lime"];

const TYPE_CHIP: Record<string, { label: string; fill: string }> = {
    MULTIPLE_CHOICE: { label: "Multiple choice", fill: "bg-px-cyan" },
    TRUE_FALSE: { label: "True or false", fill: "bg-px-pink" },
    IDENTIFICATION: { label: "Identification", fill: "bg-px-yellow" },
    ESSAY: { label: "Essay", fill: "bg-px-lime" },
};

const LEVELS: Record<string, { n: number; fill: string; label: string }> = {
    easy: { n: 1, fill: "bg-px-lime", label: "Easy" },
    normal: { n: 2, fill: "bg-px-yellow", label: "Normal" },
    hard: { n: 3, fill: "bg-px-red", label: "Hard" },
    mixed: { n: 2, fill: "bg-px-cyan", label: "Mixed" },
};

/** Which UI a question gets. Older/guest quizzes may lack questionType, so fall back to the options. */
function kindOf(q: Question): "choice" | "typed" | "essay" {
    if (q.questionType === "ESSAY") return "essay";
    return q.options && q.options.length > 0 ? "choice" : "typed";
}

const toolBtn = "px-btn px-btn-sm";

export default function QuizModal({ isOpen, onClose, quizData, user }: QuizModalProps) {
    const router = useRouter();

    // ==========================================
    // State Management
    // ==========================================

    // Edit Quiz states
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(quizData?.title || "");
    const [editedDescription, setEditedDescription] = useState(quizData?.description || "");
    const [editedQuestions, setEditedQuestions] = useState<Question[]>(quizData?.questions || []);
    const [isSavingEdits, setIsSavingEdits] = useState(false);

    // Interaction states
    const [includeAnswers, setIncludeAnswers] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [submittedAnswers, setSubmittedAnswers] = useState<Record<number, string>>({});
    const [revealedEssays, setRevealedEssays] = useState<Record<number, boolean>>({});
    const [isDeleting, setIsDeleting] = useState(false);

    // Create quiz async session states
    const [isAssigning, setIsAssigning] = useState(false);
    const [dueDate, setDueDate] = useState("");
    const [generatedPin, setGeneratedPin] = useState("");
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Practice Quiz states
    const [isStartingPractice, setIsStartingPractice] = useState(false);

    const [isLaunchingLive, setIsLaunchingLive] = useState(false);
    const [maxFactions, setMaxFactions] = useState(4);
    const [isCreatingLive, setIsCreatingLive] = useState(false);
    const [gameMode, setGameMode] = useState<"SOLO" | "FACTIONS">("SOLO");

    // Close the download menu on an outside click or Escape.
    const downloadRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!showDownloadMenu) return;
        const onDown = (e: MouseEvent) => { if (!downloadRef.current?.contains(e.target as Node)) setShowDownloadMenu(false); };
        const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") setShowDownloadMenu(false); };
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
    }, [showDownloadMenu]);

    if (!isOpen || !quizData) return null;

    const isStudent = user?.role === "STUDENT";

    // ==========================================
    // Practice scoring (essays aren't auto-graded, so they don't count)
    // ==========================================
    const isCorrectFor = (q: Question, index: number) => {
        const kind = kindOf(q);
        if (kind === "essay") return null;
        const answer = kind === "typed" ? submittedAnswers[index] : userAnswers[index];
        if (typeof answer !== "string" || !answer.trim()) return null;
        return kind === "typed" ? answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() : answer === q.correctAnswer;
    };
    const gradable = editedQuestions.filter((q) => kindOf(q) !== "essay").length;
    const results = editedQuestions.map((q, i) => isCorrectFor(q, i));
    const answeredCount = results.filter((r) => r !== null).length;
    const correctCount = results.filter((r) => r === true).length;
    const allAnswered = gradable > 0 && answeredCount === gradable;

    const resetRun = () => {
        setUserAnswers({});
        setSubmittedAnswers({});
        setRevealedEssays({});
    };

    // ==========================================
    // Handlers
    // ==========================================

    const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
        const updated = [...editedQuestions];
        updated[index] = { ...updated[index], [field]: value };
        setEditedQuestions(updated);
    };

    const handleOptionChange = (qIndex: number, optIndex: number, newValue: string) => {
        const updated = [...editedQuestions];
        const oldOptionValue = updated[qIndex].options[optIndex];
        const newOptions = [...updated[qIndex].options];
        newOptions[optIndex] = newValue;
        updated[qIndex].options = newOptions;

        if (updated[qIndex].correctAnswer === oldOptionValue) {
            updated[qIndex].correctAnswer = newValue;
        }

        setEditedQuestions(updated);
    };

    const handleCreateAssignment = async () => {
        if (!user || !quizData?.id) return;
        if (!dueDate) return toast.error("Please select a due date.");

        setIsCreatingSession(true);
        const response = await createAsyncSession(quizData.id, user.id, new Date(dueDate));

        if (response.error) {
            toast.error(response.error);
        } else {
            setGeneratedPin(response.session!.joinCode);
            toast.success("Assignment created!");
        }
        setIsCreatingSession(false);
    };

    const closeAssign = () => {
        setIsAssigning(false);
        setGeneratedPin("");
        setDueDate("");
    };

    const handlePracticeLaunch = async () => {
        if (!user || !quizData?.id) return;

        setIsStartingPractice(true);
        const response = await startPracticeQuiz(quizData.id, user.id, "Practice Mode");

        if (response.error || !response.sessionId || !response.participantId) {
            toast.error(response.error || "Failed to start practice.");
            setIsStartingPractice(false);
        } else {
            localStorage.setItem(`participant_${response.sessionId}`, response.participantId);
            router.push(`/play/${response.sessionId}`);
        }
    };

    const handleCopyLink = async () => {
        const joinLink = `${window.location.origin}/join?pin=${generatedPin}`;
        await navigator.clipboard.writeText(joinLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleAnswerSelect = (questionIndex: number, answer: string) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    };

    /** A multiple choice or true/false pick: lock it in and play the result sound. */
    const handleChoicePick = (questionIndex: number, option: string) => {
        handleAnswerSelect(questionIndex, option);
        playSfx(option === editedQuestions[questionIndex].correctAnswer ? "correct" : "wrong");
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            router.back();
        }
    };

    const handleIdentificationAnswerSubmit = (questionIndex: number) => {
        const trimmedAnswer = (userAnswers[questionIndex] || '').trim();
        if (!trimmedAnswer) return;
        if (submittedAnswers[questionIndex] === trimmedAnswer) return;
        setSubmittedAnswers(prev => ({ ...prev, [questionIndex]: trimmedAnswer }));
        const right = trimmedAnswer.toLowerCase() === editedQuestions[questionIndex].correctAnswer.trim().toLowerCase();
        playSfx(right ? "correct" : "wrong");
    };

    const handleIdentificationKeyDown = (event: KeyboardEvent<HTMLInputElement>, questionIndex: number) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleIdentificationAnswerSubmit(questionIndex);
        }
    };

    const handlePrint = () => window.print();

    const generateTXT = () => {
        let content = `${editedTitle.toUpperCase()}\n`;
        content += `${editedDescription}\n`;
        content += `Difficulty: ${quizData.difficulty.toUpperCase()}\n`;
        content += `=====================================\n\n`;

        editedQuestions.forEach((q, idx) => {
            content += `Q${idx + 1}: ${q.questionText}\n`;
            if (q.options && q.options.length > 0) {
                q.options.forEach((opt, oIdx) => {
                    content += `   ${String.fromCharCode(65 + oIdx)}. ${opt}\n`;
                });
            } else {
                content += `   [Identification Question]\n`;
            }
            if (includeAnswers) {
                content += `   -> Correct Answer: ${q.correctAnswer}\n`;
                content += `   -> Explanation: ${q.explanation}\n`;
            }
            content += `\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `${editedTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_quiz.txt`);
        toast.success("Text file downloaded successfully!");
    };

    const generateDOCX = async () => {
        try {
            const docChildren: any[] = [
                new Paragraph({
                    children: [
                        new TextRun({ text: editedTitle, bold: true, size: 32 })
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: editedDescription, italics: true, size: 24 })
                    ],
                }),
                new Paragraph({ text: "" }), // Spacer
            ];

            editedQuestions.forEach((q, idx) => {
                docChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Q${idx + 1}: ${q.questionText}`, bold: true, size: 24 })
                        ],
                    })
                );

                if (q.options && q.options.length > 0) {
                    q.options.forEach((opt, oIdx) => {
                        docChildren.push(
                            new Paragraph({
                                children: [
                                    new TextRun({ text: `   ${String.fromCharCode(65 + oIdx)}. ${opt}`, size: 20 })
                                ],
                            })
                        );
                    });
                }

                if (includeAnswers) {
                    docChildren.push(
                        new Paragraph({
                            children: [
                                new TextRun({ text: `   Correct Answer: ${q.correctAnswer}`, bold: true, color: "008000", size: 20 })
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: `   Explanation: ${q.explanation}`, italics: true, color: "555555", size: 18 })
                            ],
                        })
                    );
                }

                docChildren.push(new Paragraph({ text: "" })); // Spacer between questions
            });

            const doc = new Document({
                sections: [{ children: docChildren }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${editedTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_quiz.docx`);
            toast.success("Word document downloaded successfully!");
        } catch (error) {
            console.error("DOCX generation error:", error);
            toast.error("Failed to generate Word document.");
        }
    };

    const generatePDF = () => {
        try {
            const doc = new jsPDF();
            let y = 20;

            doc.setFontSize(20);
            doc.text(editedTitle, 105, y, { align: "center" });
            y += 10;

            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(editedDescription, 105, y, { align: "center" });
            y += 15;

            doc.setTextColor(0);
            editedQuestions.forEach((q, idx) => {
                if (y > 270) { // Page break check
                    doc.addPage();
                    y = 20;
                }

                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                const splitQuestion = doc.splitTextToSize(`Q${idx + 1}: ${q.questionText}`, 180);
                doc.text(splitQuestion, 15, y);
                y += splitQuestion.length * 7;

                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                if (q.options && q.options.length > 0) {
                    q.options.forEach((opt, oIdx) => {
                        const optText = `   ${String.fromCharCode(65 + oIdx)}. ${opt}`;
                        const splitOpt = doc.splitTextToSize(optText, 175);
                        doc.text(splitOpt, 15, y);
                        y += splitOpt.length * 5;
                    });
                }

                if (includeAnswers) {
                    doc.setTextColor(0, 128, 0);
                    doc.text(`   Answer: ${q.correctAnswer}`, 15, y);
                    y += 5;
                    doc.setTextColor(100, 100, 100);
                    const splitExp = doc.splitTextToSize(`   Explanation: ${q.explanation}`, 175);
                    doc.text(splitExp, 15, y);
                    y += splitExp.length * 5;
                    doc.setTextColor(0);
                }

                y += 8; // Spacing after question
            });

            doc.save(`${editedTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_quiz.pdf`);
            toast.success("PDF downloaded successfully!");
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate PDF.");
        }
    }

    const handleDownload = (format: 'pdf' | 'docx' | 'txt') => {
        setShowDownloadMenu(false);
        try {
            if (format === 'txt') generateTXT();
            if (format === 'docx') generateDOCX();
            if (format === 'pdf') generatePDF();
        } catch (error) {
            console.error(`Failed to generate ${format}:`, error);
            toast.error(`Couldn't create the ${format.toUpperCase()} file. Try again.`);
        }
    };

    // ==========================================
    // Server Actions
    // ==========================================
    const handleDelete = async () => {
        if (!user) return;
        const response = await deleteQuiz(quizData.id || "", user.id);
        if (response?.error) {
            toast.error("Failed to delete quiz.");
        } else {
            toast.success("Quiz deleted successfully!");
            setIsDeleting(false);
            router.refresh();
            handleClose();
        }
    };

    const handleConfirmLiveLaunch = async () => {
        if (!user || !quizData?.id) return;
        setIsCreatingLive(true);

        const finalMaxFactions = gameMode === "SOLO" ? 0 : maxFactions;

        const response = await createLiveSession(quizData.id, user.id, finalMaxFactions);

        if (response.error) {
            toast.error(response.error);
            setIsCreatingLive(false);
        } else {
            router.push(`/host/${response.session!.id}`);
        }
    };

    const cancelEdits = () => {
        setEditedTitle(quizData.title);
        setEditedDescription(quizData.description);
        setEditedQuestions(quizData.questions);
        setIsEditing(false);
    };

    const handleSaveChanges = async () => {
        if (!user || !quizData?.id) return;
        setIsSavingEdits(true);
        const response = await updateQuiz(quizData.id, user.id, {
            title: editedTitle,
            description: editedDescription,
            questions: editedQuestions
        });

        if (response.error) {
            toast.error(response.error);
        } else {
            toast.success("Quiz updated successfully!");
            quizData.title = editedTitle;
            quizData.description = editedDescription;
            quizData.questions = editedQuestions;
            setIsEditing(false);
            router.refresh();
        }
        setIsSavingEdits(false);
    };

    const level = LEVELS[quizData.difficulty] ?? LEVELS.normal;
    const minDue = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    return (
        <div data-covers-scenery className="fixed bottom-0 left-0 right-0 top-16 z-[40] flex flex-col overflow-hidden bg-bg font-sans text-fg print:static print:block print:h-auto print:overflow-visible">

            {/* ===== TOOLBAR ===== */}
            <header className="z-40 shrink-0 border-b-4 border-frame bg-surface print:hidden">
                <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-3 py-2.5 sm:px-6">
                    <button onClick={handleClose} className={`${toolBtn} px-btn-ghost`} aria-label="Back">
                        <ArrowLeft className="size-4" aria-hidden /><span className="hidden sm:inline">Back</span>
                    </button>

                    {isEditing ? (
                        <>
                            <span className="px-label ml-1 text-px-yellow px-glow">Editing</span>
                            <div className="ml-auto flex gap-2">
                                <button onClick={cancelEdits} disabled={isSavingEdits} className={`${toolBtn} px-btn-ghost`}>Cancel</button>
                                <button onClick={handleSaveChanges} disabled={isSavingEdits} data-sfx="coin" className={`${toolBtn} px-btn-yellow`}>
                                    {isSavingEdits ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
                                    {isSavingEdits ? "Saving…" : "Save changes"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Answers switch */}
                            <label className="ml-1 flex cursor-pointer items-center gap-2 text-base">
                                <input type="checkbox" className="peer sr-only" checked={includeAnswers} onChange={() => setIncludeAnswers(!includeAnswers)} data-sfx="select" />
                                <span aria-hidden className={`px-notch relative h-6 w-11 border-4 peer-focus-visible:border-px-cyan ${includeAnswers ? "border-px-void bg-px-lime" : "border-frame-strong bg-screen"}`}>
                                    <span className={`absolute top-0 size-4 bg-px-snow ${includeAnswers ? "left-[20px] border-2 border-px-void" : "left-0 border-2 border-frame-strong"}`} />
                                </span>
                                <span className="hidden sm:inline">Show answers</span>
                                <span className="sm:hidden">Answers</span>
                            </label>

                            <div className="relative" ref={downloadRef}>
                                <button onClick={() => setShowDownloadMenu(!showDownloadMenu)} aria-expanded={showDownloadMenu} aria-haspopup="menu" className={`${toolBtn} px-btn-ghost`}>
                                    <Download className="size-4" aria-hidden /><span className="hidden sm:inline">Download</span><ChevronDown className="size-3.5" aria-hidden />
                                </button>
                                {showDownloadMenu && (
                                    <div role="menu" className="px-panel absolute left-0 z-10 mt-2 w-44 py-1">
                                        {([["pdf", "PDF (.pdf)"], ["docx", "Word (.docx)"], ["txt", "Text (.txt)"]] as const).map(([fmt, label]) => (
                                            <button key={fmt} role="menuitem" onClick={() => handleDownload(fmt)} className="block w-full px-3 py-2 text-left text-base hover:bg-raised">{label}</button>
                                        ))}
                                        <p className="border-t-4 border-frame px-3 pt-2 pb-1 text-sm text-muted">{includeAnswers ? "Includes answers" : "Questions only"}</p>
                                    </div>
                                )}
                            </div>

                            <button onClick={handlePrint} className={`${toolBtn} px-btn-ghost`} aria-label="Print">
                                <Printer className="size-4" aria-hidden /><span className="hidden sm:inline">Print</span>
                            </button>

                            {user && !isStudent && (
                                <button onClick={() => setIsEditing(true)} className={`${toolBtn} px-btn-ghost`} aria-label="Edit quiz">
                                    <Edit className="size-4" aria-hidden /><span className="hidden sm:inline">Edit</span>
                                </button>
                            )}

                            <div className="ml-auto flex flex-wrap gap-2">
                                {user && quizData.id && (
                                    isStudent ? (
                                        <>
                                            <button onClick={() => router.push(`/study/${quizData.id}`)} className={`${toolBtn} px-btn-yellow`}>
                                                <BookOpen className="size-4" aria-hidden />Study
                                            </button>
                                            <button onClick={handlePracticeLaunch} disabled={isStartingPractice} data-sfx="start" className={`${toolBtn} px-btn-lime`}>
                                                {isStartingPractice ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BrainCircuit className="size-4" aria-hidden />}
                                                {isStartingPractice ? "Starting…" : "Practice"}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => setIsLaunchingLive(true)} className={`${toolBtn} px-btn-pink`}>
                                                <Play className="size-4" fill="currentColor" aria-hidden />Host live
                                            </button>
                                            <button onClick={() => setIsAssigning(true)} className={`${toolBtn} px-btn-cyan`}>
                                                <CalendarClock className="size-4" aria-hidden />Assign
                                            </button>
                                        </>
                                    )
                                )}
                                {user && quizData.id && (
                                    <button onClick={() => setIsDeleting(true)} className={`${toolBtn} px-btn-ghost hover:[--btn:var(--px-7)] hover:[--btn-ink:var(--px-0)]`} aria-label="Delete quiz" title="Delete quiz">
                                        <Trash2 className="size-4" aria-hidden />
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* ===== QUESTIONS (scrollable) ===== */}
            <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 print:overflow-visible print:p-0">
                <div className="mx-auto max-w-3xl space-y-5 pb-16 print:space-y-6 print:pb-0">

                    {/* Title card with the practice score */}
                    <section className="px-panel p-5 sm:p-6 print:border-0 print:p-0">
                        {isEditing ? (
                            <div className="space-y-4">
                                <label className="block text-base font-semibold">Title
                                    <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="px-input mt-1.5 w-full text-xl font-semibold" />
                                </label>
                                <label className="block text-base font-semibold">Description
                                    <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="px-input mt-1.5 w-full resize-none" rows={3} />
                                </label>
                            </div>
                        ) : (
                            <>
                                <h1 className="px-title text-lg leading-relaxed sm:text-2xl print:text-2xl">{editedTitle}</h1>
                                {editedDescription && <p className="mt-3 max-w-[60ch] text-lg text-muted">{editedDescription}</p>}
                                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-base">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="flex gap-[3px]" aria-hidden>
                                            {[1, 2, 3].map((i) => <span key={i} className={`size-2.5 border-2 border-px-void ${i <= level.n ? level.fill : "bg-raised"}`} />)}
                                        </span>
                                        {level.label}
                                    </span>
                                    <span className="text-muted">{editedQuestions.length} {editedQuestions.length === 1 ? "question" : "questions"}</span>
                                </div>

                                {gradable > 0 && (
                                    <div className="mt-5 border-t-4 border-dashed border-frame pt-4 print:hidden">
                                        {allAnswered ? (
                                            <div className="flex flex-wrap items-center gap-4">
                                                <Banner title="Quiz cleared!" detail={`${correctCount} of ${gradable} correct`} tone={correctCount / gradable >= 0.7 ? "lime" : "yellow"} />
                                                <button onClick={resetRun} className={`${toolBtn} px-btn-ghost`}><RotateCcw className="size-4" aria-hidden />Play again</button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                                                <p className="text-base">
                                                    <span className="font-semibold">Practice run.</span>{" "}
                                                    <span className="text-muted">Pick an answer to check it.</span>
                                                </p>
                                                <div className="flex flex-1 items-center gap-3 sm:min-w-[16rem]">
                                                    <PixelBar value={answeredCount} max={gradable} segments={Math.min(gradable, 20)} color="lime" label="Questions answered" />
                                                    <span className="whitespace-nowrap font-pixel text-[10px]">{correctCount}/{gradable}</span>
                                                </div>
                                                {answeredCount > 0 && (
                                                    <button onClick={resetRun} className={`${toolBtn} px-btn-ghost`}><RotateCcw className="size-4" aria-hidden />Reset</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </section>

                    {editedQuestions.map((q, index) => {
                        const kind = kindOf(q);
                        const result = results[index]; // true / false / null (not answered or essay)
                        const answered = result !== null;
                        const essayRevealed = !!revealedEssays[index];
                        const showFeedback = isEditing || answered || (includeAnswers && kind !== "essay") || (kind === "essay" && (essayRevealed || includeAnswers));
                        const chip = q.questionType ? TYPE_CHIP[q.questionType] : null;

                        return (
                            <article key={index} className="px-panel break-inside-avoid p-4 sm:p-6 print:border-0 print:p-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-notch bg-px-void px-2 py-1 font-pixel text-[10px] text-px-snow">Q{index + 1}</span>
                                    {chip && <span className={`px-notch px-1.5 py-1 font-pixel text-[9px] text-px-void print:hidden ${chip.fill}`}>{chip.label}</span>}
                                    {isEditing ? (
                                        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
                                            <Timer className="size-4" aria-hidden /><span className="sr-only">Time limit</span>
                                            <select value={q.timeLimitSeconds || ""} onChange={(e) => handleQuestionChange(index, 'timeLimitSeconds', e.target.value ? parseInt(e.target.value) : null)} className="px-input py-1 text-base">
                                                <option value="">No limit</option>
                                                <option value="10">10 seconds</option>
                                                <option value="20">20 seconds</option>
                                                <option value="30">30 seconds</option>
                                                <option value="45">45 seconds</option>
                                                <option value="60">1 minute</option>
                                                <option value="120">2 minutes</option>
                                            </select>
                                        </label>
                                    ) : q.timeLimitSeconds ? (
                                        <span className="ml-auto inline-flex items-center gap-1.5 font-pixel text-[10px] text-px-orange px-glow print:hidden">
                                            <Timer className="size-3.5" aria-hidden />{q.timeLimitSeconds}s
                                        </span>
                                    ) : null}
                                </div>

                                {isEditing ? (
                                    <textarea aria-label={`Question ${index + 1}`} className="px-input mt-3 w-full resize-none text-xl font-semibold" onChange={(e) => handleQuestionChange(index, "questionText", e.target.value)} value={q.questionText} rows={3} />
                                ) : (
                                    <h2 className="mt-3 text-xl font-semibold leading-snug sm:text-2xl">{q.questionText}</h2>
                                )}

                                <div className="mt-4">
                                    {isEditing ? (
                                        kind === "choice" ? (
                                            <fieldset>
                                                <legend className="mb-2 text-base font-semibold">Choices <span className="font-normal text-muted">(select the correct one)</span></legend>
                                                <div className="grid gap-2 md:grid-cols-2">
                                                    {q.options.map((opt, optIdx) => {
                                                        const isRight = q.correctAnswer === opt;
                                                        return (
                                                            <div key={optIdx} className={`px-notch flex items-start gap-2 border-4 p-2 ${isRight ? "border-px-lime bg-raised" : "border-frame-strong bg-screen"}`}>
                                                                <input type="radio" name={`correct-answer-${index}`} checked={isRight} onChange={() => handleQuestionChange(index, "correctAnswer", opt)} aria-label={`Mark choice ${String.fromCharCode(65 + optIdx)} correct`} className="mt-2.5 size-4 shrink-0 accent-[var(--px-a)]" />
                                                                <textarea value={opt} onChange={(e) => handleOptionChange(index, optIdx, e.target.value)} className="min-w-0 flex-1 resize-y bg-transparent p-1 text-base text-fg outline-none" placeholder={`Choice ${String.fromCharCode(65 + optIdx)}`} rows={2} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </fieldset>
                                        ) : (
                                            <label className="block text-base font-semibold">{kind === "essay" ? "Sample answer" : "Correct answer"}
                                                <textarea value={q.correctAnswer} onChange={(e) => handleQuestionChange(index, "correctAnswer", e.target.value)} className="px-input mt-1.5 w-full resize-y md:max-w-lg" rows={kind === "essay" ? 4 : 2} />
                                            </label>
                                        )
                                    ) : kind === "choice" ? (
                                        <div className={`grid gap-2 ${q.options.length === 2 ? "sm:grid-cols-2" : "md:grid-cols-2"}`}>
                                            {q.options.map((option, optIdx) => {
                                                const isPicked = userAnswers[index] === option;
                                                const isRightOne = option === q.correctAnswer;
                                                const revealRight = (answered || includeAnswers) && isRightOne;
                                                const state = answered
                                                    ? (isPicked && result ? "correct" : isPicked ? "wrong" : isRightOne ? "correct" : "dim")
                                                    : revealRight ? "correct" : "idle";
                                                const shell =
                                                    state === "correct" ? "border-px-void bg-px-lime text-px-void" :
                                                    state === "wrong" ? "border-px-void bg-px-red text-px-void" :
                                                    state === "dim" ? "border-frame-strong bg-surface opacity-45" :
                                                    "border-frame-strong bg-surface hover:bg-raised";
                                                return (
                                                    <button
                                                        key={optIdx}
                                                        onClick={() => handleChoicePick(index, option)}
                                                        disabled={answered}
                                                        aria-pressed={isPicked}
                                                        data-sfx="none"
                                                        className={`px-notch flex items-center gap-3 border-4 py-2 pl-2 pr-3 text-left text-lg leading-tight disabled:cursor-default print:border-2 print:border-black print:bg-white print:text-black print:opacity-100 ${shell}`}
                                                    >
                                                        <span className={`px-notch flex size-8 shrink-0 items-center justify-center border-4 border-px-void font-pixel text-[10px] text-px-void print:border-2 ${state === "correct" || state === "wrong" ? "bg-px-snow" : KEY_FILL[optIdx % 4]}`}>
                                                            {state === "correct" ? <Check className="size-4" strokeWidth={4} aria-hidden /> : state === "wrong" ? <X className="size-4" strokeWidth={4} aria-hidden /> : String.fromCharCode(65 + optIdx)}
                                                        </span>
                                                        <span className="min-w-0 flex-1">{option}</span>
                                                        {state === "correct" && isPicked && <span className="font-pixel text-[10px] print:hidden">+100</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : kind === "typed" ? (
                                        <div className="max-w-lg">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    aria-label={`Your answer to question ${index + 1}`}
                                                    placeholder="Type your answer"
                                                    value={userAnswers[index] || ''}
                                                    onChange={(e) => handleAnswerSelect(index, e.target.value)}
                                                    onKeyDown={(e) => handleIdentificationKeyDown(e, index)}
                                                    disabled={answered}
                                                    className={`px-input w-full print:border-0 print:border-b-2 print:border-black print:bg-transparent ${answered ? (result ? "border-px-lime" : "border-px-red") : ""}`}
                                                />
                                                {!answered && (
                                                    <button type="button" onClick={() => handleIdentificationAnswerSubmit(index)} disabled={!(userAnswers[index] || '').trim()} data-sfx="none" className="px-btn px-btn-cyan shrink-0 print:hidden">Check</button>
                                                )}
                                            </div>
                                            {!answered && <p className="mt-1.5 text-sm text-muted print:hidden">Press Enter to check. Capitals don&apos;t matter.</p>}
                                        </div>
                                    ) : (
                                        <div>
                                            <textarea
                                                aria-label={`Draft your answer to question ${index + 1}`}
                                                placeholder="Draft your answer here. Essays are graded by AI in live games and homework."
                                                value={userAnswers[index] || ''}
                                                onChange={(e) => handleAnswerSelect(index, e.target.value)}
                                                rows={4}
                                                className="px-input w-full resize-y print:min-h-40 print:border-2 print:border-black print:bg-transparent"
                                            />
                                            {!essayRevealed && !includeAnswers && (
                                                <button type="button" onClick={() => setRevealedEssays((p) => ({ ...p, [index]: true }))} className="px-btn px-btn-sm px-btn-ghost mt-2 print:hidden">
                                                    Compare with sample answer
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {showFeedback && (
                                    <div className="mt-5">
                                        {isEditing ? (
                                            <label className="block text-base font-semibold">Explanation
                                                <textarea value={q.explanation} onChange={(e) => handleQuestionChange(index, "explanation", e.target.value)} className="px-input mt-1.5 w-full resize-y" rows={3} />
                                            </label>
                                        ) : (
                                            <div className={`px-notch flex gap-3 border-4 bg-screen p-4 print:border-2 print:border-black print:bg-transparent ${result === true ? "border-px-lime" : result === false ? "border-px-red" : "border-frame-strong"}`}>
                                                <span className="print:hidden"><HoloOrb mood={result === false ? "sad" : result === true ? "happy" : "idle"} scale={1} spin={false} /></span>
                                                <div className="min-w-0 space-y-1.5">
                                                    <p className="text-lg">
                                                        <span className="font-pixel text-[11px]">
                                                            {result === true ? "Correct!" : result === false ? "Not quite." : kind === "essay" ? "Sample answer" : "Answer"}
                                                        </span>{" "}
                                                        {kind !== "essay" && <span className="font-semibold">{q.correctAnswer}</span>}
                                                    </p>
                                                    {kind === "essay" && <p className="text-base">{q.correctAnswer}</p>}
                                                    {result === false && (
                                                        <p className="text-base text-muted">You answered <span className="text-fg">{userAnswers[index] || submittedAnswers[index]}</span></p>
                                                    )}
                                                    {q.explanation && <p className="text-base text-muted">{q.explanation}</p>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            </main>

            {/* ===== DIALOGS ===== */}

            {isDeleting && (
                <Dialog
                    title="Delete this quiz?"
                    size="sm"
                    onClose={() => setIsDeleting(false)}
                    actions={<>
                        <button onClick={() => setIsDeleting(false)} className="px-btn px-btn-ghost">Cancel</button>
                        <button onClick={handleDelete} data-sfx="wrong" className="px-btn px-btn-red">Delete quiz</button>
                    </>}
                >
                    <p className="text-lg"><span className="font-semibold">{editedTitle}</span> and its questions will be deleted. Past reports stay. This can&apos;t be undone.</p>
                </Dialog>
            )}

            {isAssigning && (
                <Dialog
                    title={generatedPin ? "Homework is live" : "Assign as homework"}
                    onClose={closeAssign}
                    locked={isCreatingSession}
                    actions={generatedPin ? (
                        <button onClick={closeAssign} className="px-btn px-btn-ghost">Done</button>
                    ) : (<>
                        <button onClick={closeAssign} className="px-btn px-btn-ghost">Cancel</button>
                        <button onClick={handleCreateAssignment} disabled={isCreatingSession || !dueDate} data-sfx="start" className="px-btn px-btn-cyan">
                            {isCreatingSession && <Loader2 className="size-4 animate-spin" aria-hidden />}
                            Create join PIN
                        </button>
                    </>)}
                >
                    {!generatedPin ? (
                        <div className="space-y-4">
                            <p className="text-lg text-muted">Students play <span className="font-semibold text-fg">{editedTitle}</span> at their own pace until the deadline. Scores land in Reports.</p>
                            <label className="block text-base font-semibold">Due date and time
                                <input type="datetime-local" min={minDue} value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="px-input mt-1.5 w-full" />
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-lg text-muted">Share this PIN or the link with your class. Track who joined under Active assignments.</p>
                            <p className="px-notch break-all bg-px-void px-4 py-6 text-center font-pixel text-3xl tracking-widest text-px-yellow sm:text-4xl">{generatedPin}</p>
                            <button onClick={handleCopyLink} data-sfx="coin" className="px-btn px-btn-lg px-btn-yellow w-full">
                                {isCopied ? <Check className="size-5" aria-hidden /> : <Copy className="size-5" aria-hidden />}
                                {isCopied ? "Link copied" : "Copy join link"}
                            </button>
                        </div>
                    )}
                </Dialog>
            )}

            {isLaunchingLive && (
                <Dialog
                    title="Host a live game"
                    onClose={() => setIsLaunchingLive(false)}
                    locked={isCreatingLive}
                    actions={<>
                        <button onClick={() => setIsLaunchingLive(false)} className="px-btn px-btn-ghost">Cancel</button>
                        <button onClick={handleConfirmLiveLaunch} disabled={isCreatingLive} data-sfx="start" className="px-btn px-btn-pink">
                            {isCreatingLive && <Loader2 className="size-4 animate-spin" aria-hidden />}
                            Open lobby
                        </button>
                    </>}
                >
                    <div className="space-y-4">
                        <p className="text-lg text-muted">Everyone joins <span className="font-semibold text-fg">{editedTitle}</span> with a PIN and answers each question at the same time.</p>
                        <div role="radiogroup" aria-label="Game mode" className="grid grid-cols-2 gap-2">
                            {([["SOLO", "Solo", "Every player for themselves"], ["FACTIONS", "Teams", "Players split into factions"]] as const).map(([mode, label, hint]) => (
                                <button
                                    key={mode}
                                    role="radio"
                                    aria-checked={gameMode === mode}
                                    data-sfx="select"
                                    onClick={() => setGameMode(mode)}
                                    className={`px-notch flex flex-col items-start gap-1 border-4 p-3 text-left ${gameMode === mode ? "border-px-pink bg-raised" : "border-frame-strong bg-surface hover:bg-raised"}`}
                                >
                                    <span className="font-pixel text-[11px]">{label}</span>
                                    <span className="text-base text-muted">{hint}</span>
                                </button>
                            ))}
                        </div>
                        {gameMode === "FACTIONS" && (
                            <div className="space-y-2">
                                <p className="text-base font-semibold">Number of teams</p>
                                <div role="radiogroup" aria-label="Number of teams" className="flex gap-2">
                                    {[2, 3, 4, 5, 6].map((num) => (
                                        <button
                                            key={num}
                                            role="radio"
                                            aria-checked={maxFactions === num}
                                            data-sfx="select"
                                            onClick={() => setMaxFactions(num)}
                                            className={`px-btn flex-1 ${maxFactions === num ? "px-btn-pink" : "px-btn-ghost"}`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-base text-muted">The first {maxFactions} players to join become team leaders.</p>
                            </div>
                        )}
                    </div>
                </Dialog>
            )}
        </div>
    );
}
