"use client"

import { useState } from "react";
import GenerateQuizModal from "./GenerateQuizModal";

interface GenerateNewButtonProps {
    userId: string;
}

export default function GenerateNewButton({ userId }: GenerateNewButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button onClick={() => setIsModalOpen(true)} data-sfx="start" className="px-btn px-btn-yellow">
                ▶ Generate quiz
            </button>

            {isModalOpen && (
                <GenerateQuizModal
                    userId={userId}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}
