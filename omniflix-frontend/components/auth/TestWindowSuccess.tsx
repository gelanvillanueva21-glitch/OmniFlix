
"use client";

import { createPortal } from "react-dom";

interface Props {
    onClose: () => void;
    description: string;
}

export function WindowSuccess({ onClose, description }: Props) {
    return createPortal(
        <div className="fixed bottom-5 right-5 z-9999 flex w-[calc(100vw-2.5rem)] max-w-sm items-center gap-3 rounded-lg border border-emerald-800 bg-gray-900 p-4 shadow-lg">
            {/* Checkmark Icon */}
            <svg
                className="h-5 w-5 shrink-0 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>

            {/* Notification Message */}
            <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium text-gray-100">
                    Operation successful!
                </p>
                <p className="text-gray-400">
                    {description}
                </p>
            </div>

            {/* Close Button */}
            <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                aria-label="Close notification"
            >
                <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>
        </div>,
        document.body
    );
}
