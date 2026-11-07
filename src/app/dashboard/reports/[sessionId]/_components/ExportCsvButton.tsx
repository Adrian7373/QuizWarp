"use client"

import { Download } from "lucide-react"
import toast from "react-hot-toast"

interface ParticipantRow {
    nickname: string;
    totalScore: number;
    maxStreak: number;
    faction: string | null;
    correct: number;
    accuracy: number;
}

interface ExportCsvButtonProps {
    quizTitle: string;
    totalQuestions: number;
    participants: ParticipantRow[];
}

/**
 * Quote a CSV cell. Inner quotes are doubled, and a leading = + - @ is defused so a
 * nickname can't run as a formula when the file is opened in a spreadsheet.
 */
function cell(value: string | number) {
    let text = String(value);
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
}

export default function ExportCsvButton({ quizTitle, totalQuestions, participants }: ExportCsvButtonProps) {
    const handleExportCsv = () => {
        if (participants.length === 0) {
            toast.error("No scores to export yet.");
            return;
        }

        const headers = ["Rank", "Nickname", "Faction", "Score", "Correct", "Questions", "Accuracy %", "Best streak"];
        const rows = [...participants]
            .sort((a, b) => b.totalScore - a.totalScore)
            .map((p, index) => [index + 1, p.nickname, p.faction ?? "Solo", p.totalScore, p.correct, totalQuestions, p.accuracy, p.maxStreak]);

        const csv = [headers, ...rows].map(row => row.map(cell).join(",")).join("\n");

        // The BOM makes Excel read names with accents correctly.
        const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${quizTitle.replace(/[^\w-]+/g, "_")}_results.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Results downloaded");
    };

    return (
        <button type="button" onClick={handleExportCsv} disabled={participants.length === 0} className="px-btn px-btn-ghost">
            <Download className="size-4" aria-hidden />
            Export CSV
        </button>
    )
}
