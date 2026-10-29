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
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Change password"
        >
            <button
                type="button"
                aria-label="Close change password window"
                onClick={onClose}
                className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
            />

            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#3A3A40] bg-[#191919] shadow-2xl shadow-black/90">
                <div className="absolute top-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-[#8B5CF6]/40 to-transparent pointer-events-none" />

                {/* Window header bar */}
                <div className="flex items-center justify-between gap-3 border-b border-[#29292E] px-5 py-4 sm:px-7">
                    <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#A78BFA]">
                            <svg
                                className="h-5 w-5"
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
                            <h2 className="text-base font-semibold tracking-tight text-[#F5F5F5] font-sans">
                                Change password
                            </h2>
                            <p className="text-xs text-[#A1A1AA]">
                                Keep your account secure.
                            </p>
                        </div>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#A1A1AA] transition-colors hover:bg-[#242429] hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                        aria-label="Close window"
                    >
                        <svg
                            className="h-5 w-5"
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
                <form onSubmit={changPasswordClick} noValidate className="space-y-4 px-5 py-5 sm:px-7 sm:py-6">
                    {errorMessage && (
                        <div
                            className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3.5 py-2.5 leading-relaxed"
                            role="alert"
                        >
                            {errorMessage}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label
                            htmlFor="change-current-password"
                            className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]"
                        >
                            Current password
                        </label>
                        <div className="relative">
                            <input
                                id="change-current-password"
                                type={showCurrentPassword ? "text" : "password"}
                                name="current-password"
                                autoComplete="current-password"
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#202020] border border-[#3A3A40] text-[#F5F5F5] placeholder-[#71717A] text-sm outline-none transition-colors duration-200 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                                placeholder="Enter your current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword((previousState) => !previousState)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#A1A1AA] hover:text-[#F5F5F5] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                            >
                                <EyeToggleIcon isVisible={showCurrentPassword} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="change-new-password"
                            className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]"
                        >
                            New password
                        </label>
                        <div className="relative">
                            <input
                                id="change-new-password"
                                type={showNewPassword ? "text" : "password"}
                                name="new-password"
                                autoComplete="new-password"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#202020] border border-[#3A3A40] text-[#F5F5F5] placeholder-[#71717A] text-sm outline-none transition-colors duration-200 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                                placeholder="At least 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword((previousState) => !previousState)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#A1A1AA] hover:text-[#F5F5F5] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                            >
                                <EyeToggleIcon isVisible={showNewPassword} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="change-confirm-password"
                            className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]"
                        >
                            Confirm new password
                        </label>
                        <div className="relative">
                            <input
                                id="change-confirm-password"
                                type={showConfirmNewPassword ? "text" : "password"}
                                name="confirm-password"
                                autoComplete="new-password"
                                value={confirmNewPassword}
                                onChange={(event) => setConfirmNewPassword(event.target.value)}
                                required
                                className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[#202020] border border-[#3A3A40] text-[#F5F5F5] placeholder-[#71717A] text-sm outline-none transition-colors duration-200 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]"
                                placeholder="Re-enter your new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmNewPassword((previousState) => !previousState)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#A1A1AA] hover:text-[#F5F5F5] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                                aria-label={showConfirmNewPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                                <EyeToggleIcon isVisible={showConfirmNewPassword} />
                            </button>
                        </div>
                    </div>

                    {/* Window footer actions */}
                    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="w-full py-2.5 px-4 rounded-lg border border-[#3A3A40] bg-transparent text-sm font-medium text-[#A1A1AA] transition-colors hover:bg-[#242429] hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] disabled:opacity-60 sm:w-auto cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2.5 px-4 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] active:bg-[#6D28D9] text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-[#8B5CF6]/25 hover:shadow-[#8B5CF6]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
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

