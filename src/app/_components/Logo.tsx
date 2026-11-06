import { Brain } from "lucide-react";
import HoloOrb from "./arcade/HoloOrb";

interface LogoProps {
    /** 'legacy' keeps the original white-on-dark look for screens not yet on the arcade system. */
    variant?: 'legacy' | 'arcade';
    /** Arcade only: show just the orb below the sm breakpoint, for a crowded bar. */
    compact?: boolean;
}

export default function Logo({ variant = 'legacy', compact = false }: LogoProps) {
    if (variant === 'arcade') {
        return (
            <div className="flex w-max items-center gap-2.5">
                <HoloOrb mood="happy" scale={1} spin={false} />
                <span className={`font-pixel text-xs text-px-yellow px-glow sm:text-sm ${compact ? 'hidden sm:inline' : ''}`}>QuizWarp</span>
            </div>
        )
    }

    return (
        <div className="flex w-max items-center">
            <div className="w-12 aspect-square flex items-center justify-center">
                <Brain className="w-10 h-10 text-white" />
            </div>
            <p className="font-orbitron text-white">
                QuizWarp
            </p>
        </div>
    )
}
