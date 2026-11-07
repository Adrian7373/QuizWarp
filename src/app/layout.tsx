import type { Metadata } from "next";
import "./globals.css";
import { Orbitron, Press_Start_2P, Pixelify_Sans } from "next/font/google"
import { Toaster } from 'react-hot-toast';
import SfxListener from "./_components/arcade/SfxListener";

// Legacy logo wordmark on screens not yet on the arcade system.
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

// Arcade display face: titles, buttons, HUD, scores.
const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
});

// Readable pixel body face: questions, paragraphs, inputs.
const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixelify",
});

export const metadata: Metadata = {
  title: "QuizWarp",
  description: "Generate gamified, AI-driven quizzes instantly. A full-stack assessment platform designed for interactive learning between teachers and students.",
  icons: {
    icon: "/icon.svg"
  }
};

// Picks the screen before first paint: the saved choice, else the arcade cabinet.
const themeScript = `try{var t=localStorage.getItem('theme');document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${orbitron.variable} ${pressStart.variable} ${pixelify.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans">
        {children}
        <SfxListener />
        <Toaster position="bottom-right" reverseOrder={false} toastOptions={{ className: "px-toast" }} />
      </body>
    </html>
  );
}
