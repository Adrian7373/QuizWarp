import Link from "next/link";
import { LEGAL, LEGAL_LINKS } from "@/lib/legal";

export default function LegalFooter() {
    return (
        <footer className="mt-16 border-t-4 border-dashed border-frame pt-6 pb-10">
            <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2 text-base">
                {LEGAL_LINKS.map((l) => (
                    <Link key={l.href} href={l.href} className="text-muted underline hover:text-fg">
                        {l.label}
                    </Link>
                ))}
            </nav>
            <p className="mt-4 text-base text-muted">
                &copy; {new Date().getFullYear()} {LEGAL.appName}. Made in the Philippines.
            </p>
        </footer>
    );
}
