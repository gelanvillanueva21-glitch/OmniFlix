"use client";

import { MediaCard } from "@/components/explore/MediaCard";
import {
    EmptyState,
    ErrorState,
} from "@/components/explore/SectionHeader";
import { LoadingSkeleton } from "@/components/explore/LoadingSkeleton";
import type { MediaItem } from "@/lib/media";

interface FeaturedSeriesSectionProps {
    isPending: boolean;
    isError: boolean;
    errorMessage?: string;
    onRetry: () => void;
    featuredSeries?: MediaItem;
}

/** Featured content: same wide-card pattern as the Movies page. */
export function FeaturedSeriesSection({
    isPending,
    isError,
    errorMessage,
    onRetry,
    featuredSeries,
}: FeaturedSeriesSectionProps) {
    return (
        <section aria-label="Featured series" className="mb-8">
            {isPending ? (
                <LoadingSkeleton className="aspect-12/5 w-full" />
            ) : isError ? (
                <ErrorState
                    message={errorMessage}
                    onRetry={onRetry}
                />
            ) : featuredSeries ? (
                <MediaCard media={featuredSeries} variant="wide" />
            ) : (
                <EmptyState
                    title="No series returned"
                    description="No popular series are available right now."
                />
            )}
        </section>
    );
}
