"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import FileDropzone from "@/app/_components/FileDropZone";
import ImageUploadZone from "@/app/_components/ImageUploadZone";
import Dialog from "@/app/_components/arcade/Dialog";
import { PixelBar } from "@/app/_components/arcade/Hud";
import { handleAuthenticatedGeneration } from "@/app/actions/generate";
import type { InputOption, QuizType, DifficultyType } from "@/app/page";

interface GenerateQuizModalProps {
    onClose: () => void;
    userId: string;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_MB = 5;

// Each question type owns a cabinet color (see /designsystem).
const TYPE_OPTIONS: [QuizType, string, string][] = [
    ["MULTIPLE_CHOICE", "Multiple choice", "px-btn-cyan"],
    ["TRUE_FALSE", "True or false", "px-btn-pink"],
    ["IDENTIFICATION", "Identification", "px-btn-yellow"],
    ["ESSAY", "Essay", "px-btn-lime"],
];

export default function GenerateQuizModal({ onClose, userId }: GenerateQuizModalProps) {
    const router = useRouter();

    // Data State
    const options: InputOption[] = ['Text', 'File', 'Image'];
    const [selectedOption, setSelectedOption] = useState<InputOption>('Text');
    const [selectedType, setSelectedType] = useState<QuizType>("MULTIPLE_CHOICE");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [textInput, setTextInput] = useState("");
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [questionCount, setQuestionCount] = useState("5");
    const [difficulty, setDifficulty] = useState<DifficultyType>("normal");
    const [language, setLanguage] = useState("English");

    // Generation status state
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // Progress simulator
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isGenerating) {
            setProgress(0);
            setStatusText("Analyzing source material...");

            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 95) return prev;
                    if (prev === 30) setStatusText("Structuring questions...");
                    if (prev === 60) setStatusText("Validating correct answers...");
                    if (prev === 85) setStatusText("Finalizing formatting...");
                    return prev + Math.floor(Math.random() * 5) + 1;
                });
            }, 500);
        } else {
            setProgress(0);
            setStatusText("");
        }

        return () => clearInterval(interval);
    }, [isGenerating]);

    const handleGenerate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Validation
        if (selectedOption === "Text" && !textInput.trim()) return toast.error("Please enter some text.");
        if (selectedOption === "File" && !uploadedFile) return toast.error("Please upload a file.");
        if (selectedOption === "Image" && !uploadedImage) return toast.error("Please upload an image.");

        if (selectedOption === "File" && uploadedFile) {
            if (uploadedFile.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
                return toast.error(`File exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
            }
        }

        if (selectedOption === "Image" && uploadedImage) {
            if (uploadedImage.size / (1024 * 1024) > MAX_IMAGE_SIZE_MB) {
                return toast.error(`Image exceeds the ${MAX_IMAGE_SIZE_MB}MB limit.`);
            }
        }

        try {
            setIsGenerating(true);
            const formData = new FormData();

            formData.append("quizType", selectedType);
            formData.append("questionCount", questionCount);
            formData.append("inputType", selectedOption);
            formData.append("difficulty", difficulty);
            formData.append("language", language);

            if (selectedOption === "Text") formData.append("text", textInput);
            if (selectedOption === "File") formData.append("file", uploadedFile!);
            if (selectedOption === "Image") formData.append("image", uploadedImage!);

            const response = await handleAuthenticatedGeneration(formData, userId);

            if (response.error) {
                if (response.reason === "credits") {
                    toast.error("You are out of AI credits!");
                } else {
                    toast.error("Failed to generate quiz. Server error.");
                }
                setIsGenerating(false);
            } else {
                const generatedData = await response.quizData;
                setProgress(100);
                setStatusText("Quiz Ready!");

                setTimeout(() => {
                    toast.success("Quiz generated successfully!");
                    setIsGenerating(false);
                    onClose();
                    router.push(`/quiz/${generatedData.id}`);
                }, 400);
            }

        } catch (error) {
            console.error("Error generating quiz:", error);
            toast.error("An unexpected error occurred.");
            setIsGenerating(false);
        }
    };

    // Upload Handlers
    const handleUploadFile = (file: File) => {
        if (!file) return;
        if (file.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
            toast.error(`File is too large! Please keep it under ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }
        setUploadedFile(file);
    };

    const handleUploadImage = (file: File) => {
        if (!file) return;
        if (file.size / (1024 * 1024) > MAX_IMAGE_SIZE_MB) {
            toast.error(`Image is too large! Please keep it under ${MAX_IMAGE_SIZE_MB}MB.`);
            return;
        }
        setUploadedImage(file);
    };

    const handleRemoveFile = () => setUploadedFile(null);
    const handleRemoveImage = () => setUploadedImage(null);

    return (
        <Dialog
            title="New quiz"
            size="lg"
            onClose={onClose}
            locked={isGenerating}
            actions={
                <div className="flex w-full flex-col gap-3">
                    {isGenerating && (
                        <div>
                            <div className="mb-1.5 flex justify-between gap-3 text-base">
                                <span className="text-muted">{statusText}</span>
                                <span className="font-pixel text-[10px] text-px-cyan px-glow">{progress}%</span>
                            </div>
                            <PixelBar value={progress} color="cyan" label="Quiz generation progress" />
                        </div>
                    )}
                    <button onClick={handleGenerate} disabled={isGenerating} data-sfx="start" className="px-btn px-btn-lg px-btn-yellow w-full">
                        {isGenerating ? <><Loader2 className="size-5 animate-spin" aria-hidden /> Generating…</> : "▶ Generate quiz"}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                <div role="tablist" aria-label="Source type" className="grid grid-cols-3 gap-2">
                    {options.map((option) => {
                        const isActive = selectedOption === option;
                        return (
                            <button
                                key={option}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                data-sfx="select"
                                onClick={() => setSelectedOption(option)}
                                disabled={isGenerating}
                                className={`px-btn px-btn-sm w-full ${isActive ? 'px-btn-cyan' : 'px-btn-ghost'}`}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>

                <div>
                    <div hidden={selectedOption !== "File"}>
                        <FileDropzone variant="arcade" handleRemoveFile={handleRemoveFile} file={uploadedFile} handleUploadFile={handleUploadFile} />
                        <p className="mt-1.5 text-sm text-muted">Up to {MAX_FILE_SIZE_MB} MB.</p>
                    </div>
                    <div hidden={selectedOption !== "Text"}>
                        <textarea
                            aria-label="Source text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Paste your notes, an article or a reading assignment"
                            className="px-input block h-48 w-full resize-none"
                        />
                    </div>
                    <div hidden={selectedOption !== "Image"}>
                        <ImageUploadZone variant="arcade" image={uploadedImage} handleUploadImage={handleUploadImage} handleRemoveImage={handleRemoveImage} />
                        <p className="mt-1.5 text-sm text-muted">Up to {MAX_IMAGE_SIZE_MB} MB.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <label className="flex flex-col gap-1.5 text-base font-semibold">Questions
                        <select value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} className="px-input w-full py-1.5 font-normal">
                            {[5, 10, 15, 20, 25, 30, 35, 40].map(num => <option key={num} value={num}>{num}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-base font-semibold">Difficulty
                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as DifficultyType)} className="px-input w-full py-1.5 font-normal">
                            <option value="easy">Easy</option>
                            <option value="normal">Normal</option>
                            <option value="hard">Hard</option>
                        </select>
                    </label>
                    <label className="col-span-2 flex flex-col gap-1.5 text-base font-semibold sm:col-span-1">Language
                        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="px-input w-full py-1.5 font-normal">
                            <option value="English">English</option>
                            <option value="Filipino">Filipino</option>
                            <option value="Taglish (Tagalog-English)">Taglish</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="Japanese">Japanese</option>
                        </select>
                    </label>
                </div>

                <div>
                    <p className="text-base font-semibold">Question type</p>
                    <div role="radiogroup" aria-label="Question type" className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {TYPE_OPTIONS.map(([type, label, color]) => (
                            <button
                                key={type}
                                type="button"
                                role="radio"
                                aria-checked={selectedType === type}
                                data-sfx="select"
                                onClick={() => setSelectedType(type)}
                                disabled={isGenerating}
                                className={`px-btn px-btn-sm w-full whitespace-normal ${selectedType === type ? color : 'px-btn-ghost'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
