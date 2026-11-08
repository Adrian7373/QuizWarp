"use client";

import Link from "next/link";

interface ConsentCheckboxesProps {
    terms: boolean;
    privacy: boolean;
    onTermsChange: (value: boolean) => void;
    onPrivacyChange: (value: boolean) => void;
    /** Dark modal styling (legacy white-on-dark). */
    className?: string;
}

const link = "text-mint underline hover:text-white";
const box = "mt-0.5 w-4 h-4 shrink-0 accent-mint cursor-pointer";

/**
 * The two consent checkboxes shown in the sign-in and sign-up forms.
 * Links open in a new tab so a half-filled form is not lost.
 */
export function ConsentCheckboxes({ terms, privacy, onTermsChange, onPrivacyChange, className = "" }: ConsentCheckboxesProps) {
    return (
        <div className={`flex flex-col gap-2 text-sm text-white ${className}`}>
            <label className="flex items-start gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => onTermsChange(e.target.checked)}
                    className={box}
                    required
                />
                <span>
                    I have read and agree to the{" "}
                    <Link href="/terms" target="_blank" rel="noopener noreferrer" className={link}>Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="/acceptable-use" target="_blank" rel="noopener noreferrer" className={link}>Acceptable Use Policy</Link>.
                </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={privacy}
                    onChange={(e) => onPrivacyChange(e.target.checked)}
                    className={box}
                    required
                />
                <span>
                    I have read the{" "}
                    <Link href="/privacy" target="_blank" rel="noopener noreferrer" className={link}>Privacy Policy</Link>
                    {" "}and consent to the processing of my personal data as described, including AI processing of my content
                    (<Link href="/cookies" target="_blank" rel="noopener noreferrer" className={link}>cookies &amp; storage</Link>).
                </span>
            </label>
        </div>
    );
}

/** Posts the consent with the form so the server can verify and record it. */
export function ConsentHiddenInputs({ terms, privacy }: { terms: boolean; privacy: boolean }) {
    return (
        <>
            <input type="hidden" name="acceptedTerms" value={terms ? "on" : ""} />
            <input type="hidden" name="acceptedPrivacy" value={privacy ? "on" : ""} />
        </>
    );
}
