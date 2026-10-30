"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons/icons";

interface SectionHeaderProps {
    readonly title: string;
    /** Rendered only when a destination route exists. */
    readonly seeAllHref?: string;
}

export function SectionHeader({ title, seeAllHref }: SectionHeaderProps) {
    return (
        <div className="section-header">
            <h2 className="section-header-title">
                {title}
            </h2>
            {seeAllHref !== undefined && (
                <Link
                    href={seeAllHref}
                    className="section-header-link"
                >
                    See All
                    <ChevronRightIcon className="section-header-link-icon" />
                </Link>
            )}
        </div>
    );
}

interface EmptyStateProps {
    readonly title: string;
    readonly description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
    return (
        <div className="empty-state">
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-description">{description}</p>
        </div>
    );
}

interface ErrorStateProps {
    readonly message?: string;
    readonly onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
    return (
        <div
            role="alert"
            className="error-state"
        >
            <h3 className="error-state-title">
                Something went wrong
            </h3>
            <p className="error-state-description">
                {message ?? "We couldn't load this content. Please try again."}
            </p>
            {onRetry !== undefined && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="error-state-retry"
                >
                    Retry
                </button>
            )}
        </div>
    );
}
