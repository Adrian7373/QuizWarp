import type { Metadata } from "next";
import LegalPage, { A, Section, UL, type LegalSection } from "../_components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
    title: "Acceptable Use Policy | QuizWarp",
    description: "What you may and may not do on QuizWarp.",
};

const SECTIONS: LegalSection[] = [
    { id: "purpose", title: "Purpose" },
    { id: "prohibited", title: "What you must not do" },
    { id: "content", title: "Content rules" },
    { id: "ai", title: "Using the AI features" },
    { id: "games", title: "Games and classrooms" },
    { id: "enforcement", title: "Enforcement" },
    { id: "report", title: "Reporting a problem" },
];

export default function AcceptableUsePage() {
    let n = 0;
    const next = () => ++n;
    return (
        <LegalPage
            title="Acceptable Use Policy"
            summary="QuizWarp is for learning. Keep it safe, lawful and fair for everyone, especially students."
            sections={SECTIONS}
        >
            <Section id="purpose" title="Purpose" index={next()}>
                <p>
                    This policy is part of our <A href="/terms">Terms of Service</A>. It applies to everything you submit and
                    do on the Service, including quiz content, nicknames and answers.
                </p>
            </Section>

            <Section id="prohibited" title="What you must not do" index={next()}>
                <UL>
                    <li>
                        Break the law of the Philippines or any other law that applies to you, including the Cybercrime
                        Prevention Act of 2012 (Republic Act No. 10175).
                    </li>
                    <li>Access accounts or data that are not yours, or try to guess passwords, join codes or sessions.</li>
                    <li>
                        Probe, scan or test the security of the Service, or bypass authentication, usage limits, AI credit
                        limits or the anonymous-use limit (for example by clearing storage or spoofing your device identifier).
                    </li>
                    <li>Overload the Service, or use bots, scrapers or automated means to access it without our written permission.</li>
                    <li>Upload or send malware, or interfere with other people&apos;s use of the Service.</li>
                    <li>Copy, resell, or build a competing product from the Service or its output at scale.</li>
                    <li>Impersonate another person, teacher or organisation, or misrepresent your age or role.</li>
                </UL>
            </Section>

            <Section id="content" title="Content rules" index={next()}>
                <p>You must not create, upload or share content that:</p>
                <UL>
                    <li>
                        sexually exploits or endangers children, in any form (this is a serious crime under, among others,
                        Republic Act No. 9775 and Republic Act No. 11930, and we report it to the authorities);
                    </li>
                    <li>harasses, bullies, threatens or humiliates a person or group, or promotes hatred or violence;</li>
                    <li>is sexually explicit, graphically violent, or encourages self-harm or dangerous acts;</li>
                    <li>
                        infringes copyright, trademarks or other rights. Upload only material you created, have permission to
                        use, or may lawfully use for education;
                    </li>
                    <li>
                        contains private information about others (such as addresses, phone numbers, ID numbers, grades of named
                        students or health data) without a right to share it, or sensitive personal information;
                    </li>
                    <li>is false or misleading in a way that is likely to cause harm, or is spam or a scam.</li>
                </UL>
                <p>
                    Nicknames and team names must follow the same rules. Do not use real names of other people, offensive words
                    or identifiers of other students without permission.
                </p>
            </Section>

            <Section id="ai" title="Using the AI features" index={next()}>
                <UL>
                    <li>Do not try to make the AI produce illegal, harmful or deceptive content, or to bypass its safeguards.</li>
                    <li>Do not submit AI output as a source of fact without checking it.</li>
                    <li>
                        Do not use QuizWarp to create exam material in a way that breaks your school&apos;s academic integrity
                        rules, or to cheat on someone else&apos;s assessment.
                    </li>
                    <li>
                        Do not put confidential, sensitive or personal data into prompts or uploads unless it is necessary and
                        you are allowed to share it.
                    </li>
                </UL>
            </Section>

            <Section id="games" title="Games and classrooms" index={next()}>
                <UL>
                    <li>Hosts: share join codes only with the intended participants and keep the room civil. Remove disruptive players.</li>
                    <li>Players: no cheating tools, scripts or sharing answers where the host has said not to, and no disrupting other players.</li>
                    <li>
                        Consistent with the Anti-Bullying Act of 2013 (Republic Act No. 10627) and school rules, bullying of any
                        student through nicknames, answers or chat is not allowed.
                    </li>
                </UL>
            </Section>

            <Section id="enforcement" title="Enforcement" index={next()}>
                <p>
                    If we believe you have broken this policy, we may remove content, limit features, suspend or close your
                    account, and where required or appropriate, report the matter to schools, law enforcement or other
                    authorities. We may act without notice where needed to protect people or the Service. You can contact us to
                    ask us to review a decision.
                </p>
            </Section>

            <Section id="report" title="Reporting a problem" index={next()}>
                <p>
                    To report abuse, harmful content or a security issue, email {LEGAL.contactEmail}. Include a link or join
                    code and a short description. For urgent safety concerns, also contact local authorities.
                </p>
            </Section>
        </LegalPage>
    );
}
