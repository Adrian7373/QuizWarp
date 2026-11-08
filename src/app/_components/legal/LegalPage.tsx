import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "../Logo";
import ThemeToggle from "../arcade/ThemeToggle";
import LegalFooter from "./LegalFooter";
import { LEGAL, LEGAL_LINKS } from "@/lib/legal";

export interface LegalSection {
    id: string;
    title: string;
}

interface LegalPageProps {
    title: string;
    summary: string;
    sections: LegalSection[];
    children: ReactNode;
}

export default function LegalPage({ title, summary, sections, children }: LegalPageProps) {
    return (
        <div className="px-crt min-h-dvh bg-bg font-sans text-fg">
            <header className="border-b-4 border-frame bg-surface">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
                    <Link href="/" aria-label="QuizWarp home"><Logo variant="arcade" /></Link>
                    <ThemeToggle />
                </div>
            </header>

            <main className="mx-auto max-w-4xl px-4 pt-10 sm:px-6">
                <p className="px-label text-px-pink">Legal</p>
                <h1 className="px-title mt-4 text-xl sm:text-3xl sm:leading-[1.35]">{title}</h1>
                <p className="mt-4 max-w-[60ch] text-xl text-muted">{summary}</p>
                <p className="mt-3 text-base text-muted">
                    Effective {LEGAL.effectiveDate} &middot; Version {LEGAL.version}
                </p>

                <nav aria-label="Other legal documents" className="mt-5 flex flex-wrap gap-2">
                    {LEGAL_LINKS.map((l) => (
                        <Link key={l.href} href={l.href} className="px-panel px-3 py-1 text-base hover:bg-raised">
                            {l.label}
                        </Link>
                    ))}
                </nav>

                <nav aria-label="On this page" className="px-panel mt-8 p-4">
                    <h2 className="font-pixel text-xs">On this page</h2>
                    <ol className="mt-3 columns-1 gap-8 text-base sm:columns-2">
                        {sections.map((s, i) => (
                            <li key={s.id} className="mb-1 break-inside-avoid">
                                <a href={`#${s.id}`} className="text-link underline hover:text-fg">
                                    {i + 1}. {s.title}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <article className="mt-10 space-y-10">{children}</article>

                <LegalFooter />
            </main>
        </div>
    );
}

export function Section({ id, title, index, children }: { id: string; title: string; index: number; children: ReactNode }) {
    return (
        <section id={id} className="scroll-mt-6">
            <h2 className="font-pixel text-sm leading-relaxed sm:text-base">
                {index}. {title}
            </h2>
            <div className="mt-4 space-y-4 text-lg leading-relaxed">{children}</div>
        </section>
    );
}

export function UL({ children }: { children: ReactNode }) {
    return <ul className="list-disc space-y-2 pl-6 marker:text-px-pink">{children}</ul>;
}

export function A({ href, children }: { href: string; children: ReactNode }) {
    const external = /^(https?:|mailto:)/.test(href);
    if (external) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-link underline hover:text-px-pink">
                {children}
            </a>
        );
    }
    return (
        <Link href={href} className="text-link underline hover:text-px-pink">
            {children}
        </Link>
    );
}
