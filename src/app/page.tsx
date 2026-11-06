import { createClient } from "@/utils/supabase/server";
import { getUser } from "./actions";
import HomeClient from "./_components/HomeClient";
import NavBar from "./_components/NavBar";
import { Suspense } from "react";
import GeneratorSkeleton from "./_components/GeneratorSkeleton";
import { Metadata } from 'next';
import Sprite from "./_components/arcade/Sprite";
import { HERO, ICON_HOMEWORK, ICON_LIVE, ICON_REPORTS, ICON_STUDY } from "./_components/arcade/sprites";
import { Orbi } from "./_components/arcade/Hud";
import { QuestionCard } from "./_components/arcade/QuizBits";

export const metadata: Metadata = {
  title: 'QuizWarp | Turn Any Text Into an Assessment in Seconds',
  description: 'Paste your source material, and QuizWarp instantly generates accurate, gamified multiple-choice questions using AI.',
  openGraph: {
    title: 'QuizWarp',
    description: 'Instant AI Quiz Generation',
  }
};

export type InputOption = 'File' | 'Text' | 'Image';
export type QuizType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'IDENTIFICATION' | 'ESSAY';
export type DifficultyType = "easy" | "normal" | "hard"

export interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizData {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  questions: Question[];
}

export interface QuizInfo {
  id: string;
  title: string;
  description: string;
}

export type AppUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  currentStreak: number;
  aiCredits: number;
  quizzes: QuizInfo[]
};

async function AsyncNavBar() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let appUser = null;
  if (authUser) {
    const response = await getUser(authUser.id);
    if (response.user) appUser = response.user;
  }

  return <NavBar user={appUser} />;
}

async function GeneratorWrapper() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let appUser = null;
  if (authUser) {
    const response = await getUser(authUser.id);
    if (response.user) appUser = response.user;
  }

  return <HomeClient initialUser={appUser} />;
}


const MODES = [
  { icon: ICON_LIVE, fill: "bg-px-pink", title: "Live game", text: "Share a join PIN and battle it out, solo or in teams." },
  { icon: ICON_HOMEWORK, fill: "bg-px-cyan", title: "Homework", text: "Assign a quiz with a due date and see who finished." },
  { icon: ICON_STUDY, fill: "bg-px-yellow", title: "Study", text: "Flip through flashcards built from the same questions." },
  { icon: ICON_REPORTS, fill: "bg-px-lime", title: "Reports", text: "Final scores, weak topics and AI insights for the class." },
];

export default function Home() {
  return (
    <div className="px-crt min-h-dvh bg-bg font-sans text-fg">

      <Suspense fallback={<NavBar isFallback={true} user={null} />}>
        <AsyncNavBar />
      </Suspense>

      <main className="mx-auto max-w-6xl px-4 pb-14 pt-24 sm:px-6 lg:pt-28">

        <section className="grid items-start gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_32rem]">

          {/* Attract screen text renders instantly, alongside the fallbacks */}
          <div className="lg:col-start-1 lg:row-start-1">
            <p className="px-label text-px-pink">AI quiz arcade for teachers and students</p>
            <h1 className="px-title mt-4 text-2xl sm:text-[2.5rem] sm:leading-[1.35]">Turn your notes into a quiz</h1>
            <p className="mt-5 max-w-[52ch] text-xl text-muted">
              Paste text, upload a file or snap a photo. Orbi writes the questions, then you play them live, assign them as homework or study them as flashcards. No account needed to try it.
            </p>
            <p className="px-label px-blink mt-6 text-px-yellow">Insert notes to start</p>
          </div>

          {/* Shows the GeneratorSkeleton instantly, swaps to the generator when ready */}
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <Suspense fallback={<GeneratorSkeleton />}>
              <GeneratorWrapper />
            </Suspense>
          </div>

          {/* A static example of a generated question in play, with the mascots reacting */}
          <div className="lg:col-start-1 lg:row-start-2">
            <div className="max-w-md">
              <QuestionCard
                question="Which layer of the atmosphere contains the ozone layer?"
                options={["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"]}
                correct={1}
              />
            </div>
            <div className="mt-5 flex items-end gap-4">
              <Sprite art={HERO} scale={4} className="px-hop" title="Volt, the player's hero" />
              <Orbi mood="happy" scale={3} say="Stratosphere is right. +100!" />
            </div>
          </div>

        </section>

        <section className="mt-16 border-t-4 border-dashed border-frame pt-10">
          <h2 className="px-title text-base sm:text-lg">Choose your mode</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MODES.map((m) => (
              <div key={m.title} className="px-panel p-4">
                <span className={`px-notch flex size-12 items-center justify-center border-4 border-px-void ${m.fill}`}>
                  <Sprite art={m.icon} scale={3} />
                </span>
                <h3 className="mt-4 font-pixel text-xs">{m.title}</h3>
                <p className="mt-2 text-base text-muted">{m.text}</p>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
