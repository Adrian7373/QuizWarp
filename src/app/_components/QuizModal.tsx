"use client"

import { useState, type KeyboardEvent } from 'react';
import { useMediaQuery } from 'react-responsive';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { CalendarClock, Check, CircleX, Copy, Edit, Save, Timer, Trash, Play, Users, Loader2, BookOpen, BrainCircuit } from 'lucide-react';
import type { AppUser, QuizType } from '../page';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { deleteQuiz, updateQuiz } from '../actions';
import { createAsyncSession, createLiveSession } from '../actions/generate';
import { startPracticeQuiz } from '../actions';

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

export default function QuizModal({ isOpen, onClose, quizData, user }: QuizModalProps) {
    const router = useRouter();

    // Responsive breakpoints
    const sm = useMediaQuery({ query: '(min-width: 640px)' });
    const xsm = useMediaQuery({ query: '(min-width: 500px)' });

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

    if (!isOpen || !quizData) return null;

    const isStudent = user?.role === "STUDENT";

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
        setSubmittedAnswers(prev => ({ ...prev, [questionIndex]: trimmedAnswer }));
    };

    const handleIdentificationKeyDown = (event: KeyboardEvent<HTMLInputElement>, questionIndex: number) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleIdentificationAnswerSubmit(questionIndex);
        }
    };

    const handlePrint = () => window.print();

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy link:", err);
            toast.error("Failed to copy link.");
        }
    };

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
            alert(`An error occurred while generating your ${format.toUpperCase()} file.`);
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

    return (
        <div className="fixed top-16 left-0 right-0 bottom-0 z-[40] flex flex-col bg-slate-50 font-sans overflow-hidden print:static print:h-auto print:block print:overflow-visible">
            <header className="print:hidden z-40 flex px-3 sm:px-4 py-3 sm:py-4 bg-darker border-b border-slate-200 shadow-sm shrink-0 relative min-h-[72px]">

                {/* Action Container: flex-wrap with uniform gap, pr-12 ensures buttons don't overlap the absolute close button on mobile */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1 pr-12 sm:pr-0">

                    {/* Answers Toggle */}
                    <label className="flex items-center cursor-pointer gap-2 group print:hidden shrink-0 mr-1 sm:mr-0">
                        <span className="text-sm font-medium text-white group-hover:text-slate-300 transition-colors">
                            Answers
                        </span>
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={includeAnswers} onChange={() => setIncludeAnswers(!includeAnswers)} />
                            <div className={`block w-11 h-6 rounded-full transition-colors ${includeAnswers ? 'bg-[#4ce0a3]' : 'bg-slate-600'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${includeAnswers ? 'translate-x-5' : ''}`}></div>
                        </div>
                    </label>

                    {/* Download */}
                    <div className="relative print:hidden shrink-0">
                        <button onClick={() => setShowDownloadMenu(!showDownloadMenu)} className="flex items-center justify-center gap-1.5 sm:gap-2 w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            <span className="hidden sm:inline">Download</span>
                        </button>

                        {showDownloadMenu && (
                            <div className="absolute left-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-100 overflow-hidden z-10">
                                <button onClick={() => handleDownload('pdf')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">PDF (.pdf)</button>
                                <button onClick={() => handleDownload('docx')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Word (.docx)</button>
                                <button onClick={() => handleDownload('txt')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Text (.txt)</button>
                            </div>
                        )}
                    </div>

                    {/* Print */}
                    <button onClick={handlePrint} className="flex items-center justify-center gap-1.5 sm:gap-2 w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors print:hidden shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        <span className="hidden sm:inline">Print</span>
                    </button>

                    {/* Desktop Divider */}
                    <div className="hidden sm:block w-px h-6 bg-slate-600 mx-1 shrink-0"></div>

                    {/* Edit - Only visible to teachers */}
                    {!isStudent && (
                        isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="px-3 py-2 h-10 sm:h-auto text-sm font-bold text-slate-300 hover:text-white transition-colors shrink-0">
                                    Cancel
                                </button>
                                <button onClick={handleSaveChanges} disabled={isSavingEdits} className="flex items-center justify-center gap-2 px-4 py-2 h-10 sm:h-auto text-sm font-bold text-white bg-[#4ce0a3] rounded-lg hover:bg-[#3bc48b] transition-colors disabled:opacity-70 shrink-0">
                                    {isSavingEdits ? "Saving..." : <><Save className="w-4 h-4" /> Save</>}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-1.5 sm:gap-2 w-10 h-10 sm:w-auto sm:h-auto px-3 py-2 text-sm font-bold text-slate-900 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors shrink-0">
                                <Edit className="w-5 h-5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Edit</span>
                            </button>
                        )
                    )}

                    {/* ROLE-BASED PRIMARY BUTTONS */}
                    {user && quizData.id && (
                        isStudent ? (
                            <>
                                {/* Flashcards */}
                                <button onClick={() => router.push(`/study/${quizData.id}`)} className="flex items-center justify-center gap-1.5 sm:gap-2 w-10 h-10 sm:w-auto sm:h-auto px-3 py-2 text-sm font-bold text-emerald-900 bg-emerald-300 rounded-lg hover:bg-emerald-400 transition-colors print:hidden shrink-0">
                                    <BookOpen className='w-5 h-5 sm:w-4 sm:h-4' />
                                    <span className="hidden sm:inline">Flashcards</span>
                                </button>
                                {/* Practice */}
                                <button
                                    onClick={handlePracticeLaunch}
                                    disabled={isStartingPractice}
                                    className="flex items-center justify-center gap-1.5 sm:gap-2 w-10 h-10 sm:w-auto sm:h-auto px-3 py-2 text-sm font-bold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors print:hidden shrink-0 disabled:opacity-70"
                                >
                                    {isStartingPractice ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <BrainCircuit className='w-5 h-5 sm:w-4 sm:h-4' />}
                                    <span className="hidden sm:inline">{isStartingPractice ? "Starting..." : "Practice"}</span>
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Assign */}
                                <button onClick={() => setIsAssigning(true)} className="flex items-center justify-center gap-1.5 sm:gap-2 w-10 h-10 sm:w-auto sm:h-auto px-3 py-2 text-sm font-bold text-slate-900 bg-amber-300 rounded-lg hover:bg-amber-400 transition-colors print:hidden shrink-0">
                                    <CalendarClock className='w-5 h-5 sm:w-4 sm:h-4' />
                                    <span className="hidden sm:inline">Assign</span>
                                </button>
                                {/* Live */}
                                <button
                                    onClick={() => setIsLaunchingLive(true)}
                                    className="flex items-center justify-center gap-1.5 sm:gap-2 w-10 h-10 sm:w-auto sm:h-auto px-3 py-2 text-sm font-bold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors print:hidden shrink-0"
                                >
                                    <Play className='w-5 h-5 sm:w-4 sm:h-4' fill="currentColor" />
                                    <span className="hidden sm:inline">Live</span>
                                </button>
                            </>
                        )
                    )}

                    {/* Delete (Shared by both roles) */}
                    {user && (
                        <button onClick={() => setIsDeleting(true)} className="flex items-center justify-center gap-1.5 sm:gap-2 w-10 h-10 sm:w-auto sm:h-auto px-3 py-2 text-sm font-bold text-white bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors print:hidden shrink-0">
                            <Trash className='w-5 h-5 sm:w-4 sm:h-4' />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    )}
                </div>

                {/* Close Button - absolute top right on mobile, normal flex item on desktop */}
                <button onClick={handleClose} className="absolute right-5 top-3 sm:static sm:ml-2 flex items-center justify-center w-10 h-10 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors print:hidden shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-6 sm:h-6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </header>

            {/* 2. MAIN CONTENT AREA (Scrollable) */}
            <main className="bg-slate-100 flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 print:p-0 print:overflow-visible print:h-auto print:block">
                <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
                    {/* ... (Your existing Question loops, unchanged) ... */}
                    <div className="flex flex-col min-w-0 items-center justify-center bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none mb-6 sm:mb-8">
                        {isEditing ? (
                            <div className="w-full max-w-2xl space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Quiz Title</label>
                                    <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="text-xl sm:text-2xl text-center font-bold text-slate-800 border-2 border-slate-200 focus:border-[#4ce0a3] p-3 rounded-lg w-full outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Description</label>
                                    <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="text-sm text-center text-slate-600 border-2 border-slate-200 focus:border-[#4ce0a3] p-3 rounded-lg w-full outline-none transition-colors resize-none" rows={3} />
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl sm:text-3xl text-center font-black text-slate-800 truncate mb-2 max-w-full">{editedTitle}</h2>
                                <p className="text-sm sm:text-base text-center text-slate-500 mb-3">{editedDescription}</p>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${quizData.difficulty === "easy" ? "bg-emerald-100 text-emerald-700" : quizData.difficulty === "normal" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                                    {quizData.difficulty.charAt(0).toUpperCase() + quizData.difficulty.slice(1)}
                                </span>
                            </>
                        )}
                    </div>

                    {editedQuestions.map((q, index) => {
                        const hasOptions = q.options && q.options.length > 0;
                        const isIdentification = !hasOptions;
                        const hasSelection = isIdentification ? typeof submittedAnswers[index] === 'string' && submittedAnswers[index].trim().length > 0 : typeof userAnswers[index] === 'string' && userAnswers[index].trim().length > 0;
                        const isCorrect = hasSelection && (isIdentification ? submittedAnswers[index].toLowerCase() === q.correctAnswer.toLowerCase() : userAnswers[index] === q.correctAnswer);
                        const showFeedback = includeAnswers || hasSelection || isEditing;

                        return (
                            <div key={index} className="bg-white p-4 sm:p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:mb-8 break-inside-avoid">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
                                    <div className="flex gap-3 sm:gap-4 w-full">
                                        <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs sm:text-sm border border-slate-200 mt-1 sm:mt-0">{index + 1}</span>
                                        <div className="w-full">
                                            {isEditing ? (
                                                <textarea className="w-full text-lg sm:text-xl font-bold text-slate-800 border-2 border-slate-200 rounded-lg p-3 focus:border-[#4ce0a3] focus:outline-none resize-none transition-colors" onChange={(e) => handleQuestionChange(index, "questionText", e.target.value)} value={q.questionText} rows={3} />
                                            ) : (
                                                <h3 className="text-lg sm:text-xl font-bold text-slate-800 pt-0.5 sm:pt-1">{q.questionText}</h3>
                                            )}
                                        </div>
                                    </div>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2 bg-slate-50 border-2 border-slate-200 rounded-lg px-2 py-1.5 shrink-0 self-start">
                                            <Timer className="w-4 h-4 text-slate-400" />
                                            <select value={q.timeLimitSeconds || ""} onChange={(e) => handleQuestionChange(index, 'timeLimitSeconds', e.target.value ? parseInt(e.target.value) : null)} className="bg-transparent text-sm font-bold text-slate-600 focus:outline-none cursor-pointer">
                                                <option value="">No limit</option>
                                                <option value="10">10 seconds</option>
                                                <option value="20">20 seconds</option>
                                                <option value="30">30 seconds</option>
                                                <option value="45">45 seconds</option>
                                                <option value="60">1 minute</option>
                                                <option value="120">2 minutes</option>
                                            </select>
                                        </div>
                                    ) : (
                                        q.timeLimitSeconds && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full shrink-0 self-start">
                                                <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                                                {q.timeLimitSeconds}s
                                            </div>
                                        )
                                    )}
                                </div>

                                <div className="ml-0 sm:ml-12">
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            {isIdentification ? (
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Correct Answer</label>
                                                    <textarea value={q.correctAnswer} onChange={(e) => handleQuestionChange(index, "correctAnswer", e.target.value)} className="w-full md:max-w-md p-3 border-2 border-slate-200 rounded-lg focus:border-[#4ce0a3] focus:outline-none font-medium text-slate-700 transition-colors resize-y" rows={2} />
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Options & Correct Answer</label>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {q.options.map((opt, optIdx) => (
                                                            <div key={optIdx} className={`flex items-start gap-2 sm:gap-3 p-2 border-2 rounded-lg transition-colors ${q.correctAnswer === opt ? 'border-[#4ce0a3] bg-[#4ce0a3]/5' : 'border-slate-200'}`}>
                                                                <input type="radio" name={`correct-answer-${index}`} checked={q.correctAnswer === opt} onChange={() => handleQuestionChange(index, "correctAnswer", opt)} className="w-4 h-4 text-[#4ce0a3] focus:ring-[#4ce0a3] cursor-pointer ml-1 sm:ml-2 shrink-0 mt-3" />
                                                                <textarea value={opt} onChange={(e) => handleOptionChange(index, optIdx, e.target.value)} className="flex-1 p-2 bg-transparent border-none focus:ring-0 focus:outline-none font-medium text-slate-700 text-sm sm:text-base min-w-0 resize-y" placeholder={`Option ${optIdx + 1}`} rows={2} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {isIdentification ? (
                                                <div className="w-full max-w-md">
                                                    <input type="text" placeholder="Type your answer here..." value={userAnswers[index] || ''} onChange={(e) => handleAnswerSelect(index, e.target.value)} onBlur={() => handleIdentificationAnswerSubmit(index)} onKeyDown={(e) => handleIdentificationKeyDown(e, index)} className={`w-full p-3 border-b-2 bg-slate-50 focus:bg-white outline-none transition-colors text-slate-700 font-medium print:border-b print:border-black print:bg-transparent ${hasSelection ? (isCorrect ? 'border-emerald-500' : 'border-rose-500') : 'border-slate-300 focus:border-[#4ce0a3]'}`} />
                                                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 print:hidden">
                                                        <button type="button" onClick={() => handleIdentificationAnswerSubmit(index)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 w-full sm:w-auto text-center">Check answer</button>
                                                        <span className="text-xs font-medium text-slate-400 text-center sm:text-left">Press Enter or click check when done.</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {q.options.map((option, optIdx) => {
                                                        const isSelected = userAnswers[index] === option;
                                                        const isCorrectAnswer = option === q.correctAnswer;
                                                        const optionClass = hasSelection ? isSelected && isCorrect ? 'border-[#4ce0a3] bg-[#4ce0a3]/10 text-slate-900' : isSelected && !isCorrect ? 'border-rose-500 bg-rose-50 text-slate-900' : isCorrectAnswer ? 'border-[#4ce0a3] bg-[#4ce0a3]/10 text-slate-900' : 'border-slate-200 text-slate-400 opacity-60' : isSelected ? 'border-[#4ce0a3] bg-[#4ce0a3]/10 text-slate-900' : 'border-slate-200 hover:border-slate-300 text-slate-600';
                                                        return (
                                                            <button key={optIdx} onClick={() => handleAnswerSelect(index, option)} disabled={hasSelection} className={`text-left p-3 sm:p-4 rounded-lg border-2 font-medium text-sm sm:text-base transition-all print:border-slate-300 duration-300 ${optionClass}`}>
                                                                {option}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {showFeedback && (
                                    <div className="ml-0 sm:ml-12 mt-6">
                                        {isEditing ? (
                                            <div>
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Explanation</label>
                                                <textarea value={q.explanation} onChange={(e) => handleQuestionChange(index, "explanation", e.target.value)} className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-[#4ce0a3] focus:outline-none text-slate-600 text-sm transition-colors resize-y" rows={3} />
                                            </div>
                                        ) : (
                                            <div className={`p-4 sm:p-5 rounded-lg border print:border-black print:bg-transparent ${hasSelection ? (isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200') : 'bg-amber-50 border-amber-200'}`}>
                                                <p className={`text-sm font-bold mb-2 ${hasSelection ? (isCorrect ? 'text-emerald-800 print:text-black' : 'text-rose-800 print:text-black') : 'text-amber-800 print:text-black'}`}>
                                                    {hasSelection ? (isCorrect ? 'Correct!' : 'Not quite.') : 'Correct Answer:'} <span className="font-bold underline decoration-2 underline-offset-2 break-words">{q.correctAnswer}</span>
                                                </p>
                                                {hasSelection && !isCorrect && (
                                                    <p className="text-sm mt-1 text-rose-700 print:text-slate-700 mb-3 break-words">
                                                        <span className="font-semibold">Your answer:</span> {userAnswers[index] || submittedAnswers[index]}
                                                    </p>
                                                )}
                                                <div className="h-px w-full bg-black/5 my-3 hidden print:block"></div>
                                                <p className={`text-sm leading-relaxed ${hasSelection ? (isCorrect ? 'text-emerald-700 print:text-slate-700' : 'text-rose-700 print:text-slate-700') : 'text-amber-700 print:text-slate-700'}`}>
                                                    <span className="font-bold uppercase text-xs tracking-wider opacity-80 block mb-1">Explanation</span>
                                                    {q.explanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* ========================================== */}
            {/* Modal Overlays (Delete, Assign, Live) */}
            {/* ========================================== */}

            {isDeleting && (
                <div onClick={() => setIsDeleting(false)} className='bg-black/50 z-50 fixed inset-0 flex h-dvh items-center justify-center animate-in fade-in duration-200 p-4'>
                    <div onClick={(e) => e.stopPropagation()} className='bg-white p-6 sm:p-8 flex flex-col items-center gap-4 rounded-xl max-w-sm w-full shadow-2xl'>
                        <div className="bg-rose-100 p-3 rounded-full mb-2">
                            <CircleX className='w-8 h-8 text-rose-600' />
                        </div>
                        <h3 className='text-xl sm:text-2xl font-bold text-slate-800'>Delete Quiz?</h3>
                        <p className='text-center text-slate-500 mb-4 text-sm sm:text-base'>Are you sure you want to permanently delete this quiz? This action cannot be undone.</p>
                        <div className='flex flex-col sm:flex-row gap-3 w-full'>
                            <button onClick={() => setIsDeleting(false)} className='w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-lg transition-colors'>Cancel</button>
                            <button onClick={handleDelete} className='w-full sm:flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-lg transition-colors'>Confirm Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {isAssigning && (
                <div onClick={() => !generatedPin && setIsAssigning(false)} className='bg-black/50 z-50 fixed inset-0 flex h-dvh items-center justify-center animate-in fade-in duration-200 p-4'>
                    <div onClick={(e) => e.stopPropagation()} className='z-[60] bg-white p-6 sm:p-8 flex flex-col items-center gap-4 rounded-xl shadow-2xl max-w-md w-full'>
                        {!generatedPin ? (
                            <>
                                <div className="bg-amber-100 p-3 rounded-full mb-2">
                                    <CalendarClock className="w-8 h-8 text-amber-600" />
                                </div>
                                <h2 className='text-xl sm:text-2xl font-bold text-slate-800'>Assign as Homework</h2>
                                <p className='text-slate-500 text-center text-sm mb-2'>
                                    Students can play at their own pace until the deadline.
                                </p>
                                <div className="w-full mb-4">
                                    <label className="block text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Due Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full p-3 sm:p-4 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-[#4ce0a3] transition-colors text-slate-700 font-medium"
                                    />
                                </div>
                                <div className='flex flex-col sm:flex-row gap-3 w-full mt-2'>
                                    <button onClick={() => setIsAssigning(false)} className='w-full sm:flex-1 bg-slate-100 text-slate-700 font-semibold py-3 rounded-lg hover:bg-slate-200 transition-colors'>Cancel</button>
                                    <button
                                        onClick={handleCreateAssignment}
                                        disabled={isCreatingSession}
                                        className='w-full sm:flex-1 bg-[#4ce0a3] text-slate-900 font-bold py-3 rounded-lg hover:bg-[#3bc48b] transition flex justify-center items-center'
                                    >
                                        {isCreatingSession ? "Creating..." : "Create Link"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className='text-xl sm:text-2xl font-bold text-slate-800 text-center mb-2'>Assignment Ready!</h2>
                                <p className='text-slate-500 text-center text-sm mb-4'>Share this PIN or link with your students.</p>
                                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 sm:p-8 w-full text-center mb-4">
                                    <p className="text-xs sm:text-sm font-bold text-slate-400 mb-2 tracking-widest uppercase">GAME PIN</p>
                                    <p className="text-5xl sm:text-6xl font-black text-slate-900 tracking-widest break-all">{generatedPin}</p>
                                </div>
                                <button
                                    onClick={handleCopyLink}
                                    className={`w-full flex items-center justify-center gap-2 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-colors ${isCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                >
                                    {isCopied ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : <Copy className="w-5 h-5 sm:w-6 sm:h-6" />}
                                    {isCopied ? "Copied!" : "Copy Join Link"}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAssigning(false);
                                        setGeneratedPin("");
                                        setDueDate("");
                                    }}
                                    className="mt-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Done
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {isLaunchingLive && (
                <div onClick={() => !isCreatingLive && setIsLaunchingLive(false)} className='bg-black/50 z-50 fixed inset-0 flex h-dvh items-center justify-center animate-in fade-in duration-200 p-4'>
                    <div onClick={(e) => e.stopPropagation()} className='z-[60] bg-white p-6 sm:p-8 flex flex-col items-center gap-4 rounded-xl shadow-2xl max-w-md w-full'>
                        <div className="bg-indigo-50 p-3 rounded-full mb-2">
                            <Users className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h2 className='text-xl sm:text-2xl font-bold text-slate-800'>Host Live Game</h2>

                        {/* Mode Toggle */}
                        <div className="flex bg-slate-100 p-1 rounded-xl w-full mb-2">
                            <button
                                onClick={() => setGameMode("SOLO")}
                                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${gameMode === "SOLO" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                Solo Free-for-all
                            </button>
                            <button
                                onClick={() => setGameMode("FACTIONS")}
                                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${gameMode === "FACTIONS" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                Team Factions
                            </button>
                        </div>

                        {gameMode === "FACTIONS" ? (
                            <div className="w-full animate-in slide-in-from-right-4 duration-300">
                                <p className='text-slate-500 text-center text-sm mb-4'>
                                    How many factions? The first {maxFactions} students to join will become Faction Leaders.
                                </p>
                                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-2xl border-2 border-slate-100 mb-4 w-full">
                                    {[2, 3, 4, 5, 6].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => setMaxFactions(num)}
                                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-black text-lg transition-all ${maxFactions === num
                                                ? "bg-slate-900 text-white shadow-md scale-110"
                                                : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="w-full text-center py-4 animate-in slide-in-from-left-4 duration-300">
                                <p className='text-slate-500 text-sm'>
                                    Every student for themselves! No teams will be created.
                                </p>
                            </div>
                        )}

                        <div className='flex flex-col sm:flex-row gap-3 w-full mt-2'>
                            <button
                                onClick={() => setIsLaunchingLive(false)}
                                className='w-full sm:flex-1 bg-slate-100 text-slate-700 font-semibold py-3 rounded-lg hover:bg-slate-200 transition-colors'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmLiveLaunch}
                                disabled={isCreatingLive}
                                className='w-full sm:flex-1 bg-indigo-500 text-white font-bold py-3 rounded-lg hover:bg-indigo-600 transition flex justify-center items-center'
                            >
                                {isCreatingLive ? <Loader2 className="w-5 h-5 animate-spin" /> : "Open Lobby"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}