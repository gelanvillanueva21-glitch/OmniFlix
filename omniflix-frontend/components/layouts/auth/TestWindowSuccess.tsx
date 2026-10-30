
"use client";

import { createPortal } from "react-dom";

interface Props {
    onClose: () => void;
    description: string;
}

export function WindowSuccess({ onClose, description }: Props) {
    return createPortal(
        <div className="success-toast">
            {/* Checkmark Icon */}
            <svg
                className="success-toast-icon"
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
            <div className="success-toast-body">
                <p className="success-toast-title">
                    Operation successful!
                </p>
                <p className="success-toast-description">
                    {description}
                </p>
            </div>

            {/* Close Button */}
            <button
                type="button"
                onClick={onClose}
                className="success-toast-close"
                aria-label="Close notification"
            >
                <svg
                    className="success-toast-close-icon"
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
