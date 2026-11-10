"use client";

import { useEffect } from "react";

/**
 * Rectangle banner notification shown after a save attempt. Rendered as a
 * status region (polite live announcement) fixed to the viewport bottom so it
 * never disturbs the detail layout, and it disappears on its own after
 * `durationMs` or when the user dismisses it.
 */
export interface NotificationProps {
    /** Visible text, e.g. "Attack on Titan is already in your Watchlist". */
    readonly message: string;
    /** Called by the internal dismiss button. */
    readonly onDismiss: () => void;
    /** Auto-hide delay. Defaults to 3500ms. */
    readonly durationMs?: number;
}

export function Notification({
    message,
    onDismiss,
    durationMs = 3500,
}: NotificationProps) {
    useEffect(() => {
        const timer = window.setTimeout(onDismiss, durationMs);
        return () => window.clearTimeout(timer);
    }, [onDismiss, durationMs]);

    return (
        <div
            role="status"
            aria-live="polite"
            className="notification"
        >
            <span className="notificationMessage">{message}</span>
            <button
                type="button"
                aria-label="Dismiss notification"
                className="notificationDismiss"
                onClick={onDismiss}
            >
                ×
            </button>
        </div>
    );
}
