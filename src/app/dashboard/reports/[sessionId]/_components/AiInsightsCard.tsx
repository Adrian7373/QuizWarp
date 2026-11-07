"use client"

import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { generateClassInsight } from "@/app/actions/generate";
import HoloOrb from "@/app/_components/arcade/HoloOrb";
import { playSfx } from "@/app/_components/arcade/sfx";

interface AiInsightsCardProps {
    sessionId: string;
    initialInsight: string | null;
    /** An assignment still taking answers: insights are generated once, so say when to run them. */
    inProgress?: boolean;
}

export default function AiInsightsCard({ sessionId, initialInsight, inProgress = false }: AiInsightsCardProps) {
    const [insight, setInsight] = useState<string | null>(initialInsight);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        const response = await generateClassInsight(sessionId);

        if (response.error) {
            toast.error(response.error);
        } else if (response.insight) {
            setInsight(response.insight);
            playSfx("coin");
        }
        setIsGenerating(false);
    };

    return (
        <section aria-labelledby="insights-title" className="px-panel flex flex-col gap-5 p-5 sm:p-6">
            <div className="flex items-center gap-4">
                <HoloOrb mood={insight ? "happy" : "idle"} scale={2} className={isGenerating ? "px-bob" : ""} title="Orbi" />
                <div className="flex flex-col gap-2">
                    <h2 id="insights-title" className="px-title text-base">Class insights</h2>
                    <p className="text-base text-muted">Orbi reads the most-missed questions and suggests what to reteach.</p>
                </div>
            </div>

            {insight ? (
                <div className="flex max-w-prose flex-col gap-3 border-t-4 border-dashed border-frame pt-5">
                    {insight.split("\n\n").map((paragraph, index) => (
                        <p key={index} className="text-lg leading-relaxed">{paragraph}</p>
                    ))}
                </div>
            ) : isGenerating ? (
                <div role="status" className="flex flex-col gap-2 border-t-4 border-dashed border-frame pt-5">
                    <p className="px-label px-blink text-px-cyan">Analyzing answers</p>
                    <p className="text-lg text-muted">This can take up to a minute the first time while the AI service wakes up.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4 border-t-4 border-dashed border-frame pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-prose text-lg text-muted">
                        {inProgress
                            ? "Insights are generated once and saved. Run them after most of the class has finished."
                            : "Get a short summary of where the class struggled and a warm-up idea for next lesson."}
                    </p>
                    <button type="button" onClick={handleGenerate} disabled={isGenerating} className="px-btn px-btn-yellow shrink-0">
                        {isGenerating && <Loader2 className="size-4 animate-spin" aria-hidden />}
                        Generate insights
                    </button>
                </div>
            )}
        </section>
    );
}
