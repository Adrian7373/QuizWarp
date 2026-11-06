"use client"

import { useEffect, useRef } from "react";
import { processLoginRewards } from "../actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti"
import { playSfx } from "@/app/_components/arcade/sfx"

export default function RewardTracker({ userId }: { userId: string }) {
    const hasRun = useRef(false);
    const router = useRouter();

    const triggerConfetti = () => {
        const duration = 2000;
        const end = Date.now() + duration;

        // Arcade palette: yellow, pink, cyan, lime (see /designsystem). Square pixel confetti.
        const colors = ['#ffe23d', '#ff3fd1', '#2ee6ff', '#7dff4a'];

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors,
                shapes: ['square']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors,
                shapes: ['square']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const fetchRewards = async () => {
            try {
                const result = await processLoginRewards(userId);

                if (result?.success && result.creditsAdded > 0) {
                    const { monthly, daily, streak } = result.breakdown;

                    let toastMessage = "";

                    if (monthly > 0) {
                        toastMessage += `Monthly Refill: +${monthly}\n`;
                    }
                    if (streak > 0) {
                        toastMessage += `🔥 Weekly Bonus: +${streak}\n`;
                    }
                    if (daily > 0) {
                        toastMessage += `Daily Login: +${daily}\n`;
                    }

                    // Show the toast with a dynamic icon based on the best reward
                    if (streak <= 0) playSfx("coin");
                    toast.success(toastMessage.trim(), {
                        duration: 3000,
                    });

                    if (streak > 0) {
                        playSfx("levelup");
                        triggerConfetti();
                    }

                    router.refresh();
                }
            } catch (error) {
                console.error("Failed to process rewards", error);
            }
        };

        fetchRewards();
    }, [userId, router]);

    return null;
}