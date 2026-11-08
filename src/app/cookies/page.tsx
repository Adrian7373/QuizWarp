import type { Metadata } from "next";
import LegalPage, { A, Section, UL, type LegalSection } from "../_components/legal/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
    title: "Cookies & Storage | QuizWarp",
    description: "The cookies and browser storage QuizWarp uses, and how to control them.",
};

const SECTIONS: LegalSection[] = [
    { id: "what", title: "What this covers" },
    { id: "essential", title: "Cookies we use" },
    { id: "storage", title: "Local and session storage" },
    { id: "fingerprint", title: "Device identifier for anonymous use" },
    { id: "third", title: "Third parties" },
    { id: "control", title: "Your choices" },
    { id: "contact", title: "Contact" },
];

const cell = "border-2 border-frame px-3 py-2 align-top text-base";

export default function CookiesPage() {
    let n = 0;
    const next = () => ++n;
    return (
        <LegalPage
            title="Cookies & Storage"
            summary="QuizWarp keeps this simple: we use only what is needed to sign you in, remember your settings and run games. No advertising or tracking cookies."
            sections={SECTIONS}
        >
            <Section id="what" title="What this covers" index={next()}>
                <p>
                    Cookies are small files saved by your browser. Local storage and session storage are similar browser
                    features. We call all of these &quot;storage&quot;. This notice supports our{" "}
                    <A href="/privacy">Privacy Policy</A>.
                </p>
            </Section>

            <Section id="essential" title="Cookies we use" index={next()}>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr>
                                <th className={cell}>Name</th>
                                <th className={cell}>Purpose</th>
                                <th className={cell}>Lifetime</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className={cell}>sb-&hellip;-auth-token (set by Supabase)</td>
                                <td className={cell}>Keeps you signed in and secures your session.</td>
                                <td className={cell}>
                                    Browser session if &quot;Remember me&quot; is off, otherwise persistent until you sign out or it expires.
                                </td>
                            </tr>
                            <tr>
                                <td className={cell}>qw_consent</td>
                                <td className={cell}>
                                    Carries your acceptance of the Terms and Privacy Policy through the Google sign-in redirect so we can record it.
                                </td>
                                <td className={cell}>About 10 minutes, then deleted.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p>
                    These are strictly necessary for the Service to work, so they are set without a separate opt-in. If you
                    block them, you will not be able to sign in.
                </p>
            </Section>

            <Section id="storage" title="Local and session storage" index={next()}>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr>
                                <th className={cell}>Key</th>
                                <th className={cell}>Purpose</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td className={cell}>theme</td><td className={cell}>Remembers dark or light screen.</td></tr>
                            <tr><td className={cell}>sfx, music, musicTrack</td><td className={cell}>Remembers your sound effects and music choices.</td></tr>
                            <tr><td className={cell}>critters</td><td className={cell}>Remembers whether the wandering mascots are shown.</td></tr>
                            <tr><td className={cell}>participant_&lt;session&gt;</td><td className={cell}>Lets you rejoin a game you are playing after a refresh.</td></tr>
                            <tr><td className={cell}>offline_queue_&lt;session&gt;</td><td className={cell}>Holds answers temporarily if your connection drops, so they can be sent when it returns.</td></tr>
                            <tr><td className={cell}>anon_quizzes</td><td className={cell}>Lists quizzes you generated without an account, so you can open them again on this device.</td></tr>
                            <tr><td className={cell}>Question bank selection (session storage)</td><td className={cell}>Keeps your selected questions if you refresh the page.</td></tr>
                        </tbody>
                    </table>
                </div>
                <p>This data stays on your device and is not used for advertising.</p>
            </Section>

            <Section id="fingerprint" title="Device identifier for anonymous use" index={next()}>
                <p>
                    When you use the quiz generator without an account, your browser generates a device identifier (a
                    fingerprint, using the open-source FingerprintJS library running in your browser) which is sent to our
                    server with your request. We use it only to count free anonymous uses and prevent abuse of the free limit.
                    It is not used for advertising or sold. Signing in lets you use the Service without this identifier.
                </p>
            </Section>

            <Section id="third" title="Third parties" index={next()}>
                <p>
                    If you choose &quot;Continue with Google&quot;, Google sets its own cookies on its own pages under its own
                    policies. We do not currently use third-party analytics or advertising cookies. If that changes, we will
                    update this notice and ask for your consent first where needed.
                </p>
            </Section>

            <Section id="control" title="Your choices" index={next()}>
                <UL>
                    <li>You can delete or block cookies and site data in your browser settings. The Service will still work for anonymous use, but you will be signed out and your saved settings will reset.</li>
                    <li>Turn off music, sound or mascots in the app at any time.</li>
                    <li>Clearing site data removes the anonymous quiz list stored on your device.</li>
                </UL>
            </Section>

            <Section id="contact" title="Contact" index={next()}>
                <p>Questions: {LEGAL.contactEmail}.</p>
            </Section>
        </LegalPage>
    );
}
