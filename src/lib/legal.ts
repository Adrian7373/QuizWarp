// Single source of truth for the legal pages and the consent record.
//
// Bump `version` whenever the Terms or Privacy Policy change in a way that
// needs fresh consent. The version is stored with each user's acceptance.

export const LEGAL = {
    appName: "QuizWarp",
    /** Stored with each acceptance record. Format: YYYY-MM-DD of the last material change. */
    version: "2026-11-08",
    effectiveDate: "November 8, 2026",
    /**
     * Who operates the service and who people write to about privacy / legal matters.
     * Set NEXT_PUBLIC_LEGAL_CONTACT_EMAIL and NEXT_PUBLIC_LEGAL_OPERATOR in the environment
     * (Vercel + .env). Until then the pages show the fallback text below.
     */
    contactEmail: process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL || "[contact email: set NEXT_PUBLIC_LEGAL_CONTACT_EMAIL]",
    operator: process.env.NEXT_PUBLIC_LEGAL_OPERATOR || "the QuizWarp operator",
    country: "the Philippines",
} as const;

export const CONSENT_COOKIE = "qw_consent";

export const LEGAL_LINKS = [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/cookies", label: "Cookies & Storage" },
    { href: "/acceptable-use", label: "Acceptable Use" },
] as const;
