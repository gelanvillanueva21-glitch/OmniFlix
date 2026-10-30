"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { EyeToggleIcon } from "@/components/layouts/auth/EyeToggleIcon";
import { WindowSuccess } from "@/components/layouts/auth/TestWindowSuccess";
import { changePassword } from "@/service/user.service";
import { ApiError } from "@/service/client.service";
import { useMutation } from "@tanstack/react-query";

interface ChangePasswordWindowProps {
    /** Closes the window (backdrop click, ✕ button, or Escape key). */
    readonly onClose: () => void;
}

export function ChangePasswordWindow({ onClose }: ChangePasswordWindowProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [description, setDescription] = useState("");

    const closeButtonRef = useRef<HTMLButtonElement>(null);

    const mutation = useMutation({
        mutationFn: changePassword,
        onSuccess: (response) => {
            setIsSuccess(true);
            // A 204 No Content response has no body, so `response` can be
            // undefined — fall back to the default success message.
            setDescription(response?.message ?? "Your password has been updated.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        },
        onError: (error) => {
            if (error instanceof ApiError) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage("Something went wrong. Please try again.");
            }
        },
    });

    function changPasswordClick(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage("");

        if (!currentPassword) {
            setErrorMessage("Please enter your current password.");
            return;
        }

        if (!newPassword) {
            setErrorMessage("Please enter a new password.");
            return;
        }

        if (newPassword.length < 8) {
            setErrorMessage("New password must be at least 8 characters.");
            return;
        }

        if (currentPassword === newPassword) {
            setErrorMessage("New password must be different from the current password.");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setErrorMessage("Passwords do not match. Please verify.");
            return;
        }

        mutation.mutate({
            currentPassword,
            newPassword,
        });
    }

    const isSubmitting = mutation.isPending;

    // Escape closes the window and body scrolling is locked while it is open —
    // the same dismissable-overlay behavior as the explore/profile drawers.
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeButtonRef.current?.focus();
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    return (
        <div
            className="change-password-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Change password"
        >
            <button
                type="button"
                aria-label="Close change password window"
                onClick={onClose}
                className="change-password-backdrop"
            />

            <div className="change-password-window">
                <div className="change-password-accent-line" />

                {/* Window header bar */}
                <div className="change-password-header">
                    <div className="change-password-header-identity">
                        <span className="change-password-header-icon">
                            <svg
                                className="change-password-header-icon-svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.75"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                />
                            </svg>
                        </span>
                        <div>
                            <h2 className="change-password-title">
                                Change password
                            </h2>
                            <p className="change-password-subtitle">
                                Keep your account secure.
                            </p>
                        </div>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="change-password-close"
                        aria-label="Close window"
                    >
                        <svg
                            className="change-password-close-icon"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Window body */}
                <form onSubmit={changPasswordClick} noValidate className="change-password-form">
                    {errorMessage && (
                        <div
                            className="form-error-banner"
                            role="alert"
                        >
                            {errorMessage}
                        </div>
                    )}

                    <div className="form-field-group">
                        <label
                            htmlFor="change-current-password"
                            className="form-label"
                        >
                            Current password
                        </label>
                        <div className="form-input-shell">
                            <input
                                id="change-current-password"
                                type={showCurrentPassword ? "text" : "password"}
                                name="current-password"
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                required
                                className="form-input form-input--with-toggle"
                                placeholder="Enter your current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword((previousState) => !previousState)}
                                className="password-toggle-button"
                                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                            >
                                <EyeToggleIcon isVisible={showCurrentPassword} />
                            </button>
                        </div>
                    </div>

                    <div className="form-field-group">
                        <label
                            htmlFor="change-new-password"
                            className="form-label"
                        >
                            New password
                        </label>
                        <div className="form-input-shell">
                            <input
                                id="change-new-password"
                                type={showNewPassword ? "text" : "password"}
                                name="new-password"
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                required
                                className="form-input form-input--with-toggle"
                                placeholder="At least 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword((previousState) => !previousState)}
                                className="password-toggle-button"
                                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                            >
                                <EyeToggleIcon isVisible={showNewPassword} />
                            </button>
                        </div>
                    </div>

                    <div className="form-field-group">
                        <label
                            htmlFor="change-confirm-password"
                            className="form-label"
                        >
                            Confirm new password
                        </label>
                        <div className="form-input-shell">
                            <input
                                id="change-confirm-password"
                                type={showConfirmNewPassword ? "text" : "password"}
                                name="confirm-password"
                                autoComplete="new-password"
                                value={confirmNewPassword}
                                onChange={(event) => setConfirmNewPassword(event.target.value)}
                                required
                                className="form-input form-input--with-toggle"
                                placeholder="Re-enter your new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmNewPassword((previousState) => !previousState)}
                                className="password-toggle-button"
                                aria-label={showConfirmNewPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                                <EyeToggleIcon isVisible={showConfirmNewPassword} />
                            </button>
                        </div>
                    </div>

                    {/* Window footer actions */}
                    <div className="change-password-footer">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="change-password-cancel"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="change-password-submit"
                        >
                            {isSubmitting ? "Updating..." : "Change password"}
                        </button>
                    </div>
                </form>
            </div>

            {isSuccess && (
                <WindowSuccess
                    onClose={() => setIsSuccess(false)}
                    description={description}
                />
            )}
        </div>
    );
}

