"use client";

import { Eye, EyeOff, X } from "lucide-react";
import { useState } from "react";
import { FaFacebook } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { login, signInWithProvider } from "../login/actions";
import { useFormStatus } from "react-dom";
import { ConsentCheckboxes, ConsentHiddenInputs } from "./legal/ConsentCheckboxes";

function LoginSubmitButton({ disabled = false }: { disabled?: boolean }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending || disabled}
            className="flex items-center gap-2 bg-white text-black w-full justify-center py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors mt-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            {pending ? "Signing In..." : "Sign In"}
        </button>
    );
}

function SocialButton({ provider, children, disabled = false }: { provider: string, children: React.ReactNode, disabled?: boolean }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            name="provider"
            value={provider}
            disabled={pending || disabled}
            className="flex items-center gap-2 bg-white text-black w-full justify-center py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            {pending ? "Connecting..." : children}
        </button>
    );
}

interface LoginModalProps {
    onClose: () => void;
    onCreateAccount: () => void;
}

export default function LoginModal({ onClose, onCreateAccount }: LoginModalProps) {
    const [isShowing, setIsShowing] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const hasConsented = acceptedTerms && acceptedPrivacy;

    return (
        <div
            onClick={onClose}
            className="bg-black/50 z-[90] fixed inset-0 flex justify-center items-center w-full min-h-dvh px-4"
        >
            <div
                onClick={(event) => event.stopPropagation()}
                className="bg-dark p-6 sm:p-10 flex flex-col justify-center shadow-md w-full max-w-[500px] max-h-dvh overflow-y-auto rounded-lg relative"
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    aria-label="Close login modal"
                >
                    <X size={20} />
                </button>

                <h1 className="text-center text-white text-xl font-semibold mb-6">
                    Sign In
                </h1>

                <form action={login} className="text-white flex flex-col gap-3">
                    <label className="flex flex-col gap-1">
                        Email:
                        <input
                            name="email"
                            type="email"
                            className="border-white border py-2 rounded-md focus:outline-none px-2 bg-transparent text-white"
                            required
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        Password:
                        <div className="flex items-center border border-white rounded-md">
                            <input
                                name="password"
                                type={isShowing ? "text" : "password"}
                                className="border-r border-white py-2 focus:outline-none px-2 flex-grow bg-transparent text-white"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setIsShowing((prev) => !prev)}
                                className="px-2 text-white focus:outline-none"
                            >
                                {isShowing ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </label>

                    <div className="flex justify-between items-center text-sm">
                        <label className="flex gap-2 items-center cursor-pointer">
                            <input
                                name="rememberMe"
                                type="checkbox"
                                className="mt-0.5 w-4 h-4 bg-transparent border border-white rounded-sm checked:bg-mint accent-mint cursor-pointer"
                            />
                            Remember me
                        </label>
                        <button type="button" className="underline hover:text-gray-300">
                            Forgot password?
                        </button>
                    </div>

                    <ConsentCheckboxes
                        terms={acceptedTerms}
                        privacy={acceptedPrivacy}
                        onTermsChange={setAcceptedTerms}
                        onPrivacyChange={setAcceptedPrivacy}
                        className="mt-1"
                    />

                    <LoginSubmitButton disabled={!hasConsented} />
                </form>

                <div className="flex items-center py-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink-0 mx-4 text-white text-sm">or</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <form action={signInWithProvider} className="flex flex-col items-center gap-3">
                    {/* 
                    <SocialButton provider="facebook">
                        <FaFacebook color="#1877F2" className="text-xl" />
                        Continue with Facebook
                    </SocialButton>
                    */}


                    <ConsentHiddenInputs terms={acceptedTerms} privacy={acceptedPrivacy} />

                    <SocialButton provider="google" disabled={!hasConsented}>
                        <FcGoogle className="text-xl" />
                        Continue with Google
                    </SocialButton>
                    {!hasConsented && (
                        <p className="text-xs text-gray-300 text-center">
                            Tick both boxes above to continue.
                        </p>
                    )}
                </form>

                <div className="mt-4 text-center text-sm text-gray-300">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={onCreateAccount}
                        className="text-mint underline hover:text-white transition-colors"
                    >
                        Create an Account
                    </button>
                </div>
            </div>
        </div>
    );
}