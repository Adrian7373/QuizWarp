"use client"
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PixelBar } from "./arcade/Hud";
import handleAnonymousGeneration from "../actions/generate";
import fpPromise from '@fingerprintjs/fingerprintjs'
import { handleAuthenticatedGeneration } from "../actions/generate";
import type { AppUser, InputOption, QuizData, QuizType, DifficultyType } from "../page";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
const SignupModal = dynamic(() => import('./SignUpModal'), { ssr: false });
const FileDropzone = dynamic(() => import('./FileDropZone'), { ssr: false });
const ImageUploadZone = dynamic(() => import('./ImageUploadZone'), { ssr: false });
const QuizModal = dynamic(() => import('./QuizModal'), { ssr: false });


// Each question type owns a cabinet color (see /designsystem).
const TYPE_OPTIONS: [QuizType, string, string][] = [
  ["MULTIPLE_CHOICE", "Multiple choice", "px-btn-cyan"],
  ["TRUE_FALSE", "True or false", "px-btn-pink"],
  ["IDENTIFICATION", "Identification", "px-btn-yellow"],
  ["ESSAY", "Essay", "px-btn-lime"],
];

interface HomeClientProps {
  initialUser: AppUser | null;
}

export default function HomeClient({ initialUser }: HomeClientProps) {

  const MAX_FILE_SIZE_MB = 10;
  const MAX_IMAGE_SIZE_MB = 5;


  const options: InputOption[] = ['File', 'Text', 'Image'];
  const [user, setUser] = useState<AppUser | null>(initialUser);
  const router = useRouter(); // Initialize router

  //Data state
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [selectedOption, setSelectedOption] = useState<InputOption>('Text');
  const [selectedType, setSelectedType] = useState<QuizType>("MULTIPLE_CHOICE")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState("5");
  const [isNoCredits, setIsNoCredits] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyType>("normal");
  const [language, setLanguage] = useState("English");

  //Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [isLimit, setIsLimit] = useState(false);

  //Generation status state
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false)


  //Progress simulator
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isGenerating) {
      setProgress(0);
      setStatusText("Analyzing source material...");

      interval = setInterval(() => {
        setProgress((prev) => {
          // Cap the fake progress at 95% until the actual response arrives
          if (prev >= 95) return prev;

          // Update the text to make it feel like real steps are happening
          if (prev === 30) setStatusText("Structuring questions...");
          if (prev === 60) setStatusText("Validating correct answers...");
          if (prev === 85) setStatusText("Finalizing formatting...");

          // Increment by a random small amount for a natural, staggered feel
          return prev + Math.floor(Math.random() * 5) + 1;
        });
      }, 500); // Updates every half second
    } else {
      // Reset when generation finishes or fails
      setProgress(0);
      setStatusText("");
    }

    return () => clearInterval(interval);
  }, [isGenerating]);

  const generateQuiz = async () => {
    try {
      setIsGenerating(true);
      const formData = new FormData()

      formData.append("quizType", selectedType)
      formData.append("questionCount", questionCount)
      formData.append("inputType", selectedOption)
      formData.append("difficulty", difficulty)
      formData.append("language", language);

      if (selectedOption === "Text" && textInput) {
        formData.append("text", textInput);
      } else if (selectedOption === "File" && uploadedFile) {
        formData.append("file", uploadedFile);
      } else if (selectedOption === "Image" && uploadedImage) {
        formData.append("image", uploadedImage);
      } else {
        alert("Please provide the required input material.");
        setIsGenerating(false);
        return;
      }

      const fp = await fpPromise.load()
      const result = await fp.get()
      const visitorId = result.visitorId

      if (user) {

        const response = await handleAuthenticatedGeneration(formData, user.id)
        console.log(response)

        if (response.error) {
          if (response.reason === "credits") {
            setIsNoCredits(true);
            setIsGenerating(false);
          } else {
            alert("Failed to generate quiz. Server error")
            setIsGenerating(false);
          }

        } else {

          const generatedData = await response.quizData;
          setProgress(100);
          setTimeout(() => {
            setQuizData(generatedData);
            setIsOpen(true);
            setIsGenerating(false);
            router.push(`/quiz/${generatedData.id}`);
          }, 400);
        }

      } else {

        const response = await handleAnonymousGeneration(formData, visitorId);

        if (response.error) {
          if (response.reason === "limit") {
            setIsLimit(true);
            setIsGenerating(false);
          } else {
            alert("Failed to generate quiz. Server error")
            setIsGenerating(false);
          }

        } else {

          const generatedData = await response.quizData;

          // Give it a unique fake ID so we can map it in the sidebar
          const quizWithId = { ...generatedData, id: crypto.randomUUID() };

          const existingStr = localStorage.getItem('anon_quizzes');
          const existing = existingStr ? JSON.parse(existingStr) : [];

          // Save the new quiz at the top of the array
          localStorage.setItem('anon_quizzes', JSON.stringify([quizWithId, ...existing]));

          setProgress(100);
          setTimeout(() => {
            setQuizData(quizWithId);
            setIsOpen(true);
            setIsGenerating(false);
          }, 400);
        }
      }



    } catch (error) {
      console.error("Error generating quiz:", error);
      alert("Failed to generate quiz. Please try again.");
      setIsGenerating(false);
    }
  }

  const handleCloseModal = () => {
    setIsOpen(false);
  }

  const handleRemoveImage = () => {
    setUploadedImage(null)
  }

  const handleUploadImage = (file: File) => {
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
      toast.error(`Image is too large! Please keep it under ${MAX_IMAGE_SIZE_MB}MB.`);
      return; // Reject the image
    }

    setUploadedImage(file); // Accept the image
  };

  const handleRemoveFile = () => {
    setUploadedFile(null)
  }

  const handleUploadFile = (file: File) => {
    if (!file) return;

    // Convert bytes to MB
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      toast.error(`File is too large! Please keep it under ${MAX_FILE_SIZE_MB}MB.`);
      return; // Reject the file
    }

    setUploadedFile(file); // Accept the file
  };

  const handleSelectQuizType = (type: QuizType) => {
    if (!type) return;
    setSelectedType(type);
  }

  const hideModal = () => {
    setIsLimit(false);
  }

  // Listen for local quiz clicks
  useEffect(() => {
    const handleOpenQuiz = (e: Event) => {
      const customEvent = e as CustomEvent<QuizData>;
      setQuizData(customEvent.detail);
      setIsOpen(true);
    };

    window.addEventListener('openLocalQuiz', handleOpenQuiz);

    // Cleanup the listener when the component unmounts
    return () => window.removeEventListener('openLocalQuiz', handleOpenQuiz);
  }, []);

  return (
    <>
      {isLimit && (
        <SignupModal onClose={hideModal} />
      )}

      {/* VIEW SWAPPER: If quiz is open, show quiz. Otherwise, show generator. */}
      {quizData && isOpen ? (
        <QuizModal key={quizData.id} quizData={quizData} onClose={handleCloseModal} isOpen={isOpen} user={user} />
      ) : (
        <div className="px-panel w-full p-4 sm:p-5">
          <p className="px-label text-px-pink">Player 1 · New quiz</p>

          <div role="tablist" aria-label="Source type" className="mt-3 grid grid-cols-3 gap-2">
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
                  className={`px-btn px-btn-sm w-full ${isActive ? 'px-btn-cyan' : 'px-btn-ghost'}`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <div hidden={selectedOption !== "File"}>
              <FileDropzone variant="arcade" handleRemoveFile={handleRemoveFile} file={uploadedFile} handleUploadFile={handleUploadFile} />
            </div>
            <div hidden={selectedOption !== "Text"}>
              <textarea
                aria-label="Source text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your notes, an article or a reading assignment"
                className="px-input block h-44 w-full resize-none"
              ></textarea>
            </div>
            <div hidden={selectedOption !== "Image"}>
              <ImageUploadZone variant="arcade" image={uploadedImage} handleUploadImage={handleUploadImage} handleRemoveImage={handleRemoveImage} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-base font-semibold">Questions
              <select value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} className="px-input w-full py-1.5 font-normal">
                {[5, 10, 15, 20, 25, 30, 35, 40].map((n) => <option key={n} value={String(n)}>{n}</option>)}
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

          <p className="mt-4 text-base font-semibold">Question type</p>
          <div role="radiogroup" aria-label="Question type" className="mt-1.5 grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map(([type, label, color]) => {
              const isActive = selectedType === type;

              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  data-sfx="select"
                  onClick={() => handleSelectQuizType(type)}
                  className={`px-btn px-btn-sm w-full ${isActive ? color : 'px-btn-ghost'}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Loading Progress UI */}
          {isGenerating && (
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between gap-3 text-base">
                <span className="text-muted">{statusText}</span>
                <span className="font-pixel text-[10px] text-px-cyan px-glow">{progress}%</span>
              </div>
              <PixelBar value={progress} color="cyan" label="Quiz generation progress" />
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={generateQuiz}
            disabled={isGenerating || (user ? user.aiCredits <= 0 : false)}
            data-sfx="start"
            className="px-btn px-btn-lg px-btn-yellow mt-4 w-full"
          >
            {isGenerating && <Loader2 className="size-5 animate-spin" aria-hidden />}
            {isGenerating
              ? 'Generating…'
              : user && user.aiCredits <= 0
                ? 'Out of credits. Try again later'
                : '▶ Generate quiz'}
          </button>

        </div>
      )}
      {/* Hero Section */}
    </>
  )
}