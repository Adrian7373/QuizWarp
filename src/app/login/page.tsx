"use client";

import { use, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FaFacebook } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { signInWithProvider, login } from "./actions";
import { ConsentCheckboxes, ConsentHiddenInputs } from "../_components/legal/ConsentCheckboxes";


interface LoginPageProps {
    searchParams: Promise<{
        message?: string;
        error?: string;
    }>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {

    const resolvedParams = use(searchParams);

    const [isShowing, setIsShowing] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const hasConsented = acceptedTerms && acceptedPrivacy;

    const handleToggleShow = () => {
        setIsShowing((prev) => !prev);
    };

    return (
        <div className="bg-darker flex justify-center items-center w-full min-h-dvh py-6">
            <div className="bg-dark p-6 sm:p-10 flex flex-col justify-center shadow-md w-full mx-4 sm:mx-6 max-w-[500px] rounded-lg">
                <h1 className="text-center text-white text-xl font-semibold mb-6">
                    Sign In
                </h1>

                {/* 4. Use the unwrapped params here */}
                {resolvedParams?.message && (
                    <div className="bg-mint/20 border border-mint text-mint px-4 py-3 rounded-md mb-6 text-sm text-center">
                        {resolvedParams.message}
                    </div>
                )}

                {resolvedParams?.error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded-md mb-6 text-sm text-center">
                        {resolvedParams.error}
                    </div>
                )}

                {/* 1. EMAIL & PASSWORD FORM */}
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
                                onClick={handleToggleShow}
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

                    <button
                        type="submit"
                        disabled={!hasConsented}
                        className="flex items-center gap-2 bg-white text-black w-full justify-center py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors mt-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Sign In
                    </button>
                </form>

                {/* DIVIDER */}
                <div className="flex items-center py-4">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink-0 mx-4 text-white text-sm">or</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* 2. SOCIAL OAUTH FORM */}
                <form action={signInWithProvider} className="flex flex-col items-center gap-3">
                    <ConsentHiddenInputs terms={acceptedTerms} privacy={acceptedPrivacy} />
                    <button
                        type="submit"
                        name="provider"
                        hidden
                        value="facebook"
                        className="flex items-center gap-2 bg-white text-black w-full justify-center py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors"
                    >
                        <FaFacebook color="#1877F2" className="text-xl" />
                        Continue with Facebook
                    </button>

                    <button
                        type="submit"
                        name="provider"
                        value="google"
                        disabled={!hasConsented}
                        className="flex items-center gap-2 bg-white text-black w-full justify-center py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <FcGoogle className="text-xl" />
                        Continue with Google
                    </button>
                </form>
            </div>
        </div>
    );
}