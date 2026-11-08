import type { Metadata } from "next";
import LegalPage, { A, Section, UL, type LegalSection } from "../_components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
    title: "Privacy Policy | QuizWarp",
    description: "How QuizWarp collects, uses, shares and protects personal data under the Philippine Data Privacy Act of 2012.",
};

const SECTIONS: LegalSection[] = [
    { id: "who", title: "Who we are" },
    { id: "collect", title: "What we collect" },
    { id: "why", title: "Why we use it and our legal basis" },
    { id: "ai", title: "AI processing" },
    { id: "sharing", title: "Who we share it with" },
    { id: "transfers", title: "Transfers outside the Philippines" },
    { id: "retention", title: "How long we keep it" },
    { id: "security", title: "Security and breaches" },
    { id: "rights", title: "Your rights" },
    { id: "children", title: "Students and minors" },
    { id: "cookies", title: "Cookies and local storage" },
    { id: "changes", title: "Changes to this policy" },
    { id: "contact", title: "Contact and complaints" },
];

export default function PrivacyPage() {
    let n = 0;
    const next = () => ++n;
    return (
        <LegalPage
            title="Privacy Policy"
            summary="What personal data QuizWarp collects, why, who sees it, and the rights you have under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173)."
            sections={SECTIONS}
        >
            <Section id="who" title="Who we are" index={next()}>
                <p>
                    {LEGAL.appName} is operated by {LEGAL.operator} in {LEGAL.country}. For personal data we collect through
                    the Service, we are the &quot;personal information controller&quot; under the Data Privacy Act of 2012 (the
                    &quot;DPA&quot;), its Implementing Rules and Regulations, and the issuances of the National Privacy Commission
                    (&quot;NPC&quot;). Our contact for privacy matters, including our data protection officer or privacy contact, is:{" "}
                    {LEGAL.contactEmail}.
                </p>
                <p>
                    Teachers and schools who run games with their students decide what students are asked to do and how
                    results are used. In that role they have their own responsibilities for the student data they receive
                    (see <A href="/terms#teachers">Terms, Teachers, schools and students</A>).
                </p>
            </Section>

            <Section id="collect" title="What we collect" index={next()}>
                <p><strong>Account data.</strong></p>
                <UL>
                    <li>Name, email address, and the role you choose (teacher or student).</li>
                    <li>
                        Your password, which is handled by our authentication provider (Supabase) and stored in hashed form.
                        We never see or store it in readable form.
                    </li>
                    <li>If you sign in with Google: the name, email and profile details Google shares with us.</li>
                    <li>Account activity such as AI credit balance, last login date and play streaks.</li>
                    <li>A record of when you accepted the Terms and Privacy Policy and which version.</li>
                </UL>
                <p><strong>Content you provide.</strong></p>
                <UL>
                    <li>Text, files and images you upload to generate quizzes, and the quizzes, questions and answers you create.</li>
                </UL>
                <p><strong>Gameplay data.</strong></p>
                <UL>
                    <li>
                        Nickname, team/faction, answers given, correctness, points, timing, streaks and AI feedback or grading
                        on written answers, for both logged-in and nickname-only participants.
                    </li>
                    <li>Session reports and AI class insights generated for hosts.</li>
                </UL>
                <p><strong>Technical data.</strong></p>
                <UL>
                    <li>IP address, browser and device information, and server logs, used for security and troubleshooting.</li>
                    <li>
                        For anonymous (not signed in) use of the quiz generator, a device identifier created in your browser
                        (a browser fingerprint) so we can apply the free usage limit and prevent abuse.
                    </li>
                    <li>Cookies and local storage described in our <A href="/cookies">Cookies &amp; Storage notice</A>.</li>
                </UL>
                <p>
                    We do not intentionally collect sensitive personal information (as defined in the DPA, such as health,
                    government IDs, or religious or political affiliation) and ask you not to put it in your content.
                </p>
            </Section>

            <Section id="why" title="Why we use it and our legal basis" index={next()}>
                <p>
                    We process personal data only on a lawful criterion under Section 12 of the DPA:
                </p>
                <UL>
                    <li>
                        <strong>Consent</strong>, which you give when you accept the Terms and this Policy, to create and run
                        your account and to process your content with AI. You can withdraw consent at any time (see Your
                        rights), though we may then be unable to provide the Service.
                    </li>
                    <li>
                        <strong>Contract</strong>: to provide the features you ask for, such as generating quizzes, hosting
                        games, saving results, and showing reports to the host.
                    </li>
                    <li>
                        <strong>Legitimate interests</strong>: keeping the Service secure, preventing abuse and fraud, enforcing
                        usage limits, fixing bugs and improving reliability, balanced against your rights.
                    </li>
                    <li><strong>Legal obligations</strong>: complying with law, court orders or requests of government agencies.</li>
                </UL>
                <p>We do not sell personal data, and we do not use it for advertising or for profiling that produces legal effects on you.</p>
            </Section>

            <Section id="ai" title="AI processing" index={next()}>
                <p>
                    To generate quizzes, grade written answers and create class insights, our server sends the relevant content
                    (the text, files or images you provide, questions, and answers to be graded) to Google&apos;s Gemini API.
                    Uploaded files are sent temporarily to Google for processing, and our service deletes them from Google&apos;s
                    file storage after processing. Google handles that data under its own terms and privacy notices.
                </p>
                <p>
                    Do not submit content that includes personal data you do not need, or sensitive information. AI output may
                    contain mistakes; see the <A href="/terms#ai-content">Terms</A>.
                </p>
            </Section>

            <Section id="sharing" title="Who we share it with" index={next()}>
                <UL>
                    <li>
                        <strong>Hosts and teachers</strong>: if you join a game or assignment, the host can see your nickname,
                        answers, scores and timing, and may export results.
                    </li>
                    <li>
                        <strong>Other participants</strong>: leaderboards and team standings can show your nickname and score
                        during a game.
                    </li>
                    <li>
                        <strong>Service providers (processors)</strong> that help us run the Service under appropriate
                        agreements: Supabase (authentication and PostgreSQL database), Vercel (website hosting), Render (AI
                        service hosting), and Google (sign-in and Gemini AI). They may only use data to provide their services to
                        us.
                    </li>
                    <li>
                        <strong>Authorities and advisers</strong> where required by law or to protect rights, safety and
                        security, and a successor if the Service is transferred, with notice to you where required.
                    </li>
                </UL>
            </Section>

            <Section id="transfers" title="Transfers outside the Philippines" index={next()}>
                <p>
                    Our providers operate data centres in other countries, so your data may be stored or processed outside the
                    Philippines. We remain responsible for personal data we transfer to processors and use contractual and
                    technical measures to protect it as the DPA requires. By using the Service you acknowledge this transfer.
                </p>
            </Section>

            <Section id="retention" title="How long we keep it" index={next()}>
                <UL>
                    <li>Account data and quizzes: while your account is active and until you delete them or the account.</li>
                    <li>Gameplay records: while the host keeps the session, or until it is deleted or the host&apos;s account is deleted.</li>
                    <li>Anonymous usage counters and security logs: only as long as needed for abuse prevention and troubleshooting.</li>
                    <li>Backups: removed on a rolling schedule after deletion.</li>
                    <li>Some data may be kept longer where the law requires or to resolve disputes.</li>
                </UL>
                <p>
                    When data is no longer needed, we delete it or anonymise it so that it no longer identifies you.
                </p>
            </Section>

            <Section id="security" title="Security and breaches" index={next()}>
                <p>
                    We use reasonable organisational, physical and technical safeguards, including encrypted connections
                    (HTTPS), access controls, password hashing by our authentication provider, and server-side handling of
                    secrets. No system is perfectly secure.
                </p>
                <p>
                    If a personal data breach occurs that requires it, we will notify the NPC and affected individuals within
                    72 hours of knowledge or reasonable belief of the breach, as required by NPC Circular 16-03.
                </p>
            </Section>

            <Section id="rights" title="Your rights" index={next()}>
                <p>Under the DPA, you have the right to:</p>
                <UL>
                    <li><strong>Be informed</strong> about whether and how your personal data is processed;</li>
                    <li><strong>Access</strong> your personal data, and know who it was shared with;</li>
                    <li><strong>Object</strong> to processing, including withdrawing consent;</li>
                    <li><strong>Rectify</strong> inaccurate or incomplete data;</li>
                    <li><strong>Erase or block</strong> data that is unlawfully obtained, no longer needed, or that you withdraw consent for;</li>
                    <li><strong>Data portability</strong>, where your data is processed electronically and structured, to obtain a copy in a common format;</li>
                    <li><strong>Claim damages</strong> for inaccurate, incomplete, outdated, false, unlawfully obtained or unauthorised use of your data;</li>
                    <li><strong>Lodge a complaint</strong> with the National Privacy Commission.</li>
                </UL>
                <p>
                    To use these rights, write to {LEGAL.contactEmail} from the email on your account (or use the settings page
                    where available). We may ask you to verify your identity, and we will respond within a reasonable time.
                    Some rights are subject to limits allowed by law.
                </p>
            </Section>

            <Section id="children" title="Students and minors" index={next()}>
                <p>
                    QuizWarp is used in classrooms, so some participants will be under 18. Minors should use the Service only
                    with the permission of a parent, guardian or teacher. Teachers and schools who ask students to take part
                    are responsible for obtaining any parental or guardian consent that the DPA, their institution or other
                    law requires. We recommend that students join with a nickname instead of their full name.
                </p>
                <p>
                    We do not knowingly collect more personal data from minors than needed to provide the Service, do not show
                    advertising, and do not sell data. A parent or guardian who believes that a child&apos;s data should be
                    corrected or deleted may contact us at the address below.
                </p>
            </Section>

            <Section id="cookies" title="Cookies and local storage" index={next()}>
                <p>
                    We use cookies and similar browser storage to keep you signed in and remember your settings. Details are in
                    the <A href="/cookies">Cookies &amp; Storage notice</A>.
                </p>
            </Section>

            <Section id="changes" title="Changes to this policy" index={next()}>
                <p>
                    We may update this Policy. When changes are material we will notify you, for example on the site or by
                    email, and ask for your acceptance again where the law requires. The date at the top shows the latest
                    version.
                </p>
            </Section>

            <Section id="contact" title="Contact and complaints" index={next()}>
                <p>
                    Privacy questions and requests: {LEGAL.contactEmail}.
                </p>
                <p>
                    If you are not satisfied with our response, you may file a complaint with the{" "}
                    <A href="https://privacy.gov.ph">National Privacy Commission</A> of the Philippines.
                </p>
            </Section>
        </LegalPage>
    );
}
