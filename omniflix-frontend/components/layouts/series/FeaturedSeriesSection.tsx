"use client";

import { MediaCard } from "@/components/MediaCard";
import {
    EmptyState,
    ErrorState,
} from "@/components/SectionHeader";
import { LoadingSkeleton } from "@/components/loading/LoadingSkeleton";
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
        <section aria-label="Featured series" className="series-featured-section">
            {isPending ? (
                <LoadingSkeleton className="media-card-wide-frame" />
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
