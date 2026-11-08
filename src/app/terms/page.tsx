import type { Metadata } from "next";
import LegalPage, { A, Section, UL, type LegalSection } from "../_components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
    title: "Terms of Service | QuizWarp",
    description: "The rules for using QuizWarp, the AI quiz generation and gamified assessment platform.",
};

const SECTIONS: LegalSection[] = [
    { id: "agreement", title: "Agreement and eligibility" },
    { id: "service", title: "What QuizWarp is" },
    { id: "accounts", title: "Accounts and security" },
    { id: "credits", title: "AI credits" },
    { id: "your-content", title: "Your content" },
    { id: "ai-content", title: "AI-generated content" },
    { id: "teachers", title: "Teachers, schools and students" },
    { id: "acceptable-use", title: "Acceptable use" },
    { id: "ip", title: "Our intellectual property" },
    { id: "third-party", title: "Third-party services" },
    { id: "changes-termination", title: "Changes, suspension and termination" },
    { id: "disclaimers", title: "Disclaimers" },
    { id: "liability", title: "Limitation of liability" },
    { id: "indemnity", title: "Indemnity" },
    { id: "law", title: "Governing law and disputes" },
    { id: "general", title: "General" },
    { id: "contact", title: "Contact" },
];

export default function TermsPage() {
    let n = 0;
    const next = () => ++n;
    return (
        <LegalPage
            title="Terms of Service"
            summary="These terms are the agreement between you and QuizWarp. Please read them before you create an account or use the service."
            sections={SECTIONS}
        >
            <Section id="agreement" title="Agreement and eligibility" index={next()}>
                <p>
                    These Terms of Service (&quot;Terms&quot;) govern your use of {LEGAL.appName}, including the website, the
                    quiz generator, live and homework games, study mode and reports (the &quot;Service&quot;), operated by{" "}
                    {LEGAL.operator} (&quot;we&quot;, &quot;us&quot;). By creating an account, signing in, or otherwise using the Service you
                    agree to these Terms and to our <A href="/privacy">Privacy Policy</A>, <A href="/cookies">Cookies &amp; Storage
                    notice</A> and <A href="/acceptable-use">Acceptable Use Policy</A>, which form part of this agreement. If you
                    do not agree, do not use the Service.
                </p>
                <p>
                    Under the Philippine Electronic Commerce Act (Republic Act No. 8792), your electronic acceptance of these
                    Terms, such as ticking a checkbox or clicking a sign-in button, is a valid and binding agreement.
                </p>
                <p>Who may use the Service:</p>
                <UL>
                    <li>
                        <strong>Adults (18+)</strong> may create and manage their own accounts, including teacher accounts.
                    </li>
                    <li>
                        <strong>Minors (under 18)</strong> may use the Service only with the permission and supervision of a
                        parent, legal guardian, or a teacher or school acting with the guardian&apos;s authority. If you are a
                        minor, ask a parent, guardian or teacher to read these Terms with you.
                    </li>
                    <li>
                        If you sign up for an organisation (for example a school), you confirm that you are authorised to bind
                        it to these Terms.
                    </li>
                </UL>
            </Section>

            <Section id="service" title="What QuizWarp is" index={next()}>
                <p>
                    QuizWarp lets teachers and students turn notes, text, files and images into quizzes using artificial
                    intelligence, and play them as live games, homework or flashcards. You can try parts of the Service without
                    an account; some features, such as saving quizzes, hosting sessions and viewing reports, need one.
                </p>
                <p>
                    The Service is actively developed. Features may change, be limited, or be removed, and some may be
                    experimental.
                </p>
            </Section>

            <Section id="accounts" title="Accounts and security" index={next()}>
                <UL>
                    <li>Give accurate information and keep it up to date.</li>
                    <li>
                        You are responsible for keeping your password and sign-in methods secure and for all activity under your
                        account. Tell us promptly if you think someone else has accessed it.
                    </li>
                    <li>One person per account. Do not share or sell your account.</li>
                    <li>
                        You can sign in with an email and password or with a third-party account such as Google. Your use of that
                        provider is governed by its own terms.
                    </li>
                </UL>
            </Section>

            <Section id="credits" title="AI credits" index={next()}>
                <p>
                    Generating quizzes and some AI features use &quot;AI credits&quot;. Credits are granted by us (for example on
                    sign-up or on a periodic refill), have no cash value, cannot be sold, transferred or redeemed for money, and
                    may be changed, limited or reset. Anonymous use is limited and tracked per device to prevent abuse.
                </p>
                <p>
                    The Service is currently free. If we introduce paid plans, we will present the price, billing terms and
                    refund rules clearly before you pay, and those terms will apply in addition to these Terms.
                </p>
            </Section>

            <Section id="your-content" title="Your content" index={next()}>
                <p>
                    &quot;Your Content&quot; means anything you submit to the Service: text, uploaded files and images, quiz titles,
                    questions and answers, nicknames, and answers given while playing.
                </p>
                <UL>
                    <li>You keep ownership of Your Content.</li>
                    <li>
                        You give us a limited, worldwide, non-exclusive licence to host, process, copy, display and transmit Your
                        Content (including sending it to our AI provider) solely to operate, secure and improve the Service for
                        you and the people you share it with. This licence ends when you delete the content or your account,
                        except for copies in backups for a limited time and content that other users have lawfully saved or
                        played.
                    </li>
                    <li>
                        You confirm that you have the right to submit Your Content and that doing so does not infringe anyone&apos;s
                        copyright, privacy or other rights (see the Intellectual Property Code, Republic Act No. 8293, as
                        amended).
                    </li>
                    <li>
                        Do not upload content containing sensitive personal information (such as government ID numbers, health
                        or financial details) or other people&apos;s personal data that you have no right to share.
                    </li>
                </UL>
            </Section>

            <Section id="ai-content" title="AI-generated content" index={next()}>
                <p>
                    Questions, answers, explanations, grades, feedback and class insights are produced by AI and may be
                    inaccurate, incomplete, biased or out of date. <strong>You must review AI output before relying on it or
                    showing it to students.</strong> In particular:
                </p>
                <UL>
                    <li>
                        Do not use AI-generated grades or insights as the only basis for decisions that significantly affect a
                        person, such as final grades, admissions, discipline or employment.
                    </li>
                    <li>
                        Essay and open-ended grading is an automated estimate. Teachers remain responsible for the final
                        assessment of their students.
                    </li>
                    <li>
                        AI output may resemble other output generated for other users. We do not guarantee that it is unique or
                        free of third-party rights. Subject to these Terms, you may use the output for your own educational
                        purposes.
                    </li>
                </UL>
            </Section>

            <Section id="teachers" title="Teachers, schools and students" index={next()}>
                <p>
                    If you host a game, assign homework or view reports, you receive personal data of participants such as
                    nicknames, answers, scores and timing. You are responsible for:
                </p>
                <UL>
                    <li>
                        having a lawful basis, and where needed the consent of students or their parents or guardians, to use
                        the Service with your class under the Data Privacy Act of 2012 (Republic Act No. 10173) and your
                        school&apos;s policies;
                    </li>
                    <li>telling participants how their data will be used, and using results only for legitimate educational purposes;</li>
                    <li>not exporting, sharing or publishing results in a way that exposes students without a proper reason.</li>
                </UL>
                <p>
                    Participants who join with a nickname and no account should be told by the host that their answers are
                    visible to the host. Students should use a nickname rather than a full name where possible.
                </p>
            </Section>

            <Section id="acceptable-use" title="Acceptable use" index={next()}>
                <p>
                    You must follow our <A href="/acceptable-use">Acceptable Use Policy</A>. In short: no unlawful, harmful,
                    abusive or deceptive use, no attempts to break, overload or bypass the Service or its limits, and no
                    submitting content you have no right to use.
                </p>
            </Section>

            <Section id="ip" title="Our intellectual property" index={next()}>
                <p>
                    The Service, including its software, design, pixel art, characters, music and sound effects, trademarks and
                    documentation, belongs to us or our licensors and is protected by Philippine and international law. We give
                    you a limited, revocable, non-exclusive, non-transferable right to use the Service for its intended
                    purpose. You may not copy, modify, reverse engineer, scrape or resell it, except as the law allows.
                </p>
                <p>
                    If you send us feedback or suggestions, we may use them without obligation to you.
                </p>
                <p>
                    If you believe content on the Service infringes your rights, contact us at the address in the Contact
                    section with enough detail to identify the content and your claim.
                </p>
            </Section>

            <Section id="third-party" title="Third-party services" index={next()}>
                <p>
                    The Service relies on third parties, including Supabase (authentication and database), Vercel and Render
                    (hosting), and Google (sign-in and the Gemini AI API). Their availability and terms are outside our control,
                    and links to other websites are provided for convenience only. See our <A href="/privacy">Privacy
                    Policy</A> for how data is shared with them.
                </p>
            </Section>

            <Section id="changes-termination" title="Changes, suspension and termination" index={next()}>
                <UL>
                    <li>
                        <strong>By you:</strong> you may stop using the Service at any time, and you may ask us to delete your
                        account and data by contacting us (see Contact).
                    </li>
                    <li>
                        <strong>By us:</strong> we may suspend or end access, or remove content, if you breach these Terms, if
                        required by law, to protect users or the Service, or if we discontinue the Service. Where reasonable we
                        will tell you why and give you the chance to export your quizzes first.
                    </li>
                    <li>
                        <strong>Changes:</strong> we may update these Terms. For material changes we will give notice, for
                        example on the site or by email, and ask you to accept again. Continued use after the effective date
                        means you accept the updated Terms.
                    </li>
                </UL>
                <p>
                    Sections that by their nature should survive termination (such as ownership, disclaimers, liability limits
                    and governing law) will survive.
                </p>
            </Section>

            <Section id="disclaimers" title="Disclaimers" index={next()}>
                <p>
                    The Service is provided &quot;as is&quot; and &quot;as available&quot;. To the extent permitted by law, we do not
                    promise that it will be uninterrupted, error-free or secure, that AI output will be accurate or suitable
                    for your purposes, or that content will never be lost. Free instances of our hosting may be slow to start
                    or temporarily unavailable. You are responsible for keeping your own copies of important material.
                </p>
            </Section>

            <Section id="liability" title="Limitation of liability" index={next()}>
                <p>
                    To the maximum extent permitted by Philippine law, we are not liable for indirect, incidental, special or
                    consequential losses, or for loss of data, profits or goodwill, arising from your use of the Service. Our
                    total liability for any claim relating to the Service is limited to the greater of the amount you paid us
                    in the 12 months before the claim or PHP 1,000.
                </p>
                <p>
                    Nothing in these Terms limits liability that cannot be limited under the law, including liability for
                    fraud, bad faith, gross negligence or wilful misconduct, and nothing limits any rights you have as a data
                    subject under the Data Privacy Act or as a consumer under Philippine law.
                </p>
            </Section>

            <Section id="indemnity" title="Indemnity" index={next()}>
                <p>
                    You agree to be responsible for claims, losses and reasonable costs that arise from Your Content, your
                    breach of these Terms, or your violation of another person&apos;s rights or of the law, except to the extent
                    caused by our own fault.
                </p>
            </Section>

            <Section id="law" title="Governing law and disputes" index={next()}>
                <p>
                    These Terms are governed by the laws of the Republic of the Philippines. If a dispute arises, please first
                    contact us so we can try to resolve it in good faith within 30 days. If it is not resolved, the dispute
                    may be brought before the proper courts of the Philippines, and you and we submit to their jurisdiction,
                    without prejudice to any right you have to bring a complaint before the National Privacy Commission or
                    another government agency.
                </p>
            </Section>

            <Section id="general" title="General" index={next()}>
                <UL>
                    <li>These Terms and the documents they refer to are the entire agreement between you and us about the Service.</li>
                    <li>If a part is found unenforceable, the rest stays in effect.</li>
                    <li>Our not enforcing a right is not a waiver of it.</li>
                    <li>You may not assign these Terms without our consent; we may assign them as part of a transfer of the Service.</li>
                    <li>We are not liable for delays or failures caused by events beyond our reasonable control.</li>
                </UL>
            </Section>

            <Section id="contact" title="Contact" index={next()}>
                <p>
                    Questions about these Terms: {LEGAL.contactEmail}. For privacy requests see the{" "}
                    <A href="/privacy#rights">Privacy Policy</A>.
                </p>
            </Section>
        </LegalPage>
    );
}
