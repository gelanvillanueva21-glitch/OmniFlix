"use client";

import { useState, type FormEvent } from "react";
import { EyeToggleIcon } from "./EyeToggleIcon";
import { signin, signup } from "@/service/user.service";
import { ApiError } from "@/service/client.service";
import { WindowSuccess } from "./TestWindowSuccess";
import { useRouter } from "next/navigation";



interface AuthWindowProps {
    readonly mode: "signin" | "signup";
    readonly onSwitchMode: (targetMode: "signin" | "signup") => void;
}

export function AuthWindow({ mode, onSwitchMode }: AuthWindowProps) {
    const router = useRouter();

    // ── Sign In Form State ──
    const [signInUsername, setSignInUsername] = useState("");
    const [signInPassword, setSignInPassword] = useState("");
    const [showSignInPassword, setShowSignInPassword] = useState(false);
    const [signInErrorMessage, setSignInErrorMessage] = useState("");

    // ── Sign Up Form State ──
    const [signUpUsername, setSignUpUsername] = useState("");
    const [signUpPassword, setSignUpPassword] = useState("");
    const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
    const [showSignUpPassword, setShowSignUpPassword] = useState(false);
    const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
    const [signUpErrorMessage, setSignUpErrorMessage] = useState("");

    // ── Other state ──
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Small Window State ──
    const [isSuccess, setIsSuccess] = useState(false);
    const [description, setDescription] = useState("");

    // ── Handle Sign In Submit ──
    const handleSignInSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSignInErrorMessage("");

        if (!signInUsername.trim()) {
            setSignInErrorMessage("Please enter your username.");
            return;
        }

        if (!signInPassword) {
            setSignInErrorMessage("Please enter your password.");
            return;
        }

        try {
            setIsSubmitting(true);
            await signin({
                username: signInUsername,
                password: signInPassword
            });
            setIsSuccess(true);
            setDescription("Successfully login.");
            router.replace("/explore");
        } catch (error) {
            if (error instanceof ApiError)
                setSignInErrorMessage(error.message);
            else
                setSignInErrorMessage("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Handle Sign Up Submit ──
    const handleSignUpSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSignUpErrorMessage("");

        if (!signUpUsername.trim()) {
            setSignUpErrorMessage("Please enter a username.");
            return;
        }

        if (signUpUsername.trim().length < 3) {
            setSignUpErrorMessage("Username must be at least 3 characters long.");
            return;
        }

        if (!signUpPassword) {
            setSignUpErrorMessage("Please enter a password.");
            return;
        }

        if (signUpPassword.length < 8) {
            setSignUpErrorMessage("Password must be at least 8 characters long.");
            return;
        }

        if (signUpPassword !== signUpConfirmPassword) {
            setSignUpErrorMessage("Passwords do not match. Please verify.");
            return;
        }

        try {
            setIsSubmitting(true);
            await signup({
                username: signUpUsername,
                password: signUpPassword
            })
            setIsSuccess(true);
            setDescription("Successfully created an account.");
            router.replace("/explore");
        } catch (error) {
            if (error instanceof ApiError)
                setSignUpErrorMessage(error.message);
            else {
                console.log(error);
                setSignUpErrorMessage("Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }

    };

    const isSignInMode = mode === "signin";

    return (
        <div
            className="w-full max-w-150 bg-[#191919] border border-[#3A3A40] rounded-2xl p-8 sm:p-9 shadow-2xl shadow-black/90 backdrop-blur-sm relative z-20 transition-all duration-300"
            role="region"
            aria-label={isSignInMode ? "Sign in window" : "Sign up window"}
        >
            {/* Subtle top-edge accent highlight */}
            <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-[#8B5CF6]/40 to-transparent pointer-events-none" />

            {/* ── Heading and Supporting Text ── */}
            <div className="mb-7">
                <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#F5F5F5] mb-2 font-sans">
                    {isSignInMode ? "Welcome back." : "Join OmniFlix."}
                </h1>
                <p className="text-sm text-[#A1A1AA] leading-relaxed">
                    {isSignInMode
                        ? "Sign in to continue your OmniFlix journey."
                        : "Create your account and discover your next obsession."}
                </p>
            </div>

            {/* ── Sign In Form ── */}
            {isSignInMode ? (
                <form onSubmit={handleSignInSubmit} noValidate className="space-y-5">
                    {signInErrorMessage && (
                        <div
                            className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3.5 py-2.5 leading-relaxed"
                            role="alert"
                        >
                            {signInErrorMessage}
                        </div>
                    )}

                    {/* Username Input */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="signin-username"
                            className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]"
                        >
                            Username
                        </label>
                        <input
                            id="signin-username"
                            type="text"
                            name="username"
                            autoComplete="username"
                            value={signInUsername}
                            onChange={(event) => setSignInUsername(event.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#202020] border border-[#3A3A40] text-[#F5F5F5] placeholder-[#71717A] text-sm outline-none transition-colors duration-200 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                            placeholder="Enter your username"
                        />
                    </div>

                    {/* Password Input with Show/Hide Toggle */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="signin-password"
                            className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="signin-password"
                                type={showSignInPassword ? "text" : "password"}
                                name="password"
                                autoComplete="current-password"
                                value={signInPassword}
                                onChange={(event) => setSignInPassword(event.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#202020] border border-[#3A3A40] text-[#F5F5F5] placeholder-[#71717A] text-sm outline-none transition-colors duration-200 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSignInPassword((previousState) => !previousState)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#A1A1AA] hover:text-[#F5F5F5] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                                aria-label={showSignInPassword ? "Hide password" : "Show password"}
                            >
                                <EyeToggleIcon isVisible={showSignInPassword} />
                            </button>
                        </div>
                    </div>

                    {/* Primary Sign In Button */}
                    <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] active:bg-[#6D28D9] text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-[#8B5CF6]/25 hover:shadow-[#8B5CF6]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF] cursor-pointer"
                    >
                        Sign in
                    </button>

                    {/* Mode Switch Prompt */}
                    <div className="pt-2 text-center text-xs text-[#A1A1AA]">
                        Don&apos;t have an account?{" "}
                        <button
                            type="button"
                            onClick={() => onSwitchMode("signup")}
                            className="text-[#8B5CF6] hover:text-[#A78BFA] font-medium transition-colors cursor-pointer underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded"
                        >
                            Sign up
                        </button>
                    </div>
                </form>
            ) : (
                /* ── Sign Up Form ── */
                <form onSubmit={handleSignUpSubmit} noValidate className="space-y-4">
                    {signUpErrorMessage && (
                        <div
                            className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3.5 py-2.5 leading-relaxed"
                            role="alert"
                        >
                            {signUpErrorMessage}
                        </div>
                    )}

                    {/* Username Input */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="signup-username"
                            className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]"
                        >
                            Username
                        </label>
                        <input
                            id="signup-username"
                            type="text"
                            name="username"
                            autoComplete="username"
                            value={signUpUsername}
                            onChange={(event) => setSignUpUsername(event.target.value)}
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg bg-[#202020] border border-[#3A3A40] text-[#F5F5F5] placeholder-[#71717A] text-sm outline-none transition-colors duration-200 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                            placeholder="Choose a username"
                        />
                    </div>

                    {/* Password Input with Show/Hide Toggle */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="signup-password"
                            className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="signup-password"
                                type={showSignUpPassword ? "text" : "password"}
                                name="new-password"
                                autoComplete="new-password"
                                value={signUpPassword}
                                onChange={(event) => setSignUpPassword(event.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#202020] border border-[#3A3A40] text-[#F5F5F5] placeholder-[#71717A] text-sm outline-none transition-colors duration-200 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                                placeholder="At least 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSignUpPassword((previousState) => !previousState)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#A1A1AA] hover:text-[#F5F5F5] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                                aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                            >
                                <EyeToggleIcon isVisible={showSignUpPassword} />
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Input with Show/Hide Toggle */}
                    <div className="space-y-1.5">
                        <label
                            htmlFor="signup-confirm-password"
                            className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]"
                        >
                            Confirm password
                        </label>
                        <div className="relative">
                            <input
                                id="signup-confirm-password"
                                type={showSignUpConfirmPassword ? "text" : "password"}
                                name="confirm-password"
                                autoComplete="new-password"
                                value={signUpConfirmPassword}
                                onChange={(event) => setSignUpConfirmPassword(event.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#202020] border border-[#3A3A40] text-[#F5F5F5] placeholder-[#71717A] text-sm outline-none transition-colors duration-200 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                                placeholder="Re-enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSignUpConfirmPassword((previousState) => !previousState)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#A1A1AA] hover:text-[#F5F5F5] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                                aria-label={showSignUpConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                                <EyeToggleIcon isVisible={showSignUpConfirmPassword} />
                            </button>
                        </div>
                    </div>

                    {/* Primary Create Account Button */}
                    <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] active:bg-[#6D28D9] text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-[#8B5CF6]/25 hover:shadow-[#8B5CF6]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF] cursor-pointer mt-1"
                    >
                        {isSubmitting ? 'Creating account...' : 'Creat account'}
                    </button>

                    {/* Mode Switch Prompt */}
                    <div className="pt-2 text-center text-xs text-[#A1A1AA]">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => onSwitchMode("signin")}
                            className="text-[#8B5CF6] hover:text-[#A78BFA] font-medium transition-colors cursor-pointer underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            )}
            {isSuccess && (
                <WindowSuccess onClose={() => setIsSuccess(false)} description={description} />
            )}
        </div>
    );
}

