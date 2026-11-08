"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { FaFacebook } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { signUp } from "./actions"; // Adjust path if needed
import { signInWithProvider } from "../login/actions";
import { ConsentCheckboxes, ConsentHiddenInputs } from "../_components/legal/ConsentCheckboxes";

export default function SignupPage() {
    const [isShowing, setIsShowing] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const hasConsented = acceptedTerms && acceptedPrivacy;
    const [selectedRole, setSelectedRole] = useState<"TEACHER" | "STUDENT">("TEACHER");

    const handleToggleShow = () => {
        setIsShowing((prev) => !prev);
    };

    return (
        <div className="bg-darker flex justify-center items-center w-full min-h-dvh py-10">
            <div className="bg-dark p-10 flex flex-col justify-center shadow-md w-full mx-6 max-w-[500px] rounded-lg">
                <h1 className="text-center text-white text-xl font-semibold mb-6">
                    Create an Account
                </h1>

                {/* 1. EMAIL & PASSWORD SIGNUP FORM */}
                <form action={signUp} className="text-white flex flex-col gap-3">
                    <label className="flex flex-col gap-1">
                        Name:
                        <input
                            name="name"
                            type="text"
                            className="border-white border py-2 rounded-md focus:outline-none px-2 bg-transparent text-white"
                            required
                        />
                    </label>

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
                                minLength={6}
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
                    <input type="hidden" name="role" value={selectedRole} />
                    <div className="flex border-1 border-white/40 items-center rounded-md">
                        <button
                            type="button"
                            onClick={() => setSelectedRole("TEACHER")}
                            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${selectedRole === "TEACHER"
                                ? "border-mint bg-mint/20 text-mint"
                                : "border-white/40 bg-transparent text-white hover:border-mint/60 hover:text-mint"
                                }`}
                        >
                            Teacher
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedRole("STUDENT")}
                            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${selectedRole === "STUDENT"
                                ? "border-mint bg-mint/20 text-mint"
                                : "border-white/40 bg-transparent text-white hover:border-mint/60 hover:text-mint"
                                }`}
                        >
                            Student
                        </button>
                    </div>
                    <ConsentHiddenInputs terms={acceptedTerms} privacy={acceptedPrivacy} />
                    <ConsentCheckboxes
                        terms={acceptedTerms}
                        privacy={acceptedPrivacy}
                        onTermsChange={setAcceptedTerms}
                        onPrivacyChange={setAcceptedPrivacy}
                        className="mt-2"
                    />
                    <button
                        type="submit"
                        disabled={!hasConsented}
                        className="flex items-center gap-2 bg-white text-black w-full justify-center py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors mt-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Sign Up
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-300">
                    Already have an account?{" "}
                    <Link href="/login" className="text-mint underline hover:text-white transition-colors">
                        Sign In
                    </Link>
                </div>

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
                        Sign up with Facebook
                    </button>

                    <button
                        type="submit"
                        name="provider"
                        value="google"
                        disabled={!hasConsented}
                        className="flex items-center gap-2 bg-white text-black w-full justify-center py-3 rounded-sm font-semibold hover:bg-gray-200 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <FcGoogle className="text-xl" />
                        Sign up with Google
                    </button>
                </form>
            </div>
        </div>
    );
}