"use client";

import { MediaCarousel } from "@/components/MediaCarousel";
import { ErrorState, SectionHeader } from "@/components/SectionHeader";
import { MediaRowSkeleton } from "@/components/LoadingSkeleton";
import { PAGE_LIMIT } from "./seriesQueries";
import type { MediaItem } from "@/lib/media";

interface PopularCarouselSectionProps {
    label: string;
    title: string;
    isPending: boolean;
    isError: boolean;
    errorMessage?: string;
    onRetry: () => void;
    items: MediaItem[];
}

/** One popular carousel section per provider, matching the Movies page. */
export function PopularCarouselSection({
    label,
    title,
    isPending,
    isError,
    errorMessage,
    onRetry,
    items,
}: PopularCarouselSectionProps) {
    return (
        <section aria-label={label} className="mb-8 space-y-4">
            <SectionHeader title={title} />
            {isPending ? (
                <MediaRowSkeleton />
            ) : isError ? (
                <ErrorState
                    message={errorMessage}
                    onRetry={onRetry}
                />
            ) : (
                <MediaCarousel
                    items={items.slice(0, PAGE_LIMIT)}
                    label={title}
                />
            )}
        </section>
    );
}
