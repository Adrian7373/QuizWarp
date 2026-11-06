"use client"

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

interface CopyLinkButtonProps {
    joinCode: string;
}

export default function CopyLinkButton({ joinCode }: CopyLinkButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        // Construct the full join URL based on the current domain
        const link = `${window.location.origin}/join?pin=${joinCode}`;

        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            toast.success("Join link copied!");

            // Reset the button state after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy link.");
        }
    };

    return (
        <button onClick={handleCopy} data-sfx="coin" className="inline-flex items-center gap-1.5 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">
            {copied ? <Check className="size-3.5 text-px-lime" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            {copied ? "Copied" : "Copy link"}
        </button>
    );
}
