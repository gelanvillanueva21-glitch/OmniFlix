
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

    const [signInUsername, setSignInUsername] = useState("");
    const [signInPassword, setSignInPassword] = useState("");
    const [showSignInPassword, setShowSignInPassword] = useState(false);
    const [signInErrorMessage, setSignInErrorMessage] = useState("");

    const [signUpUsername, setSignUpUsername] = useState("");
    const [signUpPassword, setSignUpPassword] = useState("");
    const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
    const [showSignUpPassword, setShowSignUpPassword] = useState(false);
    const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
    const [signUpErrorMessage, setSignUpErrorMessage] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [description, setDescription] = useState("");

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
            if (error instanceof ApiError) {
                setSignInErrorMessage(error.message);
            } else {
                setSignInErrorMessage("Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

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
            });
            setIsSuccess(true);
            setDescription("Successfully created an account.");
            router.replace("/explore");
        } catch (error) {
            if (error instanceof ApiError) {
                setSignUpErrorMessage(error.message);
            } else {
                console.error(error);
                setSignUpErrorMessage("Something went wrong. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isSignInMode = mode === "signin";

    return (
        <div
            className="auth-window"
            role="region"
            aria-label={isSignInMode ? "Sign in window" : "Sign up window"}
        >
            <div className="auth-window-accent-line" />

            <div className="auth-window-heading">
                <h1 className="auth-window-title">
                    {isSignInMode ? "Welcome back." : "Join OmniFlix."}
                </h1>
                <p className="auth-window-subtitle">
                    {isSignInMode
                        ? "Sign in to continue your OmniFlix journey."
                        : "Create your account and discover your next obsession."}
                </p>
            </div>

            {isSignInMode ? (
                <form onSubmit={handleSignInSubmit} noValidate className="auth-window-form--signin">
                    {signInErrorMessage && (
                        <div
                            className="form-error-banner"
                            role="alert"
                        >
                            {signInErrorMessage}
                        </div>
                    )}

                    <div className="form-field-group">
                        <label
                            htmlFor="signin-username"
                            className="form-label"
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
                            className="form-input form-input--basic"
                            placeholder="Enter your username"
                        />
                    </div>

                    <div className="form-field-group">
                        <label
                            htmlFor="signin-password"
                            className="form-label"
                        >
                            Password
                        </label>
                        <div className="form-input-shell">
                            <input
                                id="signin-password"
                                type={showSignInPassword ? "text" : "password"}
                                name="password"
                                autoComplete="current-password"
                                value={signInPassword}
                                onChange={(event) => setSignInPassword(event.target.value)}
                                required
                                className="form-input form-input--with-toggle"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSignInPassword((previousState) => !previousState)}
                                className="password-toggle-button"
                                aria-label={showSignInPassword ? "Hide password" : "Show password"}
                            >
                                <EyeToggleIcon isVisible={showSignInPassword} />
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="auth-submit-button"
                    >
                        {isSubmitting ? "Signing in..." : "Sign in"}
                    </button>

                    <div className="auth-window-switch">
                        Don&apos;t have an account?{" "}
                        <button
                            type="button"
                            onClick={() => onSwitchMode("signup")}
                            className="auth-window-switch-button"
                        >
                            Sign up
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleSignUpSubmit} noValidate className="auth-window-form--signup">
                    {signUpErrorMessage && (
                        <div
                            className="form-error-banner"
                            role="alert"
                        >
                            {signUpErrorMessage}
                        </div>
                    )}

                    <div className="form-field-group">
                        <label
                            htmlFor="signup-username"
                            className="form-label"
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
                            className="form-input form-input--basic"
                            placeholder="Choose a username"
                        />
                    </div>

                    <div className="form-field-group">
                        <label
                            htmlFor="signup-password"
                            className="form-label"
                        >
                            Password
                        </label>
                        <div className="form-input-shell">
                            <input
                                id="signup-password"
                                type={showSignUpPassword ? "text" : "password"}
                                name="new-password"
                                autoComplete="new-password"
                                value={signUpPassword}
                                onChange={(event) => setSignUpPassword(event.target.value)}
                                required
                                className="form-input form-input--with-toggle"
                                placeholder="At least 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSignUpPassword((previousState) => !previousState)}
                                className="password-toggle-button"
                                aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                            >
                                <EyeToggleIcon isVisible={showSignUpPassword} />
                            </button>
                        </div>
                    </div>

                    <div className="form-field-group">
                        <label
                            htmlFor="signup-confirm-password"
                            className="form-label"
                        >
                            Confirm password
                        </label>
                        <div className="form-input-shell">
                            <input
                                id="signup-confirm-password"
                                type={showSignUpConfirmPassword ? "text" : "password"}
                                name="confirm-password"
                                autoComplete="new-password"
                                value={signUpConfirmPassword}
                                onChange={(event) => setSignUpConfirmPassword(event.target.value)}
                                required
                                className="form-input form-input--with-toggle"
                                placeholder="Re-enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSignUpConfirmPassword((previousState) => !previousState)}
                                className="password-toggle-button"
                                aria-label={showSignUpConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                                <EyeToggleIcon isVisible={showSignUpConfirmPassword} />
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="auth-submit-button auth-submit-button--signup"
                    >
                        {isSubmitting ? "Creating account..." : "Creat account"}
                    </button>

                    <div className="auth-window-switch">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => onSwitchMode("signin")}
                            className="auth-window-switch-button"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            )}

            {isSuccess && (
                <WindowSuccess
                    onClose={() => setIsSuccess(false)}
                    description={description}
                />
            )}
        </div>
    );
}
