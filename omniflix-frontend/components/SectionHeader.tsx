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
        <div className="flex items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-[#F5F5F5] sm:text-xl">
                {title}
            </h2>
            {seeAllHref !== undefined && (
                <Link
                    href={seeAllHref}
                    className="inline-flex items-center gap-0.5 rounded text-sm font-medium text-[#A1A1AA] transition-colors hover:text-[#A78BFA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                >
                    See All
                    <ChevronRightIcon className="h-4 w-4" />
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
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#29292E] px-6 py-10 text-center">
            <h3 className="text-sm font-medium text-[#F5F5F5]">{title}</h3>
            <p className="mt-1 max-w-sm text-sm text-[#A1A1AA]">{description}</p>
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
            className="flex flex-col items-center justify-center rounded-lg border border-[#29292E] px-6 py-10 text-center"
        >
            <h3 className="text-sm font-medium text-[#F5F5F5]">
                Something went wrong
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#A1A1AA]">
                {message ?? "We couldn't load this content. Please try again."}
            </p>
            {onRetry !== undefined && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-4 rounded-full bg-[#8B5CF6] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D946EF]"
                >
                    Retry
                </button>
            )}
        </div>
    );
}
